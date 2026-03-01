'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { api } from '@/lib/api';
import { getUserRole, validateSecureToken } from '@/lib/auth';
import { analyticsService, goalService, graphService, intelligenceService, taskService } from '@/services';
import type {
  BehaviorMetrics,
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

  useEffect(() => {
    if (!user) {
      setNodes([]);
      setEdges([]);
      setLoading(false);
      return;
    }

    const unsubNodes = graphService.subscribeNodes(firestore, user.uid, (items) => {
      setNodes(items);
      setLoading(false);
    }, () => setLoading(false));

    const unsubEdges = graphService.subscribeEdges(firestore, user.uid, (items) => {
      setEdges(items);
      setLoading(false);
    }, () => setLoading(false));

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
  return useMemo(() => {
    if (!goals.length) {
      return null;
    }

    const targetGoal = [...goals].sort((a, b) => b.skillGapScore - a.skillGapScore)[0];
    const existingSkills = nodes.filter((node) => node.type === 'skill').map((node) => node.title);
    const requiredSkills = ['System Design', 'Data Modeling', 'Python', 'MLOps', 'Deep Learning'];
    const missingSkills = requiredSkills.filter((skill) => !existingSkills.includes(skill));
    const gapPercentage = Math.round((missingSkills.length / requiredSkills.length) * 100);

    return {
      goalId: targetGoal.id,
      goalTitle: targetGoal.title,
      requiredSkills,
      existingSkills,
      missingSkills,
      gapPercentage,
      recommendations: missingSkills.map((skill) => `Add a 2-week sprint for ${skill}`),
    };
  }, [goals, nodes]);
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
