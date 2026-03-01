"use client";

import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Sparkles } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { goalService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { uxCopy } from '@/lib/ux-copy';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const focusOptions = ['AI Systems', 'Productivity', 'Deep Work', 'Learning Velocity'] as const;

type FocusOption = (typeof focusOptions)[number];

export function OnboardingFlow() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  const [goalTitle, setGoalTitle] = useState('');
  const [availableHours, setAvailableHours] = useState(10);
  const [learningFocus, setLearningFocus] = useState<FocusOption>('AI Systems');

  useEffect(() => {
    if (!user) {
      setOpen(false);
      setChecking(false);
      return;
    }

    let isMounted = true;
    setChecking(true);

    void getDoc(doc(firestore, 'users', user.uid))
      .then((snapshot) => {
        if (!isMounted) {
          return;
        }
        const data = snapshot.data() as { onboardingCompleted?: boolean } | undefined;
        setOpen(!Boolean(data?.onboardingCompleted));
      })
      .catch(() => {
        if (isMounted) {
          setOpen(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setChecking(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [firestore, user]);

  const canContinue = useMemo(() => {
    if (step === 1) {
      return goalTitle.trim().length >= 3;
    }
    if (step === 2) {
      return availableHours >= 1 && availableHours <= 80;
    }
    return learningFocus.length > 0;
  }, [availableHours, goalTitle, learningFocus, step]);

  const persistSetup = async () => {
    if (!user) {
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(firestore, 'users', user.uid), {
        id: user.uid,
        email: user.email ?? '',
        displayName: user.displayName ?? 'OpenMind User',
        onboardingCompleted: true,
        onboarding: {
          completedAt: new Date().toISOString(),
          firstGoalTitle: goalTitle,
          learningFocus,
        },
        settings: {
          darkMode: true,
          weeklyGoalHours: availableHours,
          notificationsEnabled: true,
        },
        cognitiveProfile: {
          learningStyle: 'hybrid',
          preferredFocusWindow: 'morning',
          strengths: [learningFocus],
          weakSignals: [],
        },
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      await goalService.create(firestore, {
        userId: user.uid,
        title: goalTitle,
        description: `Kickoff goal generated from onboarding with ${availableHours}h/week capacity and focus on ${learningFocus}.`,
        category: 'Learning',
        deadline: dueDate,
        priority: 'High',
      });

      toast({ title: uxCopy.success.created('Onboarding setup'), description: 'Your first goal and learning profile are ready.' });
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Setup failed',
        description: error instanceof Error ? error.message : uxCopy.error.retry,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (checking || !user) {
    return null;
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-xl glass-panel border-cyan-300/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline text-xl">
            <Sparkles className="h-5 w-5 text-primary" /> First-time Setup (3 Steps)
          </DialogTitle>
          <DialogDescription>
            Configure your initial goal, available weekly hours, and learning focus to personalize OpenMind OS.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-muted-foreground">
          Step {step} of 3
        </div>

        {step === 1 && (
          <div className="space-y-2">
            <Label htmlFor="onboarding-goal">Step 1: What is your first goal?</Label>
            <Input
              id="onboarding-goal"
              value={goalTitle}
              onChange={(event) => setGoalTitle(event.target.value)}
              placeholder="Example: Build a production-ready AI portfolio"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2">
            <Label htmlFor="onboarding-hours">Step 2: Available hours per week</Label>
            <Input
              id="onboarding-hours"
              type="number"
              min={1}
              max={80}
              value={availableHours}
              onChange={(event) => setAvailableHours(Number(event.target.value) || 1)}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2">
            <Label>Step 3: Select your primary learning focus</Label>
            <div className="grid grid-cols-2 gap-2">
              {focusOptions.map((focus) => (
                <button
                  key={focus}
                  type="button"
                  onClick={() => setLearningFocus(focus)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${learningFocus === focus ? 'border-primary bg-primary/15 text-primary' : 'border-border hover:bg-muted/40'}`}
                >
                  {focus}
                </button>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1 || saving}>
            Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep((current) => Math.min(3, current + 1))} disabled={!canContinue || saving}>
              Continue
            </Button>
          ) : (
            <Button onClick={persistSetup} disabled={!canContinue || saving}>
              {saving ? uxCopy.loading.processing : 'Finish Setup'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
