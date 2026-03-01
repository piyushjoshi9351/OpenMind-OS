"use client";

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';

export function InteractiveCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const smoothX = useSpring(x, { stiffness: 180, damping: 22, mass: 0.3 });
  const smoothY = useSpring(y, { stiffness: 180, damping: 22, mass: 0.3 });

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      x.set(event.clientX - 12);
      y.set(event.clientY - 12);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [x, y]);

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed z-[70] hidden lg:block h-6 w-6 rounded-full border border-cyan-300/70 mix-blend-screen"
        style={{ x: smoothX, y: smoothY }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed z-[69] hidden lg:block h-16 w-16 rounded-full bg-cyan-400/10 blur-xl"
        style={{ x: smoothX, y: smoothY }}
      />
    </>
  );
}
