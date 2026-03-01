from fastapi import APIRouter

from app.api.v1.endpoints import cognitive, events, health, memory, optimizer, simulation


v1_router = APIRouter()
v1_router.include_router(health.router, tags=["health"])
v1_router.include_router(memory.router, prefix="/memory", tags=["memory"])
v1_router.include_router(events.router, prefix="/events", tags=["events"])
v1_router.include_router(cognitive.router, prefix="/cognitive", tags=["cognitive"])
v1_router.include_router(optimizer.router, prefix="/optimizer", tags=["optimizer"])
v1_router.include_router(simulation.router, prefix="/simulation", tags=["simulation"])
