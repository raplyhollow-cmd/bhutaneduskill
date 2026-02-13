import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The height of the skeleton element
   * @default "h-4"
   */
  height?: string
  /**
   * The width of the skeleton element
   * @default "w-full"
   */
  width?: string
  /**
   * Whether to disable the pulse animation
   * @default false
   */
  disableAnimation?: boolean
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, height = "h-4", width = "w-full", disableAnimation = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse rounded-md bg-muted",
          !disableAnimation && "animate-pulse",
          height,
          width,
          className
        )}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

// ============================================================================
// CARD SKELETON
// ============================================================================

interface CardSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  showIcon?: boolean
  lines?: number
}

const CardSkeleton = React.forwardRef<HTMLDivElement, CardSkeletonProps>(
  ({ showIcon = true, lines = 2, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4",
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          {showIcon && <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        {lines > 0 && (
          <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>
        )}
      </div>
    )
  }
)
CardSkeleton.displayName = "CardSkeleton"

// ============================================================================
// STATS CARD SKELETON
// ============================================================================

const StatsCardSkeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
          <Skeleton className="w-10 h-10 rounded-lg" />
        </div>
      </div>
    )
  }
)
StatsCardSkeleton.displayName = "StatsCardSkeleton"

// ============================================================================
// LIST SKELETON
// ============================================================================

interface ListSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: number
  showAvatar?: boolean
}

const ListSkeleton = React.forwardRef<HTMLDivElement, ListSkeletonProps>(
  ({ items = 5, showAvatar = true, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-3", className)} {...props}>
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
            {showAvatar && <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="w-16 h-8 rounded-md flex-shrink-0" />
          </div>
        ))}
      </div>
    )
  }
)
ListSkeleton.displayName = "ListSkeleton"

// ============================================================================
// DASHBOARD SKELETON (combined)
// ============================================================================

const DashboardSkeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-6", className)} {...props}>
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        {/* Quick actions */}
        <div>
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-24 rounded-xl bg-muted animate-pulse" />
            <div className="h-24 rounded-xl bg-muted animate-pulse" />
            <div className="h-24 rounded-xl bg-muted animate-pulse" />
            <div className="h-24 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>

        {/* Recent items */}
        <div>
          <Skeleton className="h-6 w-40 mb-4" />
          <ListSkeleton items={5} />
        </div>
      </div>
    )
  }
)
DashboardSkeleton.displayName = "DashboardSkeleton"

export { Skeleton, CardSkeleton, StatsCardSkeleton, ListSkeleton, DashboardSkeleton }
