"""
Run this once to create the first admin account:
    python -m app.utils.create_admin
There is no public signup endpoint by design.
"""
import asyncio
import getpass
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.services.auth_service import hash_password


async def main():
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]

    username = input("Admin username: ").strip()
    password = getpass.getpass("Admin password (min 6 chars): ")
    confirm = getpass.getpass("Confirm password: ")

    if password != confirm:
        print("Passwords do not match.")
        return
    if len(password) < 6:
        print("Password must be at least 6 characters.")
        return

    existing = await db["admins"].find_one({"username": username})
    if existing:
        print(f"Admin '{username}' already exists.")
        return

    await db["admins"].insert_one({
        "username": username,
        "password_hash": hash_password(password),
        "createdAt": datetime.now(timezone.utc),
    })
    print(f"Admin '{username}' created successfully.")


if __name__ == "__main__":
    asyncio.run(main())
