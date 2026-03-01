import type { GoalModel, SkillGapAnalysis } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_ML_API_URL ?? 'http://localhost:8000';
const API_V1_BASE = `${API_BASE_URL}/api/v1`;

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

export const api = {
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

  async predictGoal(features: GoalPredictionFeatures & { userId: string }): Promise<{ completionProbability: number }> {
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
      return { completionProbability: 0 };
    }

    const data = await response.json();
    return { completionProbability: Number(data.completion_probability ?? 0) };
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
};
