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
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useProtectedRoute(['user', 'admin']);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const moduleAuraClass = pathname.startsWith('/insights')
    ? 'bg-[radial-gradient(circle_at_62%_14%,rgba(163,107,255,0.16),transparent_36%)]'
    : pathname.startsWith('/analytics')
      ? 'bg-[radial-gradient(circle_at_62%_14%,rgba(92,210,146,0.15),transparent_36%)]'
    : pathname.startsWith('/tasks') || pathname.startsWith('/goals') || pathname.startsWith('/roadmap') || pathname.startsWith('/dashboard')
      ? 'bg-[radial-gradient(circle_at_62%_14%,rgba(88,154,255,0.17),transparent_36%)]'
      : pathname.startsWith('/graph')
        ? 'bg-[radial-gradient(circle_at_62%_14%,rgba(86,216,236,0.15),transparent_36%)]'
        : 'bg-[radial-gradient(circle_at_62%_14%,rgba(106,214,154,0.14),transparent_36%)]';

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
      <div className="flex min-h-[calc(100vh-3rem)]">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 pb-24 md:p-8 md:pb-8 relative">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(16,25,52,0.35)_0%,rgba(9,13,30,0.6)_45%,rgba(20,12,44,0.45)_100%)]" />
          <div className="pointer-events-none absolute inset-0 animated-grid opacity-35" />
          <div className="pointer-events-none absolute inset-0 beam-sweep" />
          <div className="pointer-events-none absolute inset-0 noise-overlay opacity-40" />
          <div className="pointer-events-none absolute inset-0 grain-overlay" />
          <div className={`pointer-events-none absolute inset-0 ${moduleAuraClass}`} />
          <div className="pointer-events-none absolute -top-20 left-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute top-12 right-20 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 radial-core-light" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              className="relative z-10"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
              <footer className="mt-8 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-[11px] text-muted-foreground/85 flex flex-wrap items-center justify-between gap-2">
                <span>OpenMind OS v1.0</span>
                <span>AI Engine: Running</span>
                <span>Data Sync: Active</span>
              </footer>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}