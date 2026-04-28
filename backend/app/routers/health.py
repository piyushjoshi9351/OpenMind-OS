from fastapi import APIRouter
from sqlalchemy import text

from app.database import engine
from app.models.schemas import HealthResponse
from app.services.embedding_service import embedding_service
from app.services.goal_model_service import goal_model_service
from app.services.memory_service import memory_service


router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    dependencies: dict[str, str] = {
        "sqlite": "unknown",
        "postgres": "unknown",
        "neo4j": "unknown",
    }

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        dependencies["sqlite"] = "available"
    except Exception:
        dependencies["sqlite"] = "unavailable"

    return HealthResponse(
        status="ok",
        service="openmind-backend",
        dependencies=dependencies,
        embedding=embedding_service.runtime_status(),
        memory=memory_service.runtime_status(),
        ml=goal_model_service.runtime_status(),
    )