import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/70 dark:bg-muted/40",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer",
        "after:bg-gradient-to-r after:from-transparent after:via-white/10 dark:after:via-white/5 after:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
