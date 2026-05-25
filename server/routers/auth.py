import os
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from datetime import timedelta
import bcrypt
from utils.db import db
from dependencies.auth import verify_password, get_current_user, UserPayload
from jose import jwt

router = APIRouter()
JWT_SECRET = os.getenv("JWT_SECRET", "secret")

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    identifier: str
    password: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest):
    if not req.username or not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Username, email, and password are required")
        
    clean_username = req.username.strip()
    clean_email = req.email.strip().lower()

    # Check existing user
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
            "rawPassword": req.password
        }
    )

    token = jwt.encode(
        {"id": user.id, "username": user.username, "role": user.role},
        JWT_SECRET,
        algorithm="HS256"
    )

    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }

@router.post("/login")
async def login(req: LoginRequest):
    clean_identifier = req.identifier.strip()
    
    user = await db.user.find_first(
        where={
            "OR": [
                {"username": clean_identifier},
                {"email": clean_identifier},
                {"email": clean_identifier.lower()},
                {"username": {"equals": clean_identifier, "mode": "insensitive"}},
                {"email": {"equals": clean_identifier, "mode": "insensitive"}}
            ]
        }
    )

    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    if bool(user.isBanned) and user.role != "ADMIN":
        raise HTTPException(
            status_code=403, 
            detail="Your account has been suspended for violating our terms and conditions."
        )

    if not verify_password(req.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid password")

    token = jwt.encode(
        {"id": user.id, "username": user.username, "role": user.role},
        JWT_SECRET,
        algorithm="HS256"
    )

    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }

@router.get("/me")
async def get_user_profile(current_user: UserPayload = Depends(get_current_user)):
    user = await db.user.find_unique(
        where={"id": current_user.id},
        include={
            "tempEmails": {
                "include": {
                    "messages": True
                }
            }
        }
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    total_messages = 0
    if user.tempEmails:
        for email in user.tempEmails:
            if email.messages:
                total_messages += len(email.messages)
                
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "createdAt": user.createdAt.isoformat() if user.createdAt else None,
        "_count": {
            "tempEmails": len(user.tempEmails) if user.tempEmails else 0
        },
        "totalMessages": total_messages
    }
