"""
Central place to get a handle on each MongoDB collection and define indexes.
"""
from app.database import get_db


def faqs_collection():
    return get_db()["faqs"]


def admins_collection():
    return get_db()["admins"]


def chat_logs_collection():
    return get_db()["chat_logs"]


async def create_indexes():
    db = get_db()
    await db["faqs"].create_index([("question", "text"), ("keywords", "text")])
    await db["faqs"].create_index("category")
    await db["faqs"].create_index("active")
    await db["chat_logs"].create_index("sessionId")
    await db["chat_logs"].create_index("createdAt")
    await db["admins"].create_index("username", unique=True)
    print("MongoDB indexes verified")
