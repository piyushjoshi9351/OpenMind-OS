"""
AI endpoints for generating learning roadmaps and other AI-powered features.
"""

from typing import Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.roadmap_service import LearningRoadmap, generate_roadmap


router = APIRouter()


class GenerateLearningRoadmapRequest(BaseModel):
    """Request model for roadmap generation."""
    
    targetRole: str = Field(..., description="Desired target job role (e.g., 'AI Engineer')")
    timelineMonths: int = Field(..., ge=1, le=60, description="Timeline in months")
    experienceLevel: Literal["beginner", "intermediate", "advanced"] = Field(
        default="intermediate",
        description="Current proficiency level"
    )
    weeklyHours: int = Field(default=8, ge=1, le=60, description="Hours available per week")
    preferredStyle: Literal["project", "theory", "mixed"] = Field(
        default="mixed",
        description="Preferred learning style"
    )
    prioritySkills: Optional[list[str]] = Field(
        default=None,
        max_length=8,
        description="Priority skills to focus on"
    )
    constraints: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Any constraints or context to consider"
    )


@router.post("/generate-roadmap", response_model=LearningRoadmap)
async def generate_learning_roadmap_endpoint(request: GenerateLearningRoadmapRequest) -> LearningRoadmap:
    """
    Generate a personalized learning roadmap.
    
    This endpoint creates a structured, week-by-week learning plan tailored to:
    - Target role and required skills
    - Timeline and available hours per week
    - Learning style preferences (project-based, theory-focused, or mixed)
    - Experience level and priority skills
    - Any constraints or specific requirements
    
    Returns a roadmap with:
    - Weekly summaries and learning objectives
    - Daily breakdown with specific activities
    - Role-aligned checkpoints and practice exercises
    """
    
    roadmap = generate_roadmap(
        target_role=request.targetRole,
        timeline_months=request.timelineMonths,
        experience_level=request.experienceLevel,
        weekly_hours=request.weeklyHours,
        preferred_style=request.preferredStyle,
        priority_skills=request.prioritySkills,
        constraints=request.constraints,
    )
    
    return roadmap
