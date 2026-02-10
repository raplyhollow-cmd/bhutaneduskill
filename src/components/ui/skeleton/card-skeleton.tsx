import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface CardSkeletonProps {
  /**
   * Number of skeleton rows to display in the card content
   * @default 3
   */
  rows?: number
  /**
   * Whether to show an avatar placeholder in the card header
   * @default false
   */
  showAvatar?: boolean
  /**
   * Whether to show a title in the card header
   * @default true
   */
  showTitle?: boolean
  /**
   * Whether to show a description in the card header
   * @default true
   */
  showDescription?: boolean
  /**
   * Whether to show a footer section
   * @default false
   */
  showFooter?: boolean
  /**
   * Custom className for the card
   */
  className?: string
}

export function CardSkeleton({
  rows = 3,
  showAvatar = false,
  showTitle = true,
  showDescription = true,
  showFooter = false,
  className,
}: CardSkeletonProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="gap-4">
        {showAvatar && (
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 animate-pulse rounded-full rounded-lg bg-muted duration-500" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/3 animate-pulse rounded-lg bg-muted duration-500" />
              <div className="h-3 w-1/4 animate-pulse rounded-lg bg-muted duration-500" />
            </div>
          </div>
        )}
        {showTitle && (
          <div className="h-6 w-3/4 animate-pulse rounded-lg bg-muted duration-500" />
        )}
        {showDescription && (
          <div className="h-4 w-full animate-pulse rounded-lg bg-muted duration-500" />
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "animate-pulse rounded-lg bg-muted duration-500",
              i === 0 && "h-4 w-full",
              i === 1 && "h-4 w-5/6",
              i === 2 && "h-4 w-4/6",
              i > 2 && "h-4 w-full"
            )}
          />
        ))}
      </CardContent>
      {showFooter && (
        <div className="flex items-center justify-between px-6 pb-6 pt-0">
          <div className="h-8 w-24 animate-pulse rounded-lg bg-muted duration-500" />
          <div className="h-8 w-20 animate-pulse rounded-lg bg-muted duration-500" />
        </div>
      )}
    </Card>
  )
}

/**
 * A compact card skeleton variant for stats/metrics cards
 */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="h-4 w-1/2 animate-pulse rounded-lg bg-muted duration-500" />
          <div className="h-8 w-1/3 animate-pulse rounded-lg bg-muted duration-500" />
          <div className="h-3 w-2/3 animate-pulse rounded-lg bg-muted duration-500" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * A grid of card skeletons - useful for dashboard layouts
 */
export function CardGridSkeleton({
  count = 4,
  ...props
}: CardSkeletonProps & { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}
