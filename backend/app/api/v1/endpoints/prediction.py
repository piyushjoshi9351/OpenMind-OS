from fastapi import APIRouter

from app.models.schemas import GoalPredictionRequest, GoalPredictionResponse
from app.services.prediction_service import prediction_service


router = APIRouter()


@router.post("/goal", response_model=GoalPredictionResponse)
def predict_goal_completion(payload: GoalPredictionRequest) -> GoalPredictionResponse:
    return prediction_service.predict(payload)
