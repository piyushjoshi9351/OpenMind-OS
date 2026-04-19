"""
Roadmap generation service - Generates personalized learning roadmaps.
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field


class DailyTask(BaseModel):
    day: str
    topic: str
    activities: list[str]


class WeekPlan(BaseModel):
    weekNumber: int
    weekSummary: str
    dailyTasks: list[DailyTask]


class LearningRoadmap(BaseModel):
    roadmapTitle: str
    roadmapDescription: str
    weeks: list[WeekPlan]


WEEKDAY_LABELS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"]
MAX_WEEKS = 24

STYLE_ACTIVITY = {
    "project": "Build and ship one practical artifact tied to this topic.",
    "theory": "Deep-dive core concepts and create concise summary notes.",
    "mixed": "Split session into concept review + practical implementation.",
}

TRACK_PLANS = {
    "ai": [
        {
            "name": "Math + Foundations",
            "topics": ["Linear Algebra", "Probability", "Optimization", "Statistics"],
            "activities": [
                "Solve 8-10 focused problems and note mistakes.",
                "Summarize one concept in your own words in a notes file.",
                "Implement one tiny concept demo in Python notebook.",
            ],
        },
        {
            "name": "ML Core",
            "topics": ["Regression", "Classification", "Feature Engineering", "Validation"],
            "activities": [
                "Train one small model and compare metrics.",
                "Write experiment log: hypothesis → result → next step.",
                "Refactor data preprocessing into reusable functions.",
            ],
        },
        {
            "name": "Deep Learning + LLM",
            "topics": ["Neural Nets", "Transformers", "Fine-tuning", "Evaluation"],
            "activities": [
                "Implement one architecture block from scratch.",
                "Run one benchmark and explain failure cases.",
                "Build a mini retrieval or prompt pipeline.",
            ],
        },
        {
            "name": "MLOps + System Design",
            "topics": ["Serving", "Monitoring", "CI/CD", "Scalability"],
            "activities": [
                "Containerize one model service and test locally.",
                "Define latency/cost metrics and dashboard checklist.",
                "Design one production architecture diagram.",
            ],
        },
        {
            "name": "Portfolio + Interview Prep",
            "topics": ["Case Studies", "Behavioral Stories", "DSA for AI Roles", "Mock Interview"],
            "activities": [
                "Ship one portfolio project milestone.",
                "Prepare STAR stories aligned to staff-level impact.",
                "Do one mock interview and iterate weak areas.",
            ],
        },
    ],
    "backend": [
        {
            "name": "Language + Fundamentals",
            "topics": ["Language Mastery", "Data Structures", "Error Handling", "Testing"],
            "activities": [
                "Build one robust utility module.",
                "Write tests for core paths.",
                "Document conventions and patterns.",
            ],
        },
        {
            "name": "API + Data Layer",
            "topics": ["REST/GraphQL", "SQL Design", "Caching", "Transactions"],
            "activities": [
                "Implement one production-grade endpoint.",
                "Optimize one query path.",
                "Add input validation and failure handling.",
            ],
        },
        {
            "name": "System Design",
            "topics": ["Scalability", "Queues", "Consistency", "Observability"],
            "activities": [
                "Design one high-scale service.",
                "Add metrics/logging checklist.",
                "Run load assumptions and bottleneck review.",
            ],
        },
        {
            "name": "Deployment + Reliability",
            "topics": ["CI/CD", "Infra", "Rollback", "SLOs"],
            "activities": [
                "Set up deployment pipeline.",
                "Create runbook for incidents.",
                "Track error budgets and alerts.",
            ],
        },
        {
            "name": "Portfolio + Interview Prep",
            "topics": ["Project Narrative", "Trade-off Discussion", "Mock Design"],
            "activities": [
                "Publish one strong backend project.",
                "Practice trade-off articulation.",
                "Do timed design mock sessions.",
            ],
        },
    ],
    "product": [
        {
            "name": "Problem Discovery",
            "topics": ["User Research", "JTBD", "Problem Framing"],
            "activities": [
                "Run user interview notes synthesis.",
                "Draft one PRD problem statement.",
                "Define measurable outcomes.",
            ],
        },
        {
            "name": "Execution Systems",
            "topics": ["Roadmapping", "Prioritization", "Stakeholder Alignment"],
            "activities": [
                "Create prioritized backlog.",
                "Plan one sprint with dependencies.",
                "Communicate scope trade-offs.",
            ],
        },
        {
            "name": "Metrics + Experimentation",
            "topics": ["North Star", "Funnels", "A/B Tests"],
            "activities": [
                "Define metric hierarchy.",
                "Design one experiment.",
                "Review experiment readout template.",
            ],
        },
        {
            "name": "Leadership + Communication",
            "topics": ["Narratives", "Decision Memos", "Cross-team Execution"],
            "activities": [
                "Write one decision memo.",
                "Present roadmap update.",
                "Run alignment review.",
            ],
        },
        {
            "name": "Interview Prep + Cases",
            "topics": ["Product Sense", "Execution", "Leadership"],
            "activities": [
                "Solve one case daily.",
                "Refine leadership examples.",
                "Mock interviews and feedback loop.",
            ],
        },
    ],
    "general": [
        {
            "name": "Core Fundamentals",
            "topics": ["Concepts", "Tools", "Practice"],
            "activities": [
                "Study focused concept block.",
                "Build one micro project.",
                "Document outcomes and next step.",
            ],
        },
        {
            "name": "Skill Building",
            "topics": ["Intermediate Skills", "Problem Solving", "Review"],
            "activities": [
                "Solve targeted challenges.",
                "Refactor previous work.",
                "Track progress with weekly review.",
            ],
        },
        {
            "name": "Applied Projects",
            "topics": ["Project Architecture", "Implementation", "Quality"],
            "activities": [
                "Ship one project milestone.",
                "Add testing and monitoring.",
                "Publish project notes.",
            ],
        },
        {
            "name": "Delivery + Communication",
            "topics": ["Planning", "Execution", "Stakeholder updates"],
            "activities": [
                "Create execution timeline.",
                "Run weekly checkpoint.",
                "Share concise progress update.",
            ],
        },
        {
            "name": "Readiness + Interviews",
            "topics": ["Portfolio", "Mock Interviews", "Gap Closure"],
            "activities": [
                "Prepare showcase artifacts.",
                "Run mock interviews.",
                "Close top 3 skill gaps.",
            ],
        },
    ],
}


def detect_track(role: str) -> str:
    """Detect which learning track matches the given role."""
    role_lower = role.lower()
    
    if any(term in role_lower for term in ["ai", "ml", "data", "llm"]):
        return "ai"
    if any(term in role_lower for term in ["backend", "api", "platform"]):
        return "backend"
    if any(term in role_lower for term in ["product", "pm"]):
        return "product"
    
    return "general"


def generate_roadmap(
    target_role: str,
    timeline_months: int,
    experience_level: Literal["beginner", "intermediate", "advanced"] = "intermediate",
    weekly_hours: int = 8,
    preferred_style: Literal["project", "theory", "mixed"] = "mixed",
    priority_skills: Optional[list[str]] = None,
    constraints: Optional[str] = None,
) -> LearningRoadmap:
    """
    Generate a personalized learning roadmap.
    
    Args:
        target_role: Desired job role
        timeline_months: Timeline in months
        experience_level: Current proficiency level
        weekly_hours: Hours available per week
        preferred_style: Preferred learning style
        priority_skills: Priority skills to focus on
        constraints: Any constraints or context
    
    Returns:
        LearningRoadmap with weekly breakdown
    """
    
    # Clean and validate inputs
    clean_role = target_role.strip()
    total_weeks = min(MAX_WEEKS, max(4, timeline_months * 4))
    selected_track = TRACK_PLANS[detect_track(clean_role)]
    weekly_hours = max(1, min(60, weekly_hours))
    priority_skills = [s.strip() for s in (priority_skills or []) if s.strip()]
    
    # Determine intensity
    if weekly_hours >= 14:
        intensity_label = "high-intensity"
        daily_task_depth = 4
    elif weekly_hours >= 8:
        intensity_label = "balanced"
        daily_task_depth = 3
    else:
        intensity_label = "light"
        daily_task_depth = 2
    
    # Generate weeks
    weeks = []
    for week_index in range(total_weeks):
        week_number = week_index + 1
        
        # Select stage from track
        stage_index = min(
            len(selected_track) - 1,
            week_index // max(1, (total_weeks // len(selected_track)))
        )
        stage = selected_track[stage_index]
        
        # Select topic
        topic = stage["topics"][week_index % len(stage["topics"])]
        
        # Select priority focus
        priority_focus = priority_skills[week_index % len(priority_skills)] if priority_skills else None
        
        # Build activities
        base_activities = [
            STYLE_ACTIVITY[preferred_style],
            stage["activities"][(week_index + 0) % len(stage["activities"])],
            stage["activities"][(week_index + 1) % len(stage["activities"])],
            f"Role alignment checkpoint: connect today's work to {clean_role} expectations.",
        ]
        
        if constraints:
            base_activities.append(f"Constraint-aware adjustment: {constraints}.")
        
        # Build daily tasks
        daily_tasks = []
        for day_index, day_label in enumerate(WEEKDAY_LABELS):
            activity_slice_start = day_index % 2
            activity_slice_end = activity_slice_start + daily_task_depth
            
            daily_task = DailyTask(
                day=day_label,
                topic=f"{stage['name']} • {priority_focus + ' + ' if priority_focus else ''}{topic}",
                activities=base_activities[activity_slice_start:activity_slice_end],
            )
            daily_tasks.append(daily_task)
        
        # Build week
        week = WeekPlan(
            weekNumber=week_number,
            weekSummary=f"Week {week_number}: {stage['name']} ({experience_level} track, {intensity_label} load) with emphasis on {priority_focus + ' and ' if priority_focus else ''}{topic}.",
            dailyTasks=daily_tasks,
        )
        weeks.append(week)
    
    # Return roadmap
    priority_focus_str = f" Priority focus: {', '.join(priority_skills)}." if priority_skills else ""
    
    return LearningRoadmap(
        roadmapTitle=f"{clean_role} Optimized Learning Roadmap",
        roadmapDescription=f"A {timeline_months}-month optimized plan for becoming {clean_role}, tailored for {experience_level} level, {weekly_hours} hrs/week, and {preferred_style} learning style.{priority_focus_str}",
        weeks=weeks,
    )
