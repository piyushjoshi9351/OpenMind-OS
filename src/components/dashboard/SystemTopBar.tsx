"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Command, HeartPulse, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

const toModuleContext = (pathname: string): { category: 'Execution' | 'Intelligence' | 'Knowledge' | 'Analytics' | 'System' } => {
  if (pathname === '/dashboard' || pathname === '/tasks' || pathname === '/goals' || pathname === '/roadmap') return { category: 'Execution' };
  if (pathname === '/insights') return { category: 'Intelligence' };
  if (pathname === '/analytics') return { category: 'Analytics' };
  if (pathname === '/graph') return { category: 'Knowledge' };
  return { category: 'System' };
};

type SyncStatus = 'synced' | 'syncing' | 'disconnected';

export function SystemTopBar() {
  const pathname = usePathname();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [ambientOn, setAmbientOn] = useState(false);
  const [activityLevel, setActivityLevel] = useState(42);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!window.navigator.onLine) {
        setSyncStatus('disconnected');
        return;
      }
      setSyncStatus('syncing');
      setActivityLevel((current) => {
        const delta = (Math.random() - 0.5) * 14;
        return Math.max(20, Math.min(96, Math.round(current + delta)));
      });
      window.setTimeout(() => setSyncStatus(window.navigator.onLine ? 'synced' : 'disconnected'), 900);
    }, 15000);

    const onOnline = () => setSyncStatus('synced');
    const onOffline = () => setSyncStatus('disconnected');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    return () => {
      oscillatorRef.current?.stop();
      oscillatorRef.current?.disconnect();
      gainRef.current?.disconnect();
      void audioContextRef.current?.close();
      oscillatorRef.current = null;
      gainRef.current = null;
      audioContextRef.current = null;
    };
  }, []);

  const toggleAmbientMode = async () => {
    const next = !ambientOn;
    setAmbientOn(next);

    if (!next) {
      gainRef.current?.gain.setTargetAtTime(0.0001, audioContextRef.current?.currentTime ?? 0, 0.06);
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) {
        return;
      }

      const context = new Ctx();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 78;
      gainNode.gain.value = 0.0001;

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start();

      audioContextRef.current = context;
      oscillatorRef.current = oscillator;
      gainRef.current = gainNode;
    }

    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    gainRef.current?.gain.setTargetAtTime(0.012, audioContextRef.current?.currentTime ?? 0, 0.12);
  };

  const context = useMemo(() => toModuleContext(pathname), [pathname]);
  const moduleBadgeClass = useMemo(() => {
    if (context.category === 'Execution') {
      return 'border-cyan-300/25 bg-cyan-500/8 text-cyan-200/85';
    }
    if (context.category === 'Intelligence') {
      return 'border-violet-300/25 bg-violet-500/10 text-violet-200/85';
    }
    if (context.category === 'Knowledge') {
      return 'border-indigo-300/25 bg-indigo-500/10 text-indigo-200/85';
    }
    if (context.category === 'Analytics') {
      return 'border-emerald-300/25 bg-emerald-500/10 text-emerald-200/85';
    }
    return 'border-slate-300/20 bg-slate-500/10 text-slate-200/85';
  }, [context.category]);

  const syncBadge = useMemo(() => {
    if (syncStatus === 'disconnected') {
      return { label: 'Disconnected', className: 'border-rose-300/20 bg-rose-500/8 text-rose-200/85', dotClassName: 'bg-rose-300/80' };
    }
    if (syncStatus === 'syncing') {
      return { label: 'Syncing', className: 'border-amber-300/20 bg-amber-500/8 text-amber-200/85', dotClassName: 'bg-amber-300/80 animate-pulse' };
    }
    return { label: 'Synced', className: 'border-emerald-300/20 bg-emerald-500/8 text-emerald-200/80', dotClassName: 'bg-emerald-300/75' };
  }, [syncStatus]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/65 backdrop-blur-2xl shadow-[0_12px_28px_rgba(5,8,20,0.45)]">
      <div className="relative h-12 px-5 md:px-8 flex items-center justify-between gap-6">
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent" />

        <div className="min-w-0 flex items-center gap-6 text-[12px] md:text-[13px]">
          <Badge className="border-cyan-300/30 bg-primary/20 text-cyan-100">🧠 OpenMind OS</Badge>
          <span className="text-cyan-200/95 inline-flex items-center gap-2">
            AI Core: ACTIVE
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300/80 animate-pulse" />
          </span>
        </div>

        <div className="hidden lg:flex flex-1 justify-center items-center gap-4 text-[11px] text-muted-foreground/75">
          <Badge className={`px-2 py-0.5 text-[10px] ${moduleBadgeClass}`}>
            <span className="mr-1 inline-flex h-1.5 w-1.5 rounded-full bg-current/70" />
            {context.category}
          </Badge>
          <Badge className={`px-1.5 py-0 text-[10px] ${syncBadge.className}`}>
            <span className={`mr-1.5 inline-flex h-1.5 w-1.5 rounded-full ${syncBadge.dotClassName}`} />
            {syncBadge.label}
          </Badge>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden md:flex items-end gap-[2px] h-4 px-2 rounded-full border border-cyan-300/20 bg-cyan-500/10">
            {[0, 1, 2, 3, 4, 5, 6].map((bar) => {
              const base = 24 + (activityLevel / 10) * (0.45 + bar * 0.08);
              const height = Math.max(3, Math.min(14, Math.round(base % 14)));
              return <span key={bar} className="w-[2px] rounded-full bg-cyan-300/90 animate-waveform" style={{ height, animationDelay: `${bar * 90}ms` }} />;
            })}
          </div>

          <div className="hidden sm:flex items-center gap-1 rounded-full border border-emerald-300/25 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Stable
          </div>

          <div className="hidden sm:flex items-center gap-1 rounded-full border border-cyan-300/25 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-200">
            <HeartPulse className="h-3.5 w-3.5" />
            <span className="inline-flex h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
          </div>

          <Button
            variant="ghost"
            size="sm"
            aria-label="Toggle AI Ambient Mode"
            onClick={() => { void toggleAmbientMode(); }}
            className="hidden md:inline-flex h-8 text-cyan-100/90 hover:text-cyan-100 hover:bg-cyan-500/10 border border-cyan-300/20 rounded-full px-3"
          >
            {ambientOn ? <Volume2 className="h-3.5 w-3.5 mr-1" /> : <VolumeX className="h-3.5 w-3.5 mr-1" />}
            Ambient
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.dispatchEvent(new Event('om:command-palette-open'))}
            className="h-8 border-cyan-300/30 bg-black/20 hover:bg-black/30 text-cyan-100 rounded-full px-3"
          >
            <Command className="h-3.5 w-3.5 mr-1" />
            <span className="hidden md:inline">AI Center</span>
            <span className="ml-1 text-[10px] text-muted-foreground hidden lg:inline">⌘/Ctrl+K</span>
          </Button>

          <Button variant="ghost" size="icon" aria-label="Notifications" className="h-8 w-8 text-muted-foreground hover:text-foreground border border-white/10 rounded-full">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
