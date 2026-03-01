"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { trackFeatureEvent } from '@/lib/event-tracking';

const routeShortcuts: Record<string, string> = {
  d: '/dashboard',
  g: '/goals',
  t: '/tasks',
  i: '/insights',
  r: '/roadmap',
  p: '/profile',
};

const isEditableTarget = (eventTarget: EventTarget | null) => {
  if (!(eventTarget instanceof HTMLElement)) {
    return false;
  }
  const tagName = eventTarget.tagName.toLowerCase();
  return eventTarget.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
};

export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        event.preventDefault();
        if (user) {
          void trackFeatureEvent({ userId: user.uid, eventName: 'shortcut_command_palette', page: pathname });
        }
        window.dispatchEvent(new Event('om:command-palette-open'));
        return;
      }

      if (event.shiftKey && event.key === '?') {
        event.preventDefault();
        if (user) {
          void trackFeatureEvent({ userId: user.uid, eventName: 'shortcut_help_opened', page: pathname });
        }
        toast({
          title: 'Keyboard Shortcuts',
          description: '⌘/Ctrl+K Command Palette • D Dashboard • G Goals • T Tasks • I Insights • R Roadmap • P Profile • Q Quick Add • X Complete First Pending (Tasks)',
        });
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      if (key === 'q') {
        event.preventDefault();
        if (user) {
          void trackFeatureEvent({ userId: user.uid, eventName: 'shortcut_quick_add', page: pathname });
        }
        if (pathname !== '/tasks') {
          router.push('/tasks?quickAdd=1');
        } else {
          window.dispatchEvent(new Event('om:quick-add-focus'));
        }
        return;
      }

      const route = routeShortcuts[key];
      if (route) {
        event.preventDefault();
        if (user) {
          void trackFeatureEvent({ userId: user.uid, eventName: 'shortcut_route_nav', page: pathname, metadata: { target: route } });
        }
        router.push(route);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [pathname, router, toast, user]);

  return null;
}
