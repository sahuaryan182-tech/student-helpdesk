"""
Admin auth tests. Covers: valid login, invalid login, missing auth,
invalid JWT, unauthorized access to protected routes.
"""
from tests.conftest import auth_header


async def test_valid_login_returns_token(client, admin_user):
    res = await client.post("/api/auth/login", json=admin_user)
    assert res.status_code == 200
    assert "access_token" in res.json()


async def test_invalid_password_rejected(client, admin_user):
    res = await client.post(
        "/api/auth/login",
        json={"username": admin_user["username"], "password": "wrongpassword"},
    )
    assert res.status_code == 401


async def test_unknown_username_rejected(client, admin_user):
    res = await client.post(
        "/api/auth/login",
        json={"username": "nobody_registered", "password": "whatever123"},
    )
    assert res.status_code == 401


async def test_login_error_message_identical_for_bad_username_and_bad_password(client, admin_user):
    # Security check: the API must not reveal WHICH part was wrong,
    # otherwise an attacker could enumerate valid usernames.
    res_bad_user = await client.post("/api/auth/login", json={"username": "nobody", "password": "whatever123"})
    res_bad_pass = await client.post(
        "/api/auth/login", json={"username": admin_user["username"], "password": "wrongpassword"}
    )
    assert res_bad_user.json()["detail"] == res_bad_pass.json()["detail"]


async def test_protected_route_with_no_token_rejected(client):
    # No Authorization header at all -> HTTPBearer itself blocks this (403)
    res = await client.get("/api/faqs")
    assert res.status_code == 403


async def test_protected_route_with_garbage_token_rejected(client):
    # Header present but not a real/valid JWT -> our own check returns 401
    res = await client.get("/api/faqs", headers=auth_header("not-a-real-token"))
    assert res.status_code == 401


async def test_protected_route_with_valid_token_succeeds(client, admin_token, clean_test_db):
    res = await client.get("/api/faqs", headers=auth_header(admin_token))
    assert res.status_code == 200
