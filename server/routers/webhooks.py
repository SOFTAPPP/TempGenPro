import os
import asyncio
import re
from fastapi import APIRouter, Request, Response, status, Header, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional
from mailparser import parse_from_string  # type: ignore
from utils.db import db
from utils.de_tracker import purge_trackers
from dependencies.auth import clear_ban_cache
from utils.socket_app import emit_new_email, emit_to_user
from utils.admin_stats import sync_admin_stats

router = APIRouter()

class WebhookPayload(BaseModel):
    to: Optional[str] = None
    from_: Optional[str] = Field(None, alias="from")
    subject: Optional[str] = None
    raw: Optional[str] = None
    text: Optional[str] = None
    html: Optional[str] = None

async def process_webhook_background(payload: WebhookPayload, temp_email):
    try:
        final_body = payload.text or payload.html or ""
        email_subject = payload.subject or "(No Subject)"

        if payload.raw:
            parsed = parse_from_string(payload.raw)
            final_body = parsed.body.split('\n\n')[0] if parsed.body else (payload.text or "")
            email_subject = parsed.subject or email_subject

        result = purge_trackers(final_body)
        final_body = result["cleanedHtml"]
        trackers_blocked = result["trackersBlocked"]

        # Platform Policy Enforcement
        check_content = f"{email_subject} {final_body} {payload.from_}".lower()
        is_prohibited = any(keyword in check_content for keyword in ["facebook", "instagram", "snapchat"])

        if is_prohibited and temp_email.userId and (temp_email.user and temp_email.user.role != "ADMIN"):
            await db.user.update(
                where={"id": temp_email.userId},
                data={"isBanned": True}
            )
            clear_ban_cache(temp_email.userId)
            await emit_to_user(temp_email.userId, 'user_banned', {"message": "Policy violation ban."})
            # Trigger Admin update
            await sync_admin_stats()
            return

        # OTP Extraction
        otp_match = re.search(r'\b\d{4,8}\b', email_subject)
        if otp_match:
            otp_code = otp_match.group(0)
        else:
            # Strip HTML tags and style blocks to avoid false matches with hex colors or metadata IDs
            clean_body = re.sub(r'<(style|script|head|title)[^>]*>[\s\S]*?</\1>', ' ', final_body, flags=re.IGNORECASE)
            clean_body = re.sub(r'<[^>]+>', ' ', clean_body)
            clean_body = clean_body.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
            
            body_matches = re.findall(r'\b\d{4,8}\b', clean_body)
            otp_code = None
            if body_matches:
                for match in body_matches:
                    if match not in ['2024', '2025', '2026', '2027', '2028']:
                        otp_code = match
                        break
                if not otp_code:
                    otp_code = body_matches[0]

        message = await db.message.create(
            data={
                "tempEmailId": temp_email.id,
                "sender": payload.from_ or "Unknown",
                "subject": email_subject,
                "body": final_body or "(No content)",
                "otpCode": otp_code,
                "trackersBlocked": trackers_blocked
            }
        )

        m_dict = dict(message)
        m_dict["receivedAt"] = message.receivedAt.isoformat() if message.receivedAt else None
        
        await emit_new_email(temp_email.email, m_dict)
        if temp_email.userId:
            await emit_to_user(temp_email.userId, 'new_email_global', {"email": temp_email.email, "message": m_dict})
            
        await sync_admin_stats()

    except Exception as e:
        print(f"[Webhook Background] Error: {e}")


@router.post("/email")
async def receive_email(payload: WebhookPayload, background_tasks: BackgroundTasks, x_webhook_secret: Optional[str] = Header(None)):
    webhook_secret = os.getenv("WEBHOOK_SECRET")
    
    if webhook_secret and x_webhook_secret != webhook_secret:
        return Response(content="Unauthorized", status_code=401)
        
    if not payload.to:
        return Response(content="Recipient required", status_code=400)
        
    email_to = payload.to.lower().strip()
    
    temp_email = await db.tempemail.find_unique(
        where={"email": email_to},
        include={"user": True}
    )
    
    if not temp_email or not temp_email.isActive:
        return Response(content="Email not found or inactive", status_code=404)
        
    background_tasks.add_task(process_webhook_background, payload, temp_email)
    
    return {"status": "Accepted", "message": "Email queued for processing"}