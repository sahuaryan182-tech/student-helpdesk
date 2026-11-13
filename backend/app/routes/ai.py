"""
Admin-only AI endpoints. Both require a logged-in admin.

GET  /api/ai/status            is AI on? which model? did the last call fail?
POST /api/ai/suggest-keywords  AI-suggested keywords for the FAQ form
"""
from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.middleware.auth_middleware import get_current_admin
from app.models.collections import chat_logs_collection
from app.schemas.ai import AiStatus, KeywordSuggestRequest, KeywordSuggestResponse
from app.services import ai_service

router = APIRouter()


@router.get("/status", response_model=AiStatus)
async def ai_status(admin=Depends(get_current_admin)):
    enabled = ai_service.is_enabled()
    return AiStatus(
        enabled=enabled,
        provider=settings.AI_PROVIDER if enabled else None,
        model=ai_service.model_name() if enabled else None,
        lastError=ai_service.last_error,
        aiAnswered=await chat_logs_collection().count_documents({"source": "ai"}),
    )


@router.post("/suggest-keywords", response_model=KeywordSuggestResponse)
async def suggest_keywords(payload: KeywordSuggestRequest, admin=Depends(get_current_admin)):
    if not ai_service.is_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI features are not enabled on the server.",
        )
    try:
        keywords = await ai_service.suggest_keywords(payload.question, payload.answer)
    except ai_service.AIUnavailable as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
    return KeywordSuggestResponse(keywords=keywords)
