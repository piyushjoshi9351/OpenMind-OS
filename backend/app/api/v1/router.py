from fastapi import APIRouter

from app.api.v1.endpoints import ai, behavior, cognitive, events, health, memory, ml_insights, optimizer, prediction, simulation, skill_gap


v1_router = APIRouter()
v1_router.include_router(health.router, tags=["health"])
v1_router.include_router(ai.router, prefix="/ai", tags=["ai"])
v1_router.include_router(memory.router, prefix="/memory", tags=["memory"])
v1_router.include_router(events.router, prefix="/events", tags=["events"])
v1_router.include_router(behavior.router, prefix="/behavior", tags=["behavior"])
v1_router.include_router(cognitive.router, prefix="/cognitive", tags=["cognitive"])
v1_router.include_router(optimizer.router, prefix="/optimizer", tags=["optimizer"])
v1_router.include_router(prediction.router, prefix="/prediction", tags=["prediction"])
v1_router.include_router(skill_gap.router, prefix="/skill-gap", tags=["skill-gap"])
v1_router.include_router(simulation.router, prefix="/simulation", tags=["simulation"])
v1_router.include_router(ml_insights.router, prefix="/ml-insights", tags=["ml-insights"])
