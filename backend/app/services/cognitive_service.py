from app.models.schemas import CognitiveProfileRequest, CognitiveProfileResponse


class CognitiveService:
    def profile(self, _: CognitiveProfileRequest) -> CognitiveProfileResponse:
        return CognitiveProfileResponse(
            consistency_score=82.0,
            burnout_risk=28.0,
            focus_score=76.0,
            learning_velocity=1.32,
        )


cognitive_service = CognitiveService()
