from fastapi import FastAPI
from fastapi.responses import RedirectResponse

from app.database import init_db
from app.routers.goals import router as goals_router
from app.schemas import HealthResponse


app = FastAPI(title="OpenMind OS", version="0.1.0")
app.include_router(goals_router, prefix="/api/v1")
init_db()


@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse(url="/docs")


@app.get("/api/v1/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="openmind-os")
