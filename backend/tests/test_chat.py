"""
Student-facing chat tests. Covers every case from the original test
requirements: valid FAQ query, reworded query, unknown query, empty
input, invalid input, repeated queries.
"""


async def test_valid_faq_query_returns_matched_answer(client, sample_faq):
    res = await client.post("/api/chat", json={"sessionId": "s1", "question": "how can i pay my fees"})
    assert res.status_code == 200
    data = res.json()
    assert data["resolved"] is True
    assert "portal" in data["answer"].lower()
    assert data["confidence"] > 0


async def test_reworded_query_still_matches(client, sample_faq):
    # Different wording, same intent — proves the matcher isn't just
    # doing exact string comparison.
    res = await client.post("/api/chat", json={"sessionId": "s1", "question": "where do i pay semester fee"})
    assert res.status_code == 200
    assert res.json()["resolved"] is True


async def test_unknown_query_falls_back(client, sample_faq):
    res = await client.post("/api/chat", json={"sessionId": "s1", "question": "purple elephant flying spaceship"})
    assert res.status_code == 200
    data = res.json()
    assert data["resolved"] is False
    assert "contact the helpdesk" in data["answer"].lower()


async def test_empty_input_rejected(client, sample_faq):
    res = await client.post("/api/chat", json={"sessionId": "s1", "question": ""})
    assert res.status_code == 422


async def test_whitespace_only_input_rejected(client, sample_faq):
    res = await client.post("/api/chat", json={"sessionId": "s1", "question": "   "})
    assert res.status_code == 422


async def test_invalid_input_missing_required_field(client, sample_faq):
    # sessionId is required — omitting it should fail validation, not crash
    res = await client.post("/api/chat", json={"question": "how can i pay fees"})
    assert res.status_code == 422


async def test_repeated_queries_are_all_logged(client, sample_faq):
    session_id = "repeat-session"
    for _ in range(3):
        await client.post("/api/chat", json={"sessionId": session_id, "question": "how can i pay fees"})

    res = await client.get("/api/chat/history", params={"sessionId": session_id})
    assert res.status_code == 200
    assert len(res.json()) == 3
