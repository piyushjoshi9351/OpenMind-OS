"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">System Settings</h1>
        <p className="text-muted-foreground mt-1">Tune workspace behavior and AI module defaults.</p>
      </div>

      <Card className="om-card">
        <CardHeader>
          <CardTitle className="text-lg font-headline">Workspace Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
            <Label htmlFor="motion-mode" className="text-sm">Enhanced motion and visual effects</Label>
            <Switch id="motion-mode" defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
            <Label htmlFor="realtime-sync" className="text-sm">Realtime sync indicators</Label>
            <Switch id="realtime-sync" defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
            <Label htmlFor="ai-assist" className="text-sm">AI context-sensitive quick actions</Label>
            <Switch id="ai-assist" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
