"use client"

import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph';
import { MOCK_GRAPH_DATA } from '@/lib/api-mock';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Network } from 'lucide-react';

export default function GraphPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Knowledge Memory Graph</h1>
          <p className="text-muted-foreground mt-1">Visualize your cognitive connections and skill trees.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Add Note
          </Button>
          <Button className="gap-2">
            <Network className="h-4 w-4" /> Link Knowledge
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 h-[600px]">
          <KnowledgeGraph data={MOCK_GRAPH_DATA} />
        </div>
        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-headline">Graph Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm p-3 rounded-lg bg-primary/5">
                <p className="font-semibold">Central Hub</p>
                <p className="text-muted-foreground mt-1">'Machine Learning' is your most connected node.</p>
              </div>
              <div className="text-sm p-3 rounded-lg bg-accent/5">
                <p className="font-semibold">Knowledge Depth</p>
                <p className="text-muted-foreground mt-1">Your 'Neural Networks' subtree has 5 levels of depth.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-headline">Recent Nodes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-3">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent" /> PyTorch Advanced
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" /> Backpropagation
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" /> AI Career Goal
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}