from app.models.schemas import GoalOptimizeRequest, GoalOptimizeResponse


class OptimizerService:
    def optimize(self, payload: GoalOptimizeRequest) -> GoalOptimizeResponse:
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
