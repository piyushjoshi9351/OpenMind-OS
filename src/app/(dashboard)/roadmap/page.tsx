"use client"

import { useState } from 'react';
import { generateLearningRoadmap, GenerateLearningRoadmapOutput } from '@/ai/flows/generate-learning-roadmap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  Sparkles, 
  Map as MapIcon, 
  Calendar, 
  Clock, 
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirestore, useUser } from '@/firebase';
import { useRealtimeGoals } from '@/lib/hooks';
import { taskService } from '@/services';
import { useToast } from '@/hooks/use-toast';

const ROLE_PRESETS = ['Staff AI Engineer', 'Senior Backend Engineer', 'Product Manager'];
const SKILL_OPTIONS = ['System Design', 'ML Fundamentals', 'LLM', 'MLOps', 'Leadership', 'Interview Prep', 'Portfolio'];

export default function RoadmapPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { goals } = useRealtimeGoals();
  const { toast } = useToast();

  const [targetRole, setTargetRole] = useState('');
  const [timeline, setTimeline] = useState(3);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [weeklyHours, setWeeklyHours] = useState(8);
  const [preferredStyle, setPreferredStyle] = useState<'project' | 'theory' | 'mixed'>('mixed');
  const [prioritySkills, setPrioritySkills] = useState<string[]>([]);
  const [constraints, setConstraints] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [roadmap, setRoadmap] = useState<GenerateLearningRoadmapOutput | null>(null);
  const [completedActivities, setCompletedActivities] = useState<Record<string, boolean>>({});

  const togglePrioritySkill = (skill: string) => {
    setPrioritySkills((current) => (current.includes(skill)
      ? current.filter((item) => item !== skill)
      : [...current, skill].slice(0, 8)));
  };

  const getExecutorGoalId = () => {
    const learningGoal = goals.find((goal) => goal.category === 'Learning' && goal.status !== 'Archived');
    return learningGoal?.id ?? goals[0]?.id;
  };

  const executeRoadmap = async (scope: 'week' | 'all') => {
    if (!user || !roadmap) {
      return;
    }

    const goalId = getExecutorGoalId();
    if (!goalId) {
      toast({
        title: 'Goal required',
        description: 'Create at least one goal before executing roadmap tasks.',
        variant: 'destructive',
      });
      return;
    }

    const weeks = scope === 'week' ? roadmap.weeks.slice(0, 1) : roadmap.weeks;
    const taskPayloads = weeks.flatMap((week, weekIndex) =>
      week.dailyTasks.flatMap((dayTask, dayIndex) =>
        dayTask.activities.map((activity) => {
          const deadline = new Date(Date.now() + (weekIndex * 7 + dayIndex + 1) * 86400000).toISOString().slice(0, 10);
          return {
            userId: user.uid,
            goalId,
            title: `${dayTask.topic}: ${activity}`,
            estimatedTime: 60,
            deadline,
            tags: ['Roadmap', targetRole || 'Learning'],
          };
        }),
      ),
    );

    const cappedTasks = taskPayloads.slice(0, 80);
    setIsExecuting(true);
    try {
      await Promise.all(cappedTasks.map((payload) => taskService.create(firestore, payload)));
      toast({
        title: 'Roadmap executed',
        description: `${cappedTasks.length} task(s) added to your task board.${taskPayloads.length > cappedTasks.length ? ' (Execution capped at 80 tasks.)' : ''}`,
      });
    } catch (error) {
      toast({
        title: 'Execution failed',
        description: error instanceof Error ? error.message : 'Unable to convert roadmap into tasks.',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedRole = targetRole.trim();
    const safeTimeline = Number.isFinite(timeline) ? Math.max(1, Math.min(24, Math.round(timeline))) : 3;
    const safeWeeklyHours = Number.isFinite(weeklyHours) ? Math.max(1, Math.min(60, Math.round(weeklyHours))) : 8;

    if (!normalizedRole) {
      toast({
        title: 'Target role required',
        description: 'Please enter your target role to generate a roadmap.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await generateLearningRoadmap({
        targetRole: normalizedRole,
        timelineMonths: safeTimeline,
        experienceLevel,
        weeklyHours: safeWeeklyHours,
        preferredStyle,
        prioritySkills,
        constraints: constraints.trim() || undefined,
      });
      setRoadmap(result);
      setCompletedActivities({});
      setTargetRole(normalizedRole);
      setTimeline(safeTimeline);
      setWeeklyHours(safeWeeklyHours);
      setIsGeneratorOpen(false);
      toast({
        title: 'Roadmap generated',
        description: `Created a ${safeTimeline}-month plan for ${normalizedRole} (${safeWeeklyHours} hrs/week).`,
      });
    } catch (error) {
      toast({
        title: 'Roadmap generation failed',
        description: error instanceof Error ? error.message : 'Unable to generate roadmap right now. Try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-headline font-bold">AI Learning Roadmap</h1>
        <p className="text-muted-foreground text-lg">Generate a personalized curriculum to bridge your skill gaps.</p>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        <CardContent className="p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">API-free optimized engine is active.</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{Math.max(1, Math.min(24, Math.round(timeline))) * 4} Weeks</Badge>
              <span>Role: {targetRole.trim() || 'Not set'}</span>
              <span>• {weeklyHours} hrs/week</span>
              <span>• {experienceLevel}</span>
            </div>
          </div>

          <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-11 text-base">
                <Sparkles className="h-4 w-4" /> Open Roadmap Generator
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Generate Optimized Roadmap</DialogTitle>
                <DialogDescription>
                  Fill planner details for a more useful personalized roadmap output.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="role">Target Role</Label>
                  <Input
                    id="role"
                    placeholder="e.g., Staff AI Engineer"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="bg-background/50"
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ROLE_PRESETS.map((preset) => (
                      <Button key={preset} type="button" variant="outline" size="sm" onClick={() => setTargetRole(preset)} className="h-7">
                        {preset}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="timeline">Timeline (Months)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="timeline"
                        type="number"
                        min={1}
                        max={24}
                        value={timeline}
                        onChange={(e) => setTimeline(Number(e.target.value))}
                        className="bg-background/50"
                      />
                      <Badge variant="secondary">{Math.max(1, Math.min(24, Math.round(timeline || 1))) * 4} Weeks</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weekly-hours">Weekly Hours</Label>
                    <Input
                      id="weekly-hours"
                      type="number"
                      min={1}
                      max={60}
                      value={weeklyHours}
                      onChange={(e) => setWeeklyHours(Number(e.target.value))}
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Experience Level</Label>
                    <Select value={experienceLevel} onValueChange={(value) => setExperienceLevel(value as 'beginner' | 'intermediate' | 'advanced')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Style</Label>
                    <Select value={preferredStyle} onValueChange={(value) => setPreferredStyle(value as 'project' | 'theory' | 'mixed')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Project-first</SelectItem>
                        <SelectItem value="theory">Theory-first</SelectItem>
                        <SelectItem value="mixed">Balanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Priority Skills (optional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS.map((skill) => {
                      const selected = prioritySkills.includes(skill);
                      return (
                        <Button
                          key={skill}
                          type="button"
                          size="sm"
                          variant={selected ? 'default' : 'outline'}
                          className="h-7"
                          onClick={() => togglePrioritySkill(skill)}
                        >
                          {skill}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="constraints">Constraints / Notes (optional)</Label>
                  <Textarea
                    id="constraints"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    placeholder="Example: weekdays only, 2 hrs/day, focus on interview readiness"
                    className="min-h-[90px]"
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isLoading} className="w-full gap-2 h-11 text-base">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    {isLoading ? 'Generating...' : 'Generate Optimized Plan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div 
            key="roadmap-loading"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {[1, 2, 3].map((i) => (
              <Card key={`roadmap-skeleton-${i}`} className="border-none shadow-sm">
                <CardHeader>
                  <Skeleton className="h-6 w-1/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {roadmap && !isLoading && (
          <motion.div
            key="roadmap-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <Card className="border-none shadow-sm">
              <CardContent className="p-5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Roadmap progress</span>
                  <span>
                    {Object.values(completedActivities).filter(Boolean).length}
                    /
                    {roadmap.weeks.reduce((sum, week) => sum + week.dailyTasks.reduce((taskSum, task) => taskSum + task.activities.length, 0), 0)} completed
                  </span>
                </div>
                <Progress
                  value={
                    (Object.values(completedActivities).filter(Boolean).length /
                      Math.max(1, roadmap.weeks.reduce((sum, week) => sum + week.dailyTasks.reduce((taskSum, task) => taskSum + task.activities.length, 0), 0))) * 100
                  }
                />
              </CardContent>
            </Card>

            <div className="bg-primary text-primary-foreground p-8 rounded-2xl shadow-lg">
              <h2 className="text-3xl font-headline font-bold">{roadmap.roadmapTitle}</h2>
              <p className="mt-4 opacity-90 leading-relaxed text-lg">{roadmap.roadmapDescription}</p>
              <div className="flex gap-4 mt-6">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm">
                  <Calendar className="h-4 w-4" /> {timeline} Months
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm">
                  <MapIcon className="h-4 w-4" /> {roadmap.weeks.length} Stages
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isExecuting}
                  className="bg-white/15 text-white hover:bg-white/20"
                  onClick={() => executeRoadmap('week')}
                >
                  {isExecuting ? 'Executing...' : 'Roadmap Executor: Add Week 1 Tasks'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isExecuting}
                  className="bg-white/15 text-white hover:bg-white/20"
                  onClick={() => executeRoadmap('all')}
                >
                  {isExecuting ? 'Executing...' : 'One-click: Add Full Roadmap Tasks'}
                </Button>
              </div>
            </div>

            <div className="space-y-12 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-muted">
              {roadmap.weeks.map((week, idx) => (
                <div key={`week-${idx}-${week.weekNumber}`} className="relative pl-12 group">
                  <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-white border-2 border-primary flex items-center justify-center font-bold text-primary z-10 group-hover:scale-110 transition-transform">
                    {week.weekNumber}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-headline font-bold">Week {week.weekNumber}</h3>
                      <Badge variant="secondary">In Progress</Badge>
                    </div>
                    <p className="text-muted-foreground text-lg">{week.weekSummary}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {week.dailyTasks.map((task, tidx) => (
                        <Card key={`task-${week.weekNumber}-${tidx}-${task.day}-${task.topic}`} className="border-none shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-accent uppercase tracking-wider">{task.day}</span>
                              <Clock className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <h4 className="font-semibold text-lg mb-2">{task.topic}</h4>
                            <ul className="space-y-2">
                              {task.activities.map((act, aidx) => (
                                <li key={`act-${week.weekNumber}-${tidx}-${aidx}-${act.slice(0, 24)}`} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <Checkbox
                                    checked={Boolean(completedActivities[`${week.weekNumber}-${tidx}-${aidx}`])}
                                    onCheckedChange={(checked) => {
                                      setCompletedActivities((current) => ({
                                        ...current,
                                        [`${week.weekNumber}-${tidx}-${aidx}`]: Boolean(checked),
                                      }));
                                    }}
                                  />
                                  <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                  <Input defaultValue={act} className="h-8 text-xs" />
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {!roadmap && !isLoading && (
          <motion.div 
            key="roadmap-empty"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed border-muted rounded-2xl"
          >
            <div className="bg-muted p-4 rounded-full">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="max-w-xs">
              <p className="font-semibold text-xl">No Roadmap Yet</p>
              <p className="text-muted-foreground mt-1">Enter your target career goals above to generate an AI curriculum.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}