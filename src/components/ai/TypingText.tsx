"use client";

import { useEffect, useState } from 'react';

interface TypingTextProps {
  text: string;
  speed?: number;
  className?: string;
}

export function TypingText({ text, speed = 18, className }: TypingTextProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue('');
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setValue(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, speed);
    return () => window.clearInterval(timer);
  }, [speed, text]);

  return <p className={className}>{value}</p>;
}
