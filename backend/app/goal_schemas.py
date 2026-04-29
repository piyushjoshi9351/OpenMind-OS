from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.goal_models import GoalStatus


class GoalCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    status: GoalStatus = Field(default=GoalStatus.pending)


class GoalStatusUpdateRequest(BaseModel):
    status: GoalStatus


class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: GoalStatus
    created_at: datetime


class GoalSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: GoalStatus
    created_at: datetime
    score: float