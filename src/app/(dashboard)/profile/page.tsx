"use client"

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Shield, Bell, Key, Cloud } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your OpenMind OS identity and data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="space-y-1">
          {[
            { name: 'General', icon: User },
            { name: 'Security', icon: Shield },
            { name: 'Notifications', icon: Bell },
            { name: 'API Keys', icon: Key },
            { name: 'Data & Privacy', icon: Cloud },
          ].map((item, i) => (
            <button
              key={item.name}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                i === 0 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </button>
          ))}
        </aside>

        <div className="md:col-span-3 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Public Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-2xl bg-accent flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  JD
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">Change Avatar</Button>
                  <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fname">First Name</Label>
                  <Input id="fname" defaultValue="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lname">Last Name</Label>
                  <Input id="lname" defaultValue="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="john@example.com" disabled />
                <p className="text-xs text-muted-foreground italic">Email changes require re-authentication for security.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Cognitive Bio</Label>
                <Input id="bio" placeholder="What are your main cognitive goals?" defaultValue="AI Engineer & Continuous Learner" />
              </div>

              <div className="pt-4">
                <Button className="px-8 shadow-md">Save Profile Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm border border-rose-100">
            <CardHeader>
              <CardTitle className="font-headline text-lg text-rose-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Deleting your account will permanently wipe your knowledge graph and goal history. This action cannot be undone.
              </p>
              <Button variant="destructive">Delete Account</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}