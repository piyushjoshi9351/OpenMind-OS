import type { GoalModel, SkillGapAnalysis } from '@/types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const API_V1_BASE = `${API_BASE_URL}/api/v1`;

async function requestJson<TResponse>(path: string, init?: RequestInit & { expectJson?: boolean }): Promise<TResponse> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_V1_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  if (init?.expectJson === false || response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

export interface BackendGoal {
  id: number;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'done';
  created_at: string;
}

export interface CreateGoalPayload {
  title: string;
  description?: string | null;
}

export interface ChatMessage {
  id: number;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatHistoryResponse {
  conversation_id: string;
  messages: ChatMessage[];
}

export interface ChatSendPayload {
  message: string;
  conversationId?: string;
}

export interface ChatSendResponse {
  conversation_id: string;
  assistant_message: string;
}

export interface RoadmapRequest {
  userId: string;
  targetRole: string;
  timelineMonths: number;
}

export interface EmbeddingPayload {
  userId: string;
  nodeId: string;
  content: string;
}

export interface MemoryMatch {
  node_id: string;
  content: string;
  node_type: string;
  score: number;
}

export interface TrackEventPayload {
  userId: string;
  eventName: string;
  page: string;
  metadata?: Record<string, string>;
}

export interface BehaviorTrackPayload {
  userId: string;
  eventType: string;
  taskCompletionMinutes?: number;
  taskDelayDays?: number;
  sessionDurationMinutes?: number;
  goalProgressVelocity?: number;
  completedTaskDelta?: number;
  totalTaskDelta?: number;
  workloadLevel?: number;
  activeHours?: number;
}

export interface GoalPredictionFeatures {
  consistencyScore: number;
  delayRatio: number;
  completionVelocity: number;
  activeHours: number;
}

export interface MLInsightsPayload {
  userId: string;
  targetRole: string;
  userSkills: string[];
  windowDays?: number;
}

export interface MLInsightsResult {
  user_id: string;
  target_role: string;
  model_name: string;
  ai_readiness_score: number;
  execution_score: number;
  risk_score: number;
  skill_gap_percentage: number;
  completion_probability: number;
  recommended_actions: string[];
}

export interface GoalPredictionResult {
  completion_probability: number;
  model_name: string;
  confidence_score?: number;
  factors: Record<string, number>;
  normalized_factors?: Record<string, number>;
}

export interface SimulationResult {
  risk_factor: number;
  opportunity_cost: 'low' | 'medium' | 'high';
  estimated_months: number;
  success_probability: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
  simulation_runs: number;
  recommended_strategy: string;
}

export const api = {
  getBaseUrl() {
    return API_BASE_URL;
  },

  async healthcheck() {
    const response = await fetch(`${API_V1_BASE}/health`, { method: 'GET' });
    if (!response.ok) {
      throw new Error('ML service unavailable');
    }
    return response.json();
  },

  async getGoalPrediction(goal: GoalModel): Promise<{ completionProbability: number }> {
    const timelineMonths = Math.max(1, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
    const response = await fetch(`${API_V1_BASE}/optimizer/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: goal.userId,
        target_goal: goal.title,
        timeline_months: Math.min(36, timelineMonths),
      }),
    });

    if (!response.ok) {
      return { completionProbability: goal.completionProbability };
    }

    const data = await response.json();
    return { completionProbability: data.completion_probability ?? goal.completionProbability };
  },

  async getSkillGap(input: { userId: string; targetRole: string; userSkills: string[] }): Promise<SkillGapAnalysis | null> {
    const response = await fetch(`${API_V1_BASE}/skill-gap/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: input.userId,
        target_role: input.targetRole,
        user_skills: input.userSkills,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      goalId: input.targetRole,
      goalTitle: input.targetRole,
      requiredSkills: Array.isArray(data.required_skills) ? data.required_skills : [],
      existingSkills: Array.isArray(data.existing_skills) ? data.existing_skills : [],
      missingSkills: Array.isArray(data.missing_skills) ? data.missing_skills : [],
      gapPercentage: Number(data.gap_percentage ?? 0),
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    };
  },

  async trackBehavior(payload: BehaviorTrackPayload) {
    const response = await fetch(`${API_V1_BASE}/behavior/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: payload.userId,
        event_type: payload.eventType,
        task_completion_minutes: payload.taskCompletionMinutes ?? 0,
        task_delay_days: payload.taskDelayDays ?? 0,
        session_duration_minutes: payload.sessionDurationMinutes ?? 0,
        goal_progress_velocity: payload.goalProgressVelocity ?? 0,
        completed_task_delta: payload.completedTaskDelta ?? 0,
        total_task_delta: payload.totalTaskDelta ?? 0,
        workload_level: payload.workloadLevel ?? 0,
        active_hours: payload.activeHours ?? 0,
      }),
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  },

  async predictGoal(features: GoalPredictionFeatures & { userId: string }): Promise<GoalPredictionResult | null> {
    const response = await fetch(`${API_V1_BASE}/prediction/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: features.userId,
        consistency_score: features.consistencyScore,
        delay_ratio: features.delayRatio,
        completion_velocity: features.completionVelocity,
        active_hours: features.activeHours,
      }),
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  },

  async simulateScenario(input: {
    userId: string;
    scenario: string;
    consistencyScore?: number;
    delayRatio?: number;
    completionVelocity?: number;
    activeHours?: number;
  }): Promise<SimulationResult | null> {
    const response = await fetch(`${API_V1_BASE}/simulation/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: input.userId,
        scenario: input.scenario,
        consistency_score: input.consistencyScore,
        delay_ratio: input.delayRatio,
        completion_velocity: input.completionVelocity,
        active_hours: input.activeHours,
      }),
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  },

  async getMLInsights(input: MLInsightsPayload): Promise<MLInsightsResult | null> {
    const response = await fetch(`${API_V1_BASE}/ml-insights/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: input.userId,
        target_role: input.targetRole,
        user_skills: input.userSkills,
        window_days: input.windowDays ?? 7,
      }),
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  },

  async createEmbedding(payload: EmbeddingPayload): Promise<{ embeddingId: string } | null> {
    const response = await fetch(`${API_V1_BASE}/memory/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: payload.userId,
        content: payload.content,
        node_type: 'note',
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return { embeddingId: data.node_id };
  },

  async queryMemory(input: { userId: string; query: string; topK?: number }): Promise<MemoryMatch[]> {
    const response = await fetch(`${API_V1_BASE}/memory/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: input.userId,
        query: input.query,
        top_k: input.topK ?? 5,
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data.matches) ? data.matches : [];
  },

  async trackEvent(payload: TrackEventPayload): Promise<boolean> {
    const response = await fetch(`${API_V1_BASE}/events/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: payload.userId,
        event_name: payload.eventName,
        page: payload.page,
        metadata: payload.metadata ?? {},
      }),
    });

    return response.ok;
  },

  async enqueueBackgroundJob(payload: Record<string, unknown>) {
    const response = await fetch(`${API_BASE_URL}/jobs/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to enqueue background job');
    }

    return response.json();
  },

  async listGoals(): Promise<BackendGoal[]> {
    return requestJson<BackendGoal[]>('/goals', { method: 'GET' });
  },

  async createGoal(payload: CreateGoalPayload): Promise<BackendGoal> {
    return requestJson<BackendGoal>('/goals', {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        description: payload.description ?? null,
      }),
    });
  },

  async deleteGoal(goalId: number): Promise<void> {
    await requestJson<void>(`/goals/${goalId}`, { method: 'DELETE', expectJson: false });
  },

  async sendChatMessage(payload: ChatSendPayload): Promise<ChatSendResponse> {
    return requestJson<ChatSendResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: payload.message,
        conversation_id: payload.conversationId ?? null,
      }),
    });
  },

  async getChatHistory(conversationId: string): Promise<ChatHistoryResponse | null> {
    const response = await fetch(`${API_V1_BASE}/chat/${conversationId}`, { method: 'GET' });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json() as Promise<ChatHistoryResponse>;
  },
};
