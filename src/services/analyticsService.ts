import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type {
  BehaviorMetrics,
  CognitiveAnalyticsResult,
  DashboardSnapshot,
  GoalModel,
  TaskModel,
} from '@/types';

const toBehavior = (snapshot: QueryDocumentSnapshot<DocumentData>): BehaviorMetrics => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: String(data.userId ?? ''),
    consistencyScore: Number(data.consistencyScore ?? 0),
    delayRatio: Number(data.delayRatio ?? 0),
    burnoutRisk: Number(data.burnoutRisk ?? 0),
    focusScore: Number(data.focusScore ?? 0),
    learningVelocity: Number(data.learningVelocity ?? 1),
    updatedAt: String(data.updatedAt ?? ''),
  };
};

const toWeekday = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const safeRate = (value: number) => Math.max(0, Math.min(100, value));

export const analyticsService = {
  subscribeBehaviorMetrics(firestore: Firestore, userId: string, onData: (metrics: BehaviorMetrics | null) => void, onError: (error: Error) => void) {
    const metricsQuery = query(
      collection(firestore, 'users', userId, 'metricSnapshots'),
      orderBy('updatedAt', 'desc'),
      limit(1),
    );
    return onSnapshot(
      metricsQuery,
      (snapshot) => {
        if (snapshot.empty) {
          onData(null);
          return;
        }
        onData(toBehavior(snapshot.docs[0]));
      },
      (error) => onError(error),
    );
  },

  buildDashboardSnapshot(goals: GoalModel[], tasks: TaskModel[], metrics: BehaviorMetrics | null): DashboardSnapshot {
    const activeGoals = goals.filter((goal) => goal.status !== 'Archived').length;
    const completionProbability = goals.length
      ? safeRate(goals.reduce((sum, goal) => sum + goal.completionProbability, 0) / goals.length)
      : 0;
    const skillGapScore = goals.length
      ? safeRate(goals.reduce((sum, goal) => sum + goal.skillGapScore, 0) / goals.length)
      : 0;

    const weeklyMap = new Map<string, number>([
      ['Mon', 0],
      ['Tue', 0],
      ['Wed', 0],
      ['Thu', 0],
      ['Fri', 0],
      ['Sat', 0],
      ['Sun', 0],
    ]);

    tasks
      .filter((task) => task.completed)
      .forEach((task) => {
        const day = toWeekday(task.deadline);
        weeklyMap.set(day, (weeklyMap.get(day) ?? 0) + 1);
      });

    const weeklyProductivity = Array.from(weeklyMap.entries()).map(([day, completedTasks]) => ({
      day,
      completedTasks,
    }));

    const deepWorkTime = tasks.reduce((sum, task) => sum + (task.actualTime > 0 ? task.actualTime : task.estimatedTime), 0);
    const learningTime = tasks.filter((task) => task.tags.includes('Learning')).reduce((sum, task) => sum + task.estimatedTime, 0);
    const adminTime = Math.max(0, deepWorkTime - learningTime);

    const total = deepWorkTime + learningTime + adminTime || 1;

    return {
      activeGoals,
      completionProbability,
      skillGapScore,
      consistencyScore: metrics?.consistencyScore ?? 0,
      burnoutRisk: metrics?.burnoutRisk ?? 0,
      focusScore: metrics?.focusScore ?? 0,
      weeklyProductivity,
      focusDistribution: [
        { label: 'Deep Work', value: Math.round((deepWorkTime / total) * 100) },
        { label: 'Learning', value: Math.round((learningTime / total) * 100) },
        { label: 'Admin', value: Math.round((adminTime / total) * 100) },
      ],
    };
  },

  buildCognitiveAnalytics(metrics: BehaviorMetrics | null, tasks: TaskModel[]): CognitiveAnalyticsResult {
    const completedTasks = tasks.filter((task) => task.completed);
    const overdueTasks = tasks.filter((task) => !task.completed && new Date(task.deadline).getTime() < Date.now());

    const completionVelocity = tasks.length ? completedTasks.length / tasks.length : 0;
    const delayRatio = tasks.length ? overdueTasks.length / tasks.length : metrics?.delayRatio ?? 0;
    const learningAcceleration = (metrics?.learningVelocity ?? 1) * (1 + completionVelocity - delayRatio);

    return {
      metrics: metrics ?? {
        id: 'fallback',
        userId: 'fallback',
        consistencyScore: 0,
        delayRatio: 0,
        burnoutRisk: 0,
        focusScore: 0,
        learningVelocity: 1,
        updatedAt: new Date().toISOString(),
      },
      completionVelocity,
      delayRatio,
      learningAcceleration,
    };
  },
};
