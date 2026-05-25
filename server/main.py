import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from utils.db import connect_db, disconnect_db
from routers import auth, emails, webhooks, admin
from utils.socket_app import socket_app
from middlewares.visitor_logger import VisitorLoggerMiddleware
from utils.noise_engine import start_noise_engine
import asyncio

# Initialize FastAPI
app = FastAPI(title="TempGenPro API")

# Setup CORS
allowed_origins = os.getenv("FRONTEND_URL", "https://tempgenpro.com,https://www.tempgenpro.com").split(",")
if os.getenv("NODE_ENV") != "production":
    allowed_origins = ["*"]

app.add_middleware(VisitorLoggerMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "x-webhook-secret"],
)

# Compression Middleware
app.add_middleware(GZipMiddleware, minimum_size=1024)

# Mount Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(emails.router, prefix="/api/emails", tags=["Emails"])
app.include_router(webhooks.router, prefix="/api/webhook", tags=["Webhooks"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

# Mount Socket.IO
app.mount("/", socket_app)

@app.on_event("startup")
async def startup():
    await connect_db()
    asyncio.create_task(start_noise_engine())
    print("Server started and connected to Database")

@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()
    print("Server shutting down")

@app.get("/health")
async def health():
    return {"status": "ok"}
