"use client"

import { Sidebar } from '@/components/dashboard/Sidebar';
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav';
import { KeyboardShortcuts } from '@/components/dashboard/KeyboardShortcuts';
import { OnboardingFlow } from '@/components/dashboard/OnboardingFlow';
import { SystemTopBar } from '@/components/dashboard/SystemTopBar';
import { CommandPalette } from '@/components/dashboard/CommandPalette';
import { Skeleton } from '@/components/ui/skeleton';
import { useProtectedRoute } from '@/lib/hooks';
import { InteractiveCursor } from '@/components/ai/InteractiveCursor';
import { useIsMobile } from '@/hooks/use-mobile';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useProtectedRoute(['user', 'admin']);
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <div className="hidden md:block w-64 border-r border-border p-4 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <main className="flex-1 p-8 space-y-6">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {!isMobile && <InteractiveCursor />}
      <KeyboardShortcuts />
      <OnboardingFlow />
      <CommandPalette />
      <SystemTopBar />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-8 relative">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(16,25,52,0.35)_0%,rgba(9,13,30,0.6)_45%,rgba(20,12,44,0.45)_100%)]" />
          <div className="pointer-events-none absolute inset-0 hud-grid opacity-30" />
          <div className="pointer-events-none absolute -top-20 left-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute top-12 right-20 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}