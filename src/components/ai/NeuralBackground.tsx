"use client";

import { useEffect, useRef } from 'react';

interface NeuralBackgroundProps {
  intensity?: number;
}

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export function NeuralBackground({ intensity = 1 }: NeuralBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    const density = window.innerWidth > 1280 ? 74 : 52;

    const dots: Dot[] = Array.from({ length: density }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 1.8 + 0.6,
    }));

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent?.clientWidth ?? window.innerWidth;
      height = parent?.clientHeight ?? window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const render = () => {
      context.clearRect(0, 0, width, height);

      const gridShiftX = (mouseRef.current.x - width / 2) * 0.004;
      const gridShiftY = (mouseRef.current.y - height / 2) * 0.004;
      context.save();
      context.translate(gridShiftX, gridShiftY);
      context.strokeStyle = 'rgba(73,140,255,0.07)';
      context.lineWidth = 0.45;
      for (let gridX = 0; gridX <= width; gridX += 44) {
        context.beginPath();
        context.moveTo(gridX, 0);
        context.lineTo(gridX, height);
        context.stroke();
      }
      for (let gridY = 0; gridY <= height; gridY += 44) {
        context.beginPath();
        context.moveTo(0, gridY);
        context.lineTo(width, gridY);
        context.stroke();
      }
      context.restore();

      context.strokeStyle = 'rgba(72,145,255,0.12)';
      context.lineWidth = 0.6;

      for (let index = 0; index < dots.length; index += 1) {
        const dot = dots[index];
        dot.x += dot.vx * intensity;
        dot.y += dot.vy * intensity;

        if (dot.x < 0 || dot.x > width) {
          dot.vx *= -1;
        }
        if (dot.y < 0 || dot.y > height) {
          dot.vy *= -1;
        }

        for (let pair = index + 1; pair < dots.length; pair += 1) {
          const nextDot = dots[pair];
          const dx = dot.x - nextDot.x;
          const dy = dot.y - nextDot.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 120) {
            context.globalAlpha = (1 - distance / 120) * 0.7;
            context.beginPath();
            context.moveTo(dot.x + gridShiftX * 0.5, dot.y + gridShiftY * 0.5);
            context.lineTo(nextDot.x + gridShiftX * 0.5, nextDot.y + gridShiftY * 0.5);
            context.stroke();
          }
        }

        context.globalAlpha = 1;
        context.beginPath();
        context.fillStyle = 'rgba(99,180,255,0.9)';
        context.shadowColor = 'rgba(80,150,255,0.8)';
        context.shadowBlur = 12;
        context.arc(dot.x + gridShiftX, dot.y + gridShiftY, dot.radius, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 0.4;
      context.fillStyle = 'rgba(109, 198, 255, 0.18)';
      for (let stream = 0; stream < 8; stream += 1) {
        const phase = (Date.now() / 40 + stream * 37) % (width + 180);
        const streamY = ((stream + 1) * height) / 9;
        context.fillRect(phase - 180, streamY, 120, 1.2);
      }
      context.globalAlpha = 1;

      animationFrame = window.requestAnimationFrame(render);
    };

    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = event.clientX - rect.left;
      mouseRef.current.y = event.clientY - rect.top;
    };

    resize();
    render();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [intensity]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" aria-hidden="true" />;
}
