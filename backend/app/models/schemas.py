from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    service: str


class MemoryIngestRequest(BaseModel):
    user_id: str = Field(min_length=2)
    content: str = Field(min_length=1)
    node_type: str = Field(default="note")


class MemoryIngestResponse(BaseModel):
    node_id: str
    embedding_stub: str
    vector_dim: int
    strength_score: float


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


class GoalOptimizeResponse(BaseModel):
    completion_probability: float
    recommendations: list[str]


class SimulationRequest(BaseModel):
    user_id: str
    scenario: str


class SimulationResponse(BaseModel):
    risk_factor: float
    opportunity_cost: str
    estimated_months: int


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
