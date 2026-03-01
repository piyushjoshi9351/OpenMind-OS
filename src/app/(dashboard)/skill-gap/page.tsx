"use client"

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useRealtimeGoals, useRealtimeGraph, useSkillGapAnalysis } from '@/lib/hooks';
import { Skeleton } from '@/components/ui/skeleton';

export default function SkillGapPage() {
  const { goals, loading: goalsLoading } = useRealtimeGoals();
  const { nodes, loading: graphLoading } = useRealtimeGraph();
  const defaultAnalysis = useSkillGapAnalysis(goals, nodes);

  const [selectedGoalId, setSelectedGoalId] = useState<string>('');

  const selectedGoal = useMemo(() => {
    if (!selectedGoalId) {
      return goals[0] ?? null;
    }
    return goals.find((goal) => goal.id === selectedGoalId) ?? goals[0] ?? null;
  }, [goals, selectedGoalId]);

  const analysis = useMemo(() => {
    if (!selectedGoal || !defaultAnalysis) {
      return null;
    }
    if (defaultAnalysis.goalId === selectedGoal.id) {
      return defaultAnalysis;
    }

    const requiredSkills = ['System Design', 'Data Modeling', 'Python', 'MLOps', 'Deep Learning'];
    const existingSkills = nodes.filter((node) => node.type === 'skill').map((node) => node.title);
    const missingSkills = requiredSkills.filter((skill) => !existingSkills.includes(skill));
    const gapPercentage = Math.round((missingSkills.length / requiredSkills.length) * 100);

    return {
      goalId: selectedGoal.id,
      goalTitle: selectedGoal.title,
      requiredSkills,
      existingSkills,
      missingSkills,
      gapPercentage,
      recommendations: missingSkills.map((skill) => `Add a 2-week sprint for ${skill}`),
    };
  }, [defaultAnalysis, nodes, selectedGoal]);

  if (goalsLoading || graphLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Create at least one goal to run skill gap analysis.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Skill Gap Analyzer</h1>
        <p className="text-muted-foreground mt-1">AI-ready comparison between required and current skills with roadmap suggestions.</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Selected goal</p>
            <p className="font-semibold">{analysis.goalTitle}</p>
          </div>
          <Select value={selectedGoal?.id ?? ''} onValueChange={setSelectedGoalId}>
            <SelectTrigger className="w-full md:w-72"><SelectValue placeholder="Choose goal" /></SelectTrigger>
            <SelectContent>
              {goals.map((goal) => (
                <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle className="font-headline text-lg">Required Skills</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {analysis.requiredSkills.map((skill) => <Badge key={skill} variant="secondary" className="mr-2 mb-2">{skill}</Badge>)}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle className="font-headline text-lg">Current Skills</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {analysis.existingSkills.length ? analysis.existingSkills.map((skill) => <Badge key={skill} className="mr-2 mb-2">{skill}</Badge>) : <p className="text-sm text-muted-foreground">No skill nodes yet.</p>}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle className="font-headline text-lg">Missing Skills</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {analysis.missingSkills.length ? analysis.missingSkills.map((skill) => <Badge key={skill} variant="destructive" className="mr-2 mb-2">{skill}</Badge>) : <p className="text-sm text-emerald-600">No critical gaps detected.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="font-headline text-lg">Gap Score & Suggested Roadmap</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Gap Percentage</span>
              <span className="font-semibold">{analysis.gapPercentage}%</span>
            </div>
            <Progress value={analysis.gapPercentage} className="h-2" />
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {analysis.recommendations.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
