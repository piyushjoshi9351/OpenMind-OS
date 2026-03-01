import type { ISODateString } from '@/types/common';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskModel {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  estimatedTime: number;
  actualTime: number;
  completed: boolean;
  createdAt: ISODateString;
  deadline: ISODateString;
  tags: string[];
  subtasks: Subtask[];
  order: number;
}

export interface TaskPerformance {
  completionRate: number;
  overdueRate: number;
  efficiencyScore: number;
}
