"""
Schemas for the student-facing chat endpoint and chat_logs collection.
"""
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


class ChatRequest(BaseModel):
    sessionId: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1, max_length=500)

    @field_validator("question", "sessionId")
    @classmethod
    def reject_whitespace_only(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("must not be empty or whitespace only")
        return stripped


class ChatResponse(BaseModel):
    answer: str
    category: Optional[str] = None
    confidence: float
    resolved: bool
    # "faq" = matched by the NLP matcher, "ai" = written by the AI from FAQ
    # entries, "fallback" = nothing suitable found.
    source: Literal["faq", "ai", "fallback"] = "faq"
    # Only for source == "ai": the FAQ the AI answer is based on, so the
    # student (and the examiner) can see exactly where it came from.
    sourceQuestion: Optional[str] = None
    sourceAnswer: Optional[str] = None


class ChatLogOut(BaseModel):
    id: str
    sessionId: str
    question: str
    answer: Optional[str] = None
    source: Optional[str] = None  # absent on logs written before AI support
    matchedFaqId: Optional[str] = None
    category: Optional[str] = None
    confidence: float
    resolved: bool
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)
