from fastapi.testclient import TestClient


def test_create_goal(test_app, monkeypatch):
    from app.services.embedding_service import embedding_service

    monkeypatch.setattr(embedding_service, "embed_text", lambda text: [0.1] * embedding_service.dimensions)

    client = TestClient(test_app)

    response = client.post("/api/v1/goals", json={"title": "Launch MVP", "description": "ship v1"})

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Launch MVP"
    assert body["description"] == "ship v1"
    assert body["status"] == "pending"


def test_get_goals(test_app, monkeypatch):
    from app.services.embedding_service import embedding_service

    monkeypatch.setattr(embedding_service, "embed_text", lambda text: [0.1] * embedding_service.dimensions)

    client = TestClient(test_app)
    client.post("/api/v1/goals", json={"title": "Goal A", "description": "alpha"})
    client.post("/api/v1/goals", json={"title": "Goal B", "description": "beta"})

    response = client.get("/api/v1/goals")

    assert response.status_code == 200
    items = response.json()
    assert len(items) == 2
    assert {item["title"] for item in items} == {"Goal A", "Goal B"}


def test_update_status(test_app, monkeypatch):
    from app.services.embedding_service import embedding_service

    monkeypatch.setattr(embedding_service, "embed_text", lambda text: [0.1] * embedding_service.dimensions)

    client = TestClient(test_app)
    created = client.post("/api/v1/goals", json={"title": "Goal C", "description": "update me"}).json()

    response = client.patch(f"/api/v1/goals/{created['id']}/status", json={"status": "in_progress"})

    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"


def test_delete_goal(test_app, monkeypatch):
    from app.services.embedding_service import embedding_service

    monkeypatch.setattr(embedding_service, "embed_text", lambda text: [0.1] * embedding_service.dimensions)

    client = TestClient(test_app)
    created = client.post("/api/v1/goals", json={"title": "Goal D", "description": "remove me"}).json()

    response = client.delete(f"/api/v1/goals/{created['id']}")

    assert response.status_code == 204
    remaining = client.get("/api/v1/goals").json()
    assert all(item["id"] != created["id"] for item in remaining)