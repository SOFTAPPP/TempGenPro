import os
import time
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Request, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from utils.db import db
from pydantic import BaseModel

security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "secret")

# In-memory cache for banned status
# Format: { user_id: {"isBanned": bool, "timestamp": float} }
ban_cache = {}
BAN_CACHE_TTL = 30  # 30 seconds

class UserPayload(BaseModel):
    id: int
    username: str
    role: str

def clear_ban_cache(user_id: int):
    if user_id in ban_cache:
        del ban_cache[user_id]

async def authenticate_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserPayload:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = UserPayload(**payload)
        
        # Check cache
        cached = ban_cache.get(user.id)
        is_banned = False
        current_time = time.time()
        
        if cached and (current_time - cached["timestamp"] < BAN_CACHE_TTL):
            is_banned = cached["isBanned"]
        else:
            # Check DB
            db_user = await db.user.find_unique(where={"id": user.id})
            is_banned = bool(db_user.isBanned) if db_user else False
            ban_cache[user.id] = {"isBanned": is_banned, "timestamp": current_time}
            
        if is_banned and user.role != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended for violating our terms and conditions."
            )
            
        return user
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access denied"
        )

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_current_user(user: UserPayload = Depends(authenticate_token)) -> UserPayload:
    return user

def require_admin(user: UserPayload = Depends(authenticate_token)) -> UserPayload:
    if user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied. Admin access required."
        )
    return user
