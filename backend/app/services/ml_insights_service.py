from __future__ import annotations

from app.models.schemas import GoalPredictionRequest, MLInsightsRequest, MLInsightsResponse, SkillGapAnalyzeRequest
from app.services.behavior_service import behavior_service
from app.services.prediction_service import prediction_service
from app.services.skill_gap_service import skill_gap_service


class MLInsightsService:
    def analyze(self, payload: MLInsightsRequest) -> MLInsightsResponse:
        behavior_summary = behavior_service.summary(payload.user_id, window_days=payload.window_days)

        skill_gap = skill_gap_service.analyze(
            SkillGapAnalyzeRequest(
                user_id=payload.user_id,
                target_role=payload.target_role,
                user_skills=payload.user_skills,
            )
        )

        prediction = prediction_service.predict(
            GoalPredictionRequest(
                user_id=payload.user_id,
                consistency_score=float(behavior_summary["consistency_score"]),
                delay_ratio=float(behavior_summary["delay_ratio"]),
                completion_velocity=float(behavior_summary["completion_velocity"]),
                active_hours=float(behavior_summary["active_hours"]),
            )
        )

        execution_score = max(
            0.0,
            min(
                100.0,
                0.5 * float(behavior_summary["consistency_score"])
                + 0.3 * float(behavior_summary["focus_score"])
                + 20.0 * min(1.0, float(behavior_summary["completion_velocity"]) / 5.0),
            ),
        )

        risk_score = max(
            0.0,
            min(
                100.0,
                0.7 * float(behavior_summary["burnout_risk"])
                + 30.0 * float(behavior_summary["delay_ratio"]),
            ),
        )

        ai_readiness_score = max(
            0.0,
            min(
                100.0,
                0.45 * execution_score + 0.35 * prediction.completion_probability + 0.20 * (100.0 - skill_gap.gap_percentage),
            ),
        )

        recommendations: list[str] = []
        if risk_score > 55:
            recommendations.append("Reduce concurrent workload for the next 48 hours and prioritize one high-impact task.")
        if skill_gap.gap_percentage > 40:
            recommendations.append("Run a focused 2-week upskilling sprint for top missing role skills.")
        if prediction.completion_probability < 55:
            recommendations.append("Increase active learning hours and close at least one delayed task daily.")

        recommendations.extend(skill_gap.recommendations[:2])
        if not recommendations:
            recommendations.append("Momentum is healthy. Keep the same execution cadence and weekly review rhythm.")

        return MLInsightsResponse(
            user_id=payload.user_id,
            target_role=skill_gap.target_role,
            model_name="python_ml_fusion_v1",
            ai_readiness_score=round(ai_readiness_score, 2),
            execution_score=round(execution_score, 2),
            risk_score=round(risk_score, 2),
            skill_gap_percentage=round(skill_gap.gap_percentage, 2),
            completion_probability=round(prediction.completion_probability, 2),
            recommended_actions=recommendations[:5],
        )


ml_insights_service = MLInsightsService()