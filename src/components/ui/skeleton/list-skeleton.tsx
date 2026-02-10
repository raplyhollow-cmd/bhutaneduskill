import * as React from "react"
import { cn } from "@/lib/utils"

interface ListSkeletonProps {
  /**
   * Number of list items to display
   * @default 5
   */
  items?: number
  /**
   * Whether to show an icon/avatar for each item
   * @default false
   */
  showIcon?: boolean
  /**
   * Whether to show a secondary text line for each item
   * @default true
   */
  showSecondary?: boolean
  /**
   * Whether to show an action button on the right side of each item
   * @default false
   */
  showAction?: boolean
  /**
   * Custom className for the list container
   */
  className?: string
}

export function ListSkeleton({
  items = 5,
  showIcon = false,
  showSecondary = true,
  showAction = false,
  className,
}: ListSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {showIcon && (
            <div className="h-10 w-10 shrink-0 animate-pulse rounded bg-muted" />
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            {showSecondary && (
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            )}
          </div>
          {showAction && (
            <div className="h-8 w-20 shrink-0 animate-pulse rounded bg-muted" />
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * A vertical list skeleton with larger items (like for activity feeds)
 */
export function ActivityListSkeleton({
  items = 4,
  className,
}: Omit<ListSkeletonProps, "showIcon" | "showSecondary" | "showAction">) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            {i < items - 1 && (
              <div className="my-2 h-full w-0.5 animate-pulse bg-muted" />
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-16 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * A horizontal list skeleton (useful for tag lists or inline items)
 */
export function HorizontalListSkeleton({
  items = 5,
  className,
}: Pick<ListSkeletonProps, "items" | "className">) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="h-8 w-20 animate-pulse rounded-full bg-muted"
        />
      ))}
    </div>
  )
}

/**
 * A notification list skeleton variant
 */
export function NotificationListSkeleton({
  items = 5,
  className,
}: Pick<ListSkeletonProps, "items" | "className">) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg border p-4"
        >
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
