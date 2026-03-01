from fastapi import APIRouter

from app.models.schemas import BehavioralStatsResponse, BehavioralTrackRequest
from app.services.behavior_service import behavior_service


router = APIRouter()


@router.post("/track", response_model=BehavioralStatsResponse)
def track_behavior(payload: BehavioralTrackRequest) -> BehavioralStatsResponse:
    behavior_service.track(
        user_id=payload.user_id,
        event_type=payload.event_type,
        task_completion_minutes=payload.task_completion_minutes,
        task_delay_days=payload.task_delay_days,
        session_duration_minutes=payload.session_duration_minutes,
        goal_progress_velocity=payload.goal_progress_velocity,
        completed_task_delta=payload.completed_task_delta,
        total_task_delta=payload.total_task_delta,
        workload_level=payload.workload_level,
        active_hours=payload.active_hours,
    )
    summary = behavior_service.summary(payload.user_id)
    return BehavioralStatsResponse(**summary)


@router.get("/summary", response_model=BehavioralStatsResponse)
def get_behavior_summary(user_id: str) -> BehavioralStatsResponse:
    summary = behavior_service.summary(user_id)
    return BehavioralStatsResponse(**summary)
