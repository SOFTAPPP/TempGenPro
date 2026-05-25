import asyncio
from utils.db import db
from utils.socket_app import broadcast_admin_stats

async def sync_admin_stats():
    try:
        total_users = await db.user.count()
        total_temp_emails = await db.tempemail.count()
        active_temp_emails = await db.tempemail.count(where={"isActive": True})
        total_messages = await db.message.count()
        total_visitor_logs = await db.visitorlog.count()

        stats_data = {
            "totalUsers": total_users,
            "totalTempEmails": total_temp_emails,
            "activeTempEmails": active_temp_emails,
            "totalMessages": total_messages,
            "totalVisitorLogs": total_visitor_logs
        }

        await broadcast_admin_stats(stats_data)
        return stats_data
    except Exception as e:
        print(f"Failed to sync admin stats: {e}")
