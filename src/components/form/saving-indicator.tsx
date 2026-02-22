"use client"

import { Check, Loader2 } from "lucide-react"
import { memo, useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { formatTimeAgo } from "@/hooks/use-debounced-save"

/**
 * Saving Indicator Component
 *
 * Displays the current save status with animated states:
 * - Saving: Pulsing dot with "Saving..." text
 * - Saved: Checkmark with relative time (e.g., "Saved 2m ago")
 *
 * @example
 * ```tsx
 * <SavingIndicator isSaving={false} lastSaved={new Date()} />
 * ```
 */
export interface SavingIndicatorProps {
  isSaving: boolean
  lastSaved: Date | null
  className?: string
  variant?: "compact" | "full"
}

export const SavingIndicator = memo(
  ({ isSaving, lastSaved, className, variant = "full" }: SavingIndicatorProps) => {
    const [displayTime, setDisplayTime] = useState<string>("")

    // Update relative time every second when saved
    useEffect(() => {
      if (!lastSaved || isSaving) {
        setDisplayTime("")
        return
      }

      const updateTime = () => {
        setDisplayTime(formatTimeAgo(lastSaved))
      }

      updateTime()
      const interval = setInterval(updateTime, 1000)

      return () => clearInterval(interval)
    }, [lastSaved, isSaving])

    if (isSaving) {
      return (
        <div
          className={cn(
            "flex items-center gap-2 text-sm text-gray-500",
            className
          )}
          aria-live="polite"
          aria-label="Saving changes"
        >
          {/* Animated pulsing dot */}
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"
              )}
            />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
          </span>
          <span className="animate-pulse">Saving...</span>
        </div>
      )
    }

    if (lastSaved && displayTime) {
      return (
        <div
          className={cn(
            "flex items-center gap-2 text-sm text-gray-500",
            className
          )}
          aria-live="polite"
          aria-label={`Last saved ${displayTime}`}
        >
          <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
          {variant === "full" ? (
            <span>Saved {displayTime}</span>
          ) : (
            <span>{displayTime}</span>
          )}
        </div>
      )
    }

    return null
  }
)

SavingIndicator.displayName = "SavingIndicator"

/**
 * Compact saving indicator for use in toolbars
 * Shows minimal UI with icon-only state when compact
 */
export interface CompactSavingIndicatorProps {
  isSaving: boolean
  lastSaved: Date | null
  className?: string
}

export const CompactSavingIndicator = memo(
  ({ isSaving, lastSaved, className }: CompactSavingIndicatorProps) => {
    return (
      <SavingIndicator
        isSaving={isSaving}
        lastSaved={lastSaved}
        variant="compact"
        className={cn("text-xs", className)}
      />
    )
  }
)

CompactSavingIndicator.displayName = "CompactSavingIndicator"

/**
 * Inline saving badge for use in form headers
 */
export interface SavingBadgeProps {
  isSaving: boolean
  lastSaved: Date | null
  error?: Error | null
  className?: string
}

export const SavingBadge = memo(
  ({ isSaving, lastSaved, error, className }: SavingBadgeProps) => {
    const [displayTime, setDisplayTime] = useState<string>("")

    useEffect(() => {
      if (!lastSaved || isSaving) {
        setDisplayTime("")
        return
      }

      const updateTime = () => {
        const timeStr = formatTimeAgo(lastSaved)
        setDisplayTime(timeStr === "just now" ? "Saved" : `Saved ${timeStr}`)
      }

      updateTime()
      const interval = setInterval(updateTime, 1000)

      return () => clearInterval(interval)
    }, [lastSaved, isSaving])

    if (error) {
      return (
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            "bg-red-50 text-red-700 border border-red-200",
            "dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50",
            className
          )}
          aria-live="polite"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
          <span>Saved failed</span>
        </div>
      )
    }

    if (isSaving) {
      return (
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            "bg-blue-50 text-blue-700 border border-blue-200",
            "dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
            className
          )}
          aria-live="polite"
        >
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          <span>Saving...</span>
        </div>
      )
    }

    if (lastSaved && displayTime) {
      return (
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            "bg-green-50 text-green-700 border border-green-200",
            "dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50",
            className
          )}
          aria-live="polite"
        >
          <Check className="h-3 w-3" aria-hidden="true" />
          <span>{displayTime}</span>
        </div>
      )
    }

    return null
  }
)

SavingBadge.displayName = "SavingBadge"
