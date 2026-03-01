"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Command, Cpu, HeartPulse, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
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
  const [ambientOn, setAmbientOn] = useState(false);
  const [activityLevel, setActivityLevel] = useState(42);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLastUpdatedAt(new Date());
      setActivityLevel((current) => {
        const delta = (Math.random() - 0.5) * 14;
        return Math.max(20, Math.min(96, Math.round(current + delta)));
      });
    }, 15000);
    return () => window.clearInterval(timer);
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

  const relative = useMemo(() => {
    const diffMin = Math.max(0, Math.floor((Date.now() - lastUpdatedAt.getTime()) / 60000));
    if (diffMin <= 0) return 'just now';
    return `${diffMin}m ago`;
  }, [lastUpdatedAt]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/70 backdrop-blur-2xl shadow-[0_14px_36px_rgba(6,10,24,0.52)]">
      <div className="h-14 px-4 md:px-6 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2 text-xs md:text-sm">
          <Badge className="border-cyan-300/30 bg-primary/20 text-cyan-100">🧠 OpenMind OS</Badge>
          <span className="hidden lg:inline text-muted-foreground">|</span>
          <span className="hidden lg:inline text-cyan-200 inline-flex items-center gap-1.5">
            AI Core: ACTIVE
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" />
          </span>
          <span className="hidden lg:inline text-muted-foreground">|</span>
          <span className="hidden md:inline text-muted-foreground">Focus Mode: Medium</span>
          <span className="hidden xl:inline text-muted-foreground">| Syncing...</span>
          <span className="hidden xl:inline text-muted-foreground">| Last Updated {relative}</span>
          <span className="hidden 2xl:inline text-primary/90">• {toModuleName(pathname)}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-end gap-[2px] h-4 px-2 rounded-full border border-cyan-300/20 bg-cyan-500/10">
            {[0, 1, 2, 3, 4, 5, 6].map((bar) => {
              const base = 24 + (activityLevel / 10) * (0.45 + bar * 0.08);
              const height = Math.max(3, Math.min(14, Math.round(base % 14)));
              return <span key={bar} className="w-[2px] rounded-full bg-cyan-300/90 animate-waveform" style={{ height, animationDelay: `${bar * 90}ms` }} />;
            })}
          </div>

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
            variant="ghost"
            size="sm"
            aria-label="Toggle AI Ambient Mode"
            onClick={() => { void toggleAmbientMode(); }}
            className="hidden md:inline-flex text-cyan-100/90 hover:text-cyan-100 hover:bg-cyan-500/10"
          >
            {ambientOn ? <Volume2 className="h-3.5 w-3.5 mr-1" /> : <VolumeX className="h-3.5 w-3.5 mr-1" />}
            Ambient
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
