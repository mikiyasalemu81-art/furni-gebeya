import { Skeleton } from "@/components/ui/skeleton";

export function CategorySkeletonRow({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-shrink-0 flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 shadow-xs min-w-[84px]"
        >
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-3 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}
