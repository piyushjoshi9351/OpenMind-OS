from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
import json

from app.database import get_db
from app.goal_models import Goal
from app.goal_schemas import GoalSearchResult
from app.services.embedding_service import embedding_service

router = APIRouter()


@router.get("/goals/search", response_model=list[GoalSearchResult])
def api_v1_search_goals(q: str, db: Session = Depends(get_db)) -> list[GoalSearchResult]:
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
