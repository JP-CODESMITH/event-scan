import { cn } from '../../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-sm bg-sunken', className)} aria-hidden="true" />;
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-b-0">
      <Skeleton className="h-4 w-10" />
      <Skeleton className="h-4 flex-1 max-w-[180px]" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="ml-auto h-5 w-20" />
    </div>
  );
}
