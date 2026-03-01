import type { GoalModel, TaskModel } from '@/types';
import type {
  DailyPlanItem,
  EnergyLevel,
  GoalRiskPrediction,
  HabitFocusSnapshot,
  IntelligenceBundle,
  MemoryAssistantOutput,
  MemorySuggestion,
  SmartDailyPlan,
  WeeklyReview,
} from '@/types/intelligence';
import type { MemoryMatch } from '@/lib/api';

const ENERGY_MULTIPLIER: Record<EnergyLevel, number> = {
  Low: 0.75,
  Medium: 1,
  High: 1.2,
};

const PRIORITY_WEIGHT: Record<GoalModel['priority'], number> = {
  Low: 12,
  Medium: 20,
  High: 32,
};

const daysUntil = (isoDate: string) => {
  const target = new Date(isoDate).getTime();
  if (Number.isNaN(target)) {
    return 999;
  }
  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
};

const safeRate = (value: number) => Math.max(0, Math.min(100, value));

const computeTaskScore = (task: TaskModel, goal?: GoalModel, energy: EnergyLevel = 'Medium') => {
  const urgencyDays = daysUntil(task.deadline);
  const urgencyWeight = urgencyDays <= 0 ? 40 : urgencyDays <= 2 ? 30 : urgencyDays <= 5 ? 18 : 8;
  const priorityWeight = goal ? PRIORITY_WEIGHT[goal.priority] : 12;
  const progressWeight = goal ? Math.max(0, 20 - goal.progress * 0.2) : 10;
  const effortPenalty = Math.max(0, (task.estimatedTime / 60) - 2) * 4;
  const energyBonus = ENERGY_MULTIPLIER[energy] * (task.tags.includes('Learning') ? 8 : 5);

  return safeRate(urgencyWeight + priorityWeight + progressWeight + energyBonus - effortPenalty);
};

const resolveReason = (task: TaskModel, goal?: GoalModel) => {
  const dueDays = daysUntil(task.deadline);
  if (dueDays <= 0) {
    return 'Overdue task requires immediate closure.';
  }
  if (dueDays <= 2) {
    return 'Deadline is near; complete this in your first focus block.';
  }
  if (goal?.priority === 'High') {
    return 'Mapped to a high-priority goal.';
  }
  return 'Improves consistent execution momentum.';
};

const buildSmartDailyPlan = (goals: GoalModel[], tasks: TaskModel[], energy: EnergyLevel): SmartDailyPlan => {
  const goalMap = new Map(goals.map((goal) => [goal.id, goal]));
  const pendingTasks = tasks.filter((task) => !task.completed);

  const ranked: DailyPlanItem[] = pendingTasks
    .map((task) => {
      const goal = goalMap.get(task.goalId);
      const score = computeTaskScore(task, goal, energy);
      return {
        taskId: task.id,
        goalId: task.goalId,
        title: task.title,
        deadline: task.deadline,
        estimatedMinutes: Math.max(20, task.estimatedTime || 45),
        score,
        reason: resolveReason(task, goal),
      };
    })
    .sort((leftTask, rightTask) => rightTask.score - leftTask.score)
    .slice(0, 5);

  const energyCap = Math.round(240 * ENERGY_MULTIPLIER[energy]);
  const fitPlan: DailyPlanItem[] = [];
  let totalPlannedMinutes = 0;

  for (const item of ranked) {
    if (totalPlannedMinutes + item.estimatedMinutes > energyCap && fitPlan.length >= 3) {
      continue;
    }
    fitPlan.push(item);
    totalPlannedMinutes += item.estimatedMinutes;
  }

  const recommendation = fitPlan.length
    ? `Schedule ${fitPlan.length} focused blocks (${Math.round(totalPlannedMinutes / 60)}h total) with 10-min recovery gaps.`
    : 'No pending tasks found. Use today for planning and roadmap execution.';

  return {
    energy,
    items: fitPlan,
    totalPlannedMinutes,
    recommendation,
  };
};

const buildWeeklyReview = (goals: GoalModel[], tasks: TaskModel[]): WeeklyReview => {
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const lastWeekTasks = tasks.filter((task) => {
    const createdAt = new Date(task.createdAt).getTime();
    return !Number.isNaN(createdAt) && createdAt >= weekStart;
  });

  const completedCount = lastWeekTasks.filter((task) => task.completed).length;
  const slippedCount = tasks.filter((task) => !task.completed && daysUntil(task.deadline) < 0).length;
  const openCount = tasks.filter((task) => !task.completed).length;
  const completionRate = lastWeekTasks.length ? safeRate((completedCount / lastWeekTasks.length) * 100) : 0;

  const highlights: string[] = [];
  if (completedCount > 0) {
    highlights.push(`${completedCount} task(s) completed in the last 7 days.`);
  }
  if (slippedCount > 0) {
    highlights.push(`${slippedCount} overdue task(s) need recovery scheduling.`);
  }
  const mostProgressedGoal = [...goals].sort((a, b) => b.progress - a.progress)[0];
  if (mostProgressedGoal) {
    highlights.push(`Best momentum: ${mostProgressedGoal.title} at ${mostProgressedGoal.progress}% progress.`);
  }

  const nextWeekPlan = [
    'Block two deep-work sessions for top risk goals.',
    'Close all overdue tasks before starting new items.',
    'Reserve one learning sprint for roadmap execution.',
  ];

  return {
    completedCount,
    slippedCount,
    openCount,
    completionRate,
    highlights: highlights.length ? highlights : ['No major activity tracked this week.'],
    nextWeekPlan,
  };
};

const buildHabitFocus = (tasks: TaskModel[]): HabitFocusSnapshot => {
  const completedTasks = tasks.filter((task) => task.completed);
  const deepWorkMinutes = completedTasks.reduce((sum, task) => sum + Math.max(task.actualTime, task.estimatedTime), 0);

  const completedByDay = new Set(
    completedTasks
      .map((task) => {
        const date = new Date(task.deadline);
        if (Number.isNaN(date.getTime())) {
          return null;
        }
        return date.toISOString().slice(0, 10);
      })
      .filter((value): value is string => Boolean(value)),
  );

  let streakDays = 0;
  const cursor = new Date();
  for (let day = 0; day < 30; day += 1) {
    const key = new Date(cursor.getTime() - day * 86400000).toISOString().slice(0, 10);
    if (completedByDay.has(key)) {
      streakDays += 1;
      continue;
    }
    if (day > 0) {
      break;
    }
  }

  const total = tasks.length || 1;
  const overdue = tasks.filter((task) => !task.completed && daysUntil(task.deadline) < 0).length;
  const distractionScore = safeRate((overdue / total) * 100 + Math.max(0, 20 - streakDays * 2));
  const focusConsistency = safeRate((completedTasks.length / total) * 100 + Math.min(streakDays * 3, 20));

  return {
    streakDays,
    deepWorkMinutes,
    distractionScore,
    focusConsistency,
  };
};

const predictGoalRisks = (goals: GoalModel[], tasks: TaskModel[]): GoalRiskPrediction[] => {
  return goals
    .filter((goal) => goal.status !== 'Archived' && goal.status !== 'Completed')
    .map((goal) => {
      const goalTasks = tasks.filter((task) => task.goalId === goal.id);
      const overdueTasks = goalTasks.filter((task) => !task.completed && daysUntil(task.deadline) < 0).length;
      const pendingTasks = goalTasks.filter((task) => !task.completed).length;
      const dueDays = daysUntil(goal.deadline);

      const riskScore = safeRate(
        (100 - goal.progress) * 0.5 +
        overdueTasks * 14 +
        Math.max(0, 12 - dueDays) * 2 +
        pendingTasks * 1.5,
      );

      const riskLevel: GoalRiskPrediction['riskLevel'] = riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low';

      const reasons: string[] = [];
      if (dueDays <= 14) {
        reasons.push(`Deadline in ${Math.max(0, dueDays)} day(s).`);
      }
      if (overdueTasks > 0) {
        reasons.push(`${overdueTasks} overdue task(s) linked.`);
      }
      if (goal.progress < 40) {
        reasons.push(`Progress still at ${goal.progress}%.`);
      }
      if (!reasons.length) {
        reasons.push('Healthy pace; maintain current execution rhythm.');
      }

      return {
        goalId: goal.id,
        goalTitle: goal.title,
        riskScore,
        riskLevel,
        reasons,
      };
    })
    .sort((leftGoal, rightGoal) => rightGoal.riskScore - leftGoal.riskScore)
    .slice(0, 4);
};

const buildMemoryQuery = (goals: GoalModel[], tasks: TaskModel[]) => {
  const topGoal = [...goals].sort((a, b) => b.priority.localeCompare(a.priority))[0];
  const pending = tasks.filter((task) => !task.completed).slice(0, 3).map((task) => task.title);
  return [topGoal?.title, ...pending].filter(Boolean).join(' | ') || 'execution focus and learning gaps';
};

const buildMemorySuggestions = (matches: MemoryMatch[], tasks: TaskModel[]): MemorySuggestion[] => {
  if (!matches.length) {
    return [
      {
        title: 'Seed memory context',
        suggestion: 'Add a short project note or learning reflection so the assistant can personalize advice.',
        confidence: 0.35,
      },
    ];
  }

  return matches.slice(0, 3).map((match, index) => {
    const relatedTask = tasks.find((task) => match.content.toLowerCase().includes(task.title.toLowerCase().slice(0, 10)));
    return {
      title: `Insight ${index + 1}`,
      suggestion: relatedTask
        ? `Reconnect with "${relatedTask.title}" and apply memory cue: ${match.content.slice(0, 90)}...`
        : `Use this past context in today's plan: ${match.content.slice(0, 100)}...`,
      confidence: Number(Math.max(0, Math.min(1, match.score)).toFixed(2)),
    };
  });
};

export const intelligenceService = {
  buildBundle(goals: GoalModel[], tasks: TaskModel[], energy: EnergyLevel = 'Medium'): IntelligenceBundle {
    return {
      smartPlan: buildSmartDailyPlan(goals, tasks, energy),
      weeklyReview: buildWeeklyReview(goals, tasks),
      habitFocus: buildHabitFocus(tasks),
      goalRisks: predictGoalRisks(goals, tasks),
    };
  },

  buildMemoryQuery(goals: GoalModel[], tasks: TaskModel[]) {
    return buildMemoryQuery(goals, tasks);
  },

  buildMemoryAssistant(matches: MemoryMatch[], goals: GoalModel[], tasks: TaskModel[]): MemoryAssistantOutput {
    const query = buildMemoryQuery(goals, tasks);
    return {
      query,
      suggestions: buildMemorySuggestions(matches, tasks),
    };
  },
};
