from types import SimpleNamespace

from fastapi.testclient import TestClient


def test_chat_endpoint_returns_response(test_app, monkeypatch):
    client = TestClient(test_app)

    import app.api.v1.endpoints.chat as chat_endpoint

    class FakeChatService:
        def send_message(self, db, message, conversation_id=None):
            return SimpleNamespace(
                conversation_id=conversation_id or "conv-test",
                assistant_message=f"echo: {message}",
            )

        def get_history(self, db, conversation_id):
            return [
                SimpleNamespace(
                    id=1,
                    conversation_id=conversation_id,
                    role="user",
                    content="hello",
                    created_at="2026-01-01T00:00:00Z",
                )
            ]

    monkeypatch.setattr(chat_endpoint, "chat_service", FakeChatService())

    response = client.post("/api/v1/chat", json={"message": "Hi"})

    assert response.status_code == 200
    body = response.json()
    assert body["conversation_id"] == "conv-test"
    assert body["assistant_message"] == "echo: Hi"

    history_response = client.get(f"/api/v1/chat/{body['conversation_id']}")
    assert history_response.status_code == 200
    history = history_response.json()
    assert history["conversation_id"] == body["conversation_id"]
    assert len(history["messages"]) == 1
