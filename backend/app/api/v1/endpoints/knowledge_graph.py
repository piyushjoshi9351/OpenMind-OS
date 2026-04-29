from fastapi import APIRouter, status

from app.services.knowledge_graph_service import knowledge_graph
from app.services.skill_gap_analyzer_service import skill_gap_analyzer
from app.services.knowledge_graph_schemas import (
    SkillAnalyzeRequest,
    SkillAnalyzeResponse,
    RoadmapGenerateRequest,
    RoadmapGenerateResponse,
    RoadmapWeek,
    KnowledgeGraphResponse,
    SkillRecommendation,
)


router = APIRouter()


@router.post("/skills/analyze", response_model=SkillAnalyzeResponse, status_code=status.HTTP_200_OK)
def analyze_skills(payload: SkillAnalyzeRequest) -> SkillAnalyzeResponse:
    """
    Analyze skills needed for a goal and identify gaps.
    
    1. Extract required skills from goal using Gemini
    2. Compare with user's current skills
    3. Return missing skills and learning recommendations
    """
    # Extract skills from goal using Gemini
    required_skills = skill_gap_analyzer.extract_skills_from_goal(
        payload.goal_title, payload.goal_description
    )

    if not required_skills:
        # Fallback: use goal title to infer
        required_skills = []

    # Analyze gap
    gap_result = skill_gap_analyzer.analyze_gap(required_skills, payload.current_skills)

    return SkillAnalyzeResponse(
        required_skills=required_skills,
        missing_skills=gap_result["analysis"]["missing_skills"],
        learning_path=gap_result["analysis"]["learning_path"],
        recommendations=[
            SkillRecommendation(
                skill=rec["skill"],
                missing_prerequisites=rec["missing_prerequisites"],
                suggested_learning_path=rec["suggested_learning_path"],
                priority=rec["priority"],
            )
            for rec in gap_result["recommendations"]
        ],
        total_missing=gap_result["total_missing"],
    )


@router.get("/graph", response_model=KnowledgeGraphResponse, status_code=status.HTTP_200_OK)
def get_knowledge_graph() -> KnowledgeGraphResponse:
    """
    Get the full knowledge graph (all skills and relationships).
    Useful for visualization and understanding skill dependencies.
    """
    graph_data = knowledge_graph.get_graph_json()

    return KnowledgeGraphResponse(
        nodes=[
            {"id": n["id"], "label": n["label"], "type": n["type"], "category": n["category"]}
            for n in graph_data["nodes"]
        ],
        edges=[
            {
                "source": e["source"],
                "target": e["target"],
                "weight": e["weight"],
                "relation": e["relation"],
            }
            for e in graph_data["edges"]
        ],
        node_count=graph_data["node_count"],
        edge_count=graph_data["edge_count"],
    )


@router.post("/roadmap/generate", response_model=RoadmapGenerateResponse, status_code=status.HTTP_200_OK)
def generate_roadmap(payload: RoadmapGenerateRequest) -> RoadmapGenerateResponse:
    """
    Generate a week-by-week learning roadmap for a goal.
    
    1. Identify missing skills
    2. Use Gemini to create personalized roadmap
    3. Return structured plan with weekly tasks
    """
    # Generate roadmap using Gemini
    weeks_data = skill_gap_analyzer.generate_learning_roadmap(
        payload.goal_title, payload.required_skills, payload.current_skills
    )

    # Convert to response format
    weeks = [
        RoadmapWeek(
            week=w.get("week", idx + 1),
            title=w.get("title", f"Week {idx + 1}"),
            description=w.get("description", ""),
            tasks=w.get("tasks", []),
            project=w.get("project"),
        )
        for idx, w in enumerate(weeks_data)
    ]

    return RoadmapGenerateResponse(
        goal_title=payload.goal_title,
        weeks=weeks,
        total_weeks=len(weeks),
    )
