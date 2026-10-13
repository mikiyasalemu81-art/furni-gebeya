import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ListingCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-sm transition-all",
        className
      )}
    >
      {/* Product Image Skeleton with Badge Placeholder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
        <Skeleton className="h-full w-full" />
        <div className="absolute right-2 top-2">
          <Skeleton className="h-6 w-16 rounded-full bg-background/50 backdrop-blur-sm" />
        </div>
      </div>

      {/* Card Content Skeleton */}
      <div className="mt-3 flex flex-1 flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-3 w-1/2" />
        </div>

        {/* Price & Location Skeleton */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="space-y-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
