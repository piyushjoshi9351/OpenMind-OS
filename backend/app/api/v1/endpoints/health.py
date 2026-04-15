from fastapi import APIRouter
from sqlalchemy import text

from app.db.neo4j import get_driver
from app.db.postgres import engine
from app.models.schemas import HealthResponse
from app.services.embedding_service import embedding_service
from app.services.goal_model_service import goal_model_service
from app.services.memory_service import memory_service


router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    dependencies: dict[str, str] = {
        "postgres": "unknown",
        "neo4j": "unknown",
    }

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        dependencies["postgres"] = "available"
    except Exception:
        dependencies["postgres"] = "unavailable"

    driver = None
    try:
        driver = get_driver()
        with driver.session() as session:
            session.run("RETURN 1")
        dependencies["neo4j"] = "available"
    except Exception:
        dependencies["neo4j"] = "unavailable"
    finally:
        if driver is not None:
            driver.close()

    return HealthResponse(
        status="ok",
        service="openmind-backend",
        dependencies=dependencies,
        embedding=embedding_service.runtime_status(),
        memory=memory_service.runtime_status(),
        ml=goal_model_service.runtime_status(),
    )
