"use client";

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';

interface RippleButtonProps extends React.ComponentProps<typeof Button> {
  rippleClassName?: string;
}

export function RippleButton({ className, children, rippleClassName, onClick, ...props }: RippleButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const rippleSequenceRef = useRef(0);

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    rippleSequenceRef.current += 1;
    const id = Date.now() * 1000 + rippleSequenceRef.current;
    setRipples((current) => [...current, { id, x, y }]);
    window.setTimeout(() => {
      setRipples((current) => current.filter((item) => item.id !== id));
    }, 500);
    onClick?.(event);
  };

  return (
    <Button onClick={handleClick} className={cn('relative overflow-hidden magnetic-btn', className)} {...props}>
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className={cn('pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/70 animate-ripple', rippleClassName)}
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
    </Button>
  );
}
