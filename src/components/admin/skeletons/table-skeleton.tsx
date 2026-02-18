/**
 * TABLE SKELETON LOADER
 *
 * Premium shimmer loading state for tables
 * Uses pulse animation matching Vercel's skeleton pattern
 *
 * Usage:
 *   <TableSkeleton rows={5} columns={4} />
 */

import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/**
 * Table Skeleton
 *
 * Shows animated placeholder rows while data loads
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Header skeleton */}
      <div className="flex gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`header-${i}`}
            className="h-4 bg-gray-200 rounded w-24 animate-pulse"
          />
        ))}
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex gap-4 px-4 py-3 border-b border-gray-100"
        >
          {/* Checkbox placeholder */}
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse flex-shrink-0" />

          {/* Cell skeletons */}
          {Array.from({ length: columns - 1 }).map((_, cellIndex) => (
            <div
              key={`cell-${rowIndex}-${cellIndex}`}
              className={cn(
                "h-4 bg-gray-200 rounded animate-pulse",
                cellIndex === 0 ? "w-1/3" : cellIndex === 1 ? "w-1/4" : "w-20"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Compact Table Skeleton (for small tables)
 */
interface CompactTableSkeletonProps {
  rows?: number;
  className?: string;
}

export function CompactTableSkeleton({
  rows = 3,
  className,
}: CompactTableSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
        >
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>
          <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/**
 * List Item Skeleton (for card-based lists)
 */
export function ListItemSkeleton({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {/* Avatar/Icon skeleton */}
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />

          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-64 animate-pulse" />
          </div>

          {/* Badge skeleton */}
          <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse" />

          {/* Actions skeleton */}
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
