"use client"

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { GuidedEmptyState } from '@/components/dashboard/GuidedEmptyState';
import { DataFreshnessIndicator } from '@/components/dashboard/DataFreshnessIndicator';
import { ErrorFallbackState } from '@/components/dashboard/ErrorFallbackState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, Brain, Sparkles, Zap, Flame, Battery, TrendingUp, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useCognitiveAnalytics, useRealtimeGoals, useRealtimeTasks } from '@/lib/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { uxCopy } from '@/lib/ux-copy';
import { useUser } from '@/firebase';
import { trackFeatureEvent } from '@/lib/event-tracking';
import { api, type MLInsightsResult } from '@/lib/api';

export default function InsightsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mlInsights, setMlInsights] = useState<MLInsightsResult | null>(null);
  const { goals, loading: goalsLoading, error: goalsError } = useRealtimeGoals();
  const { tasks, loading: tasksLoading, error: tasksError } = useRealtimeTasks();
  const { dashboardSnapshot, advancedAnalytics } = useCognitiveAnalytics(goals, tasks);

  useEffect(() => {
    if (!user || goalsLoading || tasksLoading || goalsError || tasksError) {
      return;
    }

    const targetRole = goals.find((goal) => goal.category === 'Career')?.title || 'AI Engineer';
    const userSkills = Array.from(
      new Set(
        goals
          .flatMap((goal) => goal.title.split(/\s+/))
          .map((skill) => skill.trim())
          .filter((skill) => skill.length > 2)
      )
    );

    void api
      .getMLInsights({
        userId: user.uid,
        targetRole,
        userSkills,
        windowDays: 7,
      })
      .then((result) => setMlInsights(result))
      .catch(() => setMlInsights(null));
  }, [goals, goalsError, goalsLoading, tasksError, tasksLoading, user]);

  const performanceData = useMemo(() => {
    return dashboardSnapshot.weeklyProductivity.map((item, index) => ({
      time: item.day,
      focus: Math.max(15, Math.min(100, dashboardSnapshot.focusScore + (index - 3) * 6)),
    }));
  }, [dashboardSnapshot.focusScore, dashboardSnapshot.weeklyProductivity]);

  if (goalsLoading || tasksLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-8 w-52" />
        <p className="text-xs text-muted-foreground">{uxCopy.loading.syncing}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  if (goalsError || tasksError) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <ErrorFallbackState message={goalsError ?? tasksError ?? 'Unable to load insights right now.'} onAction={() => router.refresh()} />
      </div>
    );
  }

  const hasInsightData = tasks.length > 0 || goals.length > 0;
  const shortRecommendations = [
    dashboardSnapshot.burnoutRisk > 40 ? 'Reduce parallel tasks for 48h to recover cognitive load.' : 'Current load is stable; keep deep-work cadence.',
    advancedAnalytics.delayRatio > 0.25 ? 'Start day with one overdue task to reduce delay ratio.' : 'Delay ratio is healthy; maintain closing rhythm.',
    dashboardSnapshot.focusScore < 60 ? 'Add one distraction-free block of 60 minutes today.' : 'Focus quality is high; preserve the current routine.',
    ...(mlInsights?.recommended_actions?.slice(0, 2) ?? []),
  ];

  const trendChips = [
    {
      label: 'Focus Trend',
      value: `${dashboardSnapshot.focusScore}%`,
      up: dashboardSnapshot.focusScore >= 60,
    },
    {
      label: 'Recovery Trend',
      value: `${Math.round((1 - advancedAnalytics.delayRatio) * 100)}%`,
      up: advancedAnalytics.delayRatio < 0.3,
    },
    {
      label: 'Learning Trend',
      value: `${advancedAnalytics.learningAcceleration.toFixed(2)}x`,
      up: advancedAnalytics.learningAcceleration >= 1,
    },
  ];

  if (!hasInsightData) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          title="Cognitive Insights"
          subtitle="Deep analysis of your productivity and mental performance patterns."
          primaryAction={<Button onClick={() => router.push('/goals')}>Create First Goal</Button>}
          secondaryAction={<Button variant="outline" onClick={() => router.push('/tasks')}>Open Tasks</Button>}
        />
        <GuidedEmptyState
          title="No insight data yet"
          description="Create your first goal and complete at least one task. OpenMind will then generate focus, consistency, and recovery insights automatically."
          primaryLabel="Generate First Insight"
          onPrimaryAction={() => router.push('/goals')}
          secondaryLabel="Add First Task"
          onSecondaryAction={() => router.push('/tasks')}
          icon={<Sparkles className="h-5 w-5" />}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Cognitive Insights"
        subtitle="Scannable intelligence for focus, consistency, and recovery."
        primaryAction={<Button onClick={() => {
          if (user) {
            void trackFeatureEvent({ userId: user.uid, eventName: 'insights_refreshed', page: '/insights' });
          }
          router.refresh();
        }}>Refresh Insights</Button>}
        secondaryAction={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => {
              setShowAdvanced((current) => {
                const next = !current;
                if (user) {
                  void trackFeatureEvent({ userId: user.uid, eventName: next ? 'advanced_insights_opened' : 'advanced_insights_closed', page: '/insights' });
                }
                return next;
              });
            }}>
              {showAdvanced ? 'Hide Advanced Analytics' : 'Show Advanced Analytics'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/tasks')}>Open Tasks</Button>
          </div>
        }
      />

      <DataFreshnessIndicator updatedAt={advancedAnalytics.metrics.updatedAt} />

      {showAdvanced && (
        <div className="flex flex-wrap gap-2">
          {trendChips.map((chip) => (
            <Badge key={chip.label} variant="outline" className="px-3 py-1.5 gap-1">
              {chip.up ? <ArrowUpRight className="h-3.5 w-3.5 text-cyan-300" /> : <ArrowDownRight className="h-3.5 w-3.5 text-rose-300" />}
              <span>{chip.label}: {chip.value}</span>
            </Badge>
          ))}
          {mlInsights && (
            <Badge variant="outline" className="px-3 py-1.5">
              Python ML Engine: {mlInsights.model_name}
            </Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Consistency Score" 
          value={`${dashboardSnapshot.consistencyScore}%`} 
          icon={<Flame className="h-6 w-6 text-cyan-300" />}
        />
        <StatsCard 
          title="Focus Density" 
          value={`${dashboardSnapshot.focusScore}%`} 
          icon={<Zap className="h-6 w-6 text-blue-300" />}
          description="Dynamic score based on completed tasks"
        />
        <StatsCard 
          title="Cognitive Load" 
          value={advancedAnalytics.delayRatio > 0.35 ? 'High' : 'Medium'} 
          icon={<Brain className="h-6 w-6 text-purple-300" />}
        />
        <StatsCard 
          title="Recovery Rate" 
          value={`${Math.round((1 - advancedAnalytics.delayRatio) * 100)}%`} 
          icon={<Battery className="h-6 w-6 text-cyan-300" />}
        />
        {mlInsights && (
          <StatsCard
            title="AI Readiness"
            value={`${Math.round(mlInsights.ai_readiness_score)}%`}
            icon={<Sparkles className="h-6 w-6 text-cyan-300" />}
            description="Python ML fusion signal"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className={showAdvanced ? 'lg:col-span-2 om-card' : 'lg:col-span-3 om-card'}>
          <CardHeader>
            <CardTitle className="font-headline">Focus Window Analysis</CardTitle>
            <CardDescription>Average focus score by time of day over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(123, 177, 255, 0.2)" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="focus" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorFocus)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {showAdvanced && (
          <div className="space-y-6">
            <Card className="om-card bg-gradient-to-br from-primary/35 to-accent/20 text-primary-foreground">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> Learning Velocity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold font-headline">{advancedAnalytics.metrics.learningVelocity.toFixed(1)}x</div>
                <p className="text-sm opacity-80 mt-2">Learning acceleration score: {advancedAnalytics.learningAcceleration.toFixed(2)} with current execution patterns.</p>
                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="text-xs uppercase tracking-wider font-bold opacity-60">Top Growing Skill</p>
                  <p className="text-lg font-medium">Adaptive Problem Solving</p>
                </div>
              </CardContent>
            </Card>

            <Card className="om-card border border-cyan-300/20 bg-gradient-to-br from-[#11162a] to-[#16122b]">
              <CardHeader>
                <CardTitle className="text-lg font-headline text-cyan-100 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-purple-300" /> Burnout Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-cyan-100/80">Risk Factor</span>
                  <span className="text-sm font-bold text-cyan-100">{dashboardSnapshot.burnoutRisk}%</span>
                </div>
                <Progress value={dashboardSnapshot.burnoutRisk} className="h-2 bg-primary/15" />
                <p className="text-xs text-cyan-100/75 mt-4 leading-relaxed">
                  Delay ratio is {(advancedAnalytics.delayRatio * 100).toFixed(0)}%. Consider inserting recovery blocks if risk exceeds 40%.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Card className="om-card">
        <CardHeader>
          <CardTitle className="text-base font-headline">AI Recommendations</CardTitle>
          <CardDescription>Short actions based on your current cognitive signals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {shortRecommendations.map((item) => (
            <p key={item} className="text-sm text-muted-foreground">• {item}</p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}