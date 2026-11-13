"""
MongoDB connection setup using Motor (the async MongoDB driver for Python).
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure
from app.config import settings

client: AsyncIOMotorClient | None = None
db = None


async def connect_to_mongo():
    global client, db
    client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[settings.MONGO_DB_NAME]
    try:
        await client.admin.command("ping")
    except (ServerSelectionTimeoutError, ConnectionFailure) as exc:
        raise RuntimeError(
            f"Could not connect to MongoDB at '{settings.MONGO_URI}'. "
            "Is MongoDB running? Check MONGO_URI in your .env file."
        ) from exc
    print(f"Connected to MongoDB database: {settings.MONGO_DB_NAME}")


async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_db():
    return db
