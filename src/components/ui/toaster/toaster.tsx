/**
 * Clerk-Style Toaster Container
 *
 * Manages the display and positioning of toast notifications
 * - Fixed positioning (top-right by default, like Clerk)
 * - Stacked layout with gap
 * - AnimatePresence for smooth enter/exit
 * - Maximum visible toasts limit
 *
 * @example
 * ```tsx
 * <Toaster position="top-right" maxToasts={5} />
 * ```
 */

"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useCallback, useMemo } from "react"
import { ClerkToast } from "./clerk-toast"
import { useToasterContext } from "./context"
import { cn } from "@/lib/utils"
import { toastPosition } from "./tokens"
import type { ToastPosition } from "./types"

// ============================================================================
// TOASTER COMPONENT
// ============================================================================

export interface ToasterProps {
  /**
   * Position of the toast container
   * @default "top-right"
   */
  position?: ToastPosition

  /**
   * Maximum number of toasts to show at once
   * @default 5
   */
  maxToasts?: number

  /**
   * Gap between stacked toasts (in px)
   * @default 12
   */
  gap?: number

  /**
   * Z-index for the toaster
   * @default 700 (from design tokens)
   */
  zIndex?: number

  /**
   * Reverse the stack order (newest on top)
   * @default false (newest on bottom for top-right, etc.)
   */
  reverseOrder?: boolean

  /**
   * Custom class name for the container
   */
  className?: string
}

export function Toaster({
  position = "top-right",
  maxToasts = 5,
  gap = 12,
  zIndex = toastPosition.zIndex,
  reverseOrder = false,
  className,
}: ToasterProps) {
  const { toasts, dismiss } = useToasterContext()

  // Filter toasts by position and limit
  const visibleToasts = useMemo(() => {
    const filtered = toasts
      .filter((t) => (t.position ?? position) === position)
      .slice(-maxToasts)

    return reverseOrder ? filtered.reverse() : filtered
  }, [toasts, position, maxToasts, reverseOrder])

  // Handle toast dismiss
  const handleDismiss = useCallback((id: string) => {
    dismiss(id)
  }, [dismiss])

  // Position styles
  const positionStyles: Record<ToastPosition, string> = {
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-center": "top-6 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
  }

  // Stack direction based on position
  const isTop = position.startsWith("top")
  const stackDirection = isTop ? "flex-col" : "flex-col-reverse"

  return (
    <div
      className={cn(
        "fixed flex pointer-events-none",
        positionStyles[position],
        stackDirection,
        className
      )}
      style={{
        zIndex,
        gap: `${gap}px`,
      }}
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            layout
            className="pointer-events-auto"
            style={{
              // Offset for stacked animation
              y: index * 2,
            }}
          >
            <ClerkToast
              toast={toast}
              onDismiss={handleDismiss}
              position={toast.position ?? position}
              index={index}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// MULTI-POSITION TOASTER (renders all positions)
// ============================================================================

/**
 * Multi-position toaster that renders toasts in all configured positions
 * Use this if you want to support multiple toast positions simultaneously
 */
export function MultiPositionToaster(props: Omit<ToasterProps, "position">) {
  return (
    <>
      <Toaster {...props} position="top-right" />
      <Toaster {...props} position="top-left" />
      <Toaster {...props} position="bottom-right" />
      <Toaster {...props} position="bottom-left" />
    </>
  )
}

// ============================================================================
// PRESET TOASTERS (for common use cases)
// ============================================================================

/**
 * Top-right toaster (Clerk's default position)
 * This is the most common position for toasts
 */
export function TopRightToaster(props: Omit<ToasterProps, "position">) {
  return <Toaster {...props} position="top-right" />
}

/**
 * Bottom-right toaster
 * Good for less critical notifications
 */
export function BottomRightToaster(props: Omit<ToasterProps, "position">) {
  return <Toaster {...props} position="bottom-right" />
}

/**
 * Center-top toaster
 * Good for important alerts
 */
export function CenterTopToaster(props: Omit<ToasterProps, "position">) {
  return <Toaster {...props} position="top-center" />
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default Toaster
