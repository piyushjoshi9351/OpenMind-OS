from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import GoalStatus


class GoalCreate(BaseModel):
    user_id: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    status: GoalStatus = Field(default=GoalStatus.pending)


class GoalUpdate(BaseModel):
    status: GoalStatus


class GoalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    title: str
    description: str | None
    status: GoalStatus
    created_at: datetime


class HealthResponse(BaseModel):
    status: str
    service: str
