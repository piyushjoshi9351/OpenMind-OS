from app.models.schemas import GoalPredictionRequest, GoalPredictionResponse
from app.services.goal_model_service import goal_model_service


class PredictionService:
    def predict(self, payload: GoalPredictionRequest) -> GoalPredictionResponse:
        inference = goal_model_service.predict(
            {
                "consistency_score": payload.consistency_score,
                "delay_ratio": payload.delay_ratio,
                "completion_velocity": payload.completion_velocity,
                "active_hours": payload.active_hours,
            }
        )

        return GoalPredictionResponse(
            completion_probability=float(inference["completion_probability"]),
            model_name=str(inference["model_name"]),
            confidence_score=float(inference["confidence_score"]),
            factors=dict(inference["factors"]),
            normalized_factors=dict(inference["normalized_factors"]),
        )


prediction_service = PredictionService()
