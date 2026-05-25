import asyncio
import random
from utils.db import db
from utils.socket_app import emit_new_email, emit_to_user

NOISE_TEMPLATES = [
    {
        "sender": "newsletter@insights-tech.info",
        "subject": "Monthly System Intelligence Briefing: April 2026",
        "body": "Hello,\n\nIn this month’s briefing, we cover the rapid evolution of decentralized cloud infrastructure and the impact of P2P relay nodes on data sovereignty.\n\nKey Insights:\n1. Zero-Knowledge proofs are becoming standard.\n2. Latency reduction in edge computing is at an all-time high.\n\nKeep your systems optimized.\n\nRegards,\nThe Insights Tech Team"
    },
    {
        "sender": "billing-noreply@saas-managed-infra.com",
        "subject": "Monthly Usage Statement: Zero Usage Alert",
        "body": "Hello User,\n\nYour account has been active for 24 hours with zero resource consumption. This is just a courtesy notification to ensure your relay tunnels are functioning as expected.\n\nView Dashboard: https://saas-managed-infra.com/dashboard\n\nSupport Team"
    }
]

async def generate_noise_for_email(temp_email_id: int, email: str, user_id: int):
    template = random.choice(NOISE_TEMPLATES)

    message = await db.message.create(
        data={
            "tempEmailId": temp_email_id,
            "sender": template["sender"],
            "subject": template["subject"],
            "body": template["body"],
            "trackersBlocked": 0
        }
    )

    # Broadcast to frontend
    m_dict = dict(message)
    m_dict["receivedAt"] = message.receivedAt.isoformat() if message.receivedAt else None
    
    await emit_new_email(email, m_dict)
    if user_id:
        await emit_to_user(user_id, 'new_email_global', {"email": email, "message": m_dict})

async def start_noise_engine():
    print('[Noise Engine] Started. Simulation cycle: 15 minutes.')
    
    while True:
        await asyncio.sleep(15 * 60) # 15 minutes
        try:
            target_emails = await db.tempemail.find_many(
                where={"camouflageEnabled": True, "isActive": True}
            )

            print(f"[Noise Engine] Injecting noise into {len(target_emails)} active camouflage tunnels...")

            for node in target_emails:
                if random.random() > 0.6:
                    await generate_noise_for_email(node.id, node.email, node.userId)
        except Exception as e:
            print('[Noise Engine Error]:', e)
