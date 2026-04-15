from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_goal_prediction_returns_confidence_and_factors() -> None:
    response = client.post(
        "/api/v1/prediction/goal",
        json={
            "user_id": "pred-user-1",
            "consistency_score": 71,
            "delay_ratio": 0.18,
            "completion_velocity": 2.1,
            "active_hours": 3.4,
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert 0 <= data["completion_probability"] <= 100
    assert data["model_name"]
    assert 0 <= data["confidence_score"] <= 100
    assert "consistency_score" in data["factors"]
    assert "consistency_score" in data["normalized_factors"]


def test_scenario_simulation_returns_distribution_fields() -> None:
    response = client.post(
        "/api/v1/simulation/scenario",
        json={
            "user_id": "sim-user-1",
            "scenario": "career switch into AI engineering with structured part-time study",
            "consistency_score": 64,
            "delay_ratio": 0.21,
            "completion_velocity": 1.7,
            "active_hours": 2.4,
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert 0 <= data["risk_factor"] <= 100
    assert data["opportunity_cost"] in {"low", "medium", "high"}
    assert data["estimated_months"] >= 1
    assert 0 <= data["success_probability"] <= 100
    assert data["confidence_interval_low"] <= data["success_probability"] <= data["confidence_interval_high"]
    assert data["simulation_runs"] == 300
    assert isinstance(data["recommended_strategy"], str)
    assert len(data["recommended_strategy"]) > 10
