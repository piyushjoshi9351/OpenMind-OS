from app.models.schemas import GoalOptimizeRequest, GoalOptimizeResponse
from app.models.schemas import GoalPredictionRequest
from app.services.prediction_service import prediction_service


class OptimizerService:
    def optimize(self, payload: GoalOptimizeRequest) -> GoalOptimizeResponse:
        if (
            payload.consistency_score is not None
            and payload.delay_ratio is not None
            and payload.completion_velocity is not None
            and payload.active_hours is not None
        ):
            prediction = prediction_service.predict(
                GoalPredictionRequest(
                    user_id=payload.user_id,
                    consistency_score=payload.consistency_score,
                    delay_ratio=payload.delay_ratio,
                    completion_velocity=payload.completion_velocity,
                    active_hours=payload.active_hours,
                )
            )
            probability = prediction.completion_probability
        else:
            timeline_boost = min(20, payload.timeline_months * 1.5)
            probability = max(35.0, min(92.0, 58.0 + timeline_boost))

        return GoalOptimizeResponse(
            completion_probability=probability,
            recommendations=[
                "Break target into weekly measurable milestones",
                "Allocate focused deep-work blocks during top productivity window",
                "Review progress weekly and re-plan tasks using adaptive policy",
            ],
        )


optimizer_service = OptimizerService()
