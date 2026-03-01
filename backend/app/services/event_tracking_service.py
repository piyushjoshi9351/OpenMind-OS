from __future__ import annotations

from collections import Counter, deque
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class TrackedEvent:
    user_id: str
    event_name: str
    page: str
    metadata: dict[str, str]
    timestamp: str


class EventTrackingService:
    def __init__(self, max_events: int = 2000) -> None:
        self._events: deque[TrackedEvent] = deque(maxlen=max_events)
        self._counters: Counter[str] = Counter()

    def track(self, user_id: str, event_name: str, page: str, metadata: dict[str, str] | None = None) -> TrackedEvent:
        event = TrackedEvent(
            user_id=user_id,
            event_name=event_name,
            page=page,
            metadata=metadata or {},
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
        self._events.append(event)
        self._counters[event_name] += 1
        return event

    def summary(self, user_id: str | None = None) -> dict[str, object]:
        events = [event for event in self._events if user_id is None or event.user_id == user_id]
        event_counts: Counter[str] = Counter(event.event_name for event in events)
        drop_off_counts: Counter[str] = Counter()

        for index in range(len(events) - 1):
            current_event = events[index]
            next_event = events[index + 1]
            if current_event.page != next_event.page:
                drop_off_counts[current_event.page] += 1

        return {
            "events_tracked": len(events),
            "top_events": dict(event_counts.most_common(10)),
            "drop_off_pages": dict(drop_off_counts.most_common(10)),
            "global_top_events": dict(self._counters.most_common(10)),
        }


tracking_service = EventTrackingService()
