"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { radius, transition, semantic } from "@/styles/design-tokens"

/**
 * Checkbox Component with Design Token Integration
 *
 * Uses design tokens for consistent border radius, transitions,
 * and colors across the application.
 */

interface CheckboxProps extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  color?: "default" | "primary" | "success" | "warning" | "error"
}

/**
 * Get inline styles for checkbox
 * Uses design tokens for consistent styling
 */
function getCheckboxStyles(color?: string, checked?: boolean): React.CSSProperties {
  const styles: React.CSSProperties = {
    borderRadius: radius.sm,
    transition: transition.colors,
  }

  // Color-specific styles
  if (checked) {
    switch (color) {
      case 'primary':
        styles.backgroundColor = semantic.primary.DEFAULT
        styles.borderColor = semantic.primary.DEFAULT
        break
      case 'success':
        styles.backgroundColor = semantic.success.DEFAULT
        styles.borderColor = semantic.success.DEFAULT
        break
      case 'warning':
        styles.backgroundColor = semantic.warning.DEFAULT
        styles.borderColor = semantic.warning.DEFAULT
        break
      case 'error':
        styles.backgroundColor = semantic.error.DEFAULT
        styles.borderColor = semantic.error.DEFAULT
        break
      default:
        styles.backgroundColor = 'var(--primary, #6674f0)'
        styles.borderColor = 'var(--primary, #6674f0)'
    }
  }

  return styles
}

function Checkbox({
  className,
  color = "default",
  ...props
}: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-color={color}
      className={cn(
        // Base styles
        "peer shrink-0 rounded border border-input outline-none transition-all",

        // Size - 16px (size-4) for the checkbox itself
        "size-4",

        // Focus ring - 3px with ring-ring/50
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2",

        // Unchecked state
        "data-[state=unchecked]:bg-background data-[state=unchecked]:border-input",

        // Checked state - primary color
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",

        // Indeterminate state - same as checked
        "data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary-foreground",

        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",

        // Touch target wrapper adds padding externally for 44x44 minimum
        className
      )}
      style={{
        borderRadius: radius.sm,
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        {/* Check icon - inline SVG for better performance */}
        <svg
          className="size-3.5"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 3L4.5 8.5L2 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
