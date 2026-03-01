"use client";

import { motion } from 'framer-motion';

interface AIPresencePanelProps {
  activityLevel: number;
}

export function AIPresencePanel({ activityLevel }: AIPresencePanelProps) {
  return (
    <div className="glass-panel rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-primary/90">
        <span>AI Presence</span>
        <span className="flex items-center gap-2">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.2, 0.9] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="h-2 w-2 rounded-full bg-cyan-300"
          />
          Live
        </span>
      </div>
      <div className="text-sm text-muted-foreground">
        Cognitive stream monitored continuously. Neural adaptation synced with user behavior patterns.
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="processing-dots text-primary">AI Processing</span>
        <span className="font-semibold text-accent">{activityLevel}% intensity</span>
      </div>
      <div className="flex items-end gap-1 h-5">
        {[0, 1, 2, 3, 4, 5].map((bar) => (
          <motion.span
            key={bar}
            className="w-1 rounded-full bg-cyan-300/80"
            animate={{ height: [4, 14, 6, 12, 5] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: bar * 0.08 }}
          />
        ))}
      </div>
    </div>
  );
}
