from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import Select, desc, select
from sqlalchemy.orm import Session

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover - graceful fallback when dependency is absent
    genai = None

from app.chat_models import Message, MessageRole
from app.core.config import get_settings


SYSTEM_PROMPT = "You are a personal AI assistant helping students achieve their goals"
MODEL_NAME = "gemini-2.5-flash"  # Latest model with full capability


@dataclass
class ChatResult:
    conversation_id: str
    assistant_message: str


class GeminiChatService:
    def __init__(self) -> None:
        self._settings = get_settings()

    def _build_model(self):
        api_key = self._settings.gemini_api_key.strip()
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GEMINI_API_KEY is missing. Set it in backend/.env to enable Gemini chat.",
            )

        if genai is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="google-generativeai is not installed. Install the backend requirements to enable Gemini chat.",
            )

        genai.configure(api_key=api_key)
        return genai.GenerativeModel(MODEL_NAME, system_instruction=SYSTEM_PROMPT)

    @staticmethod
    def _map_error(exc: Exception) -> tuple[int, str]:
        error_type = type(exc).__name__.lower()
        message = str(exc).lower()

        if any(token in error_type for token in ("resourceexhausted", "too_many_requests")) or any(
            token in message for token in ("429", "rate limit", "quota", "resource exhausted")
        ):
            return status.HTTP_429_TOO_MANY_REQUESTS, "Gemini rate limit reached. Please try again shortly."

        if any(token in error_type for token in ("invalidargument", "permissiondenied", "unauthenticated")) or any(
            token in message for token in ("api key", "invalid api key", "permission denied", "unauthorized", "forbidden")
        ):
            return status.HTTP_503_SERVICE_UNAVAILABLE, "Gemini API key is missing or invalid."

        return status.HTTP_502_BAD_GATEWAY, "Gemini request failed. Please try again."

    @staticmethod
    def _to_gemini_history(messages: list[Message]) -> list[dict[str, Any]]:
        history: list[dict[str, Any]] = []
        for message in messages:
            role = "user" if message.role == MessageRole.user.value else "model"
            history.append({"role": role, "parts": [message.content]})
        return history

    @staticmethod
    def _load_history(db: Session, conversation_id: str, limit: int = 9) -> list[Message]:
        statement: Select[tuple[Message]] = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(desc(Message.id))
            .limit(limit)
        )
        rows = list(db.scalars(statement).all())
        return list(reversed(rows))

    @staticmethod
    def _save_turn(db: Session, conversation_id: str, user_message: str, assistant_message: str) -> None:
        db.add(Message(conversation_id=conversation_id, role=MessageRole.user.value, content=user_message))
        db.add(Message(conversation_id=conversation_id, role=MessageRole.assistant.value, content=assistant_message))
        db.commit()

    def send_message(self, db: Session, message: str, conversation_id: str | None = None) -> ChatResult:
        active_conversation_id = conversation_id or uuid4().hex
        context_messages = self._load_history(db, active_conversation_id)
        model = self._build_model()
        chat = model.start_chat(history=self._to_gemini_history(context_messages))

        try:
            response = chat.send_message(message)
        except Exception as exc:
            code, detail = self._map_error(exc)
            raise HTTPException(status_code=code, detail=detail) from exc

        assistant_message = getattr(response, "text", None) or str(response)
        self._save_turn(db, active_conversation_id, message, assistant_message)
        return ChatResult(conversation_id=active_conversation_id, assistant_message=assistant_message)

    def get_history(self, db: Session, conversation_id: str) -> list[Message]:
        statement = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.id.asc())
        return list(db.scalars(statement).all())


chat_service = GeminiChatService()