export type GoalCategory = 'Career' | 'Health' | 'Learning' | 'Personal' | 'Financial';
export type Priority = 'Low' | 'Medium' | 'High';
export type Status = 'Pending' | 'In Progress' | 'Completed' | 'On Hold';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  deadline: string;
  category: GoalCategory;
  priority: Priority;
  status: Status;
  progress: number;
  createdAt: string;
}

export interface Task {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  estimatedTime: number; // in minutes
  actualTime: number; // in minutes
  completed: boolean;
  deadline: string;
  tags: string[];
}

export interface KnowledgeNode {
  id: string;
  userId: string;
  label: string;
  type: 'Skill' | 'Topic' | 'Goal' | 'Note';
  details?: string;
}

export interface KnowledgeEdge {
  id: string;
  userId: string;
  sourceId: string;
  targetId: string;
  relation: string;
}

export interface CognitiveMetrics {
  consistencyScore: number;
  burnoutRisk: number;
  focusScore: number;
  learningVelocity: number;
  goalCompletionProbability: number;
}