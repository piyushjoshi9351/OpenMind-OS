"use client";

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const LINES = [
  'Augment Your Intelligence.',
  'Rewire Your Focus.',
  'Engineer Your Future.',
];

export function TypingIntelligenceText() {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLineIndex((current) => (current + 1) % LINES.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  const activeLine = useMemo(() => LINES[lineIndex], [lineIndex]);

  return (
    <div className="h-[76px] md:h-[92px]">
      <AnimatePresence mode="wait">
        <motion.h1
          key={activeLine}
          initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(10px)' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-4xl sm:text-5xl lg:text-7xl font-headline font-bold tracking-tight text-cyan-50"
        >
          {activeLine}
        </motion.h1>
      </AnimatePresence>
    </div>
  );
}
