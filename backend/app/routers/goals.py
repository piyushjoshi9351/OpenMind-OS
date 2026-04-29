from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
import json

from app.database import get_db
from app.goal_models import Goal
from app.goal_schemas import GoalCreateRequest, GoalResponse, GoalStatusUpdateRequest, GoalSearchResult
from app.services.embedding_service import embedding_service


router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("/search", response_model=list[GoalSearchResult])
def search_goals(q: str, db: Session = Depends(get_db)) -> list[GoalSearchResult]:
    if not q or not q.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="q query parameter is required")

    query_vec = embedding_service.embed_text(q)

    statement = select(Goal).where(Goal.embedding.is_not(None))
    candidates = list(db.scalars(statement).all())

    results: list[tuple[Goal, float]] = []
    for g in candidates:
        try:
            emb = json.loads(g.embedding) if g.embedding else None
            if not emb:
                continue
            score = embedding_service.cosine_similarity(query_vec, emb)
            results.append((g, float(score)))
        except Exception:
            continue

    # sort by score desc and return top 5
    results.sort(key=lambda it: it[1], reverse=True)
    top = results[:5]

    return [
        GoalSearchResult(
            id=g.id,
            title=g.title,
            description=g.description,
            status=g.status,
            created_at=g.created_at,
            score=round(score, 4),
        )
        for g, score in top
    ]


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreateRequest, db: Session = Depends(get_db)) -> Goal:
    goal = Goal(
        title=payload.title,
        description=payload.description,
        status=payload.status.value,
    )
    # compute and save embedding (store JSON string in embedding column)
    text_to_embed = payload.title + (" \n" + payload.description if payload.description else "")
    try:
        vector = embedding_service.embed_text(text_to_embed)
        goal.embedding = json.dumps(vector)
    except Exception:
        # If embedding fails, continue without blocking goal creation
        goal.embedding = None

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