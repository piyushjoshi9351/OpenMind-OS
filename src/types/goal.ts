import type { ISODateString } from '@/types/common';

export type GoalCategory = 'Career' | 'Health' | 'Learning' | 'Personal' | 'Financial';

export type GoalPriority = 'Low' | 'Medium' | 'High';

export type GoalStatus = 'Pending' | 'In Progress' | 'Completed' | 'On Hold' | 'Archived';

export interface GoalModel {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: GoalCategory;
  deadline: ISODateString;
  priority: GoalPriority;
  status: GoalStatus;
  completionProbability: number;
  skillGapScore: number;
  progress: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  archivedAt: ISODateString | null;
}

export interface GoalHealth {
  score: number;
  label: 'Excellent' | 'Healthy' | 'At Risk' | 'Critical';
}

export interface SkillGapAnalysis {
  goalId: string;
  goalTitle: string;
  requiredSkills: string[];
  existingSkills: string[];
  missingSkills: string[];
  gapPercentage: number;
  recommendations: string[];
}
