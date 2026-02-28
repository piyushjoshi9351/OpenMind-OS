"use client"

import { MOCK_METRICS } from '@/lib/api-mock';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Brain, Zap, Flame, Battery, TrendingUp, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const performanceData = [
  { time: '08:00', focus: 30 },
  { time: '10:00', focus: 85 },
  { time: '12:00', focus: 60 },
  { time: '14:00', focus: 75 },
  { time: '16:00', focus: 50 },
  { time: '18:00', focus: 40 },
  { time: '20:00', focus: 65 },
];

export default function InsightsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Cognitive Insights</h1>
        <p className="text-muted-foreground mt-1">Deep analysis of your productivity and mental performance patterns.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Consistency Score" 
          value={`${MOCK_METRICS.consistencyScore}%`} 
          icon={<Flame className="h-6 w-6 text-orange-500" />}
        />
        <StatsCard 
          title="Focus Density" 
          value="High" 
          icon={<Zap className="h-6 w-6 text-yellow-500" />}
          description="Avg focus session: 52m"
        />
        <StatsCard 
          title="Cognitive Load" 
          value="Medium" 
          icon={<Brain className="h-6 w-6 text-blue-500" />}
        />
        <StatsCard 
          title="Recovery Rate" 
          value="92%" 
          icon={<Battery className="h-6 w-6 text-emerald-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
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

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Learning Velocity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-headline">1.4x</div>
              <p className="text-sm opacity-80 mt-2">You are mastering new topics 40% faster than your personal baseline this month.</p>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-xs uppercase tracking-wider font-bold opacity-60">Top Growing Skill</p>
                <p className="text-lg font-medium">Deep Learning</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-rose-50 border border-rose-100">
            <CardHeader>
              <CardTitle className="text-lg font-headline text-rose-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" /> Burnout Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-rose-800">Risk Factor</span>
                <span className="text-sm font-bold text-rose-900">{MOCK_METRICS.burnoutRisk}%</span>
              </div>
              <Progress value={MOCK_METRICS.burnoutRisk} className="h-2 bg-rose-200" />
              <p className="text-xs text-rose-700 mt-4 leading-relaxed">
                Your late-night activity has increased. We recommend adding a "Rest Block" between 10:00 PM and 11:30 PM.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}