from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import time
import asyncio
from utils.db import db

IP_THROTTLE_MS = 5 * 60  # 5 minutes in seconds
ip_throttle_map = {}

class VisitorLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        should_skip = (
            path == '/health' or
            path.startswith('/socket.io') or
            path.startswith('/uploads/')
        )

        if not should_skip:
            raw_ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else "unknown")
            raw_ip = raw_ip.split(",")[0].strip()
            clean_ip = raw_ip[7:] if raw_ip.startswith("::ffff:") else raw_ip
            ip = f"{clean_ip}, ::ffff:{clean_ip}" if ":" not in clean_ip else clean_ip

            now = time.time()
            last_logged = ip_throttle_map.get(ip)

            if not last_logged or now - last_logged > IP_THROTTLE_MS:
                ip_throttle_map[ip] = now
                user_agent = request.headers.get("user-agent")
                
                # Fire and forget database creation
                asyncio.create_task(db.visitorlog.create(
                    data={
                        "ip": ip,
                        "userAgent": user_agent,
                        "path": path
                    }
                ))

        response = await call_next(request)
        return response
