import type { BehaviorMetrics } from '@/types/user';

export interface WeeklyProductivityPoint {
  day: string;
  completedTasks: number;
}

export interface FocusDistributionPoint {
  label: string;
  value: number;
}

export interface DashboardSnapshot {
  activeGoals: number;
  completionProbability: number;
  skillGapScore: number;
  consistencyScore: number;
  burnoutRisk: number;
  focusScore: number;
  weeklyProductivity: WeeklyProductivityPoint[];
  focusDistribution: FocusDistributionPoint[];
}

export interface CognitiveAnalyticsResult {
  metrics: BehaviorMetrics;
  completionVelocity: number;
  delayRatio: number;
  learningAcceleration: number;
}
