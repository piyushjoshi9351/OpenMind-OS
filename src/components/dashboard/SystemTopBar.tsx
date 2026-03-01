"use client";

import { useEffect, useMemo, useState } from 'react';
import { Bell, Command, Cpu, HeartPulse, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

const toModuleName = (pathname: string) => {
  if (pathname === '/dashboard') return 'Dashboard Module';
  if (pathname === '/insights') return 'Intelligence Module';
  if (pathname === '/tasks') return 'Execution Module';
  if (pathname === '/graph') return 'Knowledge Graph Module';
  if (pathname === '/analytics') return 'Analytics Module';
  if (pathname === '/roadmap') return 'Roadmap Module';
  return 'AI Workspace Module';
};

export function SystemTopBar() {
  const pathname = usePathname();
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLastUpdatedAt(new Date());
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const relative = useMemo(() => {
    const diffMin = Math.max(0, Math.floor((Date.now() - lastUpdatedAt.getTime()) / 60000));
    if (diffMin <= 0) return 'just now';
    return `${diffMin}m ago`;
  }, [lastUpdatedAt]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="h-14 px-4 md:px-6 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2 text-xs md:text-sm">
          <Badge className="border-cyan-300/30 bg-primary/20 text-cyan-100">🧠 OpenMind OS</Badge>
          <span className="hidden lg:inline text-muted-foreground">|</span>
          <span className="hidden lg:inline text-cyan-200">AI Core: ACTIVE</span>
          <span className="hidden lg:inline text-muted-foreground">|</span>
          <span className="hidden md:inline text-muted-foreground">Focus Mode: Medium</span>
          <span className="hidden xl:inline text-muted-foreground">| Syncing...</span>
          <span className="hidden xl:inline text-muted-foreground">| Last Updated {relative}</span>
          <span className="hidden 2xl:inline text-primary/90">• {toModuleName(pathname)}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 rounded-full border border-emerald-300/25 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            System Health: Stable
          </div>

          <div className="hidden sm:flex items-center gap-1 rounded-full border border-cyan-300/25 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-200">
            <HeartPulse className="h-3.5 w-3.5" />
            <span className="inline-flex h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
            Live Pulse
          </div>

          <Button variant="ghost" size="icon" aria-label="Notifications" className="text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.dispatchEvent(new Event('om:command-palette-open'))}
            className="border-cyan-300/30 bg-black/20 hover:bg-black/30 text-cyan-100"
          >
            <Command className="h-3.5 w-3.5 mr-1" />
            <span className="hidden md:inline">Command</span>
            <span className="ml-1 text-[10px] text-muted-foreground">⌘/Ctrl+K</span>
          </Button>

          <Cpu className="hidden lg:block h-4 w-4 text-primary" />
        </div>
      </div>
    </header>
  );
}
