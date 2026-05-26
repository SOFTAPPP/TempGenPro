import os
import random
from datetime import datetime, timedelta
from utils.db import db
from utils.persona_generator import generate_persona

FIRST_NAMES = ['james', 'mary', 'robert', 'patricia', 'john', 'jennifer', 'michael', 'linda', 'william', 'elizabeth', 'david', 'barbara', 'richard', 'susan', 'joseph', 'jessica', 'thomas', 'sarah', 'charles', 'karen', 'christopher', 'nancy', 'daniel', 'lisa', 'matthew', 'betty', 'anthony', 'margaret', 'mark', 'sandra']
LAST_NAMES = ['smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis', 'rodriguez', 'martinez', 'hernandez', 'lopez', 'gonzalez', 'wilson', 'anderson', 'thomas', 'taylor', 'moore', 'jackson', 'martin', 'lee', 'perez', 'thompson', 'white', 'harris', 'sanchez', 'clark', 'ramirez', 'lewis', 'robinson']
DEPTS = ['support', 'billing', 'info', 'contact', 'sales', 'hr', 'marketing', 'dev', 'admin', 'accounts', 'security', 'legal', 'official', 'team', 'service', 'help', 'no-reply', 'inquiry', 'office', 'feedback', 'press']

async def generate_unique_email(user_id=None, forced_domain=None, include_persona=False):
    domains_str = os.getenv('EMAIL_DOMAINS', os.getenv('EMAIL_DOMAIN', 'tempgenpro.com'))
    domains = [d.strip() for d in domains_str.split(',')]
    
    email = ''
    is_unique = False

    while not is_unique:
        domain = forced_domain if forced_domain else random.choice(domains)
        rand_pattern = random.random()
        local = ''

        if rand_pattern < 0.5:
            # Pattern 1: firstname.lastname
            first = random.choice(FIRST_NAMES)
            last = LAST_NAMES[len(LAST_NAMES) - 1 - random.randint(0, len(LAST_NAMES) - 1)]
            local = f"{first}.{last}"
            if random.random() > 0.8:
                local += str(random.randint(0, 99))
        elif rand_pattern < 0.8:
            # Pattern 2: firstname + random 3-digit number (e.g., james482)
            first = random.choice(FIRST_NAMES)
            local = f"{first}{random.randint(100, 999)}"
        else:
            # Pattern 3: initial.lastname or first_initial
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            local = f"{first[0]}{last}" if random.random() > 0.5 else f"{first}{last[0]}"
            local += str(random.randint(0, 99))
            
        email = f"{local.lower()}@{domain}"

        existing = await db.tempemail.find_unique(where={"email": email})
        if not existing:
            is_unique = True

    expires_at = datetime.utcnow() + timedelta(hours=24)
    persona = generate_persona() if include_persona else None

    return await db.tempemail.create(
        data={
            "email": email,
            "userId": user_id,
            "expiresAt": expires_at,
            "personaName": persona["name"] if persona else None,
            "personaJob": persona["job"] if persona else None,
            "personaBio": persona["bio"] if persona else None,
            "personaAvatar": persona["avatar"] if persona else None,
            "camouflageEnabled": False
        }
    )
