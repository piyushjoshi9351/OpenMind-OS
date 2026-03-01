"use client"

import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Shield, Bell, Key, Cloud } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getUserRole } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { uxCopy } from '@/lib/ux-copy';

export default function ProfilePage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    if (!user) {
      return;
    }
    const nameParts = (user.displayName ?? '').split(' ').filter(Boolean);
    setFirstName(nameParts[0] ?? 'OpenMind');
    setLastName(nameParts.slice(1).join(' ') || 'User');
    setBio('AI-first lifelong learner.');
    void getUserRole(user).then(setRole).catch(() => setRole('user'));
  }, [user]);

  const initials = useMemo(() => `${firstName[0] ?? 'O'}${lastName[0] ?? 'M'}`.toUpperCase(), [firstName, lastName]);

  const saveProfile = async () => {
    if (!user) {
      return;
    }
    try {
      await setDoc(doc(firestore, 'users', user.uid), {
        email: user.email,
        displayName: `${firstName} ${lastName}`.trim(),
        role,
        updatedAt: new Date().toISOString(),
        settings: {
          darkMode: true,
          weeklyGoalHours: 12,
          notificationsEnabled: true,
        },
        cognitiveProfile: {
          learningStyle: 'hybrid',
          preferredFocusWindow: 'morning',
          strengths: ['Consistency', 'Execution'],
          weakSignals: ['Overcommitment'],
        },
      }, { merge: true });

      toast({ title: uxCopy.success.updated('Profile'), description: 'Settings synced to Firestore.' });
    } catch (error) {
      toast({ title: 'Profile update failed', description: error instanceof Error ? error.message : uxCopy.error.retry, variant: 'destructive' });
    }
  };

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
          <Card className="om-card">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Public Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  {initials}
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">Change Avatar</Button>
                  <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size of 800K</p>
                  <p className="text-xs text-muted-foreground">Role: <span className="font-semibold text-foreground">{role}</span></p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fname">First Name</Label>
                  <Input id="fname" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lname">Last Name</Label>
                  <Input id="lname" value={lastName} onChange={(event) => setLastName(event.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={user?.email ?? ''} disabled />
                <p className="text-xs text-muted-foreground italic">Email changes require re-authentication for security.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Cognitive Bio</Label>
                <Input id="bio" placeholder="What are your main cognitive goals?" value={bio} onChange={(event) => setBio(event.target.value)} />
              </div>

              <div className="pt-4">
                <Button className="px-8 shadow-md" onClick={saveProfile}>Save Profile Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="om-card border border-primary/25">
            <CardHeader>
              <CardTitle className="font-headline text-lg text-cyan-100">Danger Zone</CardTitle>
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