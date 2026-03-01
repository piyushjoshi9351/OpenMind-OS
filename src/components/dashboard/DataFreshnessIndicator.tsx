"use client";

import { Clock3 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/time';

interface DataFreshnessIndicatorProps {
  updatedAt?: string;
  className?: string;
}

export function DataFreshnessIndicator({ updatedAt, className }: DataFreshnessIndicatorProps) {
  return (
    <div className={`inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/60 px-2.5 py-1 text-xs text-muted-foreground ${className ?? ''}`}>
      <Clock3 className="h-3.5 w-3.5" />
      <span>{updatedAt ? formatRelativeTime(updatedAt) : 'Updated recently'}</span>
    </div>
  );
}
