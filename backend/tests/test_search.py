from fastapi.testclient import TestClient


def test_semantic_search_returns_results(test_app, monkeypatch):
    client = TestClient(test_app)

    from app.services.embedding_service import embedding_service

    def fake_embed_text(text: str):
        text = text.lower()
        if "python" in text:
            return [1.0] + [0.0] * (embedding_service.dimensions - 1)
        if "cooking" in text:
            return [0.0, 1.0] + [0.0] * (embedding_service.dimensions - 2)
        return [1.0] + [0.0] * (embedding_service.dimensions - 1)

    monkeypatch.setattr(embedding_service, "embed_text", fake_embed_text)

    client.post("/api/v1/goals", json={"title": "Learn Python", "description": "Programming"})
    client.post("/api/v1/goals", json={"title": "Learn Cooking", "description": "Culinary"})

    response = client.get("/api/v1/goals/search", params={"q": "python"})

    assert response.status_code == 200
    results = response.json()
    assert len(results) == 2
    assert all("score" in result for result in results)
    assert results[0]["score"] >= results[1]["score"]
    assert results[0]["title"] == "Learn Python"
