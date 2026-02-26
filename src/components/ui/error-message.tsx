import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AlertCircle, AlertTriangle, Info, XCircle, RefreshCw } from "lucide-react"

export type ErrorMessageVariant = "error" | "warning" | "info" | "critical"

export interface ErrorMessageProps {
  /**
   * The title of the error message
   */
  title?: string
  /**
   * The error message content
   */
  message: string
  /**
   * The severity level of the error
   */
  variant?: ErrorMessageVariant
  /**
   * Optional retry action
   */
  retryAction?: {
    label: string
    onClick: () => void
  }
  /**
   * Optional dismiss action
   */
  onDismiss?: () => void
  /**
   * Whether to show the error icon
   */
  showIcon?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Size variant
   */
  size?: "sm" | "default" | "lg"
}

const variantStyles = {
  error: {
    container: "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800",
    title: "text-red-900 dark:text-red-100",
    message: "text-red-700 dark:text-red-300",
    icon: "text-red-500",
    iconBg: "bg-red-100 dark:bg-red-900/30",
  },
  warning: {
    container: "border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800",
    title: "text-orange-900 dark:text-orange-100",
    message: "text-orange-700 dark:text-orange-300",
    icon: "text-orange-500",
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
  },
  info: {
    container: "border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800",
    title: "text-blue-900 dark:text-blue-100",
    message: "text-blue-700 dark:text-blue-300",
    icon: "text-blue-500",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
  },
  critical: {
    container: "border-red-300 bg-red-100 dark:bg-red-950/40 dark:border-red-700",
    title: "text-red-900 dark:text-red-50",
    message: "text-red-800 dark:text-red-200",
    icon: "text-red-600",
    iconBg: "bg-red-200 dark:bg-red-900/50",
  },
}

const sizeStyles = {
  sm: {
    container: "p-3",
    icon: "w-4 h-4",
    title: "text-sm font-semibold",
    message: "text-xs",
  },
  default: {
    container: "p-4",
    icon: "w-5 h-5",
    title: "text-base font-semibold",
    message: "text-sm",
  },
  lg: {
    container: "p-6",
    icon: "w-6 h-6",
    title: "text-lg font-semibold",
    message: "text-base",
  },
}

const iconMap = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  critical: XCircle,
}

const containerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.15,
    },
  },
}

/**
 * ErrorMessage Component
 *
 * A consistent error message component with different severity levels,
 * optional retry/dismiss actions, and proper accessibility.
 *
 * @example
 * ```tsx
 * <ErrorMessage
 *   title="Failed to load data"
 *   message="Please check your connection and try again."
 *   variant="error"
 *   retryAction={{ label: "Retry", onClick: handleRetry }}
 * />
 * ```
 */
export function ErrorMessage({
  title,
  message,
  variant = "error",
  retryAction,
  onDismiss,
  showIcon = true,
  className,
  size = "default",
}: ErrorMessageProps) {
  const styles = variantStyles[variant]
  const sizeConfig = sizeStyles[size]
  const IconComponent = iconMap[variant]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        "relative rounded-lg border",
        styles.container,
        sizeConfig.container,
        className
      )}
      role="alert"
      aria-live={variant === "critical" ? "assertive" : "polite"}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {showIcon && (
          <div className={cn(
            "flex-shrink-0 rounded-full p-1.5",
            styles.iconBg
          )}>
            <IconComponent className={cn(sizeConfig.icon, styles.icon)} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={cn(sizeConfig.title, styles.title)}>
              {title}
            </h3>
          )}
          <p className={cn(
            sizeConfig.message,
            styles.message,
            title && "mt-1"
          )}>
            {message}
          </p>

          {/* Actions */}
          {(retryAction || onDismiss) && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {retryAction && (
                <Button
                  size={size === "sm" ? "sm" : "default"}
                  variant={variant === "critical" ? "default" : "outline"}
                  onClick={retryAction.onClick}
                  className={cn(
                    "gap-1.5",
                    variant === "error" && "border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30",
                    variant === "warning" && "border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/30",
                    variant === "info" && "border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
                  )}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {retryAction.label}
                </Button>
              )}
              {onDismiss && (
                <Button
                  size={size === "sm" ? "sm" : "default"}
                  variant="ghost"
                  onClick={onDismiss}
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Dismiss button (top-right X) */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              "flex-shrink-0 rounded p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10",
              styles.message
            )}
            aria-label="Dismiss error"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

/**
 * InlineError - A compact inline error message
 * Useful for form validation errors
 */
export interface InlineErrorProps {
  message: string
  className?: string
}

export function InlineError({ message, className }: InlineErrorProps) {
  return (
    <div className={cn("flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs mt-1", className)}>
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

/**
 * FormFieldError - Error message for form fields
 */
export interface FormFieldErrorProps {
  error?: string | string[]
  className?: string
}

export function FormFieldError({ error, className }: FormFieldErrorProps) {
  if (!error) return null

  const errorMessage = Array.isArray(error) ? error[0] : error

  return (
    <div className={cn("mt-1.5", className)}>
      <InlineError message={errorMessage} />
    </div>
  )
}
