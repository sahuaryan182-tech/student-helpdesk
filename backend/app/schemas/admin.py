"""
Admin schemas.
"""
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class AdminLogin(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class AdminOut(BaseModel):
    id: str
    username: str
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)
