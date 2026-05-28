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

def is_valid_otp(candidate: str, context_text: str, start_pos: int) -> bool:
    # 1. Reject if it looks like a common unit or UI attribute
    lowercased = candidate.lower()
    if lowercased in ['utf8', 'utf-8', 'html5', 'html', 'xhtml']:
        return False
    if re.search(r'\d+(px|em|rem|vh|vw|ms|kb|mb|gb|sec|min|deg)\b', lowercased):
        return False

    # 2. Check for greeting prefix (indicates it's a username or name)
    preceding = context_text[max(0, start_pos - 25):start_pos].lower()
    if re.search(r'\b(hey|hi|hello|dear|welcome|greetings|greet|active)\b', preceding):
        return False

    # 3. Check for OTP context keywords in the surrounding area
    context_start = max(0, start_pos - 65)
    context_end = min(len(context_text), start_pos + len(candidate) + 65)
    surrounding = context_text[context_start:context_end].lower()
    
    otp_keywords = ['code', 'otp', 'pin', 'verification', 'verify', 'one-time', 'password', 'token', 'passcode', 'activation', 'seccode', 'secur', 'confir']
    if not any(kw in surrounding for kw in otp_keywords):
        return False

    return True

def extract_verification_link(html_body: Optional[str], text_body: Optional[str]) -> Optional[str]:
    # We want to find a link that looks like a verification link.
    # Let's extract all hrefs from the HTML body if available.
    # Otherwise, extract all URLs from the text body.
    
    # 1. Parse HTML to find <a> tags and check their text/href
    if html_body:
        # A simple regex to find href and text of <a> tags
        # e.g., <a href="http://link">Confirm Email</a>
        matches = re.findall(r'<a\s+(?:[^>]*?\s+)?href=["\'](https?://[^"\']+)["\'][^>]*>(.*?)</a>', html_body, re.IGNORECASE | re.DOTALL)
        for href, text in matches:
            # Clean text (remove html tags inside the anchor, if any)
            clean_text = re.sub(r'<[^>]+>', '', text).lower().strip()
            href_lower = href.lower()
            
            # Check if text or href contains verification keywords
            keywords = ['confirm', 'verify', 'activate', 'validation', 'validate', 'verification', 'signup', 'email-verify', 'email_verify']
            is_match = False
            if any(kw in clean_text for kw in keywords):
                is_match = True
            elif any(kw in href_lower for kw in keywords):
                is_match = True
            elif 'click' in clean_text or 'here' in clean_text or 'button' in clean_text:
                # If anchor text is generic, check if the URL looks like a click tracking or confirmation URL
                if any(kw in href_lower for kw in ['click', 'ls', 'confirm', 'verify', 'activate', 'sign-up', 'auth']):
                    is_match = True
            
            if is_match:
                # Exclude footer links like unsubscribe, optout, privacy, settings, support
                if 'unsubscribe' in href_lower or 'optout' in href_lower or 'privacy' in href_lower or 'settings' in href_lower:
                    if not ('confirm' in clean_text or 'verify' in clean_text):
                        continue
                return href
                
    # 2. Fallback to parsing text body using regex to find raw URLs
    if text_body:
        raw_urls = re.findall(r'(https?://[^\s"\'<>]+)', text_body)
        for url in raw_urls:
            url_lower = url.lower()
            # Clean trailing punctuation
            while url and url[-1] in ['.', ',', ';', ':', '?', ')', ']']:
                url = url[:-1]
                url_lower = url_lower[:-1]
                
            keywords = ['confirm', 'verify', 'activate', 'validation', 'validate', 'verification', 'signup', 'email-verify', 'email_verify', 'click']
            if any(kw in url_lower for kw in keywords):
                if 'unsubscribe' in url_lower or 'optout' in url_lower or 'privacy' in url_lower or 'settings' in url_lower:
                    continue
                return url
            
    return None

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
        # Patterns to check in order of priority:
        # 1. Hyphenated alphanumeric (e.g. WPW-YP3, G-123456)
        # 2. Mixed alphanumeric of length 4 to 10 containing both letters and digits (e.g. A1B2C3)
        # 3. Pure digits of length 4 to 8 (excluding common year numbers if possible)
        patterns = [
            r'\b[a-zA-Z0-9]{2,6}-[a-zA-Z0-9]{2,6}\b',
            r'\b(?=[a-zA-Z]*\d)(?=\d*[a-zA-Z])[a-zA-Z0-9]{4,10}\b',
            r'\b\d{4,8}\b'
        ]
        
        otp_code = None
        year_blacklist = ['2024', '2025', '2026', '2027', '2028', '2029', '2030']
        
        # Check subject first
        if email_subject:
            for pattern in patterns:
                for match in re.finditer(pattern, email_subject):
                    m = match.group()
                    if m.isdigit():
                        if m not in year_blacklist and is_valid_otp(m, email_subject, match.start()):
                            otp_code = m
                            break
                    else:
                        if is_valid_otp(m, email_subject, match.start()):
                            otp_code = m
                            break
                if otp_code:
                    break

        if not otp_code:
            # Strip HTML tags and style blocks to avoid false matches with hex colors or metadata IDs
            clean_body = re.sub(r'<(style|script|head|title)[^>]*>[\s\S]*?</\1>', ' ', final_body, flags=re.IGNORECASE)
            clean_body = re.sub(r'<[^>]+>', ' ', clean_body)
            clean_body = clean_body.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
            
            for pattern in patterns:
                for match in re.finditer(pattern, clean_body):
                    m = match.group()
                    if m.isdigit():
                        if m not in year_blacklist and is_valid_otp(m, clean_body, match.start()):
                            otp_code = m
                            break
                    else:
                        if is_valid_otp(m, clean_body, match.start()):
                            otp_code = m
                            break
                if otp_code:
                    break
                    
            # Fallback: check if there was any digit match in subject/body even if it was in the blacklist, but check context
            if not otp_code:
                subject_matches = [(m.group(), email_subject, m.start()) for m in re.finditer(r'\b\d{4,8}\b', email_subject or "")]
                body_matches = [(m.group(), clean_body, m.start()) for m in re.finditer(r'\b\d{4,8}\b', clean_body)]
                for m, text, pos in (subject_matches + body_matches):
                    if is_valid_otp(m, text, pos):
                        otp_code = m
                        break

        # Extract verification link if present
        verification_link = extract_verification_link(payload.html, final_body)

        message = await db.message.create(
            data={
                "tempEmailId": temp_email.id,
                "sender": payload.from_ or "Unknown",
                "subject": email_subject,
                "body": final_body or "(No content)",
                "otpCode": otp_code,
                "verificationLink": verification_link,
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