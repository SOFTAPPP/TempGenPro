import os
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, EmailStr
import bcrypt
from utils.db import db
from utils.email import send_otp_email
from dependencies.auth import verify_password, get_current_user, UserPayload
from jose import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import httpx

router = APIRouter()
JWT_SECRET = os.getenv("JWT_SECRET", "secret")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "YOUR_GOOGLE_CLIENT_ID")

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    identifier: str
    password: str

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str

class ResendOTPRequest(BaseModel):
    email: EmailStr

class OAuthGoogleRequest(BaseModel):
    token: str

def generate_otp():
    return "".join(str(secrets.randbelow(10)) for _ in range(6))

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, background_tasks: BackgroundTasks):
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
        if not existing_user.isVerified and existing_user.email == clean_email:
            # User exists but not verified, resend OTP
            otp = generate_otp()
            expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
            await db.user.update(
                where={"id": existing_user.id},
                data={"verificationOTP": otp, "otpExpiry": expiry}
            )
            background_tasks.add_task(send_otp_email, clean_email, otp)
            return {"message": "User exists but is unverified. A new OTP has been sent.", "requiresVerification": True}
        
        raise HTTPException(status_code=400, detail="Username or email already exists")

    hashed_password = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    otp = generate_otp()
    expiry = datetime.now(timezone.utc) + timedelta(minutes=10)

    user = await db.user.create(
        data={
            "username": clean_username,
            "email": clean_email,
            "password": hashed_password,
            "rawPassword": req.password,
            "isVerified": False,
            "verificationOTP": otp,
            "otpExpiry": expiry
        }
    )

    background_tasks.add_task(send_otp_email, clean_email, otp)
    return {"message": "Registration successful. Please check your email for the OTP.", "requiresVerification": True}

@router.post("/verify-email")
async def verify_email(req: VerifyEmailRequest):
    clean_email = req.email.strip().lower()
    
    user = await db.user.find_unique(where={"email": clean_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.isVerified:
        raise HTTPException(status_code=400, detail="User is already verified")
        
    if not user.verificationOTP or user.verificationOTP != req.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if user.otpExpiry and user.otpExpiry < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    # Verify the user
    user = await db.user.update(
        where={"id": user.id},
        data={
            "isVerified": True,
            "verificationOTP": None,
            "otpExpiry": None
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

@router.post("/resend-otp")
async def resend_otp(req: ResendOTPRequest, background_tasks: BackgroundTasks):
    clean_email = req.email.strip().lower()
    user = await db.user.find_unique(where={"email": clean_email})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.isVerified:
        raise HTTPException(status_code=400, detail="User is already verified")
        
    otp = generate_otp()
    expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    await db.user.update(
        where={"id": user.id},
        data={"verificationOTP": otp, "otpExpiry": expiry}
    )
    
    background_tasks.add_task(send_otp_email, clean_email, otp)
    return {"message": "OTP resent successfully"}

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
        
    if not user.password:
        raise HTTPException(status_code=400, detail="Please login using the OAuth provider you registered with.")

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

@router.post("/oauth/google")
async def oauth_google(req: OAuthGoogleRequest):
    try:
        idinfo = id_token.verify_oauth2_token(req.token, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email']
        google_id = idinfo['sub']
        name = idinfo.get('name', '')
        
        user = await db.user.find_unique(where={"email": email})
        
        if user:
            # Update user with googleId if they don't have it
            if not user.googleId:
                user = await db.user.update(
                    where={"id": user.id},
                    data={"googleId": google_id, "isVerified": True}
                )
            if bool(user.isBanned) and user.role != "ADMIN":
                raise HTTPException(status_code=403, detail="Account suspended")
        else:
            # Create new user
            base_username = email.split('@')[0]
            username = base_username
            counter = 1
            while await db.user.find_unique(where={"username": username}):
                username = f"{base_username}{counter}"
                counter += 1
                
            user = await db.user.create(
                data={
                    "username": username,
                    "email": email,
                    "googleId": google_id,
                    "isVerified": True,
                    "authProvider": "google"
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
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid Google token")

class OAuthGenericRequest(BaseModel):
    token: str

@router.post("/oauth/facebook")
async def oauth_facebook(req: OAuthGenericRequest):
    # This is a placeholder for Facebook OAuth verification.
    # Typically, you'd call https://graph.facebook.com/me?access_token=req.token
    # and verify it, then create/login the user.
    raise HTTPException(status_code=501, detail="Facebook OAuth not fully implemented on server yet. Requires App ID & Secret.")

@router.post("/oauth/microsoft")
async def oauth_microsoft(req: OAuthGenericRequest):
    # This is a placeholder for Microsoft OAuth verification.
    raise HTTPException(status_code=501, detail="Microsoft OAuth not fully implemented on server yet. Requires Client ID & Secret.")

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
