import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Profile Card Skeleton */}
      <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-6 text-center shadow-xs md:flex-row md:justify-start md:text-left gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>

      {/* Settings list skeletons */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <Skeleton className="h-4 w-24 mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
