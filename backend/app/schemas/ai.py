"""Schemas for the admin-only AI endpoints."""
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class KeywordSuggestRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=500)
    answer: str = Field(..., min_length=1, max_length=2000)

    @field_validator("question", "answer")
    @classmethod
    def reject_whitespace_only(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("must not be empty or whitespace only")
        return stripped


class KeywordSuggestResponse(BaseModel):
    keywords: List[str]


class AiStatus(BaseModel):
    enabled: bool
    provider: Optional[str] = None
    model: Optional[str] = None
    lastError: Optional[str] = None
    aiAnswered: int = 0
