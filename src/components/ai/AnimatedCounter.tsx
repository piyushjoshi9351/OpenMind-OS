"use client";

import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
}

export function AnimatedCounter({ value, suffix = '' }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const valueRef = useRef(0);

  useEffect(() => {
    const controls = animate(valueRef.current, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (latestValue) => {
        const roundedValue = Math.round(latestValue);
        valueRef.current = roundedValue;
        setDisplayValue(roundedValue);
      },
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue}{suffix}</span>;
}
