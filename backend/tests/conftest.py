"""
Shared test fixtures.

IMPORTANT: tests run against a SEPARATE database (student_helpdesk_test),
never your real dev data — set via MONGO_DB_NAME below, applied before
the app is imported. Each test that needs a clean slate uses the
clean_test_db fixture, which wipes only that test database.
"""
import os
os.environ["MONGO_DB_NAME"] = "student_helpdesk_test"

from datetime import datetime, timezone

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager

from app.main import app
from app.services.auth_service import hash_password
from app.models.collections import admins_collection, faqs_collection, chat_logs_collection


@pytest_asyncio.fixture
async def app_with_lifespan():
    # Runs the app's real startup (MongoDB connect, indexes, seeding) and
    # shutdown events around each test, same as a real running server.
    async with LifespanManager(app):
        yield app


@pytest_asyncio.fixture
async def client(app_with_lifespan):
    transport = ASGITransport(app=app_with_lifespan)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def clean_test_db(app_with_lifespan):
    """Wipes the test database's collections. Use for tests that need a known-empty state."""
    await admins_collection().delete_many({})
    await faqs_collection().delete_many({})
    await chat_logs_collection().delete_many({})
    yield


@pytest_asyncio.fixture
async def sample_faq(app_with_lifespan, clean_test_db):
    """One known FAQ in the test DB, for chat-matching and FAQ-edit tests."""
    doc = {
        "category": "Fees",
        "question": "How can I pay semester fees?",
        "answer": "Pay via the student portal under Fee Payment.",
        "keywords": ["fees", "payment", "semester", "pay"],
        "active": True,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }
    result = await faqs_collection().insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


@pytest_asyncio.fixture
async def admin_user(app_with_lifespan, clean_test_db):
    """Creates a known admin directly in the test DB (bypassing the CLI script)."""
    creds = {"username": "test_admin", "password": "testpass123"}
    await admins_collection().insert_one({
        "username": creds["username"],
        "password_hash": hash_password(creds["password"]),
        "createdAt": datetime.now(timezone.utc),
    })
    return creds


@pytest_asyncio.fixture
async def admin_token(client, admin_user):
    res = await client.post("/api/auth/login", json=admin_user)
    return res.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
