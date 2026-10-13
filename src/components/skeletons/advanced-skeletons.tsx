import { Skeleton } from "@/components/ui/skeleton";

export function ChatAndNotificationsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Search & Tabs bar skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>

      {/* Message rows */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-border/50 bg-card/60">
            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-12 rounded-md" />
              </div>
              <Skeleton className="h-3 w-48 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WantedCardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border border-border/60 bg-card rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-12 w-full rounded-md" />
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CompareTableSkeleton() {
  return (
    <div className="border border-border rounded-2xl p-4 bg-card space-y-4 animate-pulse">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
          </div>
        ))}
      </div>
      <div className="space-y-2 pt-4 border-t border-border/60">
        <Skeleton className="h-8 w-full rounded-md" />
        <Skeleton className="h-8 w-full rounded-md" />
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    </div>
  );
}
