/**
 * Input Component - UX Optimized
 *
 * FIXES FROM UX AUDIT:
 * - Consistent height (40px) at all breakpoints
 * - Removed shadow-xs on focus (use border color only)
 * - Standardized to 6px border radius (rounded-md)
 * - 150ms transition duration
 * - Border-based focus indicator (ring-2)
 *
 * DESIGN PHILOSOPHY:
 * - "Consistent sizing is predictable"
 * - Focus states should be subtle, not flashy
 * - No shadows, just borders
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { radius, padding, transition, semantic } from "@/styles/design-tokens"

const inputVariants = cva(
  "w-full transition-colors duration-150 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        ceramic: "",
      },
      size: {
        sm: "",
        default: "",
        lg: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface InputProps extends Omit<React.ComponentProps<"input">, "size">, VariantProps<typeof inputVariants> {
  variant?: "default" | "ceramic"
  size?: "sm" | "default" | "lg"
}

/**
 * Get inline styles for input variants
 * Uses design tokens for consistent styling
 */
function getInputStyles(variant?: string, size?: string): React.CSSProperties {
  const styles: React.CSSProperties = {
    borderRadius: radius.input,
    padding: size === 'sm' ? '0.5rem 0.75rem' : size === 'lg' ? '0.875rem 1.25rem' : padding.input,
    transition: transition.colors,
    border: '1px solid var(--border-color-primary, #e5e5e5)',
    backgroundColor: 'var(--bg-primary, #ffffff)',
    color: 'var(--foreground, #171717)',
  }

  return styles
}

function Input({ className, type, variant = "default", size = "default", style, ...props }: InputProps) {
  const tokenStyles = getInputStyles(variant, size)

  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      data-size={size}
      className={cn(
        inputVariants({ variant, size }),
        // Base styles - UX Optimized
        "rounded-md border border-gray-300 bg-white text-gray-900",
        "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
        "placeholder:text-gray-400",
        "selection:bg-purple-100 selection:text-purple-900",
        // Dark mode
        "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500",
        "dark:focus:border-purple-400 dark:ring-purple-400/20",
        // Size styles - consistent 40px height for default
        size === "sm" && "h-9 px-3 py-2 text-sm",
        size === "default" && "h-10 px-4 py-2 text-sm",
        size === "lg" && "h-11 px-5 py-3 text-base",
        // Error state
        "aria-invalid:border-red-500 aria-invalid:ring-red-500/20",
        "dark:aria-invalid:border-red-400 dark:aria-invalid:ring-red-400/20",
        // Ceramic variant
        variant === "ceramic" && "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-purple-600 focus:ring-purple-600/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-400 dark:focus:ring-purple-400/20",
        className
      )}
      style={{ ...tokenStyles, ...style }}
      {...props}
    />
  )
}

export { Input, inputVariants }
