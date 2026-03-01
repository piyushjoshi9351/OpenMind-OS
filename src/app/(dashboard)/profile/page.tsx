"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Shield, Bell, Key, Cloud } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getUserRole, updateUserDisplayName, updateUserPhotoUrl } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { uxCopy } from '@/lib/ux-copy';
import { cn } from '@/lib/utils';

type ProfileSection = 'General' | 'Security' | 'Notifications' | 'API Keys' | 'Data & Privacy';

export default function ProfilePage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [activeSection, setActiveSection] = useState<ProfileSection>('General');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const [apiKey, setApiKey] = useState('om_live_4f2a8d9c17f0b24e3a');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    const nameParts = (user.displayName ?? '').split(' ').filter(Boolean);
    setFirstName(nameParts[0] ?? 'OpenMind');
    setLastName(nameParts.slice(1).join(' ') || 'User');
    setBio('AI-first lifelong learner.');
    setAvatarDataUrl(user.photoURL ?? '');
    void getUserRole(user).then(setRole).catch(() => setRole('user'));
  }, [user]);

  const initials = useMemo(() => `${firstName[0] ?? 'O'}${lastName[0] ?? 'M'}`.toUpperCase(), [firstName, lastName]);

  const saveProfile = async () => {
    if (!user) {
      return;
    }
    try {
      const displayName = `${firstName} ${lastName}`.trim();
      await updateUserDisplayName(user, displayName);
      if (avatarDataUrl) {
        await updateUserPhotoUrl(user, avatarDataUrl);
      }

      await setDoc(doc(firestore, 'users', user.uid), {
        email: user.email,
        displayName,
        photoURL: avatarDataUrl || user.photoURL || null,
        role,
        updatedAt: new Date().toISOString(),
        settings: {
          darkMode: true,
          weeklyGoalHours: 12,
          notificationsEnabled,
          twoFactorEnabled,
        },
        cognitiveProfile: {
          bio,
          learningStyle: 'hybrid',
          preferredFocusWindow: 'morning',
          strengths: ['Consistency', 'Execution'],
          weakSignals: ['Overcommitment'],
        },
      }, { merge: true });

      await user.reload();
      router.refresh();

      toast({ title: uxCopy.success.updated('Profile'), description: 'Settings synced to Firestore.' });
    } catch (error) {
      toast({ title: 'Profile update failed', description: error instanceof Error ? error.message : uxCopy.error.retry, variant: 'destructive' });
    }
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file only.', variant: 'destructive' });
      return;
    }

    if (file.size > 800 * 1024) {
      toast({ title: 'Image too large', description: 'Please upload an image up to 800KB.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        return;
      }
      setAvatarDataUrl(result);
      toast({ title: 'Avatar selected', description: 'Click Save Profile Changes to persist.' });
    };
    reader.readAsDataURL(file);
  };

  const regenerateApiKey = () => {
    const randomPart = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const nextKey = `om_live_${randomPart.slice(0, 24)}`;
    setApiKey(nextKey);
    toast({ title: 'API key regenerated', description: 'Copy and store your new key securely.' });
  };

  const copyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast({ title: 'API key copied', description: 'Key copied to clipboard.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Clipboard permission denied.', variant: 'destructive' });
    }
  };

  const exportMyData = () => {
    const payload = {
      profile: {
        firstName,
        lastName,
        bio,
        email: user?.email ?? '',
        role,
      },
      settings: {
        notificationsEnabled,
        twoFactorEnabled,
      },
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'openmind-profile-export.json';
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Data export ready', description: 'Your profile export has been downloaded.' });
  };

  const sections: Array<{ name: ProfileSection; icon: typeof User }> = [
    { name: 'General', icon: User },
    { name: 'Security', icon: Shield },
    { name: 'Notifications', icon: Bell },
    { name: 'API Keys', icon: Key },
    { name: 'Data & Privacy', icon: Cloud },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your OpenMind OS identity and data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="space-y-1">
          {sections.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveSection(item.name)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeSection === item.name ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </button>
          ))}
        </aside>

        <div className="md:col-span-3 space-y-6">
          {activeSection === 'General' && (
            <Card className="om-card">
              <CardHeader>
                <CardTitle className="font-headline text-lg">Public Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    {avatarDataUrl ? (
                      <Image src={avatarDataUrl} alt="Profile avatar" width={80} height={80} className="h-20 w-20 rounded-2xl object-cover" unoptimized />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="space-y-2">
                    <input ref={avatarInputRef} id="avatar-input" type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                    <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()}>Change Avatar</Button>
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
          )}

          {activeSection === 'Security' && (
            <Card className="om-card">
              <CardHeader>
                <CardTitle className="font-headline text-lg">Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between rounded-lg border border-white/10 p-4">
                  <div>
                    <p className="text-sm font-medium">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground mt-1">Add an extra verification step when signing in.</p>
                  </div>
                  <Button variant={twoFactorEnabled ? 'default' : 'outline'} size="sm" onClick={() => setTwoFactorEnabled((value) => !value)}>
                    {twoFactorEnabled ? 'Enabled' : 'Enable'}
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-white/10 p-4">
                  <div>
                    <p className="text-sm font-medium">Password</p>
                    <p className="text-xs text-muted-foreground mt-1">Update your password from your auth provider settings.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast({ title: 'Auth managed password', description: 'Please update password from your sign-in provider settings.' })}>Manage Password</Button>
                </div>

                <Button className="px-8 shadow-md" onClick={saveProfile}>Save Security Settings</Button>
              </CardContent>
            </Card>
          )}

          {activeSection === 'Notifications' && (
            <Card className="om-card">
              <CardHeader>
                <CardTitle className="font-headline text-lg">Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between rounded-lg border border-white/10 p-4">
                  <div>
                    <p className="text-sm font-medium">Product Notifications</p>
                    <p className="text-xs text-muted-foreground mt-1">Goal reminders, AI insights and progress alerts.</p>
                  </div>
                  <Button variant={notificationsEnabled ? 'default' : 'outline'} size="sm" onClick={() => setNotificationsEnabled((value) => !value)}>
                    {notificationsEnabled ? 'On' : 'Off'}
                  </Button>
                </div>

                <Button className="px-8 shadow-md" onClick={saveProfile}>Save Notification Settings</Button>
              </CardContent>
            </Card>
          )}

          {activeSection === 'API Keys' && (
            <Card className="om-card">
              <CardHeader>
                <CardTitle className="font-headline text-lg">API Keys</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-lg border border-white/10 p-4 space-y-2">
                  <p className="text-sm font-medium">OpenMind Personal Key</p>
                  <p className="text-xs text-muted-foreground">{apiKey}</p>
                  <p className="text-xs text-muted-foreground">Use this key for private integrations. Rotate immediately if exposed.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={regenerateApiKey}>Regenerate Key</Button>
                  <Button variant="outline" size="sm" onClick={copyApiKey}>Copy Key</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'Data & Privacy' && (
            <>
              <Card className="om-card">
                <CardHeader>
                  <CardTitle className="font-headline text-lg">Data & Privacy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Control data export and retention for your OpenMind workspace.</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={exportMyData}>Export My Data</Button>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: 'Deletion request queued', description: 'Support will contact you for verification.' })}>Request Data Deletion</Button>
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
                  <Button variant="destructive" onClick={() => toast({ title: 'Safety lock active', description: 'Account deletion requires verified support flow.', variant: 'destructive' })}>Delete Account</Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}