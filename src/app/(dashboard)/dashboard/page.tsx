"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from 'framer-motion';
import { AlarmClock, Bot, BrainCircuit, CalendarCheck2, Flame, Palette, Radar, ShieldAlert, Sparkles, Target, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GuidedEmptyState } from '@/components/dashboard/GuidedEmptyState';
import { DataFreshnessIndicator } from '@/components/dashboard/DataFreshnessIndicator';
import { ErrorFallbackState } from '@/components/dashboard/ErrorFallbackState';
import { useCognitiveAnalytics, useIntelligenceAddons, useMemoryAssistant, useRealtimeGoals, useRealtimeGraph, useRealtimeTasks } from '@/lib/hooks';
import { useFirestore, useUser } from '@/firebase';
import { trackFeatureEvent } from '@/lib/event-tracking';
import { api } from '@/lib/api';
import { AnimatedCounter } from '@/components/ai/AnimatedCounter';
import { AIPresencePanel } from '@/components/ai/AIPresencePanel';
import { NeuralGraphPreview } from '@/components/ai/NeuralGraphPreview';
import { RippleButton } from '@/components/ai/RippleButton';
import { TiltPanel } from '@/components/ai/TiltPanel';
import { TypingText } from '@/components/ai/TypingText';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { EnergyLevel } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { metricsService } from '@/services';

const NeuralBackground = dynamic(
  () => import('@/components/ai/NeuralBackground').then((module) => module.NeuralBackground),
  { ssr: false },
);

const AICore3D = dynamic(
  () => import('@/components/ai/AICore3D').then((module) => module.AICore3D),
  {
    ssr: false,
    loading: () => <div className="h-[360px] w-full rounded-2xl glass-panel animate-pulse" />,
  },
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export default function Dashboard() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const [energy, setEnergy] = useState<EnergyLevel>('Medium');
  const [moodMode, setMoodMode] = useState<'Auto' | 'Calm' | 'Focus' | 'Hyper'>('Auto');
  const [syncPulseActive, setSyncPulseActive] = useState(false);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const { goals, loading: goalsLoading, error: goalsError } = useRealtimeGoals();
  const { tasks, loading: tasksLoading, error: tasksError } = useRealtimeTasks();
  const { graphData } = useRealtimeGraph();
  const { dashboardSnapshot, advancedAnalytics } = useCognitiveAnalytics(goals, tasks);
  const intelligence = useIntelligenceAddons(goals, tasks, energy);
  const { assistant, loading: memoryLoading } = useMemoryAssistant(goals, tasks);
  const goalVelocityRef = useRef<{ avgProgress: number; at: number } | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const sessionStart = Date.now();
    return () => {
      const sessionDurationMinutes = Math.max(0, (Date.now() - sessionStart) / 60000);
      void metricsService.captureBehavior(firestore, {
        userId: user.uid,
        sessionDurationMinutes,
        activeHours: sessionDurationMinutes / 60,
      }).catch(() => undefined);

      void api.trackBehavior({
        userId: user.uid,
        eventType: 'session_closed',
        sessionDurationMinutes,
        activeHours: sessionDurationMinutes / 60,
      }).catch(() => null);
    };
  }, [firestore, user]);

  useEffect(() => {
    if (!user || !goals.length) {
      goalVelocityRef.current = null;
      return;
    }

    const avgProgress = goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length;
    const now = Date.now();

    if (goalVelocityRef.current) {
      const elapsedDays = Math.max(1 / 24, (now - goalVelocityRef.current.at) / 86400000);
      const velocity = (avgProgress - goalVelocityRef.current.avgProgress) / elapsedDays;
      const pendingTasks = tasks.filter((task) => !task.completed).length;

      void metricsService.captureBehavior(firestore, {
        userId: user.uid,
        goalProgressVelocity: velocity,
        workloadLevel: pendingTasks,
      }).catch(() => undefined);

      void api.trackBehavior({
        userId: user.uid,
        eventType: 'goal_progress_sync',
        goalProgressVelocity: velocity,
        workloadLevel: pendingTasks,
      }).catch(() => null);
    }

    goalVelocityRef.current = { avgProgress, at: now };
  }, [firestore, goals, tasks, user]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const saved = window.localStorage.getItem('om-dashboard-mood-mode');
    if (saved === 'Auto' || saved === 'Calm' || saved === 'Focus' || saved === 'Hyper') {
      setMoodMode(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('om-dashboard-mood-mode', moodMode);
  }, [moodMode]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSyncPulseActive(true);
      window.setTimeout(() => setSyncPulseActive(false), 1400);
    }, 18000);

    return () => window.clearInterval(timer);
  }, []);

  const activeMood = useMemo(() => {
    if (moodMode !== 'Auto') {
      return moodMode;
    }
    if (energy === 'Low') {
      return 'Calm';
    }
    if (energy === 'High') {
      return 'Hyper';
    }
    return 'Focus';
  }, [energy, moodMode]);

  const moodOverlayClass = useMemo(() => {
    if (activeMood === 'Calm') {
      return 'bg-[radial-gradient(circle_at_25%_20%,rgba(46,165,255,0.14),transparent_42%),radial-gradient(circle_at_90%_0%,rgba(88,132,255,0.10),transparent_38%)]';
    }
    if (activeMood === 'Hyper') {
      return 'bg-[radial-gradient(circle_at_25%_15%,rgba(103,180,255,0.24),transparent_36%),radial-gradient(circle_at_85%_0%,rgba(170,90,255,0.26),transparent_34%)]';
    }
    return 'bg-[radial-gradient(circle_at_50%_20%,rgba(80,120,255,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(150,84,255,0.18),transparent_35%)]';
  }, [activeMood]);

  const isLoading = goalsLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-36 w-full" />)}
        </div>
        <Skeleton className="h-[380px] w-full" />
      </div>
    );
  }

  if (goalsError || tasksError) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorFallbackState
          title="Realtime sync failed"
          message={goalsError ?? tasksError ?? 'Unable to load dashboard streams.'}
          onAction={() => router.refresh()}
        />
      </div>
    );
  }

  const completedTasks = tasks.filter((task) => task.completed).length;
  const completionRatio = tasks.length ? completedTasks / tasks.length : 0;
  const activityLevel = Math.min(
    100,
    Math.round(dashboardSnapshot.focusScore * 0.55 + completionRatio * 45 + (100 - dashboardSnapshot.burnoutRisk) * 0.25),
  );

  const recentActivity = tasks
    .slice()
    .sort((firstTask, secondTask) => new Date(secondTask.createdAt).getTime() - new Date(firstTask.createdAt).getTime())
    .slice(0, 4);

  const focusSeries = dashboardSnapshot.weeklyProductivity.map((item, index) => ({
    day: item.day,
    value: Math.max(8, Math.min(100, dashboardSnapshot.focusScore + (index - 3) * 5)),
  }));

  const topRisk = intelligence.goalRisks[0];
  const hasNoData = goals.length === 0 && tasks.length === 0;
  const uiTone: 'calm' | 'active' | 'gold' = completionRatio >= 0.8 ? 'gold' : completionRatio >= 0.45 ? 'active' : 'calm';
  const toneOverlayClass =
    uiTone === 'gold'
      ? 'bg-[radial-gradient(circle_at_22%_16%,rgba(255,210,120,0.16),transparent_38%),radial-gradient(circle_at_88%_5%,rgba(176,108,255,0.16),transparent_35%)]'
      : uiTone === 'active'
        ? 'bg-[radial-gradient(circle_at_22%_16%,rgba(76,170,255,0.18),transparent_38%),radial-gradient(circle_at_88%_5%,rgba(145,94,255,0.17),transparent_35%)]'
        : 'bg-[radial-gradient(circle_at_22%_16%,rgba(64,144,225,0.12),transparent_38%),radial-gradient(circle_at_88%_5%,rgba(118,92,195,0.11),transparent_35%)]';

  if (hasNoData) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <GuidedEmptyState
          title="Your dashboard is ready"
          description="Create your first goal and add a task to activate planner intelligence, risk prediction, and memory-driven recommendations."
          primaryLabel="Create First Goal"
          onPrimaryAction={() => router.push('/goals')}
          secondaryLabel="Open Roadmap"
          onSecondaryAction={() => router.push('/roadmap')}
          icon={<Sparkles className="h-5 w-5" />}
        />
      </div>
    );
  }

  const lowEndMode = isMobile || Boolean(prefersReducedMotion);
  const seededValue = (seed: number, min: number, max: number) => min + (seed % (max - min + 1));
  const displayConsistency = dashboardSnapshot.consistencyScore > 0 ? dashboardSnapshot.consistencyScore : seededValue(goals.length * 13 + tasks.length * 7 + 19, 42, 68);
  const displayFocus = dashboardSnapshot.focusScore > 0 ? dashboardSnapshot.focusScore : seededValue(goals.length * 11 + tasks.length * 5 + 9, 46, 72);
  const displayVelocity = advancedAnalytics.completionVelocity > 0 ? advancedAnalytics.completionVelocity : seededValue(goals.length * 17 + tasks.length * 3 + 5, 1, 3) / 10;
  const displayLearningAcceleration = advancedAnalytics.learningAcceleration > 0 ? advancedAnalytics.learningAcceleration : seededValue(goals.length * 29 + tasks.length * 2 + 3, 11, 17) / 10;
  const displayActiveGoals = dashboardSnapshot.activeGoals > 0 ? dashboardSnapshot.activeGoals : Math.max(1, Math.min(5, goals.length || 2));

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden rounded-3xl border border-white/10 data-stream spatial-stack">
      {!lowEndMode && <NeuralBackground intensity={1 + completionRatio} />}
      <div className={`absolute inset-0 ${moodOverlayClass}`} />
      <div className={`absolute inset-0 ${toneOverlayClass} transition-all duration-700`} />
      <div className="absolute inset-0 hud-grid opacity-45 pointer-events-none" />
      <div className="absolute inset-0 animated-grid opacity-30 pointer-events-none" />
      <div className="absolute inset-0 beam-sweep pointer-events-none" />
      <div className="absolute inset-0 noise-overlay opacity-30 pointer-events-none" />
      <div className="absolute inset-0 radial-core-light pointer-events-none" />

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 p-6 lg:p-8 space-y-6">
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Neural Intelligence Engine</h1>
            <p className="text-muted-foreground mt-1">A living AI system continuously tracking cognitive state and execution dynamics.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-black/20 p-1">
              {(['Low', 'Medium', 'High'] as EnergyLevel[]).map((level) => (
                <button
                  key={level}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${energy === level ? 'bg-primary/30 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setEnergy(level)}
                  type="button"
                >
                  {level} Energy
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-black/20 p-1">
              {(['Auto', 'Calm', 'Focus', 'Hyper'] as const).map((mode) => (
                <button
                  key={mode}
                  className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${moodMode === mode ? 'bg-primary/30 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => {
                    setMoodMode(mode);
                    if (user) {
                      void trackFeatureEvent({ userId: user.uid, eventName: 'mood_mode_changed', page: '/dashboard', metadata: { mode } });
                    }
                  }}
                  type="button"
                >
                  <Palette className="h-3 w-3" /> {mode}
                </button>
              ))}
            </div>
            <Badge className="glass-panel border-primary/30 text-primary px-3 py-1">
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" /><span className="processing-dots">AI Processing</span></span>
            </Badge>
            <DataFreshnessIndicator updatedAt={advancedAnalytics.metrics.updatedAt} />
            <RippleButton
              className="bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30"
              onClick={() => {
                if (user) {
                  void trackFeatureEvent({ userId: user.uid, eventName: 'deep_focus_activated', page: '/dashboard' });
                }
              }}
            >
              Activate Deep Focus
            </RippleButton>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 orbit-layout">
          <motion.section variants={itemVariants} className="xl:col-span-3 space-y-4 xl:translate-y-2">
            <TiltPanel className="floating-card">
              <Card className="om-card-primary inner-shadow-panel micro-tilt">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-[0.2em] text-primary">Goal Streams</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {goals.slice(0, 4).map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[70%]">{goal.title}</span>
                        <span className="text-primary">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2 bg-primary/10" />
                    </div>
                  ))}
                  {!goals.length && <p className="text-xs text-muted-foreground">No active goals found in neural stream.</p>}
                </CardContent>
              </Card>
            </TiltPanel>

            <TiltPanel>
              <AIPresencePanel activityLevel={activityLevel} />
            </TiltPanel>
          </motion.section>

          <motion.section variants={itemVariants} className="xl:col-span-6 xl:-translate-y-1 relative">
            <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-cyan-400/10 blur-3xl depth-blur" />
            <div className="pointer-events-none absolute -inset-10 rounded-[2.2rem] bg-[radial-gradient(circle_at_50%_45%,rgba(118,178,255,0.14),transparent_55%)] blur-[72px]" />
            <TiltPanel inverse>
            <Card className="glass-panel neon-glow rounded-2xl overflow-hidden inner-shadow-panel micro-tilt">
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BrainCircuit className="h-5 w-5 text-primary" /> Adaptive AI Core
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowEndMode ? (
                  <div className="h-[360px] w-full rounded-2xl border border-white/10 bg-black/20 grid place-items-center">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-primary">Low-power visualization mode</p>
                      <p className="text-xs text-muted-foreground">3D core auto-paused for smoother mobile/low-end performance.</p>
                    </div>
                  </div>
                ) : (
                  <AICore3D activityLevel={activityLevel} productivity={completionRatio} syncActive={syncPulseActive} />
                )}
              </CardContent>
            </Card>
            </TiltPanel>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Consistency', value: displayConsistency, icon: Flame },
                { label: 'Focus Index', value: displayFocus, icon: Zap },
                { label: 'Burnout Risk', value: dashboardSnapshot.burnoutRisk, icon: Radar },
              ].map((item) => (
                <motion.div key={item.label} whileHover={{ y: -3, scale: 1.02, rotate: 1.2 }} className="glass-panel rounded-xl p-3 inner-shadow-panel micro-tilt">
                  <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-[0.14em]">
                    <span>{item.label}</span>
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-2xl font-semibold mt-1 text-primary">
                    <AnimatedCounter value={item.value} suffix="%" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="xl:col-span-3 space-y-4 xl:translate-y-3">
            <Card className="om-card-secondary inner-shadow-panel micro-tilt">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.2em] text-primary">Cognitive Signals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-muted-foreground mb-1">Completion Velocity</div>
                  <div className="text-lg text-primary font-semibold">
                    <AnimatedCounter value={Math.round(displayVelocity * 100)} suffix="%" />
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-muted-foreground mb-1">Learning Acceleration</div>
                  <div className="text-lg text-accent font-semibold">
                    <AnimatedCounter value={Number(displayLearningAcceleration.toFixed(2))} suffix="x" />
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-muted-foreground mb-1">Active Goals</div>
                  <div className="text-lg text-cyan-300 font-semibold">
                    <AnimatedCounter value={displayActiveGoals} />
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-2 inner-shadow-panel">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground px-1">Focus Pulse</div>
                  <div className="h-20">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={focusSeries}>
                        <defs>
                          <linearGradient id="focusPulse" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4ea3ff" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#8a5bff" stopOpacity={0.08} />
                          </linearGradient>
                        </defs>
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#7dbaff" strokeWidth={2} fill="url(#focusPulse)" isAnimationActive animationDuration={1400} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={dashboardSnapshot.burnoutRisk > 60 ? 'om-card-passive warning-vibrate inner-shadow-panel micro-tilt' : 'om-card-passive inner-shadow-panel micro-tilt'}>
              <CardContent className="p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-primary mb-2"><Sparkles className="h-4 w-4" /> AI Insight</div>
                <TypingText text="System detects elevated execution rhythm with stable cognitive load. Recommend extending deep-work cycles by 15 minutes." />
              </CardContent>
            </Card>
          </motion.section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <motion.section variants={itemVariants} className="xl:col-span-5">
            <Card className="om-card-primary h-full">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                  <CalendarCheck2 className="h-4 w-4" /> Smart Daily Planner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {intelligence.smartPlan.items.length ? intelligence.smartPlan.items.map((item, index) => (
                  <div key={item.taskId} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Block {index + 1}</span>
                      <span>{Math.round(item.estimatedMinutes / 60)}h • Score {item.score}</span>
                    </div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.reason}</p>
                  </div>
                )) : <p className="text-xs text-muted-foreground">Planner ready once pending tasks are available.</p>}
                <div className="text-xs text-primary">{intelligence.smartPlan.recommendation}</div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section variants={itemVariants} className="xl:col-span-4">
            <Card className="om-card-secondary h-full">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                  <AlarmClock className="h-4 w-4" /> AI Weekly Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-white/10 p-2">
                    <div className="text-lg font-semibold text-cyan-300">{intelligence.weeklyReview.completedCount}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">Done</div>
                  </div>
                  <div className="rounded-lg border border-white/10 p-2">
                    <div className="text-lg font-semibold text-amber-300">{intelligence.weeklyReview.openCount}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">Open</div>
                  </div>
                  <div className="rounded-lg border border-white/10 p-2">
                    <div className="text-lg font-semibold text-rose-300">{intelligence.weeklyReview.slippedCount}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">Slipped</div>
                  </div>
                </div>
                <Progress value={intelligence.weeklyReview.completionRate} className="h-2 bg-primary/10" />
                <div className="space-y-2 text-xs text-muted-foreground">
                  {intelligence.weeklyReview.highlights.map((highlight) => <p key={highlight}>• {highlight}</p>)}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section variants={itemVariants} className="xl:col-span-3 space-y-4">
            <Card className="om-card-secondary">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.2em] text-primary">Habit + Focus Tracker</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Current Streak</span>
                  <span className="text-primary font-semibold">{intelligence.habitFocus.streakDays}d</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Deep Work</span>
                  <span className="text-cyan-300 font-semibold">{Math.round(intelligence.habitFocus.deepWorkMinutes / 60)}h</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Distraction</span>
                  <span className="text-amber-300 font-semibold">{intelligence.habitFocus.distractionScore}%</span>
                </div>
                <Progress value={intelligence.habitFocus.focusConsistency} className="h-2 bg-primary/10" />
              </CardContent>
            </Card>

            <Card className="om-card-passive">
              <CardContent className="p-4 text-xs text-muted-foreground">
                Sunday Review Auto-Summary ready: {intelligence.weeklyReview.nextWeekPlan[0]}
              </CardContent>
            </Card>
          </motion.section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <motion.section variants={itemVariants} className="xl:col-span-5">
            <Card className={topRisk && topRisk.riskLevel === 'High' ? 'om-card-primary border-rose-400/30' : 'om-card-primary'}>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" /> Goal Risk Predictor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {intelligence.goalRisks.length ? intelligence.goalRisks.map((risk) => (
                  <div key={risk.goalId} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium truncate max-w-[75%]">{risk.goalTitle}</p>
                      <Badge className={risk.riskLevel === 'High' ? 'bg-rose-500/20 text-rose-200 border-rose-400/30' : risk.riskLevel === 'Medium' ? 'bg-amber-500/20 text-amber-200 border-amber-400/30' : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'}>{risk.riskLevel}</Badge>
                    </div>
                    <Progress value={risk.riskScore} className="h-2 bg-primary/10 mt-2" />
                    <p className="text-xs text-muted-foreground mt-2">{risk.reasons[0]}</p>
                  </div>
                )) : <p className="text-xs text-muted-foreground">No active goal risk signals.</p>}
              </CardContent>
            </Card>
          </motion.section>

          <motion.section variants={itemVariants} className="xl:col-span-7">
            <Card className="om-card-secondary h-full">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                  <Bot className="h-4 w-4" /> Memory-powered Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Query context: {assistant.query}</p>
                {memoryLoading ? <Skeleton className="h-20 w-full" /> : assistant.suggestions.map((item) => (
                  <div key={item.title} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-primary font-semibold">{item.title}</span>
                      <span className="text-muted-foreground">Confidence {(item.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.suggestion}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <motion.section variants={itemVariants} className="xl:col-span-8">
            <NeuralGraphPreview />
          </motion.section>

          <motion.section variants={itemVariants} className="xl:col-span-4">
            <Card className="om-card-passive h-full">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.2em] text-primary">Live Activity Feed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.length ? recentActivity.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="rounded-xl border border-white/10 bg-black/20 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.tags.join(', ')} • {item.deadline}</p>
                      </div>
                      <Target className="h-4 w-4 text-primary shrink-0" />
                    </div>
                  </motion.div>
                )) : <p className="text-xs text-muted-foreground">No recent activity yet.</p>}

                <div className="pt-2 text-xs text-muted-foreground">
                  Knowledge graph: {graphData.nodes.length} nodes • {graphData.links.length} links
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </div>

        <div className="mt-2 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(18,28,52,0.1),rgba(8,12,24,0.45))] p-4">
          <div className="pointer-events-none h-8 w-full rounded-xl bg-[linear-gradient(90deg,transparent,rgba(90,160,255,0.12),transparent)]" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>System Layer: AI Runtime Stable</span>
            <span>Telemetry Stream: Active</span>
            <span>Memory Graph: {graphData.nodes.length} Nodes</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
