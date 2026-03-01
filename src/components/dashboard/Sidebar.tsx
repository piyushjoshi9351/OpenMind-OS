"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { 
  LayoutDashboard, 
  Target, 
  CheckSquare, 
  Network, 
  BarChart3, 
  Map, 
  Zap, 
  Gauge,
  LogOut,
  BrainCircuit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { logoutUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Knowledge Graph', href: '/graph', icon: Network },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Skill Gap', href: '/skill-gap', icon: Gauge },
  { name: 'Roadmap', href: '/roadmap', icon: Map },
  { name: 'Cognitive Insights', href: '/insights', icon: Zap },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { toast } = useToast();

  const userInitials = useMemo(() => {
    const source = user?.displayName ?? user?.email ?? 'OM';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }, [user?.displayName, user?.email]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast({ title: 'Logged out', description: 'Session ended successfully.' });
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="hidden md:flex flex-col h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary p-2 rounded-xl">
          <BrainCircuit className="text-primary-foreground h-6 w-6" />
        </div>
        <span className="font-headline text-xl font-bold tracking-tight">OpenMind OS</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            aria-label={`Go to ${item.name}`}
            aria-current={pathname === item.href ? 'page' : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
              pathname === item.href 
                ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
              <item.icon className={cn(
                "h-5 w-5",
                pathname === item.href ? "text-sidebar-accent-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
              )} />
              {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Link href="/profile" aria-label="Open profile settings">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent/50 cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center font-bold text-white">
              {userInitials}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.displayName ?? 'OpenMind User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? 'user@openmind.local'}</p>
            </div>
          </div>
        </Link>
        <Button aria-label="Logout from OpenMind OS" variant="ghost" className="w-full min-h-11 justify-start gap-3 mt-4 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}