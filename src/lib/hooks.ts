'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { api } from '@/lib/api';
import { getUserRole, validateSecureToken } from '@/lib/auth';
import { analyticsService, goalService, graphService, intelligenceService, metricsService, taskService } from '@/services';
import type {
  BehaviorMetrics,
  CognitiveAnalyticsResult,
  DashboardSnapshot,
  EnergyLevel,
  GoalModel,
  GraphDataModel,
  IntelligenceBundle,
  KnowledgeEdgeModel,
  KnowledgeNodeModel,
  MemoryAssistantOutput,
  SkillGapAnalysis,
  TaskModel,
} from '@/types';

export function useProtectedRoute(allowedRoles: Array<'admin' | 'user'> = ['user', 'admin']) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const validate = async () => {
      if (isUserLoading) {
        return;
      }

      if (!user) {
        router.replace('/login');
        return;
      }

      const isTokenValid = await validateSecureToken(user);
      if (!isTokenValid) {
        router.replace('/login');
        return;
      }

      const role = await getUserRole(user);
      if (isMounted && allowedRoles.includes(role)) {
        setIsAuthorized(true);
      } else {
        router.replace('/dashboard');
      }
    };

    void validate();

    return () => {
      isMounted = false;
    };
  }, [allowedRoles, isUserLoading, router, user]);

  return {
    user,
    isLoading: isUserLoading || !isAuthorized,
    isAuthorized,
  };
}

export function useRealtimeGoals() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [goals, setGoals] = useState<GoalModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = goalService.subscribeByUser(
      firestore,
      user.uid,
      (items) => {
        setGoals(items);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [firestore, user]);

  return { goals, loading, error };
}

export function useRealtimeTasks() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [tasks, setTasks] = useState<TaskModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = taskService.subscribeByUser(
      firestore,
      user.uid,
      (items) => {
        setTasks(items);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [firestore, user]);

  const toggleTask = useCallback(async (taskId: string, completed: boolean) => {
    const previous = tasks;
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, completed } : task)));
    try {
      const targetTask = tasks.find((task) => task.id === taskId);
      if (!user || !targetTask) {
        throw new Error('Task context unavailable.');
      }
      await taskService.toggleCompleted(firestore, user.uid, targetTask.goalId, taskId, completed);

      const delayDays = Math.max(0, (Date.now() - new Date(targetTask.deadline).getTime()) / 86400000);
      await Promise.all([
        metricsService.captureBehavior(firestore, {
          userId: user.uid,
          completedTaskDelta: completed ? 1 : -1,
          totalTaskDelta: 0,
          taskCompletionMinutes: completed ? Math.max(targetTask.actualTime, targetTask.estimatedTime) : 0,
          taskDelayDays: completed ? delayDays : 0,
          activeHours: completed ? Math.max(0.1, targetTask.estimatedTime / 60) : 0,
        }),
        api.trackBehavior({
          userId: user.uid,
          eventType: completed ? 'task_completed' : 'task_reopened',
          taskCompletionMinutes: completed ? Math.max(targetTask.actualTime, targetTask.estimatedTime) : 0,
          taskDelayDays: completed ? delayDays : 0,
          completedTaskDelta: completed ? 1 : -1,
          totalTaskDelta: 0,
          activeHours: completed ? Math.max(0.1, targetTask.estimatedTime / 60) : 0,
        }),
      ]);
    } catch (updateError) {
      setTasks(previous);
      toast({
        title: 'Update failed',
        description: updateError instanceof Error ? updateError.message : 'Task update was reverted.',
        variant: 'destructive',
      });
    }
  }, [firestore, tasks, toast, user]);

  return { tasks, loading, error, toggleTask };
}

export function useRealtimeGraph() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [nodes, setNodes] = useState<KnowledgeNodeModel[]>([]);
  const [edges, setEdges] = useState<KnowledgeEdgeModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setNodes([]);
      setEdges([]);
      setLoading(false);
      setError(null);
      return;
    }

    setError(null);
    setLoading(true);

    const unsubNodes = graphService.subscribeNodes(firestore, user.uid, (items) => {
      setNodes(items);
      setLoading(false);
    }, (snapshotError) => {
      setError(snapshotError.message);
      setLoading(false);
    });

    const unsubEdges = graphService.subscribeEdges(firestore, user.uid, (items) => {
      setEdges(items);
      setLoading(false);
    }, (snapshotError) => {
      setError(snapshotError.message);
      setLoading(false);
    });

    return () => {
      unsubNodes();
      unsubEdges();
    };
  }, [firestore, user]);

  const graphData = useMemo<GraphDataModel>(() => graphService.toGraphData(nodes, edges), [nodes, edges]);
  const weakClusters = useMemo(() => graphService.buildWeakClusterInsights(nodes, edges), [nodes, edges]);

  return {
    nodes,
    edges,
    graphData,
    weakClusters,
    loading,
    error,
  };
}

export function useCognitiveAnalytics(goals: GoalModel[], tasks: TaskModel[]) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [behaviorMetrics, setBehaviorMetrics] = useState<BehaviorMetrics | null>(null);

  useEffect(() => {
    if (!user) {
      setBehaviorMetrics(null);
      return;
    }

    const unsubscribe = analyticsService.subscribeBehaviorMetrics(firestore, user.uid, setBehaviorMetrics, () => setBehaviorMetrics(null));
    return () => unsubscribe();
  }, [firestore, user]);

  const dashboardSnapshot = useMemo<DashboardSnapshot>(() => {
    return analyticsService.buildDashboardSnapshot(goals, tasks, behaviorMetrics);
  }, [behaviorMetrics, goals, tasks]);

  const advancedAnalytics = useMemo(() => {
    return analyticsService.buildCognitiveAnalytics(behaviorMetrics, tasks);
  }, [behaviorMetrics, tasks]);

  return {
    behaviorMetrics,
    dashboardSnapshot,
    advancedAnalytics,
  };
}

export function useSkillGapAnalysis(goals: GoalModel[], nodes: KnowledgeNodeModel[]): SkillGapAnalysis | null {
  const { user } = useUser();
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);

  useEffect(() => {
    if (!goals.length || !user) {
      setAnalysis(null);
      return;
    }

    const targetGoal = [...goals].sort((a, b) => b.skillGapScore - a.skillGapScore)[0];
    const existingSkills = nodes.filter((node) => node.type === 'skill').map((node) => node.title);
    const roleHint = targetGoal.title.toLowerCase().includes('data scientist')
      ? 'data_scientist'
      : targetGoal.title.toLowerCase().includes('backend')
        ? 'backend_engineer'
        : targetGoal.title.toLowerCase().includes('product')
          ? 'product_manager'
          : 'ai_engineer';

    let isMounted = true;

    void api.getSkillGap({ userId: user.uid, targetRole: roleHint, userSkills: existingSkills })
      .then((result) => {
        if (!isMounted || !result) {
          return;
        }

        setAnalysis({
          goalId: targetGoal.id,
          goalTitle: targetGoal.title,
          requiredSkills: result.requiredSkills,
          existingSkills: result.existingSkills,
          missingSkills: result.missingSkills,
          gapPercentage: result.gapPercentage,
          recommendations: result.recommendations,
        });
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        const requiredSkills = ['System Design', 'Data Modeling', 'Python', 'MLOps', 'Deep Learning'];
        const missingSkills = requiredSkills.filter((skill) => !existingSkills.includes(skill));
        const gapPercentage = Math.round((missingSkills.length / requiredSkills.length) * 100);
        setAnalysis({
          goalId: targetGoal.id,
          goalTitle: targetGoal.title,
          requiredSkills,
          existingSkills,
          missingSkills,
          gapPercentage,
          recommendations: missingSkills.map((skill) => `Add a 2-week sprint for ${skill}`),
        });
      });

    return () => {
      isMounted = false;
    };
  }, [goals, nodes, user]);

  return analysis;
}

export function useIntelligenceAddons(goals: GoalModel[], tasks: TaskModel[], energy: EnergyLevel) {
  return useMemo<IntelligenceBundle>(() => intelligenceService.buildBundle(goals, tasks, energy), [energy, goals, tasks]);
}

export function useMemoryAssistant(goals: GoalModel[], tasks: TaskModel[]) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [assistant, setAssistant] = useState<MemoryAssistantOutput>({
    query: 'execution focus and learning gaps',
    suggestions: [],
  });

  const queryText = useMemo(() => intelligenceService.buildMemoryQuery(goals, tasks), [goals, tasks]);

  useEffect(() => {
    if (!user || !tasks.length) {
      setAssistant({
        query: queryText,
        suggestions: [{ title: 'No memory context', suggestion: 'Complete a few tasks to unlock personalized suggestions.', confidence: 0.25 }],
      });
      return;
    }

    let isMounted = true;
    setLoading(true);

    void api.createEmbedding({
      userId: user.uid,
      nodeId: `session-${Date.now()}`,
      content: `Goal context: ${goals.slice(0, 2).map((goal) => goal.title).join(', ')} | Pending tasks: ${tasks.filter((task) => !task.completed).slice(0, 3).map((task) => task.title).join(', ')}`,
    })
      .catch(() => null)
      .then(() => api.queryMemory({ userId: user.uid, query: queryText, topK: 3 }))
      .then((matches) => {
        if (!isMounted) {
          return;
        }
        setAssistant(intelligenceService.buildMemoryAssistant(matches, goals, tasks));
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setAssistant({
          query: queryText,
          suggestions: [{ title: 'Memory service offline', suggestion: 'Backend memory API unavailable; using local planning signals only.', confidence: 0.2 }],
        });
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [goals, queryText, tasks, user]);

  return {
    loading,
    assistant,
  };
}

export interface LiveMLSignals {
  loading: boolean;
  error: string | null;
  targetRole: string;
  prediction: {
    completionProbability: number;
    confidenceScore: number;
    modelName: string;
  } | null;
  insights: {
    readinessScore: number;
    riskScore: number;
    recommendedActions: string[];
    modelName: string;
  } | null;
  simulation: {
    successProbability: number;
    confidenceLow: number;
    confidenceHigh: number;
    opportunityCost: 'low' | 'medium' | 'high';
    estimatedMonths: number;
  } | null;
}

const inferTargetRoleFromGoal = (goalTitle: string): string => {
  const lower = goalTitle.toLowerCase();
  if (lower.includes('backend')) {
    return 'backend_engineer';
  }
  if (lower.includes('product')) {
    return 'product_manager';
  }
  if (lower.includes('data')) {
    return 'data_scientist';
  }
  return 'ai_engineer';
};

export function useLiveMLSignals(
  goals: GoalModel[],
  tasks: TaskModel[],
  dashboardSnapshot: DashboardSnapshot,
  advancedAnalytics: CognitiveAnalyticsResult,
): LiveMLSignals {
  const { user } = useUser();
  const [state, setState] = useState<LiveMLSignals>({
    loading: false,
    error: null,
    targetRole: 'ai_engineer',
    prediction: null,
    insights: null,
    simulation: null,
  });

  const activeGoal = useMemo(() => {
    const active = goals.filter((goal) => goal.status !== 'Archived');
    if (!active.length) {
      return null;
    }

    return [...active].sort((leftGoal, rightGoal) => {
      const priorityScore = { High: 3, Medium: 2, Low: 1 };
      const byPriority = priorityScore[rightGoal.priority] - priorityScore[leftGoal.priority];
      if (byPriority !== 0) {
        return byPriority;
      }
      return new Date(leftGoal.deadline).getTime() - new Date(rightGoal.deadline).getTime();
    })[0];
  }, [goals]);

  useEffect(() => {
    if (!user || !activeGoal) {
      setState((current) => ({
        ...current,
        loading: false,
        error: null,
        targetRole: 'ai_engineer',
        prediction: null,
        insights: null,
        simulation: null,
      }));
      return;
    }

    let isMounted = true;
    const targetRole = inferTargetRoleFromGoal(activeGoal.title);
    const userSkills = Array.from(
      new Set(
        tasks
          .flatMap((task) => task.tags)
          .concat(goals.map((goal) => goal.category))
          .map((entry) => entry.trim())
          .filter(Boolean),
      ),
    ).slice(0, 16);

    setState((current) => ({ ...current, loading: true, error: null, targetRole }));

    const predictionPromise = api.predictGoal({
      userId: user.uid,
      consistencyScore: dashboardSnapshot.consistencyScore,
      delayRatio: advancedAnalytics.delayRatio,
      completionVelocity: advancedAnalytics.completionVelocity,
      activeHours: Math.max(0.2, Math.min(8, tasks.reduce((sum, task) => sum + (task.completed ? Math.max(task.actualTime, task.estimatedTime) : 0), 0) / 60)),
    });

    const insightsPromise = api.getMLInsights({
      userId: user.uid,
      targetRole,
      userSkills,
      windowDays: 7,
    });

    const simulationPromise = api.simulateScenario({
      userId: user.uid,
      scenario: activeGoal.title,
      consistencyScore: dashboardSnapshot.consistencyScore,
      delayRatio: advancedAnalytics.delayRatio,
      completionVelocity: advancedAnalytics.completionVelocity,
      activeHours: Math.max(0.2, Math.min(8, tasks.length ? tasks.reduce((sum, task) => sum + task.estimatedTime, 0) / tasks.length / 60 : 1.2)),
    });

    void Promise.all([predictionPromise, insightsPromise, simulationPromise])
      .then(([prediction, insights, simulation]) => {
        if (!isMounted) {
          return;
        }

        setState({
          loading: false,
          error: null,
          targetRole,
          prediction: prediction
            ? {
              completionProbability: Number(prediction.completion_probability ?? 0),
              confidenceScore: Number(prediction.confidence_score ?? 0),
              modelName: String(prediction.model_name ?? 'unknown'),
            }
            : null,
          insights: insights
            ? {
              readinessScore: Number(insights.ai_readiness_score ?? 0),
              riskScore: Number(insights.risk_score ?? 0),
              recommendedActions: Array.isArray(insights.recommended_actions) ? insights.recommended_actions : [],
              modelName: String(insights.model_name ?? 'unknown'),
            }
            : null,
          simulation: simulation
            ? {
              successProbability: Number(simulation.success_probability ?? 0),
              confidenceLow: Number(simulation.confidence_interval_low ?? 0),
              confidenceHigh: Number(simulation.confidence_interval_high ?? 0),
              opportunityCost: simulation.opportunity_cost,
              estimatedMonths: Number(simulation.estimated_months ?? 0),
            }
            : null,
        });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setState((current) => ({
          ...current,
          loading: false,
          error: error instanceof Error ? error.message : 'ML backend unavailable',
        }));
      });

    return () => {
      isMounted = false;
    };
  }, [activeGoal, advancedAnalytics.completionVelocity, advancedAnalytics.delayRatio, dashboardSnapshot.consistencyScore, goals, tasks, user]);

  return state;
}
