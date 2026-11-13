"""
FAQ CRUD tests. Covers: add FAQ, edit FAQ, delete FAQ, invalid FAQ data,
and unauthorized access to each of those operations.
"""
from tests.conftest import auth_header


async def test_create_faq_success(client, admin_token, clean_test_db):
    payload = {
        "category": "Hostel",
        "question": "What is the hostel allotment process?",
        "answer": "Contact the hostel office after fee confirmation.",
        "keywords": ["hostel", "room"],
    }
    res = await client.post("/api/faqs", json=payload, headers=auth_header(admin_token))
    assert res.status_code == 201
    assert res.json()["category"] == "Hostel"


async def test_create_faq_invalid_data_rejected(client, admin_token, clean_test_db):
    # Empty category, too-short question, empty answer — all invalid
    payload = {"category": "", "question": "ab", "answer": ""}
    res = await client.post("/api/faqs", json=payload, headers=auth_header(admin_token))
    assert res.status_code == 422


async def test_create_faq_unauthenticated_rejected(client):
    res = await client.post(
        "/api/faqs",
        json={"category": "Fees", "question": "test question here", "answer": "test answer"},
    )
    assert res.status_code == 403


async def test_edit_faq_success(client, admin_token, sample_faq):
    faq_id = str(sample_faq["_id"])
    res = await client.put(
        f"/api/faqs/{faq_id}", json={"answer": "Updated answer text."}, headers=auth_header(admin_token)
    )
    assert res.status_code == 200
    assert res.json()["answer"] == "Updated answer text."
    # Fields not sent in the update must remain unchanged
    assert res.json()["category"] == "Fees"


async def test_edit_faq_invalid_data_rejected(client, admin_token, sample_faq):
    faq_id = str(sample_faq["_id"])
    res = await client.put(f"/api/faqs/{faq_id}", json={"question": "ab"}, headers=auth_header(admin_token))
    assert res.status_code == 422


async def test_edit_nonexistent_faq_returns_404(client, admin_token, clean_test_db):
    fake_id = "64b64b64b64b64b64b64b64b"
    res = await client.put(f"/api/faqs/{fake_id}", json={"answer": "x"}, headers=auth_header(admin_token))
    assert res.status_code == 404


async def test_edit_faq_unauthenticated_rejected(client, sample_faq):
    faq_id = str(sample_faq["_id"])
    res = await client.put(f"/api/faqs/{faq_id}", json={"answer": "hacked"})
    assert res.status_code == 403


async def test_delete_faq_success(client, admin_token, sample_faq):
    faq_id = str(sample_faq["_id"])
    res = await client.delete(f"/api/faqs/{faq_id}", headers=auth_header(admin_token))
    assert res.status_code == 204

    # Confirm it's actually gone
    list_res = await client.get("/api/faqs", headers=auth_header(admin_token))
    ids = [f["id"] for f in list_res.json()]
    assert faq_id not in ids


async def test_delete_nonexistent_faq_returns_404(client, admin_token, clean_test_db):
    fake_id = "64b64b64b64b64b64b64b64b"
    res = await client.delete(f"/api/faqs/{fake_id}", headers=auth_header(admin_token))
    assert res.status_code == 404


async def test_delete_faq_unauthenticated_rejected(client, sample_faq):
    faq_id = str(sample_faq["_id"])
    res = await client.delete(f"/api/faqs/{faq_id}")
    assert res.status_code == 403


async def test_list_faqs_category_filter(client, admin_token, sample_faq):
    res = await client.get("/api/faqs", params={"category": "Fees"}, headers=auth_header(admin_token))
    assert res.status_code == 200
    assert all(f["category"] == "Fees" for f in res.json())
