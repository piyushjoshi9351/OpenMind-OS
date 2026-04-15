from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_memory_ingest_and_retrieve_roundtrip() -> None:
    user_id = f"user-{uuid4().hex[:8]}"

    ingest_response = client.post(
        "/api/v1/memory/ingest",
        json={
            "user_id": user_id,
            "content": "Review linear algebra vectors and matrix multiplication.",
            "node_type": "learning_note",
        },
    )

    assert ingest_response.status_code == 200
    ingest_data = ingest_response.json()
    assert ingest_data["node_id"].startswith("node-")
    assert ingest_data["vector_dim"] > 0
    assert 0 <= ingest_data["strength_score"] <= 100

    retrieve_response = client.post(
        "/api/v1/memory/retrieve",
        json={
            "user_id": user_id,
            "query": "matrix operations",
            "top_k": 3,
        },
    )

    assert retrieve_response.status_code == 200
    retrieve_data = retrieve_response.json()
    assert retrieve_data["user_id"] == user_id
    assert len(retrieve_data["matches"]) >= 1
    assert retrieve_data["matches"][0]["node_type"] == "learning_note"


def test_ml_insights_analyze_returns_expected_shape() -> None:
    user_id = f"ml-{uuid4().hex[:8]}"

    behavior_seed = client.post(
        "/api/v1/behavior/track",
        json={
            "user_id": user_id,
            "event_type": "task_completed",
            "task_completion_minutes": 42,
            "task_delay_days": 0,
            "session_duration_minutes": 70,
            "goal_progress_velocity": 1.6,
            "completed_task_delta": 2,
            "total_task_delta": 3,
            "workload_level": 2.5,
            "active_hours": 2.0,
        },
    )
    assert behavior_seed.status_code == 200

    response = client.post(
        "/api/v1/ml-insights/analyze",
        json={
            "user_id": user_id,
            "target_role": "AI Engineer",
            "user_skills": ["Python", "FastAPI", "SQL"],
            "window_days": 7,
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["user_id"] == user_id
    assert data["target_role"] == "ai_engineer"
    assert data["model_name"].startswith("python_ml_fusion_v2::")

    assert 0 <= data["ai_readiness_score"] <= 100
    assert 0 <= data["execution_score"] <= 100
    assert 0 <= data["risk_score"] <= 100
    assert 0 <= data["skill_gap_percentage"] <= 100
    assert 0 <= data["completion_probability"] <= 100
    assert isinstance(data["recommended_actions"], list)
    assert len(data["recommended_actions"]) >= 1


def test_ml_insights_validation_for_invalid_window_days() -> None:
    response = client.post(
        "/api/v1/ml-insights/analyze",
        json={
            "user_id": "u-12",
            "target_role": "AI Engineer",
            "user_skills": ["Python"],
            "window_days": 31,
        },
    )

    assert response.status_code == 422