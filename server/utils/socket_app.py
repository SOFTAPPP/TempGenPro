import socketio  # type: ignore

# Create a Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# Wrap with ASGI application
socket_app = socketio.ASGIApp(sio)

@sio.event
async def connect(sid, environ):
    print(f"[Socket] Client connected: {sid}")

@sio.event
async def join_user(sid, user_id):
    room = f"user_{user_id}"
    await sio.enter_room(sid, room)
    print(f"[Socket] {sid} joined room: {room}")

@sio.event
async def join_inbox(sid, email):
    await sio.enter_room(sid, email)
    print(f"[Socket] {sid} joined room: {email}")

@sio.event
async def join_admin(sid, role):
    await sio.enter_room(sid, "admin_nexus")
    print(f"[Socket] {sid} joined admin nexus")

@sio.event
async def disconnect(sid):
    print(f"[Socket] Client disconnected: {sid}")

async def emit_new_email(email_address: str, message: dict):
    # Emit to the room named after the email address
    await sio.emit("new_email", message, room=email_address)

async def emit_to_user(user_id: int, event: str, payload: dict):
    # Emit to the user's specific room
    await sio.emit(event, payload, room=f"user_{user_id}")

async def broadcast_admin_stats(stats: dict):
    # Emit to the admin dashboard room
    await sio.emit("admin_stats_update", stats, room="admin_nexus")
