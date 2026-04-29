from __future__ import annotations

from pydantic import BaseModel, Field


class SkillAnalyzeRequest(BaseModel):
    """Request to analyze skills for a goal."""

    goal_title: str = Field(min_length=1, max_length=500)
    goal_description: str | None = Field(default=None, max_length=2000)
    current_skills: list[str] = Field(default_factory=list)


class SkillRecommendation(BaseModel):
    """Recommendation for learning a skill."""

    skill: str
    missing_prerequisites: list[str]
    suggested_learning_path: list[str]
    priority: str  # "high", "medium", "low"


class SkillAnalyzeResponse(BaseModel):
    """Response from skill analysis."""

    required_skills: list[str]
    missing_skills: list[str]
    learning_path: list[str]
    recommendations: list[SkillRecommendation]
    total_missing: int


class RoadmapWeek(BaseModel):
    """One week in learning roadmap."""

    week: int
    title: str
    description: str
    tasks: list[str]
    project: str | None = None


class RoadmapGenerateRequest(BaseModel):
    """Request to generate learning roadmap."""

    goal_title: str = Field(min_length=1, max_length=500)
    required_skills: list[str] = Field(min_items=1)
    current_skills: list[str] = Field(default_factory=list)


class RoadmapGenerateResponse(BaseModel):
    """Response with week-by-week roadmap."""

    goal_title: str
    weeks: list[RoadmapWeek]
    total_weeks: int


class GraphNode(BaseModel):
    """Node in knowledge graph."""

    id: str
    label: str
    type: str  # "skill", "goal"
    category: str


class GraphEdge(BaseModel):
    """Edge in knowledge graph."""

    source: str
    target: str
    weight: float
    relation: str  # "prerequisite", "enables"


class KnowledgeGraphResponse(BaseModel):
    """Full knowledge graph data."""

    nodes: list[GraphNode]
    edges: list[GraphEdge]
    node_count: int
    edge_count: int
