from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.chat_models import MessageRole


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation_id: str | None = Field(default=None, min_length=1, max_length=64)


class ChatResponse(BaseModel):
    conversation_id: str
    assistant_message: str


class ChatMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: str
    role: MessageRole
    content: str
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    conversation_id: str
    messages: list[ChatMessageRead]