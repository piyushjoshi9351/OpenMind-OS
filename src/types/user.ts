import type { ISODateString, UserRole } from '@/types/common';

export interface CognitiveProfile {
  learningStyle: 'visual' | 'reading' | 'hands-on' | 'hybrid';
  preferredFocusWindow: 'morning' | 'afternoon' | 'evening' | 'night';
  strengths: string[];
  weakSignals: string[];
}

export interface UserSettings {
  darkMode: boolean;
  weeklyGoalHours: number;
  notificationsEnabled: boolean;
}

export interface UserModel {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: ISODateString;
  settings: UserSettings;
  cognitiveProfile: CognitiveProfile;
}

export interface BehaviorMetrics {
  id: string;
  userId: string;
  consistencyScore: number;
  delayRatio: number;
  burnoutRisk: number;
  focusScore: number;
  learningVelocity: number;
  updatedAt: ISODateString;
}
