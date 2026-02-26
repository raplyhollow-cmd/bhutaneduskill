/**
 * Clerk-Style Toast Component
 *
 * Individual toast notification with Clerk.com's design aesthetic
 * - Compact height (~44px)
 * - Subtle border with backdrop blur
 * - Smooth slide-in animation (from right)
 * - Icon on left (colored by type)
 * - Close button on right
 * - Progress bar for auto-dismiss
 * - Click to dismiss
 *
 * @example
 * ```tsx
 * <ClerkToast
 *   toast={toastData}
 *   onDismiss={dismiss}
 *   position="top-right"
 *   index={0}
 * />
 * ```
 */

"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { ToastProps } from "./types"
import {
  toastColors,
  toastSpacing,
  toastShadow,
  toastTypography,
  toastSize,
  toastProgress,
} from "./tokens"
import { getAnimationForPosition, progressShrink, iconBounce, spinner } from "./animations"

// ============================================================================
// ICONS
// ============================================================================

const variantIcons = {
  success: <CheckCircle2 strokeWidth={2.5} className="w-full h-full" />,
  error: <AlertCircle strokeWidth={2.5} className="w-full h-full" />,
  warning: <AlertTriangle strokeWidth={2.5} className="w-full h-full" />,
  info: <Info strokeWidth={2.5} className="w-full h-full" />,
  loading: <Loader2 strokeWidth={2} className="w-full h-full" />,
  default: <Info strokeWidth={2} className="w-full h-full" />,
}

// ============================================================================
// TOAST COMPONENT
// ============================================================================

export function ClerkToast({ toast, onDismiss, position, index }: ToastProps) {
  const {
    id,
    title,
    description,
    variant = "default",
    duration = 5000,
    action,
    onDismiss: onDismissCallback,
    showProgress = true,
    icon: customIcon,
    dismissOnClick = true,
    closeable = true,
  } = toast

  const [isHovered, setIsHovered] = useState(false)
  const [progress, setProgress] = useState(1)
  const animation = getAnimationForPosition(position)

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    onDismissCallback?.()
    onDismiss(id)
  }, [id, onDismiss, onDismissCallback])

  // Auto-dismiss with progress
  useEffect(() => {
    if (duration <= 0 || variant === "loading" || isHovered) {
      return
    }

    const startTime = Date.now()
    const animateProgress = () => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, duration - elapsed)
      const newProgress = remaining / duration

      setProgress(newProgress)

      if (remaining > 0) {
        requestAnimationFrame(animateProgress)
      } else {
        handleDismiss()
      }
    }

    const rafId = requestAnimationFrame(animateProgress)
    return () => cancelAnimationFrame(rafId)
  }, [duration, variant, isHovered, handleDismiss])

  // Get icon color
  const getIconColor = () => {
    const colors: Record<string, string> = {
      success: toastColors.icon.success,
      error: toastColors.icon.error,
      warning: toastColors.icon.warning,
      info: toastColors.icon.info,
      loading: toastColors.icon.loading,
      default: toastColors.icon.default,
    }
    return colors[variant] || colors.default
  }

  // Get progress color
  const getProgressColor = () => {
    const colors: Record<string, string> = {
      success: toastProgress.color.success,
      error: toastProgress.color.error,
      warning: toastProgress.color.warning,
      info: toastProgress.color.info,
      loading: toastProgress.color.loading,
      default: toastProgress.color.default,
    }
    return colors[variant] || colors.default
  }

  return (
    <motion.div
      layout
      variants={animation}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{
        minHeight: toastSize.minHeight.DEFAULT,
        width: toastSize.width.DEFAULT,
        maxWidth: "calc(100vw - 48px)",
        background: toastColors.background.DEFAULT,
        border: `1px solid ${toastColors.border.DEFAULT}`,
        boxShadow: toastShadow.DEFAULT,
        borderRadius: toastSpacing.radius.DEFAULT,
        padding: toastSpacing.padding.DEFAULT,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
      className={cn(
        "relative flex items-start gap-3 pointer-events-auto",
        "cursor-pointer select-none"
      )}
      onClick={dismissOnClick ? handleDismiss : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Progress bar at top */}
      {showProgress && duration > 0 && variant !== "loading" && (
        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden rounded-t-lg">
          <motion.div
            className="h-full origin-left"
            style={{ backgroundColor: getProgressColor() }}
            initial={{ scaleX: 1 }}
            animate={{
              scaleX: isHovered ? progress : 0,
            }}
            transition={{
              duration: isHovered ? 0 : duration / 1000,
              ease: "linear",
            }}
          />
        </div>
      )}

      {/* Icon */}
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: toastSpacing.icon.large,
          height: toastSpacing.icon.large,
          color: getIconColor(),
          marginTop: "1px",
        }}
      >
        {variant === "loading" ? (
          <motion.div
            variants={spinner}
            initial="hidden"
            animate="visible"
            className="w-full h-full"
          >
            {customIcon || variantIcons[variant]}
          </motion.div>
        ) : (
          <motion.div
            variants={iconBounce}
            initial="hidden"
            animate="visible"
            className="w-full h-full"
          >
            {customIcon || variantIcons[variant]}
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {title && (
          <p
            style={{
              fontSize: toastTypography.fontSize.title,
              fontWeight: toastTypography.fontWeight.title,
              lineHeight: toastTypography.lineHeight.title,
              color: toastColors.text.primary,
            }}
            className="truncate"
          >
            {title}
          </p>
        )}
        {description && (
          <p
            style={{
              fontSize: toastTypography.fontSize.description,
              fontWeight: toastTypography.fontWeight.description,
              lineHeight: toastTypography.lineHeight.description,
              color: toastColors.text.secondary,
            }}
            className={cn(
              "truncate",
              title && "mt-0.5"
            )}
          >
            {description}
          </p>
        )}
        {action && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation()
              action.onClick()
              handleDismiss()
            }}
            className={cn(
              "inline-flex items-center justify-center",
              "px-3 py-1.5 rounded-md text-sm font-medium mt-2",
              "transition-colors duration-150"
            )}
            style={{
              fontSize: toastTypography.fontSize.action,
              fontWeight: toastTypography.fontWeight.action,
              backgroundColor:
                action.variant === "primary"
                  ? toastColors.action.primary
                  : action.variant === "danger"
                  ? toastColors.action.danger
                  : toastColors.action.ghost,
              color:
                action.variant === "ghost"
                  ? toastColors.text.primary
                  : "#ffffff",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {action.label}
          </motion.button>
        )}
      </div>

      {/* Close button */}
      {closeable && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation()
            handleDismiss()
          }}
          className="flex-shrink-0 p-1 rounded-md transition-colors"
          style={{
            color: toastColors.text.tertiary,
            marginTop: "-2px",
            marginRight: "-2px",
          }}
          whileHover={{
            scale: 1.1,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            color: toastColors.text.primary,
          }}
          whileTap={{ scale: 0.9 }}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </motion.button>
      )}
    </motion.div>
  )
}

// ============================================================================
// COMPACT VARIANT (for space-constrained areas)
// ============================================================================

interface CompactClerkToastProps extends Omit<ToastProps, "index"> {
  compact?: boolean
}

export function CompactClerkToast({ toast, onDismiss, position, compact = true }: CompactClerkToastProps) {
  const { id, title, description, variant = "default", closeable = true, onDismiss: onDismissCallback } = toast

  const handleDismiss = () => {
    onDismissCallback?.()
    onDismiss(id)
  }

  const getIconColor = () => {
    const colors: Record<string, string> = {
      success: toastColors.icon.success,
      error: toastColors.icon.error,
      warning: toastColors.icon.warning,
      info: toastColors.icon.info,
      loading: toastColors.icon.loading,
      default: toastColors.icon.default,
    }
    return colors[variant] || colors.default
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={{
        minHeight: compact ? toastSize.minHeight.compact : toastSize.minHeight.DEFAULT,
        background: toastColors.background.DEFAULT,
        border: `1px solid ${toastColors.border.DEFAULT}`,
        boxShadow: toastShadow.subtle,
        borderRadius: toastSpacing.radius.compact,
        padding: compact ? toastSpacing.padding.compact : toastSpacing.padding.DEFAULT,
      }}
      className={cn(
        "relative flex items-center gap-2 pointer-events-auto",
        "cursor-pointer"
      )}
      onClick={handleDismiss}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: toastSpacing.icon.compact,
          height: toastSpacing.icon.compact,
          color: getIconColor(),
        }}
      >
        {variant === "loading" ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, repeatType: "loop", duration: 1, ease: "linear" }}
            className="w-full h-full"
          >
            <Loader2 strokeWidth={2.5} className="w-full h-full" />
          </motion.div>
        ) : (
          variantIcons[variant]
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          style={{
            fontSize: toastTypography.fontSize.description,
            fontWeight: toastTypography.fontWeight.description,
            color: toastColors.text.primary,
          }}
          className="truncate"
        >
          {title || description}
        </p>
      </div>

      {/* Close button */}
      {closeable && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation()
            handleDismiss()
          }}
          className="flex-shrink-0"
          style={{ color: toastColors.text.tertiary }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-3.5 h-3.5" />
        </motion.button>
      )}
    </motion.div>
  )
}
