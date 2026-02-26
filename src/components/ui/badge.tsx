import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { radius, padding, semantic } from "@/styles/design-tokens"

/**
 * Badge Component with Design Token Integration
 *
 * Uses design tokens for consistent border radius, padding, colors,
 * and transitions across the application.
 */

const badgeVariants = cva(
  "inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "",
        secondary: "",
        destructive: "",
        outline: "",
        ghost: "",
        link: "",
        success: "",
        warning: "",
        error: "",
        info: "",
        // Ceramic design system variants
        ceramic: "",
        "ceramic-default": "",
        "ceramic-success": "",
        "ceramic-error": "",
        "ceramic-warning": "",
        "ceramic-info": "",
        "ceramic-solid-brand": "",
        "ceramic-solid-success": "",
        "ceramic-solid-error": "",
      },
      size: {
        default: "",
        sm: "",
        lg: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Get inline styles for badge variants
 * Uses design tokens for consistent styling
 */
function getBadgeStyles(variant?: string, size?: string): React.CSSProperties {
  const styles: React.CSSProperties = {
    borderRadius: radius.badge,
    transition: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  }

  // Size-specific styles
  switch (size) {
    case 'sm':
      styles.padding = '0.125rem 0.5rem'
      styles.fontSize = '0.625rem'
      styles.fontWeight = 500
      break
    case 'lg':
      styles.padding = '0.375rem 0.75rem'
      styles.fontSize = '0.875rem'
      styles.fontWeight = 500
      break
    default:
      styles.padding = '0.375rem 0.75rem'
      styles.fontSize = '0.75rem'
      styles.fontWeight = 500
  }

  // Variant-specific styles using design tokens
  switch (variant) {
    case 'default':
      styles.backgroundColor = semantic.primary.DEFAULT
      styles.color = semantic.primary.fg
      styles.border = 'transparent'
      break
    case 'secondary':
      styles.backgroundColor = semantic.secondary.DEFAULT
      styles.color = semantic.secondary.fg
      styles.border = 'transparent'
      break
    case 'destructive':
      styles.backgroundColor = semantic.error.DEFAULT
      styles.color = semantic.error.fg
      styles.border = 'transparent'
      break
    case 'outline':
      styles.backgroundColor = 'transparent'
      styles.color = 'var(--foreground, #171717)'
      styles.border = '1px solid var(--border-color-primary, #e5e5e5)'
      break
    case 'ghost':
      styles.backgroundColor = 'transparent'
      styles.color = 'var(--foreground, #171717)'
      styles.border = 'transparent'
      break
    case 'link':
      styles.backgroundColor = 'transparent'
      styles.color = semantic.primary.DEFAULT
      styles.border = 'transparent'
      styles.textDecoration = 'underline'
      styles.textUnderlineOffset = '2px'
      break
    case 'success':
      styles.backgroundColor = semantic.success.subtle
      styles.color = semantic.success.subtleText
      styles.border = 'transparent'
      break
    case 'warning':
      styles.backgroundColor = semantic.warning.subtle
      styles.color = semantic.warning.subtleText
      styles.border = 'transparent'
      break
    case 'error':
      styles.backgroundColor = semantic.error.subtle
      styles.color = semantic.error.subtleText
      styles.border = 'transparent'
      break
    case 'info':
      styles.backgroundColor = semantic.info.subtle
      styles.color = semantic.info.subtleText
      styles.border = 'transparent'
      break
    // Ceramic variants
    case 'ceramic':
      styles.backgroundColor = 'var(--ceramic-brand/10, rgba(132, 107, 255, 0.1))'
      styles.color = 'var(--ceramic-brand, #8467ff)'
      styles.border = 'transparent'
      break
    case 'ceramic-default':
      styles.backgroundColor = 'var(--ceramic-gray-100, #f3f4f6)'
      styles.color = 'var(--ceramic-gray-700, #374151)'
      styles.border = 'transparent'
      break
    case 'ceramic-success':
      styles.backgroundColor = 'rgba(49, 200, 84, 0.1)'
      styles.color = 'var(--ceramic-green-600, #16a34a)'
      styles.border = 'transparent'
      break
    case 'ceramic-error':
      styles.backgroundColor = 'rgba(247, 61, 61, 0.1)'
      styles.color = 'var(--ceramic-red-600, #dc2626)'
      styles.border = 'transparent'
      break
    case 'ceramic-warning':
      styles.backgroundColor = 'rgba(253, 114, 36, 0.1)'
      styles.color = 'var(--ceramic-orange-600, #ea580c)'
      styles.border = 'transparent'
      break
    case 'ceramic-info':
      styles.backgroundColor = 'rgba(48, 127, 246, 0.1)'
      styles.color = 'var(--ceramic-blue-600, #2563eb)'
      styles.border = 'transparent'
      break
    case 'ceramic-solid-brand':
      styles.backgroundColor = 'var(--ceramic-brand, #8467ff)'
      styles.color = 'var(--ceramic-white, #ffffff)'
      styles.border = 'transparent'
      break
    case 'ceramic-solid-success':
      styles.backgroundColor = 'var(--ceramic-green-600, #16a34a)'
      styles.color = 'var(--ceramic-white, #ffffff)'
      styles.border = 'transparent'
      break
    case 'ceramic-solid-error':
      styles.backgroundColor = 'var(--ceramic-red-600, #dc2626)'
      styles.color = 'var(--ceramic-white, #ffffff)'
      styles.border = 'transparent'
      break
    default:
      styles.backgroundColor = semantic.primary.DEFAULT
      styles.color = semantic.primary.fg
      styles.border = 'transparent'
  }

  return styles
}

interface BadgeProps extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | "success" | "warning" | "error" | "info" | "ceramic" | "ceramic-default" | "ceramic-success" | "ceramic-error" | "ceramic-warning" | "ceramic-info" | "ceramic-solid-brand" | "ceramic-solid-success" | "ceramic-solid-error";
  size?: "default" | "sm" | "lg";
}

function Badge({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  style,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span"
  const tokenStyles = getBadgeStyles(variant, size)

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(
        badgeVariants({ variant }),
        "rounded-full border border-transparent px-3 py-1.5 text-xs font-medium",
        className
      )}
      style={{ ...tokenStyles, ...style }}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
