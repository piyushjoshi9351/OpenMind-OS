import { api } from '@/lib/api';

export interface FeatureEventInput {
  userId: string;
  eventName: string;
  page: string;
  metadata?: Record<string, string>;
}

const queueFallback = (input: FeatureEventInput) => {
  if (typeof window === 'undefined') {
    return;
  }
  const key = 'om-event-queue';
  const current = window.localStorage.getItem(key);
  const parsed = current ? JSON.parse(current) as FeatureEventInput[] : [];
  const next = [...parsed.slice(-49), input];
  window.localStorage.setItem(key, JSON.stringify(next));
};

export async function trackFeatureEvent(input: FeatureEventInput) {
  try {
    await api.trackEvent({
      userId: input.userId,
      eventName: input.eventName,
      page: input.page,
      metadata: input.metadata,
    });
  } catch {
    queueFallback(input);
  }
}
