"use client"

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { GuidedEmptyState } from '@/components/dashboard/GuidedEmptyState';
import { Plus, Target, Calendar, MoreVertical, Trash2, Edit2, Archive } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useUser } from '@/firebase';
import { goalService } from '@/services';
import { useRealtimeGoals } from '@/lib/hooks';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { uxCopy } from '@/lib/ux-copy';
import type { GoalCategory, GoalPriority } from '@/types';

const categories: GoalCategory[] = ['Career', 'Health', 'Learning', 'Personal', 'Financial'];
const priorities: GoalPriority[] = ['Low', 'Medium', 'High'];

export default function GoalsPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { goals, loading, error } = useRealtimeGoals();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Career');
  const [priority, setPriority] = useState<GoalPriority>('Medium');
  const [submitting, setSubmitting] = useState(false);

  const activeGoals = useMemo(() => goals.filter((goal) => goal.status !== 'Archived'), [goals]);

  const createGoal = async () => {
    if (!user || !title || !deadline) {
      return;
    }
    setSubmitting(true);
    try {
      await goalService.create(firestore, {
        userId: user.uid,
        title,
        description,
        category,
        deadline,
        priority,
      });
      setTitle('');
      setDescription('');
      setDeadline('');
      toast({ title: uxCopy.success.created('Goal'), description: 'Your adaptive goal is now tracked.' });
    } catch (createError) {
      toast({ title: 'Goal creation failed', description: createError instanceof Error ? createError.message : uxCopy.error.retry, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const archiveGoal = async (goalId: string) => {
    if (!user) {
      return;
    }
    try {
      await goalService.archive(firestore, user.uid, goalId);
      toast({ title: uxCopy.success.archived('Goal'), description: 'Goal moved to archive successfully.' });
    } catch (archiveError) {
      toast({ title: 'Archive failed', description: archiveError instanceof Error ? archiveError.message : uxCopy.error.retry, variant: 'destructive' });
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!user) {
      return;
    }
    try {
      await goalService.remove(firestore, user.uid, goalId);
      toast({ title: 'Goal deleted', description: 'Goal removed permanently.' });
    } catch (deleteError) {
      toast({ title: 'Delete failed', description: deleteError instanceof Error ? deleteError.message : uxCopy.error.retry, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-36 w-full" />
        <p className="text-xs text-muted-foreground">{uxCopy.loading.syncing}</p>
      </div>
    );
  }

  if (error) {
    return <div className="max-w-7xl mx-auto text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Goals & Objectives"
        subtitle="Track your long-term vision and progress."
        primaryAction={<Button onClick={createGoal} disabled={submitting || !title || !deadline}><Plus className="h-4 w-4 mr-1" /> Create Goal</Button>}
        secondaryAction={<Badge variant="outline">{activeGoals.length} Active</Badge>}
      />

      <Card className="om-card">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Goal Creation Wizard</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 space-y-2">
            <Label htmlFor="goal-title">Goal title</Label>
            <Input id="goal-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Become a Staff AI Engineer" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-category">Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as GoalCategory)}>
              <SelectTrigger id="goal-category"><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-priority">Priority</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as GoalPriority)}>
              <SelectTrigger id="goal-priority"><SelectValue /></SelectTrigger>
              <SelectContent>{priorities.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-deadline">Deadline</Label>
            <Input id="goal-deadline" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
          </div>
          <div className="lg:col-span-4 space-y-2">
            <Label htmlFor="goal-description">Description</Label>
            <Input id="goal-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Map milestones and expected outcomes..." />
          </div>
          <Button variant="outline" onClick={createGoal} disabled={submitting || !title || !deadline} className="h-10 mt-auto">
            <Plus className="h-4 w-4 mr-1" /> Create Goal
          </Button>
        </CardContent>
      </Card>

      {!activeGoals.length && (
        <GuidedEmptyState
          title="No goals yet"
          description="Start with one high-impact goal. This unlocks task planning, risk prediction, and personalized insights."
          primaryLabel="Create First Goal"
          onPrimaryAction={createGoal}
          secondaryLabel="Open Roadmap"
          onSecondaryAction={() => router.push('/roadmap')}
          icon={<Target className="h-5 w-5" />}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeGoals.map((goal) => (
          <Card key={goal.id} className="om-card">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <Badge variant={goal.priority === 'High' ? 'destructive' : 'outline'} className="mb-2">
                  {goal.priority} Priority
                </Badge>
                <CardTitle className="font-headline text-xl">{goal.title}</CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2">
                    <Edit2 className="h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => archiveGoal(goal.id)}>
                    <Archive className="h-4 w-4" /> Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-destructive" onClick={() => deleteGoal(goal.id)}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {goal.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Overall Progress</span>
                  <span className="text-muted-foreground">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Completion probability: {goal.completionProbability}%</span>
                  <span>Skill gap: {goal.skillGapScore}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {goal.deadline}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>{goal.category}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <button className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-muted hover:border-primary/50 transition-colors group" onClick={createGoal}>
          <div className="bg-muted p-3 rounded-full group-hover:bg-primary/10 transition-colors">
            <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
          </div>
          <p className="mt-4 font-semibold text-muted-foreground group-hover:text-primary">Add New Goal</p>
        </button>
      </div>
    </div>
  );
}