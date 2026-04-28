from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.goal_models import Goal
from app.goal_schemas import GoalCreateRequest, GoalResponse, GoalStatusUpdateRequest


router = APIRouter(prefix="/goals", tags=["goals"])


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreateRequest, db: Session = Depends(get_db)) -> Goal:
    goal = Goal(
        title=payload.title,
        description=payload.description,
        status=payload.status.value,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.get("", response_model=list[GoalResponse])
def list_goals(db: Session = Depends(get_db)) -> list[Goal]:
    statement = select(Goal).order_by(Goal.created_at.asc(), Goal.id.asc())
    return list(db.scalars(statement).all())


@router.patch("/{goal_id}/status", response_model=GoalResponse)
def update_goal_status(goal_id: int, payload: GoalStatusUpdateRequest, db: Session = Depends(get_db)) -> Goal:
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