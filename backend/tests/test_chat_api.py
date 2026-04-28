from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import database as chat_database
from app.database import Base
from app.main import app
from app.services import chat_service as chat_service_module


class FakeResponse:
    def __init__(self, text: str) -> None:
        self.text = text


class FakeChatSession:
    def __init__(self, history: list[dict[str, object]]) -> None:
        self.history = history

    def send_message(self, message: str) -> FakeResponse:
        return FakeResponse(f"AI reply: {message}")


class FakeGenerativeModel:
    def __init__(self, history_bucket: list[list[dict[str, object]]]) -> None:
        self._history_bucket = history_bucket

    def start_chat(self, history: list[dict[str, object]]) -> FakeChatSession:
        self._history_bucket.append(history)
        return FakeChatSession(history)


class FakeGenAI:
    def __init__(self) -> None:
        self.configured_api_key: str | None = None
        self.history_bucket: list[list[dict[str, object]]] = []

    def configure(self, api_key: str) -> None:
        self.configured_api_key = api_key

    def GenerativeModel(self, model_name: str, system_instruction: str) -> FakeGenerativeModel:
        return FakeGenerativeModel(self.history_bucket)


def make_client(tmp_path: Path) -> TestClient:
    test_engine = create_engine(
        f"sqlite:///{(tmp_path / 'chat.sqlite3').as_posix()}",
        connect_args={"check_same_thread": False},
        future=True,
    )
    Base.metadata.create_all(bind=test_engine)
    testing_session_local = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)

    def override_get_db():
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[chat_database.get_db] = override_get_db
    return TestClient(app)


def test_chat_roundtrip_and_history(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    fake_genai = FakeGenAI()
    monkeypatch.setattr(chat_service_module, "genai", fake_genai)
    chat_service_module.chat_service._settings.gemini_api_key = "test-key"

    client = make_client(tmp_path)
    try:
        response = client.post(
            "/api/v1/chat",
            json={"message": "Help me plan today's study goals"},
        )

        assert response.status_code == 200
        body = response.json()
        conversation_id = body["conversation_id"]
        assert body["assistant_message"] == "AI reply: Help me plan today's study goals"

        history = client.get(f"/api/v1/chat/{conversation_id}")
        assert history.status_code == 200
        history_body = history.json()
        assert history_body["conversation_id"] == conversation_id
        assert len(history_body["messages"]) == 2
        assert history_body["messages"][0]["role"] == "user"
        assert history_body["messages"][1]["role"] == "assistant"
        assert fake_genai.history_bucket[0] == []
    finally:
        app.dependency_overrides.clear()
        client.close()


def test_missing_api_key_returns_meaningful_error(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(chat_service_module, "genai", FakeGenAI())
    chat_service_module.chat_service._settings.gemini_api_key = ""

    client = make_client(tmp_path)
    try:
        response = client.post(
            "/api/v1/chat",
            json={"message": "Hello"},
        )

        assert response.status_code == 503
        assert "GEMINI_API_KEY" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()
        client.close()


def test_rate_limit_returns_429(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    class RateLimitedChatSession(FakeChatSession):
        def send_message(self, message: str) -> FakeResponse:
            raise RuntimeError("429 RESOURCE_EXHAUSTED: rate limit reached")

    class RateLimitedModel(FakeGenerativeModel):
        def start_chat(self, history: list[dict[str, object]]) -> RateLimitedChatSession:
            return RateLimitedChatSession(history)

    class RateLimitedGenAI(FakeGenAI):
        def GenerativeModel(self, model_name: str, system_instruction: str) -> RateLimitedModel:
            return RateLimitedModel(self.history_bucket)

    monkeypatch.setattr(chat_service_module, "genai", RateLimitedGenAI())
    chat_service_module.chat_service._settings.gemini_api_key = "test-key"

    client = make_client(tmp_path)
    try:
        response = client.post(
            "/api/v1/chat",
            json={"message": "Hello"},
        )

        assert response.status_code == 429
        assert "rate limit" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()
        client.close()