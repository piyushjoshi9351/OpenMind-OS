"use client"

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Zap, Target, Network, ArrowRight, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="dark flex flex-col min-h-screen bg-[#0A0A0F] text-foreground">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-xl border border-primary/40 neon-glow">
            <Image src="/openmind-logo.svg" alt="OpenMind OS" width={24} height={24} className="h-6 w-6" priority />
          </div>
          <span className="font-headline text-2xl font-bold tracking-tight">OpenMind OS</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="#features" className="hover:text-cyan-300">Features</Link>
          <Link href="#about" className="hover:text-cyan-300">Mission</Link>
          <Link href="/login" className="px-4 py-2 rounded-full border border-cyan-300/30 hover:bg-cyan-400/10 transition-colors">Login</Link>
          <Link href="/login" className="px-5 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-cyan-200 text-xs font-bold uppercase tracking-widest">
            <Zap className="h-3 w-3" /> AI-Powered Personal Operating System
          </div>
          <h1 className="text-6xl md:text-8xl font-headline font-bold leading-tight tracking-tight text-cyan-50">
            Augment Your <span className="text-primary">Intelligence.</span>
          </h1>
          <p className="text-xl md:text-2xl text-cyan-100/70 max-w-3xl mx-auto leading-relaxed">
            A personal cognitive assistant that builds your knowledge graph, tracks your goals, and optimizes your learning velocity with AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-8 justify-center">
            <Link href="/dashboard">
              <Button className="h-14 px-8 rounded-full bg-gradient-to-r from-primary to-accent text-lg gap-2 shadow-lg hover:shadow-xl transition-all magnetic-btn">
                Enter your OS <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" className="h-14 px-8 rounded-full text-lg border-cyan-300/30 bg-white/5 backdrop-blur">
              Watch Demo
            </Button>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full">
          {[
            { 
              icon: Target, 
              title: "Goal Orchestration", 
              desc: "Multi-layered goal tracking with real-time probability analysis." 
            },
            { 
              icon: Network, 
              title: "Knowledge Graph", 
              desc: "A dynamic semantic memory that connects every concept you learn." 
            },
            { 
              icon: BrainCircuit, 
              title: "Cognitive Insights", 
              desc: "Behavioral analytics to detect burnout and optimize focus windows." 
            }
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="p-8 rounded-3xl glass-panel hover:shadow-md transition-all text-left group"
            >
              <div className="bg-primary/10 p-3 rounded-2xl w-fit group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-8 w-8 text-cyan-300" />
              </div>
              <h3 className="text-2xl font-headline font-bold mt-6">{f.title}</h3>
              <p className="text-cyan-100/70 mt-2 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-cyan-300/15 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Image src="/openmind-logo.svg" alt="OpenMind OS" width={20} height={20} className="h-5 w-5" />
            <span className="font-headline font-bold text-cyan-100">OpenMind OS</span>
          </div>
          <p className="text-sm text-cyan-100/60">© 2024 OpenMind AI. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-medium text-cyan-100/70">
            <Link href="#" className="hover:text-cyan-300">Terms</Link>
            <Link href="#" className="hover:text-cyan-300">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}