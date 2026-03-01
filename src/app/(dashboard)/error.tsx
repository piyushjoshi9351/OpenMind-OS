"use client"

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto mt-20 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4">
      <h2 className="text-2xl font-headline font-semibold text-destructive">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">{error.message || 'Unexpected dashboard failure.'}</p>
      <Button onClick={reset}>Retry</Button>
    </div>
  );
}
