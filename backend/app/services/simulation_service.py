from __future__ import annotations

from hashlib import sha256
import random

from app.models.schemas import GoalPredictionRequest, SimulationRequest, SimulationResponse
from app.services.prediction_service import prediction_service


class SimulationService:
    @staticmethod
    def _scenario_risk_boost(scenario: str) -> float:
        lowered = scenario.lower()
        if "startup" in lowered:
            return 18.0
        if "career" in lowered:
            return 7.0
        if "switch" in lowered or "pivot" in lowered:
            return 11.0
        return 4.0

    @staticmethod
    def _scenario_complexity_boost(scenario: str) -> float:
        word_count = max(1, len([chunk for chunk in scenario.split() if chunk.strip()]))
        return min(14.0, word_count * 0.35)

    @staticmethod
    def _features_from_payload(payload: SimulationRequest) -> dict[str, float]:
        scenario = payload.scenario.lower()
        consistency = payload.consistency_score
        delay_ratio = payload.delay_ratio
        completion_velocity = payload.completion_velocity
        active_hours = payload.active_hours

        if consistency is None:
            consistency = 52.0
            if "discipl" in scenario or "consistent" in scenario:
                consistency += 16.0
            if "burnout" in scenario or "overwhelm" in scenario:
                consistency -= 14.0

        if delay_ratio is None:
            delay_ratio = 0.22
            if "deadline" in scenario or "urgent" in scenario:
                delay_ratio += 0.1
            if "structured" in scenario or "plan" in scenario:
                delay_ratio -= 0.06

        if completion_velocity is None:
            completion_velocity = 1.3
            if "sprint" in scenario or "intensive" in scenario:
                completion_velocity += 0.55

        if active_hours is None:
            active_hours = 1.8
            if "full-time" in scenario:
                active_hours += 1.6
            if "part-time" in scenario:
                active_hours -= 0.45

        return {
            "consistency_score": max(0.0, min(100.0, consistency)),
            "delay_ratio": max(0.0, min(1.0, delay_ratio)),
            "completion_velocity": max(0.0, completion_velocity),
            "active_hours": max(0.0, active_hours),
        }

    def simulate(self, payload: SimulationRequest) -> SimulationResponse:
        scenario = payload.scenario
        base = self._features_from_payload(payload)

        seed_hash = sha256(f"{payload.user_id}:{scenario}".encode("utf-8")).hexdigest()
        rng = random.Random(int(seed_hash[:16], 16))

        runs = 300
        probabilities: list[float] = []
        for _ in range(runs):
            sample = GoalPredictionRequest(
                user_id=payload.user_id,
                consistency_score=max(0.0, min(100.0, base["consistency_score"] + rng.gauss(0, 7.0))),
                delay_ratio=max(0.0, min(1.0, base["delay_ratio"] + rng.gauss(0, 0.08))),
                completion_velocity=max(0.0, base["completion_velocity"] + rng.gauss(0, 0.35)),
                active_hours=max(0.0, base["active_hours"] + rng.gauss(0, 0.45)),
            )
            probabilities.append(prediction_service.predict(sample).completion_probability)

        probabilities.sort()
        mean_probability = sum(probabilities) / runs
        low_index = max(0, int(runs * 0.1) - 1)
        high_index = min(runs - 1, int(runs * 0.9) - 1)
        p10 = probabilities[low_index]
        p90 = probabilities[high_index]

        spread = max(0.0, p90 - p10)
        risk_factor = max(
            0.0,
            min(
                100.0,
                (100.0 - mean_probability)
                + self._scenario_risk_boost(scenario)
                + spread * 0.2,
            ),
        )

        complexity_boost = self._scenario_complexity_boost(scenario)
        estimated_months = int(max(1, round(4.0 + complexity_boost + (100.0 - mean_probability) / 10.0)))

        if risk_factor >= 65:
            opportunity_cost = "high"
            strategy = "De-risk execution first: narrow scope, reduce active goals, and run weekly checkpoint reviews."
        elif risk_factor >= 40:
            opportunity_cost = "medium"
            strategy = "Prioritize milestone cadence and maintain consistency with one strategic upskilling block per week."
        else:
            opportunity_cost = "low"
            strategy = "Momentum is strong: maintain pace and reinvest saved effort into stretch outcomes."

        return SimulationResponse(
            risk_factor=round(risk_factor, 2),
            opportunity_cost=opportunity_cost,
            estimated_months=estimated_months,
            success_probability=round(mean_probability, 2),
            confidence_interval_low=round(p10, 2),
            confidence_interval_high=round(p90, 2),
            simulation_runs=runs,
            recommended_strategy=strategy,
        )


simulation_service = SimulationService()
