from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import database as goal_database
from app.database import Base
from app.main import app


def _override_db_session(test_engine):
    testing_session_local = sessionmaker(bind=test_engine, autoflush=False, autocommit=False, expire_on_commit=False)

    def override_get_db():
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    return override_get_db


def _make_client(tmp_path: Path) -> TestClient:
    test_engine = create_engine(
        f"sqlite:///{(tmp_path / 'goals.sqlite3').as_posix()}",
        connect_args={"check_same_thread": False},
        future=True,
    )
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[goal_database.get_db] = _override_db_session(test_engine)
    return TestClient(app)


def test_health_endpoint_is_available(tmp_path: Path) -> None:
    client = _make_client(tmp_path)
    try:
        response = client.get("/health")
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "ok"
        assert body["service"] == "openmind-backend"
        assert body["dependencies"]["sqlite"] == "available"
    finally:
        app.dependency_overrides.clear()
        client.close()


def test_goal_crud_roundtrip(tmp_path: Path) -> None:
    client = _make_client(tmp_path)
    try:
        create_response = client.post(
            "/goals",
            json={
                "title": "Finish FastAPI basics",
                "description": "Routes, routers, and dependency injection",
                "status": "pending",
            },
        )

        assert create_response.status_code == 201
        created = create_response.json()
        goal_id = created["id"]
        assert created["status"] == "pending"

        list_response = client.get("/goals")
        assert list_response.status_code == 200
        goals = list_response.json()
        assert len(goals) == 1
        assert goals[0]["title"] == "Finish FastAPI basics"

        update_response = client.patch(f"/goals/{goal_id}/status", json={"status": "done"})
        assert update_response.status_code == 200
        assert update_response.json()["status"] == "done"

        delete_response = client.delete(f"/goals/{goal_id}")
        assert delete_response.status_code == 204

        final_list = client.get("/goals")
        assert final_list.status_code == 200
        assert final_list.json() == []
    finally:
        app.dependency_overrides.clear()
        client.close()


def test_invalid_goal_status_rejected(tmp_path: Path) -> None:
    client = _make_client(tmp_path)
    try:
        response = client.post(
            "/goals",
            json={
                "title": "Learn validation",
                "status": "blocked",
            },
        )

        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()
        client.close()