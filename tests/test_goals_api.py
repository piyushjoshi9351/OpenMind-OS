from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import database as goal_database
from app.database import Base
from app.main import app


def make_client(tmp_path: Path) -> TestClient:
    test_engine = create_engine(
        f"sqlite:///{(tmp_path / 'goals.sqlite3').as_posix()}",
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

    app.dependency_overrides[goal_database.get_db] = override_get_db
    return TestClient(app)


def test_create_and_list_goals_filter_by_user(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    try:
        response = client.post(
            "/api/v1/goals",
            json={"user_id": "user-1", "title": "Finish FastAPI", "description": "routes", "status": "pending"},
        )
        assert response.status_code == 201

        second = client.post(
            "/api/v1/goals",
            json={"user_id": "user-2", "title": "Other goal", "description": None, "status": "in_progress"},
        )
        assert second.status_code == 201

        all_goals = client.get("/api/v1/goals")
        assert all_goals.status_code == 200
        assert len(all_goals.json()) == 2

        user_goals = client.get("/api/v1/goals", params={"user_id": "user-1"})
        assert user_goals.status_code == 200
        assert len(user_goals.json()) == 1
        assert user_goals.json()[0]["user_id"] == "user-1"
    finally:
        app.dependency_overrides.clear()
        client.close()


def test_update_and_delete_goal(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    try:
        created = client.post(
            "/api/v1/goals",
            json={"user_id": "user-1", "title": "Update me", "description": "x", "status": "pending"},
        ).json()

        updated = client.put(f"/api/v1/goals/{created['id']}", json={"status": "done"})
        assert updated.status_code == 200
        assert updated.json()["status"] == "done"

        deleted = client.delete(f"/api/v1/goals/{created['id']}")
        assert deleted.status_code == 204

        after_delete = client.get("/api/v1/goals", params={"user_id": "user-1"})
        assert after_delete.json() == []
    finally:
        app.dependency_overrides.clear()
        client.close()


def test_invalid_status_rejected(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    try:
        response = client.post(
            "/api/v1/goals",
            json={"user_id": "user-1", "title": "Bad status", "status": "blocked"},
        )
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()
        client.close()