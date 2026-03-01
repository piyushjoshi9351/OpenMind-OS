from fastapi import APIRouter

from app.models.schemas import MLInsightsRequest, MLInsightsResponse
from app.services.ml_insights_service import ml_insights_service


router = APIRouter()


@router.post("/analyze", response_model=MLInsightsResponse)
def analyze_ml_insights(payload: MLInsightsRequest) -> MLInsightsResponse:
    return ml_insights_service.analyze(payload)