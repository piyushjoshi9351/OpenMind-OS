"use client";

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface GuidedEmptyStateProps {
  title: string;
  description: string;
  primaryLabel: string;
  onPrimaryAction: () => void;
  icon?: ReactNode;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}

export function GuidedEmptyState({
  title,
  description,
  primaryLabel,
  onPrimaryAction,
  icon,
  secondaryLabel,
  onSecondaryAction,
}: GuidedEmptyStateProps) {
  return (
    <div className="w-full rounded-2xl border border-dashed border-border/70 bg-card/60 px-6 py-10 text-center">
      {icon && <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex justify-center gap-2">
        {secondaryLabel && onSecondaryAction && (
          <Button variant="outline" onClick={onSecondaryAction}>{secondaryLabel}</Button>
        )}
        <Button onClick={onPrimaryAction}>{primaryLabel}</Button>
      </div>
    </div>
  );
}
