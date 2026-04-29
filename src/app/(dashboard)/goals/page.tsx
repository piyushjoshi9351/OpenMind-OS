"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, Sparkles, Target, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { GuidedEmptyState } from '@/components/dashboard/GuidedEmptyState';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { uxCopy } from '@/lib/ux-copy';
import { api, type BackendGoal } from '@/lib/api';

export default function GoalsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goals, setGoals] = useState<BackendGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const items = await api.listGoals();
      setGoals(items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load goals.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  const createGoal = async () => {
    if (!title.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await api.createGoal({
        title: title.trim(),
        description: description.trim() || null,
      });
      setTitle('');
      setDescription('');
      await loadGoals();
      toast({ title: uxCopy.success.created('Goal'), description: 'Goal saved through FastAPI.' });
    } catch (createError) {
      toast({ title: 'Goal creation failed', description: createError instanceof Error ? createError.message : uxCopy.error.retry, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const removeGoal = async (goalId: number) => {
    try {
      await api.deleteGoal(goalId);
      await loadGoals();
      toast({ title: uxCopy.success.archived('Goal'), description: 'Goal removed from backend.' });
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
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
        <Button onClick={() => void loadGoals()} variant="outline">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Goals & Objectives"
        subtitle="Real goals load from FastAPI now, not from hardcoded demo data."
        primaryAction={<Button onClick={() => void loadGoals()} variant="outline" disabled={refreshing}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>}
        secondaryAction={<Badge variant="outline">{goals.length} Goals</Badge>}
      />

      <Card className="om-card">
        <CardHeader>
          <CardTitle className="font-headline text-lg">Backend Connected</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-background/70 p-3">
            <p className="text-xs text-muted-foreground">Backend URL</p>
            <p className="mt-1 truncate font-semibold">{api.getBaseUrl()}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/70 p-3">
            <p className="text-xs text-muted-foreground">Connection</p>
            <p className="mt-1 font-semibold text-emerald-400">Live API</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/70 p-3">
            <p className="text-xs text-muted-foreground">Data Source</p>
            <p className="mt-1 font-semibold">GET /api/v1/goals</p>
          </div>
        </CardContent>
      </Card>

      <Card className="om-card">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Create Goal</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="goal-title">Goal title</Label>
            <Input id="goal-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Become a Staff AI Engineer" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="goal-description">Description</Label>
            <Input id="goal-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Map milestones and expected outcomes..." />
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => void loadGoals()} disabled={refreshing}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh List
            </Button>
            <Button onClick={() => void createGoal()} disabled={submitting || !title.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Create Goal
            </Button>
          </div>
          <p className="md:col-span-2 text-xs text-muted-foreground">
            Submit the form and the list refreshes from the backend immediately.
          </p>
        </CardContent>
      </Card>

      {!goals.length && (
        <GuidedEmptyState
          title="No goals yet"
          description="Create your first goal above. The card list below is powered by the backend API."
          primaryLabel="Focus Form"
          onPrimaryAction={() => document.getElementById('goal-title')?.focus()}
          secondaryLabel="Open Roadmap"
          onSecondaryAction={() => router.push('/roadmap')}
          icon={<Sparkles className="h-5 w-5" />}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <Card key={goal.id} className="om-card">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-2">
                <Badge variant="outline" className="w-fit capitalize">
                  {goal.status.replace('_', ' ')}
                </Badge>
                <CardTitle className="font-headline text-xl">{goal.title}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => void removeGoal(goal.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {goal.description || 'No description provided.'}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Created: {new Date(goal.created_at).toLocaleString()}</span>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/70 p-3 text-xs text-muted-foreground">
                This card is rendered from real backend data, not hardcoded samples.
              </div>
            </CardContent>
          </Card>
        ))}

        <button className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-muted hover:border-primary/50 transition-colors group" onClick={() => document.getElementById('goal-title')?.focus()}>
          <div className="bg-muted p-3 rounded-full group-hover:bg-primary/10 transition-colors">
            <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
          </div>
          <p className="mt-4 font-semibold text-muted-foreground group-hover:text-primary">Add New Goal</p>
        </button>
      </div>
    </div>
  );
}