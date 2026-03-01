"use client";

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface TiltPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function TiltPanel({ children, className }: TiltPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-50, 50], [2, -2]), { stiffness: 140, damping: 18 });
  const rotateY = useSpring(useTransform(mouseX, [-50, 50], [-2, 2]), { stiffness: 140, damping: 18 });
  const translateX = useSpring(useTransform(mouseX, [-50, 50], [-2.5, 2.5]), { stiffness: 120, damping: 20 });
  const translateY = useSpring(useTransform(mouseY, [-50, 50], [-2.5, 2.5]), { stiffness: 120, damping: 20 });

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    mouseX.set(x / 6);
    mouseY.set(y / 6);
  };

  const onLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, x: translateX, y: translateY, transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
