"""
Lightweight NLP + FAQ matching engine.

NOT a large language model. A transparent, explainable keyword-overlap
matcher: normalize -> tokenize -> compare against FAQ keywords/questions
-> score -> confidence -> threshold -> fallback.
"""
import re
from app.models.collections import faqs_collection

CONFIDENCE_THRESHOLD = 0.34

# Filler words that say nothing about the TOPIC of a question. Without this,
# "how do I settle my tuition" scores a "match" with "How do I check my result?"
# purely because of "how", "do", "i" and "my". They are ignored when scoring.
STOPWORDS = frozenset("""
a an the and or but if so than then that this these those there here
is are was were be been am do does did done can could will would should shall may might must
have has had get got give gives need needs want wants please tell show know
i me my mine we us our you your he him his she her it its they them their
how what when where which who whom why
to of in on at for from by with about as into onto over under up out off
any some
""".split())


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def tokenize(text: str) -> list[str]:
    return normalize(text).split()


def meaningful_tokens(text: str) -> list[str]:
    """Tokens that carry meaning: the tokenized text without filler words."""
    return [t for t in tokenize(text) if t not in STOPWORDS]


async def rank_faqs(question: str, limit: int | None = None) -> list[dict]:
    """
    Scores every ACTIVE FAQ against the question, best first.
    Returns [{"faq": <doc>, "score": int, "confidence": float}, ...].
    Ties keep the original database order (sorted() is stable).
    """
    query_tokens = meaningful_tokens(question)
    faqs = await faqs_collection().find({"active": True}).to_list(length=1000)

    ranked = []
    for faq in faqs:
        vocabulary = set(k.lower() for k in faq.get("keywords", []))
        vocabulary |= set(tokenize(faq.get("question", "")))
        score = len(set(query_tokens) & vocabulary)
        confidence = round(min(score / len(query_tokens), 1.0), 2) if query_tokens else 0.0
        ranked.append({"faq": faq, "score": score, "confidence": confidence})

    ranked.sort(key=lambda r: r["score"], reverse=True)
    return ranked[:limit] if limit else ranked


async def match_query(question: str) -> dict:
    """The original matcher: the single best FAQ, or no match below the threshold."""
    if not meaningful_tokens(question):
        return {"faq": None, "confidence": 0.0, "resolved": False}

    ranked = await rank_faqs(question)
    best = ranked[0] if ranked and ranked[0]["score"] > 0 else None

    confidence = best["confidence"] if best else 0.0
    resolved = best is not None and confidence >= CONFIDENCE_THRESHOLD

    return {
        "faq": best["faq"] if resolved else None,
        "confidence": confidence,
        "resolved": resolved,
    }
