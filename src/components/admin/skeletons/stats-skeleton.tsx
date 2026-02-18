/**
 * STATS SKELETON LOADER
 *
 * Premium shimmer loading state for stat cards
 * Matches Vercel's dashboard loading pattern
 *
 * Usage:
 *   <StatsSkeleton count={6} />
 *   <LargeStatsSkeleton count={3} />
 */

import { cn } from "@/lib/utils";

interface StatsSkeletonProps {
  count?: number;
  className?: string;
  large?: boolean;
}

/**
 * Stats Card Skeleton
 *
 * Individual stat card loading state
 */
function StatCardSkeleton({ large = false }: { large?: boolean }) {
  return (
    <div className="p-6 border border-gray-200 rounded-lg bg-white">
      {/* Icon + Label row */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className={cn(
            "bg-gray-200 rounded animate-pulse",
            large ? "w-6 h-6" : "w-4 h-4"
          )}
        />
        <div
          className={cn(
            "h-3 bg-gray-200 rounded animate-pulse",
            large ? "w-24" : "w-20"
          )}
        />
      </div>

      {/* Value */}
      <div
        className={cn(
          "h-8 bg-gray-200 rounded animate-pulse mb-2",
          large ? "w-20" : "w-16"
        )}
      />

      {/* Subtitle/trend */}
      <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
    </div>
  );
}

/**
 * Stats Grid Skeleton
 *
 * Grid of stat card skeletons
 */
export function StatsSkeleton({
  count = 6,
  className,
  large = false,
}: StatsSkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        !large && "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
        large && "grid-cols-1 md:grid-cols-3",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} large={large} />
      ))}
    </div>
  );
}

/**
 * Large Stats Skeleton (for bigger stat cards)
 */
export function LargeStatsSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} large />
      ))}
    </div>
  );
}

/**
 * Metric Card Skeleton (with chart)
 */
export function MetricCardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("p-6 border border-gray-200 rounded-lg bg-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
      </div>

      {/* Chart placeholder */}
      <div className="h-40 bg-gray-100 rounded animate-pulse mb-4" />

      {/* Sub-metrics */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
            <div className="h-5 bg-gray-200 rounded w-12 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Dashboard Overview Skeleton
 *
 * Complete dashboard loading state
 */
export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
      </div>

      {/* Stats grid */}
      <StatsSkeleton count={6} />

      {/* Cards grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
