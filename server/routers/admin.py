from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from utils.db import db
from dependencies.auth import get_current_user, require_admin, UserPayload
from utils.admin_stats import sync_admin_stats
from utils.socket_app import emit_to_user
import bcrypt
import asyncio

router = APIRouter(dependencies=[Depends(require_admin)])

class CreateUserReq(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str

class UpdateUserReq(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None

class ResetPasswordReq(BaseModel):
    newPassword: str

@router.get("/users")
async def get_all_users():
    users = await db.user.find_many(
        include={
            "tempEmails": {
                "include": {
                    "messages": {
                        "take": 20,
                        "orderBy": {"receivedAt": "desc"}
                    }
                }
            }
        },
        order={"createdAt": "desc"}
    )
    
    formatted = []
    for u in users:
        u_dict = dict(u)
        u_dict["createdAt"] = u.createdAt.isoformat() if u.createdAt else None
        
        if u.tempEmails:
            formatted_emails = []
            for em in u.tempEmails:
                em_dict = dict(em)
                em_dict["createdAt"] = em.createdAt.isoformat() if em.createdAt else None
                if em.messages:
                    formatted_messages = []
                    for m in em.messages:
                        m_dict = dict(m)
                        m_dict["receivedAt"] = m.receivedAt.isoformat() if m.receivedAt else None
                        formatted_messages.append(m_dict)
                    em_dict["messages"] = formatted_messages
                formatted_emails.append(em_dict)
            u_dict["tempEmails"] = formatted_emails
        formatted.append(u_dict)
        
    return formatted

@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(req: CreateUserReq):
    clean_username = req.username.strip()
    clean_email = req.email.strip().lower()

    existing_user = await db.user.find_first(
        where={
            "OR": [
                {"username": {"equals": clean_username, "mode": "insensitive"}},
                {"email": {"equals": clean_email, "mode": "insensitive"}}
            ]
        }
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    hashed_password = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    user = await db.user.create(
        data={
            "username": clean_username,
            "email": clean_email,
            "password": hashed_password,
            "rawPassword": req.password,
            "role": "ADMIN" if req.role == "ADMIN" else "USER"
        }
    )
    
    asyncio.create_task(sync_admin_stats())
    return {"message": "User created successfully", "user": {"id": user.id, "username": user.username, "email": user.email, "role": user.role}}

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, current_admin: UserPayload = Depends(require_admin)):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account.")
        
    await emit_to_user(user_id, 'user_deleted', {"message": "This account has been permanently deleted by an administrator."})
    await db.user.delete(where={"id": user_id})
    asyncio.create_task(sync_admin_stats())
    return {"message": "User and all associated data deleted successfully"}

@router.put("/users/{user_id}")
async def update_user(user_id: int, req: UpdateUserReq):
    data = {}
    if req.username: data["username"] = req.username.strip()
    if req.email: data["email"] = req.email.strip().lower()
    
    user = await db.user.update(where={"id": user_id}, data=data)
    u_dict = dict(user)
    u_dict["createdAt"] = user.createdAt.isoformat() if user.createdAt else None
    return u_dict

@router.put("/users/{user_id}/reset-password")
async def reset_password(user_id: int, req: ResetPasswordReq):
    hashed_password = bcrypt.hashpw(req.newPassword.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    await db.user.update(
        where={"id": user_id},
        data={"password": hashed_password, "rawPassword": req.newPassword}
    )
    return {"message": "Password reset successfully"}

@router.post("/users/{user_id}/ban")
async def toggle_ban(user_id: int):
    user = await db.user.find_unique(where={"id": user_id})
    if not user: raise HTTPException(status_code=404, detail="User not found")
    if user.role == "ADMIN": raise HTTPException(status_code=400, detail="Administrative accounts cannot be banned.")
    
    updated = await db.user.update(where={"id": user_id}, data={"isBanned": not user.isBanned})
    if updated.isBanned:
        await emit_to_user(user_id, 'user_banned', {"message": "Your account has been suspended for violating our terms and conditions."})
    else:
        await emit_to_user(user_id, 'user_restored', {"message": "Your account has been restored."})
        
    u_dict = dict(updated)
    u_dict["createdAt"] = updated.createdAt.isoformat() if updated.createdAt else None
    return u_dict

@router.get("/stats")
async def get_stats():
    return await sync_admin_stats()

@router.get("/visitors")
async def get_visitor_logs():
    logs = await db.visitorlog.find_many(order={"timestamp": "desc"}, take=100)
    formatted = []
    for log in logs:
        l = dict(log)
        l["timestamp"] = log.timestamp.isoformat() if log.timestamp else None
        formatted.append(l)
    return formatted
    
@router.delete("/temp-emails/{email_id}")
async def delete_temp_email(email_id: int):
    await db.tempemail.delete(where={"id": email_id})
    asyncio.create_task(sync_admin_stats())
    return {"message": "Temporary email and associated messages deleted successfully"}

@router.delete("/messages/{msg_id}")
async def delete_message(msg_id: int):
    await db.message.delete(where={"id": msg_id})
    asyncio.create_task(sync_admin_stats())
    return {"message": "Message deleted successfully"}
