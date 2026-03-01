"use client"

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { 
  Bell,
  Brain,
  LayoutDashboard, 
  Target, 
  CheckSquare, 
  Network, 
  BarChart3, 
  Map, 
  Zap,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { logoutUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const navSections = [
  {
    title: 'Core',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Intelligence', href: '/insights', icon: Brain },
    ],
  },
  {
    title: 'Execution',
    items: [
      { name: 'Goals', href: '/goals', icon: Target },
      { name: 'Tasks', href: '/tasks', icon: CheckSquare },
      { name: 'Roadmap', href: '/roadmap', icon: Map },
    ],
  },
  {
    title: 'Knowledge',
    items: [
      { name: 'Graph', href: '/graph', icon: Network },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Profile', href: '/profile', icon: User },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
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
    <aside className="hidden md:flex group/sidebar relative h-screen shrink-0 w-[4.25rem] hover:w-64 transition-[width] duration-300 bg-transparent border-r border-white/5 backdrop-blur-md sidebar-neon-edge">
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-cyan-400/5 via-cyan-300/75 to-purple-400/8" />
      <div className="pointer-events-none absolute inset-0 sidebar-hover-glow opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-500" />

      <div className="flex h-full w-full flex-col">
        <div className="px-3 py-5 flex items-center gap-3 min-h-[76px]">
          <div className="bg-primary/20 border border-primary/40 p-2 rounded-xl neon-glow">
            <Image src="/openmind-logo.svg" alt="OpenMind OS" width={24} height={24} className="h-6 w-6" priority />
          </div>
          <div className="opacity-0 -translate-x-2 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 transition-all duration-250 whitespace-nowrap">
            <p className="font-headline text-lg font-bold tracking-tight">OpenMind OS</p>
            <p className="text-[11px] text-muted-foreground">Smart Dock</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-3 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <div className="h-px mx-2 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent opacity-70" />
              <p className="px-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground opacity-0 -translate-x-2 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 transition-all duration-200">
                {section.title}
              </p>
              {section.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-label={`Go to ${item.name}`}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className={cn(
                    'relative flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 nav-glow',
                    pathname === item.href
                      ? 'bg-primary/20 text-cyan-100 border border-cyan-300/30 shadow-[0_0_20px_rgba(88,177,255,0.25)]'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/35 border border-transparent',
                  )}
                >
                  <item.icon className={cn(
                    'h-5 w-5 shrink-0',
                    pathname === item.href ? 'text-cyan-200' : 'text-muted-foreground group-hover/sidebar:text-cyan-200',
                  )} />
                  <span className="opacity-0 -translate-x-1 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 transition-all duration-200 whitespace-nowrap">
                    {item.name}
                  </span>
                  {pathname === item.href && (
                    <span className="absolute right-2 h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border/70 space-y-2">
          <Link href="/profile" aria-label="Open profile settings">
            <div className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-sidebar-accent/40 cursor-pointer transition-colors border border-white/10 bg-black/10 nav-glow">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white shrink-0">
                {user?.photoURL ? (
                  <Image src={user.photoURL} alt="User avatar" width={36} height={36} className="h-9 w-9 rounded-full object-cover" unoptimized />
                ) : (
                  userInitials
                )}
              </div>
              <div className="min-w-0 opacity-0 -translate-x-1 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 transition-all duration-200">
                <p className="text-sm font-medium truncate">{user?.displayName ?? 'OpenMind User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? 'user@openmind.local'}</p>
              </div>
              <Bell className="h-4 w-4 text-muted-foreground opacity-0 group-hover/sidebar:opacity-100 transition-opacity" />
            </div>
          </Link>
          <Button
            aria-label="Logout from OpenMind OS"
            variant="ghost"
            className="w-full min-h-11 justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">Logout</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}