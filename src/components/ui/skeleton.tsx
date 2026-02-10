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

export { Skeleton }
