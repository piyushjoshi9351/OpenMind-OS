"use client"

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar
} from 'recharts';
import { Target, CheckCircle2, Zap, Flame, BrainCircuit } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MOCK_METRICS, MOCK_GOALS } from '@/lib/api-mock';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const weeklyData = [
  { name: 'Mon', tasks: 4 },
  { name: 'Tue', tasks: 3 },
  { name: 'Wed', tasks: 7 },
  { name: 'Thu', tasks: 5 },
  { name: 'Fri', tasks: 8 },
  { name: 'Sat', tasks: 2 },
  { name: 'Sun', tasks: 3 },
];

const skillData = [
  { subject: 'Learning', A: 120, fullMark: 150 },
  { subject: 'Coding', A: 98, fullMark: 150 },
  { subject: 'Communication', A: 86, fullMark: 150 },
  { subject: 'Design', A: 99, fullMark: 150 },
  { subject: 'Mathematics', A: 85, fullMark: 150 },
];

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-headline font-bold">Welcome back, John</h1>
        <p className="text-muted-foreground mt-2">Here is your cognitive summary for the week.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Consistency Streak" 
          value="12 Days" 
          icon={<Flame className="h-6 w-6" />}
          trend={{ value: 15, isUp: true }}
        />
        <StatsCard 
          title="Productivity Score" 
          value={MOCK_METRICS.focusScore} 
          icon={<Zap className="h-6 w-6" />}
          description="Focus quality based on task intensity"
        />
        <StatsCard 
          title="Active Goals" 
          value={MOCK_GOALS.length} 
          icon={<Target className="h-6 w-6" />}
        />
        <StatsCard 
          title="Burnout Risk" 
          value={`${MOCK_METRICS.burnoutRisk}%`} 
          icon={<BrainCircuit className="h-6 w-6" />}
          className={MOCK_METRICS.burnoutRisk > 40 ? "bg-rose-50" : ""}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f5f5f5' }} />
                  <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">Skill Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                  <PolarGrid stroke="#eee" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Radar
                    name="Skills"
                    dataKey="A"
                    stroke="hsl(var(--accent))"
                    fill="hsl(var(--accent))"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline">Active Goals</CardTitle>
            <Badge variant="outline">View All</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            {MOCK_GOALS.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{goal.title}</span>
                  <span className="text-sm text-muted-foreground">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="h-2" />
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-[10px]">{goal.category}</Badge>
                  <span className="text-[10px] text-muted-foreground">Deadline: {goal.deadline}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">Cognitive Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-primary/5 flex items-start gap-4">
              <Zap className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-semibold text-sm">Peak Performance Window</p>
                <p className="text-xs text-muted-foreground mt-1">Your data suggests you are most productive between 9:00 AM and 11:30 AM.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-accent/10 flex items-start gap-4">
              <Target className="h-5 w-5 text-accent mt-1" />
              <div>
                <p className="font-semibold text-sm">Learning Velocity</p>
                <p className="text-xs text-muted-foreground mt-1">You are acquiring technical skills 1.4x faster than the platform average.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 flex items-start gap-4">
              <CheckCircle2 className="h-5 w-5 text-amber-500 mt-1" />
              <div>
                <p className="font-semibold text-sm">Goal Completion Probability</p>
                <p className="text-xs text-muted-foreground mt-1">Based on consistency, your probability of finishing 'AI Engineering' is 82%.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}