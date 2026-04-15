from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    service: str
    dependencies: dict[str, str] = Field(default_factory=dict)
    embedding: dict[str, object] = Field(default_factory=dict)
    memory: dict[str, object] = Field(default_factory=dict)
    ml: dict[str, object] = Field(default_factory=dict)


class MemoryIngestRequest(BaseModel):
    user_id: str = Field(min_length=2)
    content: str = Field(min_length=1)
    node_type: str = Field(default="note")


class MemoryIngestResponse(BaseModel):
    node_id: str
    embedding_stub: str
    vector_dim: int
    strength_score: float
    related_node_ids: list[str] = Field(default_factory=list)
    auto_connections_created: int = 0


class MemoryMatch(BaseModel):
    node_id: str
    content: str
    node_type: str
    score: float


class MemoryQueryRequest(BaseModel):
    user_id: str = Field(min_length=2)
    query: str = Field(min_length=1)
    top_k: int = Field(default=5, ge=1, le=20)


class MemoryQueryResponse(BaseModel):
    user_id: str
    matches: list[MemoryMatch]


class CognitiveProfileRequest(BaseModel):
    user_id: str


class CognitiveProfileResponse(BaseModel):
    consistency_score: float
    burnout_risk: float
    focus_score: float
    learning_velocity: float


class GoalOptimizeRequest(BaseModel):
    user_id: str
    target_goal: str
    timeline_months: int = Field(ge=1, le=36)
    consistency_score: float | None = None
    delay_ratio: float | None = None
    completion_velocity: float | None = None
    active_hours: float | None = None


class GoalOptimizeResponse(BaseModel):
    completion_probability: float
    recommendations: list[str]


class SimulationRequest(BaseModel):
    user_id: str
    scenario: str
    consistency_score: float | None = Field(default=None, ge=0, le=100)
    delay_ratio: float | None = Field(default=None, ge=0, le=1)
    completion_velocity: float | None = Field(default=None, ge=0)
    active_hours: float | None = Field(default=None, ge=0)


class SimulationResponse(BaseModel):
    risk_factor: float
    opportunity_cost: str
    estimated_months: int
    success_probability: float
    confidence_interval_low: float
    confidence_interval_high: float
    simulation_runs: int
    recommended_strategy: str


class EventTrackRequest(BaseModel):
    user_id: str = Field(min_length=2)
    event_name: str = Field(min_length=2)
    page: str = Field(min_length=1)
    metadata: dict[str, str] = Field(default_factory=dict)


class EventTrackResponse(BaseModel):
    accepted: bool
    tracked_at: str


class EventSummaryResponse(BaseModel):
    events_tracked: int
    top_events: dict[str, int]
    drop_off_pages: dict[str, int]
    global_top_events: dict[str, int]


class BehavioralTrackRequest(BaseModel):
    user_id: str = Field(min_length=2)
    event_type: str = Field(min_length=2)
    task_completion_minutes: float = Field(default=0, ge=0)
    task_delay_days: float = Field(default=0)
    session_duration_minutes: float = Field(default=0, ge=0)
    goal_progress_velocity: float = Field(default=0)
    completed_task_delta: int = 0
    total_task_delta: int = 0
    workload_level: float = Field(default=0, ge=0)
    active_hours: float = Field(default=0, ge=0)


class BehavioralStatsResponse(BaseModel):
    user_id: str
    consistency_score: float
    focus_score: float
    burnout_risk: float
    delay_ratio: float
    completion_velocity: float
    active_hours: float
    daily_activity_count: int
    window_days: int


class SkillGapAnalyzeRequest(BaseModel):
    user_id: str = Field(min_length=2)
    target_role: str = Field(min_length=2)
    user_skills: list[str] = Field(default_factory=list)


class SkillGapAnalyzeResponse(BaseModel):
    user_id: str
    target_role: str
    required_skills: list[str]
    existing_skills: list[str]
    missing_skills: list[str]
    gap_percentage: float
    recommendations: list[str]


class GoalPredictionRequest(BaseModel):
    user_id: str = Field(min_length=2)
    consistency_score: float = Field(ge=0, le=100)
    delay_ratio: float = Field(ge=0, le=1)
    completion_velocity: float = Field(ge=0)
    active_hours: float = Field(ge=0)


class GoalPredictionResponse(BaseModel):
    completion_probability: float
    model_name: str
    confidence_score: float | None = None
    factors: dict[str, float]
    normalized_factors: dict[str, float] = Field(default_factory=dict)


class MLInsightsRequest(BaseModel):
    user_id: str = Field(min_length=2)
    target_role: str = Field(min_length=2)
    user_skills: list[str] = Field(default_factory=list)
    window_days: int = Field(default=7, ge=1, le=30)


class MLInsightsResponse(BaseModel):
    user_id: str
    target_role: str
    model_name: str
    ai_readiness_score: float
    execution_score: float
    risk_score: float
    skill_gap_percentage: float
    completion_probability: float
    recommended_actions: list[str]
