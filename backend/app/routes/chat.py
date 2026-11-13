"""
Student-facing chat endpoints. No admin login required here.

Answering strategy (hybrid):
  1. NLP matcher: normalize -> tokenize -> score -> confidence threshold.
     A confident match is answered straight from the FAQ. No AI involved.
  2. If there is no confident match AND AI is enabled, the FAQ entries are given
     to a language model that may answer ONLY from them (see services/ai_service).
  3. Otherwise: the honest "no suitable answer" fallback.
"""
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Query, Request

from app.config import settings
from app.schemas.chat import ChatRequest, ChatResponse, ChatLogOut
from app.services import ai_service
from app.services.nlp_matcher import match_query, rank_faqs
from app.models.collections import chat_logs_collection
from app.utils.serializers import serialize_list

router = APIRouter()

FALLBACK_MESSAGE = (
    "Sorry, I couldn't find a suitable answer in the current helpdesk "
    "knowledge base. Please try another question or contact the helpdesk."
)


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest, request: Request):
    match = await match_query(payload.question)
    faq = match["faq"]

    source = "faq" if faq else "fallback"
    answer = faq["answer"] if faq else FALLBACK_MESSAGE
    category = faq["category"] if faq else None
    matched_id = str(faq["_id"]) if faq else None
    resolved = match["resolved"]
    source_question = source_answer = None

    if not faq and ai_service.is_enabled():
        # Rate-limit per client IP so a public page can't drain the API credit.
        client_key = request.client.host if request.client else payload.sessionId
        if ai_service.ai_limiter.allow(client_key):
            candidates = await rank_faqs(payload.question, limit=settings.AI_CONTEXT_FAQS)
            ai = await ai_service.answer_from_faqs(payload.question, [c["faq"] for c in candidates])
            if ai:
                source, resolved = "ai", True
                answer, category = ai.answer, ai.faq["category"]
                matched_id = str(ai.faq["_id"])
                source_question, source_answer = ai.faq["question"], ai.faq["answer"]

    # The answer text and its source are stored with the log so chat history shows
    # exactly what the student saw, and the admin can tell AI answers apart.
    await chat_logs_collection().insert_one({
        "sessionId": payload.sessionId,
        "question": payload.question,
        "answer": answer,
        "source": source,
        "matchedFaqId": matched_id,
        "category": category,
        "confidence": match["confidence"],
        "resolved": resolved,
        "createdAt": datetime.now(timezone.utc),
    })

    return ChatResponse(
        answer=answer,
        category=category,
        confidence=match["confidence"],
        resolved=resolved,
        source=source,
        sourceQuestion=source_question,
        sourceAnswer=source_answer,
    )


@router.get("/history", response_model=List[ChatLogOut])
async def chat_history(sessionId: str = Query(...)):
    docs = (
        await chat_logs_collection()
        .find({"sessionId": sessionId})
        .sort("createdAt", 1)
        .to_list(length=200)
    )
    return serialize_list(docs)
