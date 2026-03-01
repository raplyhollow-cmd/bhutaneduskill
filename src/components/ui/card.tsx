/**
 * Card Component - Engineer Premium (Vercel/Clerk Inspired)
 *
 * ENGINEER PREMIUM FEATURES:
 * - Dual-layer "milled" border effect (inner highlight + outer shadow)
 * - Consistent 8px border radius (rounded-[8px])
 * - 150ms hover transition (snappy, feels instantaneous)
 * - Responsive padding: p-6 desktop, p-4 mobile
 * - Information-dense spacing (24px default padding)
 * - Keyboard-only focus rings
 * - Subtle depth through layering, not elevation
 *
 * DESIGN PHILOSOPHY:
 * - "Precision over blur"
 * - "Borders over shadows"
 * - Clean, functional design
 * - Monochrome + portal accent gradients
 */

"use client";

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "flex flex-col bg-white dark:bg-gray-900",
  {
    variants: {
      variant: {
        default: "border border-gray-200/60 dark:border-gray-700/60",
        interactive: "border border-gray-200/60 dark:border-gray-700/60 cursor-pointer",
        elevated: "border border-gray-200/60 dark:border-gray-700/60",
        flat: "border-0 bg-gray-50/60 dark:bg-gray-800/60",
        ceramic: "border border-gray-200/60 dark:border-gray-700/60",
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
 * Get inline styles for Engineer Premium card variants
 * Uses dual-layer "milled" border effect
 */
function getCardStyles(variant?: string, size?: string): React.CSSProperties {
  // Base styles - dual-layer border
  const styles: React.CSSProperties = {
    borderRadius: '8px',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    // Dual-layer "milled" border - Vercel's signature look
    boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.8) inset, 0 1px 2px rgba(0, 0, 0, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  }

  // Elevated variant gets stronger shadow
  if (variant === 'elevated' || variant === 'ceramic') {
    styles.boxShadow = '0 0 0 1px rgba(255, 255, 255, 0.8) inset, 0 4px 12px rgba(0, 0, 0, 0.08)'
  }

  return styles
}

function Card({ className, asChild, children, variant = "default", size = "default", style, ...props }: CardProps) {
  // Responsive padding: p-6 on desktop, p-4 on mobile
  const sizePadding = {
    compact: "p-3 sm:p-4",
    default: "p-4 sm:p-6",
    spacious: "p-6 sm:p-8",
  }

  const tokenStyles = getCardStyles(variant, size)

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement & { props?: { className?: string; style?: React.CSSProperties } };
    const childClassName = child.props?.className || "";
    const childStyle = child.props?.style || {};
    return React.cloneElement(child, {
      className: cn(
        cardVariants({ variant, size }),
        "rounded-[8px]",
        sizePadding[size],
        variant === "interactive" && "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.9)_inset,0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5",
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
        "rounded-[8px]",
        sizePadding[size],
        // Hover state - subtle lift
        variant === "interactive" && "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.9)_inset,0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5",
        // Keyboard-only focus ring
        "focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:outline-none",
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
        "flex flex-col space-y-1.5 pb-4",
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
      className={cn("text-base font-semibold leading-none tracking-tight text-[#000000] dark:text-gray-100", className)}
      style={{ letterSpacing: '-0.02em' }}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-[#666666] dark:text-gray-400", className)}
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
      className={cn("flex items-center pt-4 mt-auto", className)}
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
