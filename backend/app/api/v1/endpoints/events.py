from fastapi import APIRouter

from app.models.schemas import EventSummaryResponse, EventTrackRequest, EventTrackResponse
from app.services.event_tracking_service import tracking_service


router = APIRouter()


@router.post("/track", response_model=EventTrackResponse)
def track_event(payload: EventTrackRequest) -> EventTrackResponse:
    tracked = tracking_service.track(
        user_id=payload.user_id,
        event_name=payload.event_name,
        page=payload.page,
        metadata=payload.metadata,
    )
    return EventTrackResponse(
        accepted=True,
        tracked_at=tracked.timestamp,
    )


@router.get("/summary", response_model=EventSummaryResponse)
def get_summary(user_id: str | None = None) -> EventSummaryResponse:
    summary = tracking_service.summary(user_id=user_id)
    return EventSummaryResponse(**summary)
