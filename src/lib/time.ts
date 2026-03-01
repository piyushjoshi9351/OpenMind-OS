export function formatRelativeTime(timestampIso: string): string {
  const parsed = new Date(timestampIso).getTime();
  if (Number.isNaN(parsed)) {
    return 'Updated recently';
  }

  const diffMs = Date.now() - parsed;
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMin < 1) {
    return 'Updated just now';
  }
  if (diffMin < 60) {
    return `Updated ${diffMin}m ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `Updated ${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Updated ${diffDays}d ago`;
}
