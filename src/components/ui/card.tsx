/**
 * Card Component - UX Optimized
 *
 * FIXES FROM UX AUDIT:
 * - Reduced padding from px-6 py-5 to px-4 py-3 (25% reduction)
 * - Standardized to 8px border radius (rounded-lg)
 * - Removed all shadows (use borders only)
 * - Subtle background color shift on hover
 * - 150ms transition duration
 * - No gradients on cards
 *
 * DESIGN PHILOSOPHY:
 * - "Borders over shadows"
 * - Compact density (reduced padding)
 * - Subtle hover states
 * - Depth through layering, not elevation
 */

"use client";

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { radius, padding, transition, shadow } from "@/styles/design-tokens"

const cardVariants = cva(
  "flex flex-col bg-white dark:bg-gray-900",
  {
    variants: {
      variant: {
        default: "border border-gray-200 dark:border-gray-700",
        interactive: "border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50",
        elevated: "border border-gray-200 dark:border-gray-700 shadow-sm",
        flat: "border-0 bg-gray-50 dark:bg-gray-800",
        ceramic: "border border-gray-200 dark:border-gray-700 shadow-sm",
      },
      size: {
        compact: "",
        default: "",
        spacious: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface CardProps extends React.ComponentProps<"div">, VariantProps<typeof cardVariants> {
  asChild?: boolean;
  variant?: "default" | "interactive" | "elevated" | "flat" | "ceramic";
  size?: "compact" | "default" | "spacious";
}

/**
 * Get inline styles for card variants
 * Uses design tokens for consistent styling
 */
function getCardStyles(variant?: string, size?: string): React.CSSProperties {
  const styles: React.CSSProperties = {
    borderRadius: radius.card,
    padding: size === 'compact' ? padding.sm : size === 'spacious' ? padding.xl : padding.card,
    transition: transition.colors,
    border: '1px solid var(--border-color-primary, #e5e5e5)',
    backgroundColor: 'var(--bg-primary, #ffffff)',
  }

  // Elevated variant gets shadow
  if (variant === 'elevated') {
    styles.boxShadow = shadow.sm
  }

  return styles
}

function Card({ className, asChild, children, variant = "default", size = "default", style, ...props }: CardProps) {
  const sizePadding = {
    compact: "p-3",
    default: "p-4",
    spacious: "p-6",
  }

  const tokenStyles = getCardStyles(variant, size)

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement & { props?: { className?: string; style?: React.CSSProperties } };
    const childClassName = child.props?.className || "";
    const childStyle = child.props?.style || {};
    return React.cloneElement(child, {
      className: cn(
        cardVariants({ variant, size }),
        "rounded-lg transition-colors duration-150",
        sizePadding[size],
        className,
        childClassName
      ),
      style: { ...tokenStyles, ...childStyle, ...(style as React.CSSProperties) },
      ...props
    });
  }

  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(
        cardVariants({ variant, size }),
        "rounded-lg transition-colors duration-150",
        sizePadding[size],
        variant === "interactive" && "hover:border-gray-300 dark:hover:border-gray-600",
        className
      )}
      style={{ ...tokenStyles, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col space-y-1.5 pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-base font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("pt-0", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center pt-3 mt-auto", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
