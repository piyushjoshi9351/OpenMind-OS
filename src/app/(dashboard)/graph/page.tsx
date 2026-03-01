"use client"

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Network } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useUser } from '@/firebase';
import { useRealtimeGraph } from '@/lib/hooks';
import { graphService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import type { KnowledgeNodeType } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { RippleButton } from '@/components/ai/RippleButton';

export default function GraphPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { graphData, loading, weakClusters } = useRealtimeGraph();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeTitle, setNodeTitle] = useState('');
  const [nodeType, setNodeType] = useState<KnowledgeNodeType>('skill');
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [relationType, setRelationType] = useState('related_to');

  const selectedNode = useMemo(() => graphData.nodes.find((node) => node.id === selectedNodeId) ?? null, [graphData.nodes, selectedNodeId]);

  const createNode = async () => {
    if (!user || !nodeTitle.trim()) {
      return;
    }
    try {
      await graphService.createNode(firestore, {
        userId: user.uid,
        title: nodeTitle,
        type: nodeType,
        embeddingPlaceholder: 'embedding-v1',
      });
      setNodeTitle('');
      toast({ title: 'Node created', description: 'Knowledge node added to graph.' });
    } catch (error) {
      toast({ title: 'Node creation failed', description: error instanceof Error ? error.message : 'Please retry.', variant: 'destructive' });
    }
  };

  const createEdge = async () => {
    if (!user || !sourceId || !targetId || sourceId === targetId) {
      return;
    }
    try {
      await graphService.createEdge(firestore, {
        userId: user.uid,
        sourceId,
        targetId,
        relationType,
      });
      toast({ title: 'Relationship created', description: 'Knowledge edge added to graph.' });
    } catch (error) {
      toast({ title: 'Edge creation failed', description: error instanceof Error ? error.message : 'Please retry.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-[580px] w-full" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Knowledge Memory Graph</h1>
          <p className="text-muted-foreground mt-1">Immersive research-lab workspace for cognitive knowledge mapping.</p>
        </div>
        <div className="flex gap-2">
          <RippleButton variant="outline" className="gap-2 glass-panel">
            <Plus className="h-4 w-4" /> Add Note
          </RippleButton>
          <RippleButton className="gap-2 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30">
            <Network className="h-4 w-4" /> Link Knowledge
          </RippleButton>
        </div>
      </div>

      <Card className="glass-panel border-white/10 shadow-xl">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="node-title">Node title</Label>
            <Input id="node-title" value={nodeTitle} onChange={(event) => setNodeTitle(event.target.value)} placeholder="Distributed Training" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="node-type">Node type</Label>
            <Select value={nodeType} onValueChange={(value) => setNodeType(value as KnowledgeNodeType)}>
              <SelectTrigger id="node-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="skill">Skill</SelectItem>
                <SelectItem value="topic">Topic</SelectItem>
                <SelectItem value="goal">Goal</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="mt-auto" onClick={createNode}><Plus className="h-4 w-4 mr-1" /> Add Node</Button>

          <div className="space-y-2">
            <Label>Source node</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>{graphData.nodes.map((node) => <SelectItem key={node.id} value={node.id}>{node.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target node</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger><SelectValue placeholder="Select target" /></SelectTrigger>
              <SelectContent>{graphData.nodes.map((node) => <SelectItem key={node.id} value={node.id}>{node.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Relation type</Label>
            <Input value={relationType} onChange={(event) => setRelationType(event.target.value)} placeholder="depends_on" />
            <Button variant="outline" className="w-full" onClick={createEdge}><Network className="h-4 w-4 mr-1" /> Create Relation</Button>
          </div>
        </CardContent>
      </Card>

      <div className="relative rounded-2xl border border-white/10 bg-black/35 p-3 md:p-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(90,170,255,0.10),transparent_35%),radial-gradient(circle_at_90%_0%,rgba(150,90,255,0.12),transparent_32%)] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
          <div className="lg:col-span-3 h-[620px]">
            <KnowledgeGraph data={graphData} weakClusters={weakClusters} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
          </div>
          <div className="space-y-6">
            <Card className="glass-panel border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-headline">Graph Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {weakClusters.map((cluster) => (
                  <div key={cluster.id} className="text-sm p-3 rounded-lg bg-primary/5">
                    <p className="font-semibold">Weak Cluster: {cluster.title}</p>
                    <p className="text-muted-foreground mt-1">Weakness score {cluster.weaknessScore}. Add supporting links to strengthen this skill area.</p>
                  </div>
                ))}
                {!weakClusters.length && (
                  <div className="text-sm p-3 rounded-lg bg-accent/5">
                    <p className="font-semibold">No weak clusters detected</p>
                    <p className="text-muted-foreground mt-1">Your skill nodes have healthy connectivity.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-panel border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-headline">Research Console</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Nodes pulse to indicate active cognitive pathways.</p>
                <p>• Edges animate to show relationship flow direction.</p>
                <p>• Select any node to open floating detail inspector.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <AnimatePresence>
          {selectedNode && (
            <motion.aside
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.24 }}
              className="absolute right-5 top-5 w-[320px] max-w-[calc(100%-2.5rem)] rounded-2xl border border-cyan-300/25 bg-background/90 backdrop-blur-xl shadow-[0_0_35px_rgba(88,177,255,0.22)] z-20"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <p className="text-sm font-semibold text-cyan-100">Node Detail Panel</p>
                <Button variant="ghost" size="sm" onClick={() => setSelectedNodeId(null)}>Close</Button>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <p><span className="font-semibold">Title:</span> {selectedNode.title}</p>
                <p><span className="font-semibold">Type:</span> {selectedNode.type}</p>
                <p><span className="font-semibold">Created:</span> {new Date(selectedNode.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground pt-2">Module status: AI relation tracing active.</p>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}