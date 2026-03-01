from fastapi import APIRouter

from app.models.schemas import SimulationRequest, SimulationResponse
from app.services.simulation_service import simulation_service


router = APIRouter()


@router.post("/scenario", response_model=SimulationResponse)
def run_simulation(payload: SimulationRequest) -> SimulationResponse:
    return simulation_service.simulate(payload)
