export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type LearningStyle = 'project' | 'theory' | 'mixed';

export interface DailyTask {
  day: string;
  topic: string;
  activities: string[];
}

export interface WeekPlan {
  weekNumber: number;
  weekSummary: string;
  dailyTasks: DailyTask[];
}

export interface LearningRoadmap {
  roadmapTitle: string;
  roadmapDescription: string;
  weeks: WeekPlan[];
}

export interface RoadmapModel extends LearningRoadmap {
  id: string;
  userId: string;
  targetRole: string;
  timelineMonths: number;
  experienceLevel: ExperienceLevel;
  weeklyHours: number;
  preferredStyle: LearningStyle;
  prioritySkills: string[];
  constraints?: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  currentWeek: number;
  completedWeeks: number[];
}
