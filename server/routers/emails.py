from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import asyncio
from datetime import datetime
from datetime import timezone
from utils.db import db
from dependencies.auth import get_current_user, UserPayload
from utils.email_generator import generate_unique_email
from utils.admin_stats import sync_admin_stats

router = APIRouter()

class CreateEmailRequest(BaseModel):
    type: Optional[str] = None
    includePersona: Optional[bool] = False

@router.get("")
async def get_user_emails(current_user: UserPayload = Depends(get_current_user)):
    emails = await db.tempemail.find_many(
        where={
            "userId": current_user.id,
            "isActive": True
        },
        order={"createdAt": "desc"},
        include={
            "messages": True
        }
    )
    
    # Format to match Node response
    formatted = []
    for email in emails:
        data = dict(email)
        data["_count"] = {"messages": len(email.messages) if email.messages else 0}
        data["createdAt"] = email.createdAt.isoformat() if email.createdAt else None
        data["expiresAt"] = email.expiresAt.isoformat() if email.expiresAt else None
        del data["messages"]
        formatted.append(data)
        
    return formatted

@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def create_email(req: CreateEmailRequest, current_user: UserPayload = Depends(get_current_user)):
    user_id = current_user.id
    user_role = current_user.role

    if user_role != "ADMIN":
        active_count = await db.tempemail.count(
            where={"userId": user_id, "isActive": True}
        )
        if active_count >= 5:
            raise HTTPException(
                status_code=403,
                detail="INVENTORY FULL: Free tier supports a maximum of 5 active relay nodes. Please disconnect an existing node to deploy a new one."
            )

    forced_domain = None
    if user_role == "ADMIN":
        if req.type == "social":
            forced_domain = "mysocialrelay.com"
        elif req.type == "main":
            forced_domain = "tempgenpro.com"

    email = await generate_unique_email(user_id, forced_domain, bool(req.includePersona))

    # Trigger admin sync asynchronously
    asyncio.create_task(sync_admin_stats())
    
    data = dict(email)
    data["createdAt"] = email.createdAt.isoformat() if email.createdAt else None
    data["expiresAt"] = email.expiresAt.isoformat() if email.expiresAt else None

    return data

@router.delete("/{email_id}")
async def delete_email(email_id: int, current_user: UserPayload = Depends(get_current_user)):
    await db.tempemail.update(
        where={
            "id": email_id
        },
        data={"isActive": False}
    )
    # Trigger admin sync
    asyncio.create_task(sync_admin_stats())
    return {"message": "Email deleted"}

@router.get("/{email_id}/messages")
async def get_email_messages(email_id: int, current_user: UserPayload = Depends(get_current_user)):
    # Verify ownership
    email_node = await db.tempemail.find_first(
        where={"id": email_id, "userId": current_user.id}
    )
    if not email_node:
        raise HTTPException(status_code=404, detail="Email not found")

    messages = await db.message.find_many(
        where={"tempEmailId": email_id},
        order={"receivedAt": "desc"},
        take=50
    )

    optimized_messages = []
    for m in messages:
        m_dict = dict(m)
        m_dict["body"] = m.body[:200] + ("..." if len(m.body) > 200 else "")
        m_dict["trackersBlocked"] = m.trackersBlocked or 0
        m_dict["receivedAt"] = m.receivedAt.isoformat() if m.receivedAt else None
        optimized_messages.append(m_dict)

    return optimized_messages

@router.get("/messages/{message_id}")
async def get_message_detail(message_id: int, current_user: UserPayload = Depends(get_current_user)):
    message = await db.message.find_first(
        where={"id": message_id},
        include={"tempEmail": True}
    )
    
    if not message or not message.tempEmail or message.tempEmail.userId != current_user.id:
        raise HTTPException(status_code=404, detail="Message not found")
        
    m_dict = dict(message)
    m_dict["receivedAt"] = message.receivedAt.isoformat() if message.receivedAt else None
    del m_dict["tempEmail"]
    return m_dict

@router.delete("/messages/{message_id}")
async def delete_message(message_id: int, current_user: UserPayload = Depends(get_current_user)):
    message = await db.message.find_first(
        where={"id": message_id},
        include={"tempEmail": True}
    )
    
    if not message or not message.tempEmail or message.tempEmail.userId != current_user.id:
        raise HTTPException(status_code=404, detail="Message not found or unauthorized")

    await db.message.delete(where={"id": message_id})
    return {"message": "Message deleted"}

@router.post("/{email_id}/camouflage")
async def toggle_camouflage(email_id: int, current_user: UserPayload = Depends(get_current_user)):
    email_node = await db.tempemail.find_first(
        where={"id": email_id, "userId": current_user.id}
    )
    if not email_node:
        raise HTTPException(status_code=404, detail="Relay node not found")

    updated = await db.tempemail.update(
        where={"id": email_id},
        data={"camouflageEnabled": not email_node.camouflageEnabled}
    )
    
    updated_dict = dict(updated)
    updated_dict["createdAt"] = updated.createdAt.isoformat() if updated.createdAt else None
    updated_dict["expiresAt"] = updated.expiresAt.isoformat() if updated.expiresAt else None
    return updated_dict

class SendEmailRequest(BaseModel):
    from_email: str
    to_email: str
    subject: str
    body: str

@router.post("/send")
async def send_custom_email(req: SendEmailRequest, current_user: UserPayload = Depends(get_current_user)):
    import os
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    # Verify that the current user owns the from_email and it's active
    email_node = await db.tempemail.find_first(
        where={
            "email": req.from_email,
            "userId": current_user.id,
            "isActive": True
        }
    )
    if not email_node:
        raise HTTPException(
            status_code=404,
            detail="Sender email address not found or inactive."
        )

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")

    if not smtp_user or not smtp_pass:
        print("\n=== [LOCAL SMTP OUTGOING MAIL (MOCKED)] ===")
        print(f"From: {req.from_email}")
        print(f"To: {req.to_email}")
        print(f"Subject: {req.subject}")
        print(f"Body: {req.body}")
        print("==========================================\n")
        
        await db.message.create(
            data={
                "tempEmailId": email_node.id,
                "sender": f"OUTBOUND:{req.to_email}",
                "subject": req.subject,
                "body": req.body,
                "receivedAt": datetime.now(timezone.utc)
            }
        )
        
        return {"message": "Email sent successfully (mocked locally)."}

    try:
        msg = MIMEMultipart()
        msg['From'] = req.from_email
        msg['To'] = req.to_email
        msg['Subject'] = req.subject
        msg.attach(MIMEText(req.body, 'plain'))
        msg['Reply-To'] = req.from_email

        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(req.from_email, req.to_email, msg.as_string())
        server.quit()
        print(f"[Email Router] Outgoing mail successfully sent from {req.from_email} to {req.to_email}")
        
        await db.message.create(
            data={
                "tempEmailId": email_node.id,
                "sender": f"OUTBOUND:{req.to_email}",
                "subject": req.subject,
                "body": req.body,
                "receivedAt": datetime.now(timezone.utc)
            }
        )
        
        return {"message": "Email sent successfully."}
    except Exception as e:
        print(f"[Email Router Error] SMTP outgoing delivery failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SMTP delivery failed: {str(e)}"
        )
