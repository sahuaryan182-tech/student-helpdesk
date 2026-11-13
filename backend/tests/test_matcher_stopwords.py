"""
The matcher ignores filler words ("how", "do", "I", "my", "the"...) when scoring.
Before this, a question could 'match' an unrelated FAQ purely on filler words.
"""
from app.services.nlp_matcher import match_query, meaningful_tokens


def test_meaningful_tokens_drops_filler_words():
    assert meaningful_tokens("How do I pay my semester fees?") == ["pay", "semester", "fees"]
    assert meaningful_tokens("what is the") == []


async def test_filler_words_alone_no_longer_cause_a_match(client, sample_faq):
    # Shares only "how", "can", "i" with "How can I pay semester fees?" -> must NOT match.
    result = await match_query("how can i get my tuition money")
    assert result["resolved"] is False
    assert result["faq"] is None


async def test_real_topic_words_still_match(client, sample_faq):
    result = await match_query("can I pay my fees")
    assert result["resolved"] is True
    assert result["faq"]["category"] == sample_faq["category"]


async def test_exact_faq_question_still_matches_with_full_confidence(client, sample_faq):
    result = await match_query(sample_faq["question"])
    assert result["resolved"] is True
    assert result["confidence"] == 1.0


async def test_question_made_only_of_filler_words_is_not_matched(client, sample_faq):
    result = await match_query("what is the")
    assert result == {"faq": None, "confidence": 0.0, "resolved": False}
