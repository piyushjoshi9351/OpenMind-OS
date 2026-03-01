"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Activity, ArrowRight, BrainCircuit, Cpu, Network, Orbit, Sparkles, Target, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { RippleButton } from '@/components/ai/RippleButton';
import { AICoreOrb3D } from '@/components/landing/AICoreOrb3D';
import { NeuralBackground3D } from '@/components/landing/NeuralBackground3D';
import { TypingIntelligenceText } from '@/components/landing/TypingIntelligenceText';

const FEATURE_CARDS = [
  {
    icon: Target,
    title: 'Goal Orchestration Engine',
    description: 'Adaptive milestone modeling with live probability updates and execution guidance.',
  },
  {
    icon: Network,
    title: 'Cognitive Knowledge Mesh',
    description: 'Graph-based memory mapping that connects concepts, goals, and active learning loops.',
  },
  {
    icon: BrainCircuit,
    title: 'Behavioral Intelligence Layer',
    description: 'Focus and burnout signal analysis tuned for sustained high-performance routines.',
  },
];

const LIVE_EVENTS = [
  'Node cluster updated',
  'Cognitive load optimized',
  'Focus window recalibrated',
  'Knowledge graph expanded',
  'Adaptive planner synchronized',
  'Inference stream stabilized',
];

const PIPELINE_STEPS = ['Input', 'Analyze', 'Optimize', 'Execute', 'Learn'];

export default function LandingPage() {
  const [booting, setBooting] = useState(true);
  const [cursor, setCursor] = useState({ x: -100, y: -100 });
  const [activeStep, setActiveStep] = useState(0);
  const { scrollYProgress, scrollY } = useScroll();

  const heroBackgroundY = useTransform(scrollY, [0, 900], [0, -140]);
  const orbY = useTransform(scrollY, [0, 900], [0, -80]);
  const heroTextY = useTransform(scrollY, [0, 900], [0, -120]);
  const heroTextOpacity = useTransform(scrollY, [0, 620], [1, 0.25]);

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      setCursor({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % PIPELINE_STEPS.length);
    }, 1200);
    return () => window.clearInterval(timer);
  }, []);

  const doubledEvents = useMemo(() => [...LIVE_EVENTS, ...LIVE_EVENTS], []);

  return (
    <div className="dark relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#1F1147] text-foreground landing-noise">
      {booting && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#05070f]/95 backdrop-blur-xl"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center space-y-4">
            <div className="mx-auto h-20 w-20 rounded-full border border-cyan-300/40 border-t-cyan-200 animate-spin" />
            <p className="text-xs tracking-[0.25em] uppercase text-cyan-100/85">OpenMind Boot Sequence</p>
            <p className="text-sm text-cyan-200/80 processing-dots">Initializing AI Layers</p>
          </div>
        </motion.div>
      )}

      <motion.div className="fixed top-0 left-0 right-0 z-[110] h-1 origin-left bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500" style={{ scaleX: scrollYProgress }} />

      <div className="pointer-events-none fixed inset-0 z-[100] hidden lg:block">
        <motion.div
          className="absolute h-3 w-3 rounded-full bg-cyan-300/80 shadow-[0_0_20px_rgba(95,193,255,0.75)]"
          animate={{ x: cursor.x - 6, y: cursor.y - 6 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        />
      </div>

      <NeuralBackground3D />

      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55 }}
        className="sticky top-0 z-50 border-b border-cyan-300/10 bg-black/25 backdrop-blur-2xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <motion.div
              className="rounded-xl border border-cyan-300/35 bg-primary/20 p-2 neon-glow"
              animate={{ boxShadow: ['0 0 18px rgba(90,165,255,0.25)', '0 0 32px rgba(127,108,255,0.34)', '0 0 18px rgba(90,165,255,0.25)'] }}
              transition={{ duration: 2.8, repeat: Infinity }}
            >
              <Image src="/openmind-logo.svg" alt="OpenMind OS" width={24} height={24} className="h-6 w-6" priority />
            </motion.div>
            <span className="font-headline text-xl md:text-2xl font-bold tracking-tight">OpenMind OS</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-cyan-100/85">
            <Link href="#features" className="hover:text-cyan-300 transition-colors">Features</Link>
            <Link href="#architecture" className="hover:text-cyan-300 transition-colors">Architecture</Link>
            <Link href="#demo" className="hover:text-cyan-300 transition-colors">Live Demo</Link>
            <Link href="/login" className="rounded-full border border-cyan-300/30 px-4 py-2 hover:bg-cyan-300/10 transition-colors">Login</Link>
            <Link href="/login" className="rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2 text-white hover:opacity-90 transition-opacity">Get Started</Link>
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10">
        <section className="relative min-h-[92vh] overflow-hidden px-4 pt-10 pb-16 md:px-8 md:pt-16">
          <motion.div style={{ y: heroBackgroundY }} className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,rgba(92,170,255,0.2),transparent_34%),radial-gradient(circle_at_84%_8%,rgba(163,105,255,0.2),transparent_32%)]" />
            <div className="absolute inset-0 landing-grid opacity-50" />
            <div className="absolute inset-0 beam-sweep" />
            <div className="absolute inset-0 star-field opacity-65" />
            <div className="absolute inset-0 grain-overlay" />
            <div className="absolute right-[12%] top-[16%] h-44 w-44 rounded-full lens-flare pointer-events-none" />
          </motion.div>

          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.55 }}
              className="mb-7 inline-flex flex-wrap items-center gap-3 rounded-xl border border-cyan-300/20 bg-black/25 px-4 py-2 text-[11px] tracking-[0.16em] uppercase text-cyan-100/85"
            >
              <span>AI CORE: ONLINE</span>
              <span className="h-1 w-1 rounded-full bg-cyan-300" />
              <span>NEURAL MESH: SYNCHRONIZED</span>
              <span className="h-1 w-1 rounded-full bg-cyan-300" />
              <span>MEMORY LAYER: INITIALIZED</span>
            </motion.div>

            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <motion.div style={{ y: heroTextY, opacity: heroTextOpacity }} className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-black/30 px-4 py-2 text-[11px] tracking-[0.14em] uppercase text-cyan-200">
                  <Zap className="h-3.5 w-3.5" /> Advanced AI Cognitive Platform
                </div>

                <div className="relative inline-block text-sweep">
                  <TypingIntelligenceText />
                </div>

                <p className="max-w-2xl text-base md:text-xl text-cyan-100/70 leading-relaxed">
                  OpenMind runs like a personal AI operating system—observing intent, optimizing execution, and scaling your learning velocity through neural intelligence loops.
                </p>

                <motion.div className="flex flex-col sm:flex-row gap-4 pt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                  <Link href="/dashboard">
                    <RippleButton className="h-13 rounded-full bg-gradient-to-r from-primary via-blue-500 to-accent px-7 text-base text-white">
                      Enter Neural Workspace <ArrowRight className="ml-2 h-4 w-4" />
                    </RippleButton>
                  </Link>
                  <RippleButton variant="outline" className="h-13 rounded-full border-cyan-300/30 bg-white/5 px-7 text-base text-cyan-100">
                    Launch Live Demo
                  </RippleButton>
                </motion.div>
              </motion.div>

              <motion.div style={{ y: orbY }} className="relative flex items-center justify-center ai-breathing-glow">
                <div className="pointer-events-none absolute h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(88,164,255,0.24),transparent_66%)] blur-3xl" />
                <div className="pointer-events-none absolute h-[420px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(130,190,255,0.14),transparent_64%)] blur-[82px]" />
                <AICoreOrb3D />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative z-10 border-y border-cyan-300/10 bg-black/25 py-3 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mb-2 text-[11px] tracking-[0.16em] uppercase text-cyan-100/70">Live Neural Events</div>
            <div className="landing-ticker">
              <div className="landing-ticker-track">
                {doubledEvents.map((event, index) => (
                  <span key={`event-${index}-${event}`} className="landing-ticker-item">• {event}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            <p className="text-[11px] tracking-[0.16em] uppercase text-cyan-200/80">Feature Matrix</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-headline font-bold">Built Like an AI System, Not Just an App</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURE_CARDS.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, rotateX: 4, rotateY: 4 }}
                className="landing-feature-card relative rounded-3xl border border-cyan-300/18 bg-[linear-gradient(165deg,rgba(91,155,255,0.12),rgba(16,22,41,0.6))] p-7"
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.8, repeat: Infinity, delay: index * 0.3 }}
                  className="mb-5 inline-flex rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-3"
                >
                  <item.icon className="h-6 w-6 text-cyan-200" />
                </motion.div>
                <h3 className="text-xl font-headline font-bold">{item.title}</h3>
                <p className="mt-2 text-sm text-cyan-100/70 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 md:px-8 pb-16" id="demo">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-8 items-stretch">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-3xl border border-cyan-300/15 bg-black/25 p-7">
              <p className="text-[11px] tracking-[0.16em] uppercase text-cyan-200/75">Interactive Demo Teaser</p>
              <h3 className="mt-2 text-2xl font-headline font-bold">Live Cognitive Engine Window</h3>
              <p className="mt-3 text-cyan-100/70 text-sm leading-relaxed">
                A compact live preview of graph evolution, attention density, and adaptive recommendation streams.
              </p>
              <div className="mt-6 flex gap-3">
                <RippleButton className="rounded-full bg-gradient-to-r from-primary to-accent px-5 text-white">Explore Simulation</RippleButton>
                <Button variant="outline" className="rounded-full border-cyan-300/30 bg-white/5">Read Specs</Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.015 }}
              className="relative overflow-hidden rounded-3xl border border-cyan-300/25 bg-[linear-gradient(160deg,rgba(93,169,255,0.12),rgba(10,14,28,0.8))] p-6 shadow-[0_0_45px_rgba(91,165,255,0.2)]"
            >
              <div className="pointer-events-none absolute inset-0 beam-sweep" />
              <div className="pointer-events-none absolute inset-0 noise-overlay opacity-40" />
              <div className="grid h-full grid-cols-[1fr_0.9fr] gap-5">
                <div className="rounded-2xl border border-cyan-300/15 bg-black/35 p-4">
                  <p className="text-xs text-cyan-100/70 uppercase tracking-[0.14em]">Graph Stream</p>
                  <div className="relative mt-4 h-44 rounded-xl border border-white/10 bg-[#070b14] overflow-hidden">
                    {[0, 1, 2, 3, 4, 5, 6].map((dot) => (
                      <motion.span
                        key={`dot-${dot}`}
                        className="absolute h-2 w-2 rounded-full bg-cyan-300"
                        initial={{ x: 18 + dot * 24, y: 20 + (dot % 3) * 34 }}
                        animate={{ x: [18 + dot * 24, 28 + dot * 24, 14 + dot * 24], y: [20 + (dot % 3) * 34, 26 + (dot % 4) * 30, 16 + (dot % 3) * 34] }}
                        transition={{ duration: 4 + dot * 0.28, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-cyan-300/15 bg-black/35 p-3 text-xs text-cyan-100/80">Realtime dashboard snippet</div>
                  {[76, 62, 84].map((value, index) => (
                    <div key={`snippet-${index}`} className="rounded-xl border border-white/10 bg-black/30 p-3">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-cyan-100/60">Signal {index + 1}</p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${value}%` }}
                          transition={{ duration: 0.9, delay: index * 0.2 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 md:px-8 py-16" id="architecture">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            <p className="text-[11px] tracking-[0.16em] uppercase text-cyan-200/80">Your Brain. Visualized.</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-headline font-bold">Animated Knowledge Graph Simulation</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-black/25 p-6 md:p-8"
          >
            <div className="pointer-events-none absolute inset-0 star-field opacity-45" />
            <div className="pointer-events-none absolute inset-0 beam-sweep" />
            <div className="pointer-events-none absolute inset-0 noise-overlay opacity-35" />
            <div className="relative h-64 rounded-2xl border border-cyan-300/12 bg-[#070b14]/85 overflow-hidden">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((node, index) => (
                <motion.span
                  key={`graph-node-${node}`}
                  className="absolute h-2.5 w-2.5 rounded-full bg-cyan-300/90 shadow-[0_0_16px_rgba(95,193,255,0.65)]"
                  initial={{ x: 22 + node * 38, y: 20 + (node % 4) * 48 }}
                  animate={{
                    x: [22 + node * 38, 16 + node * 36, 24 + node * 37],
                    y: [20 + (node % 4) * 48, 30 + (node % 5) * 42, 24 + (node % 4) * 48],
                    opacity: [0.5, 1, 0.6],
                  }}
                  transition={{ duration: 5 + index * 0.22, repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}

              {[
                { left: '8%', top: '22%', width: '18%' },
                { left: '22%', top: '46%', width: '24%' },
                { left: '38%', top: '30%', width: '22%' },
                { left: '56%', top: '52%', width: '17%' },
                { left: '68%', top: '36%', width: '19%' },
                { left: '32%', top: '62%', width: '28%' },
              ].map((line, index) => (
                <motion.div
                  key={`graph-line-${index}`}
                  className="absolute h-px bg-gradient-to-r from-cyan-300/0 via-cyan-300/45 to-purple-300/0"
                  style={{ left: line.left, top: line.top, width: line.width }}
                  animate={{ opacity: [0.15, 0.55, 0.2], scaleX: [0.95, 1.06, 0.98] }}
                  transition={{ duration: 3.4 + index * 0.28, repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-4 md:px-8 pb-16">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            <p className="text-[11px] tracking-[0.16em] uppercase text-cyan-200/80">How OpenMind Thinks</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-headline font-bold">Neural Signal Architecture Pipeline</h2>
          </motion.div>

          <div className="rounded-3xl border border-cyan-300/20 bg-black/25 p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {PIPELINE_STEPS.map((step, index) => {
                const isActive = index === activeStep;
                return (
                  <motion.div
                    key={step}
                    animate={{ opacity: isActive ? 1 : 0.55, scale: isActive ? 1.03 : 1 }}
                    className={`rounded-2xl border px-4 py-5 text-center transition-colors ${isActive ? 'border-cyan-300/45 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-black/20 text-cyan-100/70'}`}
                  >
                    <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium">{step}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 md:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              '“Feels like Jarvis for real productivity.”',
              '“The graph intelligence is unreal for learners.”',
              '“Finally an AI workspace that thinks in systems.”',
            ].map((quote, index) => (
              <motion.div
                key={`quote-${index}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.12 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-cyan-300/14 bg-black/20 p-5 text-sm text-cyan-100/75"
              >
                {quote}
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 md:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-cyan-300/28 bg-[linear-gradient(145deg,rgba(93,166,255,0.18),rgba(22,16,52,0.56))] p-8 md:p-12 text-center"
          >
            <p className="text-[11px] tracking-[0.16em] uppercase text-cyan-100/80">Deploy Your Cognitive OS</p>
            <h2 className="mt-2 text-3xl md:text-5xl font-headline font-bold">Start Building Your AI-Enhanced Future</h2>
            <p className="mt-3 text-cyan-100/75 max-w-2xl mx-auto">
              Turn your goals, tasks, and knowledge graph into one adaptive intelligence engine.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <RippleButton className="rounded-full bg-gradient-to-r from-primary to-accent px-8 text-white">Initialize Workspace</RippleButton>
              </Link>
              <Button variant="outline" className="rounded-full border-cyan-300/35 bg-white/5">View Architecture Docs</Button>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-cyan-300/12 px-4 py-10 md:px-8 bg-black/35 backdrop-blur-md">
        <div className="mx-auto max-w-7xl flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 p-2">
              <Orbit className="h-4 w-4 text-cyan-200" />
            </div>
            <div>
              <p className="font-headline font-bold text-cyan-100">OpenMind OS</p>
              <p className="text-xs text-cyan-100/60">Neural productivity platform</p>
            </div>
          </div>
          <div className="text-xs text-cyan-100/55">© 2026 OpenMind AI • Systems online</div>
          <div className="flex items-center gap-4 text-xs text-cyan-100/70">
            <span className="inline-flex items-center gap-1"><Activity className="h-3 w-3" /> Core Stable</span>
            <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI Runtime Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}