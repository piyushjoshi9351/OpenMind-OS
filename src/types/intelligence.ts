import type { GoalModel } from '@/types/goal';
import type { TaskModel } from '@/types/task';

export type EnergyLevel = 'Low' | 'Medium' | 'High';

export interface DailyPlanItem {
  taskId: string;
  goalId: string;
  title: string;
  deadline: string;
  estimatedMinutes: number;
  score: number;
  reason: string;
}

export interface SmartDailyPlan {
  energy: EnergyLevel;
  items: DailyPlanItem[];
  totalPlannedMinutes: number;
  recommendation: string;
}

export interface WeeklyReview {
  completedCount: number;
  slippedCount: number;
  openCount: number;
  completionRate: number;
  highlights: string[];
  nextWeekPlan: string[];
}

export interface HabitFocusSnapshot {
  streakDays: number;
  deepWorkMinutes: number;
  distractionScore: number;
  focusConsistency: number;
}

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface GoalRiskPrediction {
  goalId: string;
  goalTitle: string;
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: string[];
}

export interface MemorySuggestion {
  title: string;
  suggestion: string;
  confidence: number;
}

export interface MemoryAssistantOutput {
  query: string;
  suggestions: MemorySuggestion[];
}

export interface IntelligenceBundle {
  smartPlan: SmartDailyPlan;
  weeklyReview: WeeklyReview;
  habitFocus: HabitFocusSnapshot;
  goalRisks: GoalRiskPrediction[];
}

export interface TaskGoalContext {
  goals: GoalModel[];
  tasks: TaskModel[];
}
