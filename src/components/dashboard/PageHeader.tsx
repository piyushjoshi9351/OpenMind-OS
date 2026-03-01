"use client";

import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
}

export function PageHeader({ title, subtitle, primaryAction, secondaryAction }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-headline font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center gap-2">
          {secondaryAction}
          {primaryAction}
        </div>
      )}
    </div>
  );
}
