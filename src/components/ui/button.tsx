"use client";

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { semantic, radius, shadow, padding, portal } from "@/styles/design-tokens"

/**
 * Button Component with Design Token Integration
 *
 * Variants now use design tokens for consistent styling across the application.
 * Transition durations and easing curves are sourced from the design system.
 */

/**
 * Button Component - UX Optimized
 *
 * FIXES FROM UX AUDIT:
 * - Removed hover transform effects (-translate-y-0.5)
 * - Reduced animation duration to 150ms for snappier feel
 * - Simplified to 5 core variants (primary, secondary, ghost, danger, link)
 * - Consistent 40px height for default size
 * - Removed excessive shadows
 * - Solid colors only, no gradients on hover
 *
 * DESIGN PHILOSOPHY:
 * - "No gimmicky animations"
 * - Fast transitions (150ms)
 * - Flat colors, minimal shadows
 * - 6px border radius (rounded-md)
 */

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "link"
  | "student"
  | "teacher"
  | "parent"
  | "counselor"
  | "admin"
  | "school-admin"
  | "ministry"
  | "ceramic"
  | "ceramic-outline"
  | "ceramic-ghost"
  | "ceramic-warning"
  | "ceramic-info"
  | "ceramic-success"
  | "ceramic-error"
  | "default"
  | "destructive"
  | "outline";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-purple-500/20 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        // Primary: Solid color, flat design
        primary: "bg-purple-600 text-white hover:bg-purple-700",
        // Secondary: Outline style
        secondary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200",
        // Ghost: Minimal background on hover
        ghost: "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800",
        // Danger: Red for destructive actions
        danger: "bg-red-600 text-white hover:bg-red-700",
        // Link: Underlined text
        link: "text-purple-600 underline-offset-4 hover:underline dark:text-purple-400",
        // Portal-specific variants with gradients
        student: "[background:linear-gradient(135deg,rgb(249_115_22)_0%,rgb(194_65_12)_100%)] text-white hover:opacity-90",
        teacher: "[background:linear-gradient(135deg,rgb(59_130_246)_0%,rgb(37_99_235)_100%)] text-white hover:opacity-90",
        parent: "[background:linear-gradient(135deg,rgb(107_114_128)_0%,rgb(75_85_99)_100%)] text-white hover:opacity-90",
        counselor: "[background:linear-gradient(135deg,rgb(168_85_247)_0%,rgb(147_51_234)_100%)] text-white hover:opacity-90",
        admin: "[background:linear-gradient(135deg,rgb(236_72_153)_0%,rgb(219_39_119)_100%)] text-white hover:opacity-90",
        "school-admin": "[background:linear-gradient(135deg,rgb(139_92_246)_0%,rgb(124_58_237)_100%)] text-white hover:opacity-90",
        ministry: "[background:linear-gradient(135deg,rgb(20_184_166)_0%,rgb(13_148_136)_100%)] text-white hover:opacity-90",
        // Ceramic design system variants
        ceramic: "[background-color:var(--ceramic-brand)] [color:var(--ceramic-white)] hover:opacity-90",
        "ceramic-outline": "[border-color:var(--border-color-primary)] [background-color:transparent] [color:var(--ceramic-primary)] hover:[background-color:var(--ceramic-gray-100)]",
        "ceramic-ghost": "[background-color:transparent] [color:var(--ceramic-secondary)] hover:[background-color:var(--ceramic-gray-100)]",
        "ceramic-warning": "[background-color:var(--ceramic-warning)] [color:var(--ceramic-white)] hover:opacity-90",
        "ceramic-info": "[background-color:var(--ceramic-info)] [color:var(--ceramic-white)] hover:opacity-90",
        "ceramic-success": "[background-color:var(--ceramic-success)] [color:var(--ceramic-white)] hover:opacity-90",
        "ceramic-error": "[background-color:var(--ceramic-error)] [color:var(--ceramic-white)] hover:opacity-90",
        // Legacy variant names mapped to new ones
        default: "bg-purple-600 text-white hover:bg-purple-700",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200",
      } satisfies Record<ButtonVariant, string>,
      size: {
        sm: "h-9 px-3 text-xs",
        default: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10 p-0",
      },
      loading: {
        true: "relative",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false,
    },
  }
)

/**
 * Get inline styles for button variants
 * Uses design tokens for consistent spacing, radius, and transitions
 * ENGINEER PREMIUM: Portal buttons now use gradients for premium look
 */
function getButtonStyles(variant?: string, size?: string): React.CSSProperties {
  const styles: React.CSSProperties = {
    borderRadius: '6px', // Consistent 6px radius (Engineer Premium spec)
    transition: 'all 150ms ease-out', // 150ms snappy transitions
  }

  // Portal-specific gradients (Engineer Premium spec)
  if (variant === 'student') {
    styles.background = portal.student.gradient // Design token gradient
    styles.color = '#ffffff'
  } else if (variant === 'teacher') {
    styles.background = portal.teacher.gradient // Design token gradient
    styles.color = '#ffffff'
  } else if (variant === 'parent') {
    styles.background = portal.parent.gradient // Design token gradient
    styles.color = '#ffffff'
  } else if (variant === 'counselor') {
    styles.background = portal.counselor.gradient // Design token gradient
    styles.color = '#ffffff'
  } else if (variant === 'admin') {
    styles.background = portal.admin.gradient // Design token gradient
    styles.color = '#ffffff'
  } else if (variant === 'school-admin') {
    styles.background = portal.schoolAdmin.gradient // Design token gradient
    styles.color = '#ffffff'
  } else if (variant === 'ministry') {
    styles.background = portal.ministry.gradient // Design token gradient
    styles.color = '#ffffff'
  }

  return styles
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  style,
  loading = false,
  children,
  disabled,
  ...props
}: Omit<React.ComponentProps<"button">, "variant"> &
  VariantProps<typeof buttonVariants> & {
    variant?: ButtonVariant;
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot : "button"
  const tokenStyles = getButtonStyles(variant, size)

  const isDisabled = disabled || loading

  // When using asChild, we can't render multiple children
  // Loading indicator is not supported with asChild
  const content = loading ? (
    <>
      <Loader2 className="animate-spin" aria-hidden="true" />
      {typeof children === "string" && (
        <span className="opacity-70">{children}</span>
      )}
    </>
  ) : (
    children
  )

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading ? "true" : undefined}
      className={cn(buttonVariants({ variant, size, loading, className }))}
      style={{ ...tokenStyles, ...style }}
      disabled={isDisabled}
      {...props}
    >
      {content}
    </Comp>
  )
}

export { Button, buttonVariants };
export type { ButtonVariant };
