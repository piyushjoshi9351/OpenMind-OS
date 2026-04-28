from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import CheckConstraint, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class GoalStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    done = "done"


class Goal(Base):
    __tablename__ = "goals"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'in_progress', 'done')", name="ck_goals_status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=GoalStatus.pending.value)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )