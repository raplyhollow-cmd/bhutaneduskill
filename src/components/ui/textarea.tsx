import * as React from "react"

import { cn } from "@/lib/utils"
import { radius, padding, shadow } from "@/styles/design-tokens"

/**
 * Textarea Component with Design Token Integration
 *
 * Uses design tokens for consistent border radius, padding, shadows,
 * and focus states across the application.
 */

interface TextareaProps extends React.ComponentProps<"textarea"> {
  variant?: "default" | "ceramic"
  size?: "default" | "sm" | "lg"
}

/**
 * Get inline styles for textarea
 * Uses design tokens for consistent styling
 */
function getTextareaStyles(variant?: string, size?: string): React.CSSProperties {
  const styles: React.CSSProperties = {
    borderRadius: radius.input,
    padding: padding.input,
    transition: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-color-primary, #e5e5e5)',
    boxShadow: shadow.xs,
  }

  // Size-specific styles
  switch (size) {
    case 'sm':
      styles.minHeight = '5rem'
      styles.fontSize = '0.875rem'
      styles.padding = '0.5rem 0.75rem'
      break
    case 'lg':
      styles.minHeight = '8rem'
      styles.fontSize = '1rem'
      styles.padding = '0.75rem 1rem'
      break
    default:
      styles.minHeight = '5rem'
      styles.fontSize = '0.875rem'
  }

  // Mobile: prevent zoom with 16px font
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // Dark mode support
  styles.backgroundColor = 'rgba(23, 23, 23, 0.3)'

  return styles
}

function Textarea({ className, variant = "default", size = "default", style, ...props }: TextareaProps) {
  const tokenStyles = getTextareaStyles(variant, size)

  return (
    <textarea
      data-slot="textarea"
      data-variant={variant}
      data-size={size}
      className={cn(
        // Base styles
        "flex field-sizing-content w-full rounded-lg border bg-transparent px-4 py-2.5 text-base md:text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]",
        // Focus styles
        "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50",
        // Error styles
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Disabled styles
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Mobile min height
        "min-h-20 min-h-11 md:min-h-20",
        // Dark mode
        "dark:bg-input/30",
        // Ceramic variant
        variant === "ceramic" && "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-purple-600 focus:ring-purple-600/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-400 dark:focus:ring-purple-400/20",
        className
      )}
      style={{ ...tokenStyles, ...style }}
      {...props}
    />
  )
}

export { Textarea }
