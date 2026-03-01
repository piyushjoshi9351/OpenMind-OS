"use client";

import { motion } from 'framer-motion';
import { Flame, Gauge, Timer, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AnimatedCounter } from '@/components/ai/AnimatedCounter';
import { TiltPanel } from '@/components/ai/TiltPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCognitiveAnalytics, useRealtimeGoals, useRealtimeTasks } from '@/lib/hooks';

const MONTHLY_GROWTH = [
  { month: 'Jan', score: 52 },
  { month: 'Feb', score: 59 },
  { month: 'Mar', score: 61 },
  { month: 'Apr', score: 65 },
  { month: 'May', score: 70 },
  { month: 'Jun', score: 74 },
];

const SKILL_STRENGTH = [
  { skill: 'Coding', score: 82 },
  { skill: 'Learning', score: 88 },
  { skill: 'Planning', score: 71 },
  { skill: 'Consistency', score: 86 },
  { skill: 'Focus', score: 77 },
];

const HEATMAP_ROWS = [
  { slot: 'Morning', mon: 8, tue: 7, wed: 9, thu: 8, fri: 9, sat: 5, sun: 4 },
  { slot: 'Afternoon', mon: 6, tue: 6, wed: 7, thu: 6, fri: 8, sat: 4, sun: 3 },
  { slot: 'Evening', mon: 5, tue: 6, wed: 5, thu: 7, fri: 6, sat: 6, sun: 5 },
];

const PIE_COLORS = ['#56a8ff', '#9e6cff', '#61f0ff'];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export default function AnalyticsPage() {
  const { goals, loading: goalsLoading } = useRealtimeGoals();
  const { tasks, loading: tasksLoading } = useRealtimeTasks();
  const { dashboardSnapshot, advancedAnalytics } = useCognitiveAnalytics(goals, tasks);

  if (goalsLoading || tasksLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((loadingItem) => <Skeleton key={loadingItem} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  const momentumData = dashboardSnapshot.weeklyProductivity.map((itemData, index) => ({
    ...itemData,
    focus: Math.max(10, Math.min(100, dashboardSnapshot.focusScore + (index - 3) * 7)),
  }));

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-8">
      <motion.div variants={item}>
        <h1 className="text-3xl font-headline font-bold">Cognitive Analytics Engine</h1>
        <p className="text-muted-foreground mt-1">Live neural metrics with glow-layered visual intelligence tracking.</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Consistency Score', value: dashboardSnapshot.consistencyScore, icon: Flame, suffix: '%' },
          { label: 'Burnout Risk', value: dashboardSnapshot.burnoutRisk, icon: Timer, suffix: '%' },
          { label: 'Focus Index', value: dashboardSnapshot.focusScore, icon: Gauge, suffix: '%' },
          { label: 'Learning Boost', value: Number(advancedAnalytics.learningAcceleration.toFixed(2)), icon: TrendingUp, suffix: 'x' },
        ].map((metric) => (
          <TiltPanel key={metric.label} className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <span>{metric.label}</span>
              <metric.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-semibold text-primary mt-2">
              <AnimatedCounter value={metric.value} suffix={metric.suffix} />
            </div>
          </TiltPanel>
        ))}
      </motion.div>

      <motion.section variants={item}>
        <Card className="glass-panel border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle className="font-headline">Weekly Completion Momentum</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={momentumData}>
                  <defs>
                    <linearGradient id="momentumFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ea3ff" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#4ea3ff" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 168, 255, 0.18)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="focus" stroke="#8ac4ff" strokeWidth={3} fill="url(#momentumFill)" isAnimationActive animationDuration={1400} />
                  <Bar dataKey="completedTasks" fill="#69b0ff" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1100} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.section variants={item}>
          <Card className="glass-panel border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="font-headline">Productivity Heatmap (Intensity)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={HEATMAP_ROWS} layout="vertical" barCategoryGap={12}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(120, 168, 255, 0.14)" />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="slot" width={90} />
                    <Tooltip />
                    <Bar dataKey="mon" stackId="a" fill="#62adff" />
                    <Bar dataKey="tue" stackId="a" fill="#4ad4ff" />
                    <Bar dataKey="wed" stackId="a" fill="#8b6bff" />
                    <Bar dataKey="thu" stackId="a" fill="#9b70ff" />
                    <Bar dataKey="fri" stackId="a" fill="#ad6eff" />
                    <Bar dataKey="sat" stackId="a" fill="#71d7ff" />
                    <Bar dataKey="sun" stackId="a" fill="#90a6d5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section variants={item}>
          <Card className="glass-panel border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="font-headline">Monthly Growth Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MONTHLY_GROWTH}>
                    <defs>
                      <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#5ea9ff" />
                        <stop offset="100%" stopColor="#9f73ff" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 168, 255, 0.16)" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="url(#lineGlow)" strokeWidth={3.4} dot={{ r: 3.2 }} isAnimationActive animationDuration={1500} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.section variants={item}>
          <Card className="glass-panel border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="font-headline">Skill Strength Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={SKILL_STRENGTH}>
                    <PolarGrid stroke="rgba(140, 184, 255, 0.24)" />
                    <PolarAngleAxis dataKey="skill" />
                    <Radar dataKey="score" stroke="#7dc1ff" fill="#7dc1ff" fillOpacity={0.27} isAnimationActive animationDuration={1200} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section variants={item}>
          <Card className="glass-panel border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="font-headline">Focus Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dashboardSnapshot.focusDistribution} dataKey="value" nameKey="label" outerRadius={96} label isAnimationActive animationDuration={1200}>
                      {dashboardSnapshot.focusDistribution.map((entry, index) => (
                        <Cell key={`${entry.label}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </motion.div>
  );
}
