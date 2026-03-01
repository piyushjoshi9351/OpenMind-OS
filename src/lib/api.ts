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

  async getSkillGap(input: { userId: string; goalId: string }): Promise<SkillGapAnalysis | null> {
    const response = await fetch(`${API_BASE_URL}/analyze/skill-gap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
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
