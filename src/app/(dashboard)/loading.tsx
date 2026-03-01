import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 p-8">
      <Skeleton className="h-8 w-72" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 w-full" />)}
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
