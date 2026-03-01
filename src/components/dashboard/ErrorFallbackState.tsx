"use client";

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorFallbackStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorFallbackState({
  title = 'Sync issue detected',
  message,
  actionLabel = 'Retry',
  onAction,
}: ErrorFallbackStateProps) {
  return (
    <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-destructive">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
          {onAction && (
            <Button variant="outline" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
