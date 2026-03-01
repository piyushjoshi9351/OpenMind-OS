"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrainCircuit, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { loginWithEmail, loginWithGoogle, signUpWithEmail } from '@/lib/auth';
import { useUser } from '@/firebase';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [isUserLoading, router, user]);

  const onEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || password.length < 6) {
      toast({
        title: 'Invalid credentials',
        description: 'Enter a valid email and password with at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      toast({
        title: mode === 'signin' ? 'Welcome back' : 'Account created',
        description: 'Redirecting to your dashboard.',
      });
      router.replace('/dashboard');
    } catch (error) {
      toast({
        title: 'Authentication failed',
        description: error instanceof Error ? error.message : 'Please retry.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onGoogleAuth = async () => {
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      router.replace('/dashboard');
    } catch (error) {
      toast({
        title: 'Google sign-in failed',
        description: error instanceof Error ? error.message : 'Please retry.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-xl rounded-2xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <BrainCircuit className="h-5 w-5" />
            <span className="font-headline font-semibold">OpenMind OS</span>
          </div>
          <CardTitle className="text-2xl">Secure Access</CardTitle>
          <CardDescription>Sign in to your AI cognitive operating system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={(value) => setMode(value as 'signin' | 'signup')}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          </Tabs>

          <form className="space-y-4" onSubmit={onEmailAuth}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              {mode === 'signin' ? 'Continue with Email' : 'Create Account'}
            </Button>
          </form>

          <Button variant="outline" className="w-full" onClick={onGoogleAuth} disabled={isSubmitting}>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
