"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Target, 
  CheckSquare, 
  Network, 
  BarChart3, 
  Map, 
  Zap, 
  User,
  LogOut,
  BrainCircuit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Knowledge Graph', href: '/graph', icon: Network },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Roadmap', href: '/roadmap', icon: Map },
  { name: 'Cognitive Insights', href: '/insights', icon: Zap },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary p-2 rounded-xl">
          <BrainCircuit className="text-primary-foreground h-6 w-6" />
        </div>
        <span className="font-headline text-xl font-bold tracking-tight">OpenMind OS</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.name} href={item.href}>
            <span className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
              pathname === item.href 
                ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}>
              <item.icon className={cn(
                "h-5 w-5",
                pathname === item.href ? "text-sidebar-accent-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
              )} />
              {item.name}
            </span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Link href="/profile">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent/50 cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center font-bold text-white">
              JD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-muted-foreground truncate">john@example.com</p>
            </div>
          </div>
        </Link>
        <Button variant="ghost" className="w-full justify-start gap-3 mt-4 text-muted-foreground hover:text-destructive">
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}