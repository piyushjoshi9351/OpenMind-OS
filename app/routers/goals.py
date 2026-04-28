from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Goal
from app.schemas import GoalCreate, GoalRead, GoalUpdate


router = APIRouter(prefix="/goals", tags=["goals"])


@router.post("", response_model=GoalRead, status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreate, db: Session = Depends(get_db)) -> Goal:
    goal = Goal(
        user_id=payload.user_id,
        title=payload.title,
        description=payload.description,
        status=payload.status.value,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.get("", response_model=list[GoalRead])
def get_goals(user_id: str | None = None, db: Session = Depends(get_db)) -> list[Goal]:
    statement = select(Goal)
    if user_id:
        statement = statement.where(Goal.user_id == user_id)
    statement = statement.order_by(Goal.id.asc())
    return list(db.scalars(statement).all())


@router.put("/{goal_id}", response_model=GoalRead)
def update_goal_status(goal_id: int, payload: GoalUpdate, db: Session = Depends(get_db)) -> Goal:
    goal = db.get(Goal, goal_id)
    if goal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    goal.status = payload.status.value
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: int, db: Session = Depends(get_db)) -> None:
    goal = db.get(Goal, goal_id)
    if goal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    db.delete(goal)
    db.commit()
