"use client"

import { useState } from 'react';
import { generateLearningRoadmap, GenerateLearningRoadmapOutput } from '@/ai/flows/generate-learning-roadmap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Sparkles, 
  Map as MapIcon, 
  Calendar, 
  Clock, 
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RoadmapPage() {
  const [targetRole, setTargetRole] = useState('');
  const [timeline, setTimeline] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<GenerateLearningRoadmapOutput | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole) return;
    
    setIsLoading(true);
    try {
      const result = await generateLearningRoadmap({
        targetRole,
        timelineMonths: timeline,
      });
      setRoadmap(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-headline font-bold">AI Learning Roadmap</h1>
        <p className="text-muted-foreground text-lg">Generate a personalized curriculum to bridge your skill gaps.</p>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        <CardContent className="p-8">
          <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="role">Target Role</Label>
              <Input 
                id="role" 
                placeholder="e.g., Senior AI Engineer" 
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline (Months)</Label>
              <Input 
                id="timeline" 
                type="number" 
                min={1} 
                max={24} 
                value={timeline}
                onChange={(e) => setTimeline(parseInt(e.target.value))}
                className="bg-background/50"
              />
            </div>
            <div className="md:col-span-3 mt-2">
              <Button type="submit" disabled={isLoading} className="w-full gap-2 h-11 text-lg">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {isLoading ? "Synthesizing Roadmap..." : "Generate Personalized Plan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-none shadow-sm">
                <CardHeader>
                  <Skeleton className="h-6 w-1/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {roadmap && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-primary text-primary-foreground p-8 rounded-2xl shadow-lg">
              <h2 className="text-3xl font-headline font-bold">{roadmap.roadmapTitle}</h2>
              <p className="mt-4 opacity-90 leading-relaxed text-lg">{roadmap.roadmapDescription}</p>
              <div className="flex gap-4 mt-6">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm">
                  <Calendar className="h-4 w-4" /> {timeline} Months
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm">
                  <MapIcon className="h-4 w-4" /> {roadmap.weeks.length} Stages
                </div>
              </div>
            </div>

            <div className="space-y-12 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-muted">
              {roadmap.weeks.map((week, idx) => (
                <div key={week.weekNumber} className="relative pl-12 group">
                  <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-white border-2 border-primary flex items-center justify-center font-bold text-primary z-10 group-hover:scale-110 transition-transform">
                    {week.weekNumber}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-headline font-bold">Week {week.weekNumber}</h3>
                      <Badge variant="secondary">In Progress</Badge>
                    </div>
                    <p className="text-muted-foreground text-lg">{week.weekSummary}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {week.dailyTasks.map((task, tidx) => (
                        <Card key={tidx} className="border-none shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-accent uppercase tracking-wider">{task.day}</span>
                              <Clock className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <h4 className="font-semibold text-lg mb-2">{task.topic}</h4>
                            <ul className="space-y-2">
                              {task.activities.map((act, aidx) => (
                                <li key={aidx} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                  {act}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {!roadmap && !isLoading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed border-muted rounded-2xl"
          >
            <div className="bg-muted p-4 rounded-full">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="max-w-xs">
              <p className="font-semibold text-xl">No Roadmap Yet</p>
              <p className="text-muted-foreground mt-1">Enter your target career goals above to generate an AI curriculum.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}