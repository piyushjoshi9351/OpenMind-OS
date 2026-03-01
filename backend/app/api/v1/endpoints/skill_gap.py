from fastapi import APIRouter

from app.models.schemas import SkillGapAnalyzeRequest, SkillGapAnalyzeResponse
from app.services.skill_gap_service import skill_gap_service


router = APIRouter()


@router.post("/analyze", response_model=SkillGapAnalyzeResponse)
def analyze_skill_gap(payload: SkillGapAnalyzeRequest) -> SkillGapAnalyzeResponse:
    return skill_gap_service.analyze(payload)
