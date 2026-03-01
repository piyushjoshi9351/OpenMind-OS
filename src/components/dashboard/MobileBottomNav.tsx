"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, LayoutDashboard, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Goals', href: '/goals', icon: Target },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Insights', href: '/insights', icon: Zap },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur-xl">
      <div className="grid grid-cols-4 px-2 py-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={cn(
            'flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-colors',
            pathname === item.href ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
          )}>
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
