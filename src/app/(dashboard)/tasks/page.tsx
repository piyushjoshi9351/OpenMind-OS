"use client"

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { GuidedEmptyState } from '@/components/dashboard/GuidedEmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorFallbackState } from '@/components/dashboard/ErrorFallbackState';
import { 
  Plus, 
  Search, 
  Clock, 
  Calendar, 
  Tag,
  ChevronRight,
  Sparkles,
  Flame,
  Bot,
  ArrowDownUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFirestore, useUser } from '@/firebase';
import { useRealtimeGoals, useRealtimeTasks } from '@/lib/hooks';
import { taskService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { uxCopy } from '@/lib/ux-copy';
import { trackFeatureEvent } from '@/lib/event-tracking';

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { tasks, loading, error: tasksError, toggleTask } = useRealtimeTasks();
  const { goals, error: goalsError } = useRealtimeGoals();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const quickAddInputRef = useRef<HTMLInputElement | null>(null);

  const now = Date.now();

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const isOverdue = !task.completed && new Date(task.deadline).getTime() < now;
        if (activeFilter === 'pending') {
          return !task.completed;
        }
        if (activeFilter === 'completed') {
          return task.completed;
        }
        if (activeFilter === 'overdue') {
          return isOverdue;
        }
        return true;
      })
      .filter((task) => task.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [activeFilter, now, searchTerm, tasks]);

  const performanceScore = useMemo(() => {
    if (!tasks.length) {
      return 0;
    }
    const completed = tasks.filter((task) => task.completed).length;
    const overdue = tasks.filter((task) => !task.completed && new Date(task.deadline).getTime() < now).length;
    return Math.max(0, Math.round((completed / tasks.length) * 100 - (overdue / tasks.length) * 30));
  }, [now, tasks]);

  const productivityHeat = useMemo(() => {
    if (performanceScore >= 75) {
      return { label: 'High', tone: 'text-cyan-200 border-cyan-300/30 bg-cyan-500/10' };
    }
    if (performanceScore >= 45) {
      return { label: 'Medium', tone: 'text-purple-200 border-purple-300/30 bg-purple-500/10' };
    }
    return { label: 'Low', tone: 'text-amber-200 border-amber-300/30 bg-amber-500/10' };
  }, [performanceScore]);

  const aiRecommendedTasks = useMemo(() => {
    return tasks
      .filter((task) => !task.completed)
      .map((task) => {
        const dueMs = new Date(task.deadline).getTime() - now;
        const dueDays = Math.ceil(dueMs / 86400000);
        const urgencyScore = dueDays <= 0 ? 45 : dueDays <= 2 ? 32 : dueDays <= 5 ? 20 : 8;
        const effortScore = Math.max(0, 16 - Math.round(task.estimatedTime / 30));
        const tagBoost = task.tags.includes('Learning') ? 10 : 6;
        return {
          ...task,
          aiScore: Math.max(1, Math.min(100, urgencyScore + effortScore + tagBoost)),
        };
      })
      .sort((leftTask, rightTask) => rightTask.aiScore - leftTask.aiScore)
      .slice(0, 3);
  }, [now, tasks]);

  const groupedTasks = useMemo(() => {
    const overdue: typeof filteredTasks = [];
    const today: typeof filteredTasks = [];
    const upcoming: typeof filteredTasks = [];

    filteredTasks.forEach((task) => {
      if (task.completed) {
        upcoming.push(task);
        return;
      }

      const dueDate = new Date(task.deadline);
      if (Number.isNaN(dueDate.getTime()) || dueDate.getTime() < now) {
        overdue.push(task);
        return;
      }

      const sameDay = new Date().toISOString().slice(0, 10) === task.deadline;
      if (sameDay) {
        today.push(task);
        return;
      }

      upcoming.push(task);
    });

    return [
      { key: 'Overdue Priority', items: overdue },
      { key: 'Today Focus', items: today },
      { key: 'Upcoming Queue', items: upcoming },
    ];
  }, [filteredTasks, now]);

  useEffect(() => {
    const shouldFocus = searchParams.get('quickAdd') === '1';
    if (shouldFocus) {
      quickAddInputRef.current?.focus();
    }
  }, [searchParams]);

  useEffect(() => {
    const focusQuickAdd = () => quickAddInputRef.current?.focus();
    window.addEventListener('om:quick-add-focus', focusQuickAdd);
    return () => window.removeEventListener('om:quick-add-focus', focusQuickAdd);
  }, []);

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'x') {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) {
        return;
      }
      const firstPending = filteredTasks.find((task) => !task.completed);
      if (!firstPending) {
        return;
      }
      event.preventDefault();
      void toggleTask(firstPending.id, true);
      toast({ title: 'Quick complete', description: `Marked "${firstPending.title}" as complete.` });
    };

    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [filteredTasks, toast, toggleTask]);

  const createQuickTask = async () => {
    if (!user || !newTaskTitle.trim()) {
      return;
    }

    const fallbackGoal = goals[0]?.id;
    if (!fallbackGoal) {
      toast({ title: 'Create first goal', description: 'Tasks are linked to goals. Start from Goals to continue.', variant: 'destructive' });
      return;
    }

    try {
      await taskService.create(firestore, {
        userId: user.uid,
        goalId: fallbackGoal,
        title: newTaskTitle,
        estimatedTime: 60,
        deadline: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        tags: ['General'],
      });
      setNewTaskTitle('');
      if (user) {
        void trackFeatureEvent({ userId: user.uid, eventName: 'task_quick_created', page: '/tasks' });
      }
      toast({ title: uxCopy.success.created('Task'), description: 'Quick task added to your active goal.' });
    } catch (error) {
      toast({ title: 'Task creation failed', description: error instanceof Error ? error.message : uxCopy.error.retry, variant: 'destructive' });
    }
  };

  const applyBulkComplete = async (completed: boolean) => {
    if (!user || !selectedTaskIds.length) {
      return;
    }
    try {
      await taskService.bulkUpdateCompleted(
        firestore,
        user.uid,
        selectedTaskIds
          .map((taskId) => {
            const task = tasks.find((item) => item.id === taskId);
            if (!task) {
              return null;
            }
            return { taskId, goalId: task.goalId, completed };
          })
          .filter((item): item is { taskId: string; goalId: string; completed: boolean } => Boolean(item)),
      );
      setSelectedTaskIds([]);
      if (user) {
        void trackFeatureEvent({ userId: user.uid, eventName: completed ? 'tasks_bulk_completed' : 'tasks_bulk_reopened', page: '/tasks' });
      }
      toast({ title: uxCopy.success.updated('Tasks'), description: `Selected tasks marked as ${completed ? 'complete' : 'pending'}.` });
    } catch (error) {
      toast({ title: 'Bulk update failed', description: error instanceof Error ? error.message : uxCopy.error.retry, variant: 'destructive' });
    }
  };

  const reorderTasks = async (sourceId: string, targetId: string) => {
    if (!user) {
      return;
    }
    const orderedIds = filteredTasks.map((task) => task.id);
    const sourceIndex = orderedIds.indexOf(sourceId);
    const targetIndex = orderedIds.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      return;
    }
    orderedIds.splice(sourceIndex, 1);
    orderedIds.splice(targetIndex, 0, sourceId);
    try {
      await taskService.reorder(
        firestore,
        user.uid,
        orderedIds
          .map((taskId) => {
            const task = tasks.find((item) => item.id === taskId);
            if (!task) {
              return null;
            }
            return { taskId, goalId: task.goalId };
          })
          .filter((item): item is { taskId: string; goalId: string } => Boolean(item)),
      );
    } catch (error) {
      toast({ title: 'Reorder failed', description: error instanceof Error ? error.message : uxCopy.error.retry, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-24 w-full" />
        <p className="text-xs text-muted-foreground">{uxCopy.loading.syncing}</p>
      </div>
    );
  }

  if (tasksError || goalsError) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <ErrorFallbackState message={tasksError ?? goalsError ?? 'Unable to load task streams.'} onAction={() => router.refresh()} />
      </div>
    );
  }

  const hasNoGoals = goals.length === 0;
  const hasNoTasks = tasks.length === 0;

  if (hasNoGoals) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Daily Tasks"
          subtitle="Execute your roadmap one step at a time."
          primaryAction={<Button onClick={() => router.push('/goals')}>Create First Goal</Button>}
        />
        <GuidedEmptyState
          title="Create first goal to unlock tasks"
          description="Task execution is goal-linked. Once a goal exists, you can auto-generate or quickly add tasks here."
          primaryLabel="Go to Goals"
          onPrimaryAction={() => router.push('/goals')}
          secondaryLabel="Open Roadmap"
          onSecondaryAction={() => router.push('/roadmap')}
          icon={<Sparkles className="h-5 w-5" />}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Daily Tasks"
        subtitle="Execute your roadmap one step at a time."
        primaryAction={<Button className="gap-2 shadow-lg" onClick={createQuickTask}><Plus className="h-4 w-4" /> Add Task</Button>}
        secondaryAction={
          <Input
            ref={quickAddInputRef}
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void createQuickTask();
              }
            }}
            placeholder="Quick add task (Q to focus, Enter to add)"
            className="w-72"
          />
        }
      />

      <Card className="om-card">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">Performance score: <span className="font-semibold text-foreground">{performanceScore}</span></div>
          <Badge variant="outline" className={productivityHeat.tone}>Productivity Heat: {productivityHeat.label}</Badge>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => applyBulkComplete(true)}>Mark Selected Complete</Button>
            <Button variant="outline" size="sm" onClick={() => applyBulkComplete(false)}>Mark Selected Pending</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="om-card">
          <CardHeader>
            <CardTitle className="text-base font-headline flex items-center gap-2">
              <Bot className="h-4 w-4 text-cyan-300" /> AI Recommended Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {aiRecommendedTasks.length ? aiRecommendedTasks.map((task, index) => (
              <div key={`recommended-${task.id}-${task.goalId}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <Badge className="bg-primary/20 border border-primary/30 text-cyan-100">Score {task.aiScore}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Due {task.deadline} • {Math.max(1, Math.round(task.estimatedTime / 60))}h estimate</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">No pending tasks for recommendations yet.</p>}
          </CardContent>
        </Card>

        <Card className="om-card">
          <CardHeader>
            <CardTitle className="text-base font-headline flex items-center gap-2">
              <Flame className="h-4 w-4 text-purple-300" /> Productivity Heat Indicator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-muted-foreground">Realtime intensity</p>
              <div className="mt-2 h-2 rounded-full overflow-hidden bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(6, performanceScore)}%` }}
                  transition={{ duration: 0.45 }}
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Engine signal: {performanceScore >= 75 ? 'Peak execution rhythm detected.' : performanceScore >= 45 ? 'Stable rhythm with optimization headroom.' : 'Low rhythm. Prioritize AI recommended tasks first.'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <Card className="om-card">
            <CardHeader>
              <CardTitle className="text-lg font-headline">Quick Filter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {['all', 'pending', 'completed', 'overdue'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === filter ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="om-card">
            <CardHeader>
              <CardTitle className="text-lg font-headline">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {['AI', 'Coding', 'Research', 'Health', 'Deep Learning'].map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-muted-foreground/20">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks..." className="pl-10 h-11 bg-white/5 border-border shadow-sm" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
          </div>

          <div className="space-y-4">
            {groupedTasks.map((group) => (
              <div key={group.key} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{group.key}</p>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <ArrowDownUp className="h-3.5 w-3.5" /> Smart sorting active
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {group.items.map((task, index) => (
                    <motion.div
                      key={`task-card-${task.id}-${task.goalId}-${index}`}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className="om-card group hover:-translate-y-0.5 transition-transform"
                        draggable
                        onDragStart={() => setDraggedTaskId(task.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={async () => {
                          if (draggedTaskId) {
                            await reorderTasks(draggedTaskId, task.id);
                          }
                          setDraggedTaskId(null);
                        }}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <Checkbox aria-label={`Select task ${task.title}`} checked={selectedTaskIds.includes(task.id)} className="h-5 w-5 rounded-full" onCheckedChange={(checked) => {
                            setSelectedTaskIds((current) => checked
                              ? [...current, task.id]
                              : current.filter((taskId) => taskId !== task.id));
                          }} />
                          <Checkbox aria-label={`Mark ${task.title} as completed`} checked={task.completed} className="h-5 w-5 rounded-full" onCheckedChange={(checked) => toggleTask(task.id, Boolean(checked))} />
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-lg truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {task.deadline}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {Math.round(task.estimatedTime / 60)}h estimated
                              </div>
                              <div className="flex items-center gap-1">
                                <Tag className="h-3 w-3" /> {task.tags.join(', ')}
                              </div>
                              {!task.completed && new Date(task.deadline).getTime() < now && (
                                <Badge variant="destructive">Overdue</Badge>
                              )}
                            </div>
                          </div>
                          <Button aria-label={`Open details for ${task.title}`} variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ))}

            {!filteredTasks.length && hasNoTasks && (
              <GuidedEmptyState
                title="No tasks yet"
                description="Create your first task to activate planner, insights, and risk prediction flows."
                primaryLabel="Add First Task"
                onPrimaryAction={createQuickTask}
                secondaryLabel="Generate from Roadmap"
                onSecondaryAction={() => router.push('/roadmap')}
                icon={<Sparkles className="h-5 w-5" />}
              />
            )}

            {!filteredTasks.length && !hasNoTasks && (
              <GuidedEmptyState
                title="No tasks in this filter"
                description="Try a different filter or clear search to view more tasks."
                primaryLabel="Show All Tasks"
                onPrimaryAction={() => {
                  setActiveFilter('all');
                  setSearchTerm('');
                }}
                secondaryLabel="Create Task"
                onSecondaryAction={createQuickTask}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}