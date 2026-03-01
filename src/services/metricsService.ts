import {
  doc,
  increment,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore';

const toDayKey = (inputDate = new Date()) => inputDate.toISOString().slice(0, 10);
const toWeekKey = (inputDate = new Date()) => {
  const date = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), inputDate.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const dailyStatsDoc = (firestore: Firestore, userId: string, dayKey: string) =>
  doc(firestore, 'userMetrics', userId, 'dailyStats', dayKey);

const weeklyStatsDoc = (firestore: Firestore, userId: string, weekKey: string) =>
  doc(firestore, 'userMetrics', userId, 'weeklyStats', weekKey);

interface BehaviorCaptureInput {
  userId: string;
  completedTaskDelta?: number;
  totalTaskDelta?: number;
  taskCompletionMinutes?: number;
  taskDelayDays?: number;
  sessionDurationMinutes?: number;
  goalProgressVelocity?: number;
  workloadLevel?: number;
  activeHours?: number;
}

export const metricsService = {
  async captureBehavior(firestore: Firestore, input: BehaviorCaptureInput) {
    const dayKey = toDayKey();
    const weekKey = toWeekKey();

    const dailyRef = dailyStatsDoc(firestore, input.userId, dayKey);
    const weeklyRef = weeklyStatsDoc(firestore, input.userId, weekKey);

    const dailyPatch = {
      userId: input.userId,
      day: dayKey,
      completedTasks: increment(input.completedTaskDelta ?? 0),
      totalTasks: increment(input.totalTaskDelta ?? 0),
      totalCompletionMinutes: increment(input.taskCompletionMinutes ?? 0),
      totalDelayDays: increment(input.taskDelayDays ?? 0),
      totalSessionMinutes: increment(input.sessionDurationMinutes ?? 0),
      goalProgressVelocitySum: increment(input.goalProgressVelocity ?? 0),
      workloadLevelSum: increment(input.workloadLevel ?? 0),
      activeHours: increment(input.activeHours ?? 0),
      activityCount: increment(1),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    const weeklyPatch = {
      userId: input.userId,
      week: weekKey,
      completedTasks: increment(input.completedTaskDelta ?? 0),
      totalTasks: increment(input.totalTaskDelta ?? 0),
      totalCompletionMinutes: increment(input.taskCompletionMinutes ?? 0),
      totalDelayDays: increment(input.taskDelayDays ?? 0),
      totalSessionMinutes: increment(input.sessionDurationMinutes ?? 0),
      goalProgressVelocitySum: increment(input.goalProgressVelocity ?? 0),
      workloadLevelSum: increment(input.workloadLevel ?? 0),
      activeHours: increment(input.activeHours ?? 0),
      activityCount: increment(1),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    await Promise.all([
      setDoc(dailyRef, dailyPatch, { merge: true }),
      setDoc(weeklyRef, weeklyPatch, { merge: true }),
    ]);
  },
};
