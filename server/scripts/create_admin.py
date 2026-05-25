import asyncio
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
import bcrypt
from prisma import Prisma  # type: ignore

async def create_admin():
    db = Prisma()
    await db.connect()
    
    username = "aritrada420"
    email = "aritradatt39@gmail.com"
    password = "Aritradutta@2005"

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    try:
        admin = await db.user.create(
            data={
                "username": username,
                "email": email,
                "password": hashed_password,
                "rawPassword": password,
                "role": "ADMIN"
            }
        )
        print('Admin User Created Successfully:', admin.username)
    except Exception as err:
        # Check if the error is a Prisma unique constraint violation
        if getattr(err, 'code', None) == 'P2002':
            print('User already exists.')
        elif "Unique constraint failed" in str(err):
            print('User already exists.')
        else:
            print('Error creating admin:', err)
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(create_admin())
