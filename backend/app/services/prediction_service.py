from __future__ import annotations

import math

from app.models.schemas import GoalPredictionRequest, GoalPredictionResponse


class PredictionService:
    """Simple logistic-regression style inference service.

    This uses fixed coefficients to bootstrap model behavior before model training.
    """

    def __init__(self) -> None:
        self._weights = {
            "bias": -0.9,
            "consistency": 0.032,
            "delay_ratio": -2.1,
            "completion_velocity": 0.42,
            "active_hours": 0.06,
        }

    @staticmethod
    def _sigmoid(value: float) -> float:
        return 1.0 / (1.0 + math.exp(-value))

    def predict(self, payload: GoalPredictionRequest) -> GoalPredictionResponse:
        linear = (
            self._weights["bias"]
            + self._weights["consistency"] * payload.consistency_score
            + self._weights["delay_ratio"] * payload.delay_ratio
            + self._weights["completion_velocity"] * payload.completion_velocity
            + self._weights["active_hours"] * payload.active_hours
        )

        probability = round(max(0.0, min(100.0, self._sigmoid(linear) * 100.0)), 2)

        return GoalPredictionResponse(
            completion_probability=probability,
            model_name="logistic_regression_bootstrap_v1",
            factors={
                "consistency_score": round(payload.consistency_score, 3),
                "delay_ratio": round(payload.delay_ratio, 4),
                "completion_velocity": round(payload.completion_velocity, 4),
                "active_hours": round(payload.active_hours, 4),
            },
        )


prediction_service = PredictionService()
