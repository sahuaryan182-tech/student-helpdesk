"""
Pydantic schemas for the FAQ resource.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


class FaqCreate(BaseModel):
    category: str = Field(..., min_length=1, max_length=50, examples=["Fees"])
    question: str = Field(..., min_length=3, examples=["How can I pay semester fees?"])
    answer: str = Field(..., min_length=1, examples=["Pay through the student portal under Fee Payment."])
    keywords: List[str] = Field(default_factory=list, examples=[["fees", "payment", "semester"]])
    active: bool = True

    @field_validator("category", "question", "answer")
    @classmethod
    def reject_whitespace_only(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("must not be empty or whitespace only")
        return stripped

    @field_validator("keywords")
    @classmethod
    def clean_keywords(cls, value: List[str]) -> List[str]:
        return [k.strip().lower() for k in value if k.strip()]


class FaqUpdate(BaseModel):
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    question: Optional[str] = Field(None, min_length=3)
    answer: Optional[str] = Field(None, min_length=1)
    keywords: Optional[List[str]] = None
    active: Optional[bool] = None

    @field_validator("category", "question", "answer")
    @classmethod
    def reject_whitespace_only(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("must not be empty or whitespace only")
        return stripped

    @field_validator("keywords")
    @classmethod
    def clean_keywords(cls, value: Optional[List[str]]) -> Optional[List[str]]:
        if value is None:
            return value
        return [k.strip().lower() for k in value if k.strip()]


class FaqOut(BaseModel):
    id: str
    category: str
    question: str
    answer: str
    keywords: List[str]
    active: bool
    createdAt: datetime
    updatedAt: datetime

    model_config = ConfigDict(from_attributes=True)
