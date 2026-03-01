from fastapi import APIRouter

from app.models.schemas import GoalOptimizeRequest, GoalOptimizeResponse
from app.services.optimizer_service import optimizer_service


router = APIRouter()


@router.post("/goal", response_model=GoalOptimizeResponse)
def optimize_goal(payload: GoalOptimizeRequest) -> GoalOptimizeResponse:
    return optimizer_service.optimize(payload)
