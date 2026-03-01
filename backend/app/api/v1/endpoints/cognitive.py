from fastapi import APIRouter

from app.models.schemas import CognitiveProfileRequest, CognitiveProfileResponse
from app.services.cognitive_service import cognitive_service


router = APIRouter()


@router.post("/profile", response_model=CognitiveProfileResponse)
def profile(payload: CognitiveProfileRequest) -> CognitiveProfileResponse:
    return cognitive_service.profile(payload)
