/**
 * MODERN SHIMMER SKELETON
 *
 * Next-gen loading skeleton with shimmer effect inspired by Vercel and Linear.
 *
 * FEATURES:
 * - Smooth shimmer animation (left to right)
 * - Subtle gradient shimmer
 * - Configurable speed and direction
 * - Multiple variants (card, button, input, text)
 * - Dark mode support
 *
 * DESIGN PHILOSOPHY:
 * - "Loading should feel fast"
 * - Subtle shimmer, not aggressive pulse
 * - Consistent with final content shape
 *
 * @example
 * ```tsx
 * import { ShimmerSkeleton, ShimmerCard, ShimmerButton } from "@/components/ui/skeleton/shimmer-skeleton"
 *
 * <ShimmerCard title height={24} />
 * <ShimmerButton />
 * <ShimmerSkeleton lines={3} />
 * ```
 */

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// =============================================================================
// TYPES
// =============================================================================

export interface ShimmerSkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  variant?: "text" | "circular" | "rectangular"
  animationSpeed?: "slow" | "normal" | "fast"
}

export interface ShimmerTextProps {
  lines?: number
  className?: string
  lastLineWidth?: string
}

export interface ShimmerCardProps {
  showAvatar?: boolean
  showTitle?: boolean
  lines?: number
  className?: string
  avatarSize?: number
}

export interface ShimmerButtonProps {
  width?: string | number
  size?: "sm" | "md" | "lg"
  className?: string
}

export interface ShimmerInputProps {
  width?: string | number
  className?: string
  label?: boolean
}

// =============================================================================
// BASE SHIMMER COMPONENT
// =============================================================================

const shimmerVariants = {
  slow: "animate-shimmer-slow",
  normal: "animate-shimmer",
  fast: "animate-shimmer-fast",
}

export function ShimmerSkeleton({
  className,
  width,
  height,
  variant = "rectangular",
  animationSpeed = "normal",
}: ShimmerSkeletonProps) {
  const variantStyles = {
    text: "rounded-md h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gray-100 dark:bg-gray-800",
        shimmerVariants[animationSpeed],
        variantStyles[variant],
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer-slide">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent dark:via-gray-700/50" />
      </div>
    </div>
  )
}

// =============================================================================
// TEXT SKELETON
// =============================================================================

export function ShimmerText({
  lines = 3,
  className,
  lastLineWidth = "70%",
}: ShimmerTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerSkeleton
          key={i}
          width={i === lines - 1 ? lastLineWidth : "100%"}
          variant="text"
        />
      ))}
    </div>
  )
}

// =============================================================================
// CARD SKELETON
// =============================================================================

export function ShimmerCard({
  showAvatar = true,
  showTitle = true,
  lines = 2,
  className,
  avatarSize = 40,
}: ShimmerCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {showAvatar && (
          <ShimmerSkeleton
            width={avatarSize}
            height={avatarSize}
            variant="circular"
          />
        )}
        <div className="flex-1 space-y-3">
          {showTitle && <ShimmerSkeleton width="60%" height={20} variant="text" />}
          <ShimmerText lines={lines} lastLineWidth="80%" />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// BUTTON SKELETON
// =============================================================================

const buttonSizes = {
  sm: { height: "h-9", width: "w-20" },
  md: { height: "h-10", width: "w-24" },
  lg: { height: "h-11", width: "w-32" },
}

export function ShimmerButton({
  width,
  size = "md",
  className,
}: ShimmerButtonProps) {
  return (
    <div
      className={cn(
        "inline-block rounded-md bg-gray-100 dark:bg-gray-800",
        buttonSizes[size].height,
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width || buttonSizes[size].width,
      }}
    >
      <div className="h-full w-full relative overflow-hidden rounded-md">
        <div className="absolute inset-0 -translate-x-full animate-shimmer-slide">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent dark:via-gray-700/50" />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// INPUT SKELETON
// =============================================================================

export function ShimmerInput({
  width,
  className,
  label = false,
}: ShimmerInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && <ShimmerSkeleton width="30%" height={16} variant="text" />}
      <ShimmerSkeleton
        width={width || "100%"}
        height={40}
        variant="rectangular"
      />
    </div>
  )
}

// =============================================================================
// STATS CARD SKELETON
// =============================================================================

export interface ShimmerStatsCardProps {
  className?: string
  showTrend?: boolean
}

export function ShimmerStatsCard({
  className,
  showTrend = true,
}: ShimmerStatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <ShimmerSkeleton width={80} height={16} variant="text" />
          <ShimmerSkeleton width={60} height={28} variant="text" />
          {showTrend && <ShimmerSkeleton width={100} height={16} variant="text" />}
        </div>
        <ShimmerSkeleton width={40} height={40} variant="rectangular" />
      </div>
    </div>
  )
}

// =============================================================================
// TABLE ROW SKELETON
// =============================================================================

export interface ShimmerTableRowProps {
  columns?: number
  className?: string
}

export function ShimmerTableRow({
  columns = 4,
  className,
}: ShimmerTableRowProps) {
  return (
    <div className={cn("flex items-center gap-4 p-3 border-b border-gray-100 dark:border-gray-800", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <ShimmerSkeleton
          key={i}
          width={i === 0 ? "30%" : i === columns - 1 ? "15%" : "100%"}
          height={16}
          variant="text"
          className={cn(i === 0 ? "flex-shrink-0" : "flex-1")}
        />
      ))}
    </div>
  )
}

// =============================================================================
// MODAL SKELETON
// =============================================================================

export interface ShimmerModalProps {
  showHeader?: boolean
  showFooter?: boolean
  fields?: number
  className?: string
}

export function ShimmerModal({
  showHeader = true,
  showFooter = true,
  fields = 4,
  className,
}: ShimmerModalProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6",
        className
      )}
    >
      {showHeader && (
        <div className="space-y-3 mb-6">
          <ShimmerSkeleton width="40%" height={24} variant="text" />
          <ShimmerSkeleton width="70%" height={16} variant="text" />
        </div>
      )}

      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <ShimmerInput key={i} label />
        ))}
      </div>

      {showFooter && (
        <div className="flex items-center justify-end gap-3 mt-6">
          <ShimmerButton size="md" />
          <ShimmerButton size="md" />
        </div>
      )}
    </div>
  )
}

// =============================================================================
// LIST SKELETON
// =============================================================================

export interface ShimmerListProps {
  items?: number
  showAvatar?: boolean
  className?: string
}

export function ShimmerList({
  items = 5,
  showAvatar = true,
  className,
}: ShimmerListProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
          {showAvatar && <ShimmerSkeleton width={40} height={40} variant="circular" />}
          <div className="flex-1 space-y-2">
            <ShimmerSkeleton width="70%" height={16} variant="text" />
            <ShimmerSkeleton width="50%" height={14} variant="text" />
          </div>
          <ShimmerSkeleton width={60} height={28} variant="rectangular" />
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// DASHBOARD SKELETON
// =============================================================================

export interface ShimmerDashboardProps {
  statsCards?: number
  showRecentActivity?: boolean
  className?: string
}

export function ShimmerDashboard({
  statsCards = 4,
  showRecentActivity = true,
  className,
}: ShimmerDashboardProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: statsCards }).map((_, i) => (
          <ShimmerStatsCard key={i} />
        ))}
      </div>

      {/* Recent Activity */}
      {showRecentActivity && (
        <div>
          <div className="mb-4">
            <ShimmerSkeleton width={150} height={20} variant="text" />
          </div>
          <ShimmerList items={5} />
        </div>
      )}
    </div>
  )
}

// =============================================================================
// AVATAR SKELETON
// =============================================================================

export interface ShimmerAvatarProps {
  size?: number | "sm" | "md" | "lg" | "xl"
  className?: string
}

const avatarSizes = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
}

export function ShimmerAvatar({
  size = "md",
  className,
}: ShimmerAvatarProps) {
  const pixelSize = typeof size === "number" ? size : avatarSizes[size]

  return (
    <ShimmerSkeleton
      width={pixelSize}
      height={pixelSize}
      variant="circular"
      className={className}
    />
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ShimmerSkeleton
