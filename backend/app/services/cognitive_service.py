from app.models.schemas import CognitiveProfileRequest, CognitiveProfileResponse
from app.services.behavior_service import behavior_service


class CognitiveService:
    def profile(self, payload: CognitiveProfileRequest) -> CognitiveProfileResponse:
        summary = behavior_service.summary(payload.user_id)
        return CognitiveProfileResponse(
            consistency_score=float(summary["consistency_score"]),
            burnout_risk=float(summary["burnout_risk"]),
            focus_score=float(summary["focus_score"]),
            learning_velocity=round(1.0 + float(summary["completion_velocity"]) * 0.08 - float(summary["delay_ratio"]) * 0.3, 3),
        )


cognitive_service = CognitiveService()
