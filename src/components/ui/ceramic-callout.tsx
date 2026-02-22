"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"

// =============================================================================
// TYPES
// =============================================================================

interface CeramicCalloutProps extends React.ComponentProps<"div">, VariantProps<typeof calloutVariants> {
  title?: string
  icon?: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
}

// =============================================================================
// VARIANTS
// =============================================================================

const calloutVariants = cva(
  "flex gap-3 rounded-lg border p-4 w-full",
  {
    variants: {
      variant: {
        default: "bg-ceramic-gray-50 border-ceramic-gray-200 dark:bg-ceramic-gray-900/50 dark:border-ceramic-gray-800",
        info: "bg-blue-50/90 border-blue-200 dark:bg-blue-950/50 dark:border-blue-900/50 text-blue-900 dark:text-blue-100",
        warning: "bg-orange-50/90 border-orange-200 dark:bg-orange-950/50 dark:border-orange-900/50 text-orange-900 dark:text-orange-100",
        error: "bg-red-50/90 border-red-200 dark:bg-red-950/50 dark:border-red-900/50 text-red-900 dark:text-red-100",
        success: "bg-green-50/90 border-green-200 dark:bg-green-950/50 dark:border-green-900/50 text-green-900 dark:text-green-100",
        ceramic: "callout-clerk",
        "ceramic-info": "callout-clerk callout-clerk-info",
        "ceramic-warning": "callout-clerk callout-clerk-warning",
        "ceramic-error": "callout-clerk callout-clerk-error",
        "ceramic-success": "callout-clerk callout-clerk-success",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// =============================================================================
// ICONS
// =============================================================================

const DefaultIcon = () => (
  <AlertCircle className="h-5 w-5 text-ceramic-secondary dark:text-ceramic-gray-400" />
)

const variantIcons = {
  default: DefaultIcon,
  info: <Info className="h-5 w-5 text-ceramic-info" />,
  warning: <AlertTriangle className="h-5 w-5 text-ceramic-warning" />,
  error: <AlertCircle className="h-5 w-5 text-ceramic-negative" />,
  success: <CheckCircle2 className="h-5 w-5 text-ceramic-positive" />,
  ceramic: DefaultIcon,
  "ceramic-info": <Info className="h-5 w-5 text-ceramic-info" />,
  "ceramic-warning": <AlertTriangle className="h-5 w-5 text-ceramic-warning" />,
  "ceramic-error": <AlertCircle className="h-5 w-5 text-ceramic-negative" />,
  "ceramic-success": <CheckCircle2 className="h-5 w-5 text-ceramic-positive" />,
} as const

// =============================================================================
// CALLOUT COMPONENT
// =============================================================================

function CeramicCallout({
  className,
  variant,
  title,
  icon,
  dismissible = false,
  onDismiss,
  children,
  ...props
}: CeramicCalloutProps) {
  const Icon = icon ?? variantIcons[variant || "default"]

  return (
    <div
      data-slot="callout"
      className={cn(calloutVariants({ variant }), className)}
      {...props}
    >
      {/* Icon */}
      {Icon && (
        <div className="callout-icon flex-shrink-0 mt-0.5">
          {Icon as React.ReactNode}
        </div>
      )}

      {/* Content */}
      <div className="callout-content flex-1">
        {title && (
          <div className="callout-title font-semibold text-sm">
            {title}
          </div>
        )}
        <div className="callout-message text-sm [&_p]:leading-relaxed">
          {children}
        </div>
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface CalloutTitleProps extends React.ComponentProps<"div"> {
  children: React.ReactNode
}

function CalloutTitle({ className, children, ...props }: CalloutTitleProps) {
  return (
    <div
      data-slot="callout-title"
      className={cn("font-semibold text-sm", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface CalloutDescriptionProps extends React.ComponentProps<"div"> {
  children: React.ReactNode
}

function CalloutDescription({ className, children, ...props }: CalloutDescriptionProps) {
  return (
    <div
      data-slot="callout-description"
      className={cn("text-sm", className)}
      {...props}
    >
      {children}
    </div>
  )
}

// =============================================================================
// BANNER COMPONENT (Full width)
// =============================================================================

interface BannerProps extends Omit<CeramicCalloutProps, "variant"> {
  variant?: "default" | "info" | "warning" | "error" | "success"
  sticky?: boolean
}

function CeramicBanner({ className, variant = "default", sticky = false, ...props }: BannerProps) {
  return (
    <div
      data-slot="banner"
      className={cn(
        "w-full min-h-10 flex items-center justify-center px-4 py-2 text-sm",
        sticky && "sticky top-0 z-50",
        variant === "info" && "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100",
        variant === "warning" && "bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100",
        variant === "error" && "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100",
        variant === "success" && "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100",
        variant === "default" && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100",
        className
      )}
      {...props}
    />
  )
}

// =============================================================================
// CONVENIENCE COMPONENTS
// =============================================================================

interface InfoCalloutProps extends Omit<CeramicCalloutProps, "variant"> {
  title?: string
}

function InfoCallout({ title, children, ...props }: InfoCalloutProps) {
  return (
    <CeramicCallout variant="info" title={title} {...props}>
      {children}
    </CeramicCallout>
  )
}

function WarningCallout({ title, children, ...props }: InfoCalloutProps) {
  return (
    <CeramicCallout variant="warning" title={title} {...props}>
      {children}
    </CeramicCallout>
  )
}

function ErrorCallout({ title, children, ...props }: InfoCalloutProps) {
  return (
    <CeramicCallout variant="error" title={title} {...props}>
      {children}
    </CeramicCallout>
  )
}

function SuccessCallout({ title, children, ...props }: InfoCalloutProps) {
  return (
    <CeramicCallout variant="success" title={title} {...props}>
      {children}
    </CeramicCallout>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  CeramicCallout,
  CalloutTitle,
  CalloutDescription,
  CeramicBanner,
  InfoCallout,
  WarningCallout,
  ErrorCallout,
  SuccessCallout,
  calloutVariants,
}

export type { CeramicCalloutProps, CalloutTitleProps, CalloutDescriptionProps, BannerProps }
