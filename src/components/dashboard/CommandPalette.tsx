"use client";

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Command, Search, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CommandEntry {
  title: string;
  description: string;
  action: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('om:command-palette-open', onOpen);
    return () => window.removeEventListener('om:command-palette-open', onOpen);
  }, []);

  const entries = useMemo<CommandEntry[]>(() => [
    { title: 'Go to Dashboard', description: 'Open AI core workspace', action: () => router.push('/dashboard') },
    { title: 'Open Intelligence', description: 'View cognitive insights', action: () => router.push('/insights') },
    { title: 'Open Tasks', description: 'Jump to execution board', action: () => router.push('/tasks') },
    { title: 'Open Goals', description: 'Manage strategic objectives', action: () => router.push('/goals') },
    { title: 'Open Roadmap', description: 'Generate and execute roadmap', action: () => router.push('/roadmap') },
    { title: 'Open Knowledge Graph', description: 'Research and connect nodes', action: () => router.push('/graph') },
    {
      title: 'Quick Add Task Focus',
      description: 'Move to tasks and focus quick input',
      action: () => {
        if (pathname !== '/tasks') {
          router.push('/tasks?quickAdd=1');
          return;
        }
        window.dispatchEvent(new Event('om:quick-add-focus'));
      },
    },
  ], [pathname, router]);

  const filtered = entries.filter((entry) => {
    const source = `${entry.title} ${entry.description}`.toLowerCase();
    return source.includes(query.toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl glass-panel border-cyan-300/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-cyan-100">
            <Command className="h-4 w-4" /> OpenMind Command Palette
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-10"
              placeholder="Search commands and modules..."
            />
          </div>

          <div className="max-h-[360px] overflow-auto space-y-2 pr-1">
            {filtered.map((entry) => (
              <Button
                key={entry.title}
                variant="ghost"
                className="w-full justify-between h-auto rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left hover:bg-primary/15"
                onClick={() => {
                  entry.action();
                  setOpen(false);
                  setQuery('');
                }}
              >
                <div>
                  <p className="text-sm font-medium">{entry.title}</p>
                  <p className="text-xs text-muted-foreground">{entry.description}</p>
                </div>
                <Sparkles className="h-4 w-4 text-cyan-300" />
              </Button>
            ))}
            {!filtered.length && <p className="text-xs text-muted-foreground px-1">No matching command found.</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
