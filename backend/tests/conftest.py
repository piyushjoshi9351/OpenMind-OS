from pathlib import Path
import os
import sys

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


os.environ.setdefault("ENABLE_ML_STUBS", "true")
os.environ.setdefault("PRELOAD_EMBEDDING_MODEL", "false")
os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("POSTGRES_URL", "sqlite:///./.cache/test-health.sqlite3")


BACKEND_ROOT = Path(__file__).resolve().parents[1]
backend_root_str = str(BACKEND_ROOT)
if backend_root_str not in sys.path:
    sys.path.insert(0, backend_root_str)


@pytest.fixture(autouse=True)
def stub_health_dependency(monkeypatch):
    from app.api.v1.endpoints import health as health_endpoint

    class FakeSession:
        def run(self, *args, **kwargs):
            return None

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

    class FakeDriver:
        def session(self):
            return FakeSession()

        def close(self):
            return None

    monkeypatch.setattr(health_endpoint, "get_driver", lambda: FakeDriver())


@pytest.fixture()
def test_app(monkeypatch):
    from app.database import Base, get_db
    from app.main import app as fastapi_app

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    fastapi_app.dependency_overrides[get_db] = override_get_db

    yield fastapi_app

    fastapi_app.dependency_overrides.clear()