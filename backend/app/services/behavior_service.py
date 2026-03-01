from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
import math


@dataclass
class BehaviorEvent:
    timestamp: datetime
    event_type: str
    task_completion_minutes: float
    task_delay_days: float
    session_duration_minutes: float
    goal_progress_velocity: float
    completed_task_delta: int
    total_task_delta: int
    workload_level: float
    active_hours: float


class BehaviorService:
    def __init__(self, max_events_per_user: int = 5000) -> None:
        self._events: dict[str, deque[BehaviorEvent]] = {}
        self._max_events_per_user = max_events_per_user

    def track(
        self,
        user_id: str,
        event_type: str,
        task_completion_minutes: float = 0,
        task_delay_days: float = 0,
        session_duration_minutes: float = 0,
        goal_progress_velocity: float = 0,
        completed_task_delta: int = 0,
        total_task_delta: int = 0,
        workload_level: float = 0,
        active_hours: float = 0,
    ) -> None:
        queue = self._events.setdefault(user_id, deque(maxlen=self._max_events_per_user))
        queue.append(
            BehaviorEvent(
                timestamp=datetime.now(timezone.utc),
                event_type=event_type,
                task_completion_minutes=max(0.0, task_completion_minutes),
                task_delay_days=task_delay_days,
                session_duration_minutes=max(0.0, session_duration_minutes),
                goal_progress_velocity=goal_progress_velocity,
                completed_task_delta=completed_task_delta,
                total_task_delta=total_task_delta,
                workload_level=max(0.0, workload_level),
                active_hours=max(0.0, active_hours),
            )
        )

    def _window(self, user_id: str, window_days: int = 7) -> list[BehaviorEvent]:
        now = datetime.now(timezone.utc)
        events = list(self._events.get(user_id, []))
        return [event for event in events if (now - event.timestamp).days < window_days]

    def summary(self, user_id: str, window_days: int = 7) -> dict[str, float | int | str]:
        events = self._window(user_id, window_days=window_days)
        if not events:
            return {
                "user_id": user_id,
                "consistency_score": 0.0,
                "focus_score": 0.0,
                "burnout_risk": 0.0,
                "delay_ratio": 0.0,
                "completion_velocity": 0.0,
                "active_hours": 0.0,
                "daily_activity_count": 0,
                "window_days": window_days,
            }

        completed_tasks = sum(max(0, event.completed_task_delta) for event in events)
        total_tasks = sum(max(0, event.total_task_delta) for event in events)
        completion_rate = completed_tasks / max(1, total_tasks)

        avg_session_duration = sum(event.session_duration_minutes for event in events if event.session_duration_minutes > 0) / max(
            1,
            sum(1 for event in events if event.session_duration_minutes > 0),
        )

        avg_task_delay = sum(max(0.0, event.task_delay_days) for event in events) / max(1, len(events))
        avg_workload = sum(event.workload_level for event in events) / max(1, len(events))
        active_hours = sum(event.active_hours for event in events)

        consistency_score = max(0.0, min(100.0, completion_rate * 100.0))
        focus_score = max(0.0, min(100.0, (avg_session_duration / 60.0) * 45.0 + completion_rate * 55.0))

        burnout_raw = avg_workload * 18.0 + (1.0 - completion_rate) * 45.0 + avg_task_delay * 7.5
        burnout_risk = max(0.0, min(100.0, burnout_raw))

        completion_velocity = completed_tasks / max(1, window_days)
        delay_ratio = max(0.0, min(1.0, avg_task_delay / 7.0))

        active_days = {event.timestamp.date().isoformat() for event in events}
        daily_activity_count = int(math.ceil(len(events) / max(1, len(active_days))))

        return {
            "user_id": user_id,
            "consistency_score": round(consistency_score, 2),
            "focus_score": round(focus_score, 2),
            "burnout_risk": round(burnout_risk, 2),
            "delay_ratio": round(delay_ratio, 4),
            "completion_velocity": round(completion_velocity, 3),
            "active_hours": round(active_hours, 2),
            "daily_activity_count": daily_activity_count,
            "window_days": window_days,
        }


behavior_service = BehaviorService()
