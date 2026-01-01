import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted pixel-border-inset",
        className
      )}
      {...props}
    />
  );
}

// Card Skeleton for profile cards, friend cards, etc.
export function CardSkeleton() {
  return (
    <div className="p-4 sm:p-6 bg-card border-2 border-border pixel-border-outset minecraft-texture">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

// List Item Skeleton for friend lists, match history, etc.
export function ListItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-2 md:p-3 mb-2 bg-muted pixel-border animate-pulse">
      <div className="flex items-center space-x-2 md:space-x-3 flex-1">
        <Skeleton className="w-2 h-2 md:w-3 md:h-3 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 md:h-4 w-24 md:w-32" />
          <Skeleton className="h-2 md:h-3 w-32 md:w-40" />
        </div>
      </div>
    </div>
  );
}

// Stats Card Skeleton for dashboard stats
export function StatsCardSkeleton() {
  return (
    <div className="p-3 sm:p-5 flex flex-col items-center justify-center border-2 border-border pixel-border-outset bg-card">
      <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl mb-2 sm:mb-3" />
      <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 mb-1" />
      <Skeleton className="h-3 w-12 sm:w-16" />
    </div>
  );
}

// Match History Skeleton
export function MatchHistorySkeleton() {
  return (
    <div className="p-3 sm:p-4 border-2 rounded-xl bg-muted/20 border-border">
      <div className="flex justify-between items-center">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-4 w-12 ml-auto" />
          <Skeleton className="h-3 w-10 ml-auto" />
        </div>
      </div>
    </div>
  );
}
