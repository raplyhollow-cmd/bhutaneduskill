"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { radius, transition, semantic } from "@/styles/design-tokens"

/**
 * Switch Component with Design Token Integration
 *
 * Uses design tokens for consistent border radius, transitions,
 * and colors across the application.
 */

interface SwitchProps extends React.ComponentProps<typeof SwitchPrimitive.Root> {
  size?: "sm" | "default" | "lg"
  color?: "default" | "primary" | "success" | "warning" | "error"
}

/**
 * Get inline styles for switch
 * Uses design tokens for consistent styling
 */
function getSwitchStyles(color?: string, checked?: boolean): React.CSSProperties {
  const styles: React.CSSProperties = {
    borderRadius: radius.full,
    transition: transition.transform,
  }

  // Color-specific styles
  if (checked) {
    switch (color) {
      case 'primary':
        styles.backgroundColor = semantic.primary.DEFAULT
        break
      case 'success':
        styles.backgroundColor = semantic.success.DEFAULT
        break
      case 'warning':
        styles.backgroundColor = semantic.warning.DEFAULT
        break
      case 'error':
        styles.backgroundColor = semantic.error.DEFAULT
        break
      default:
        styles.backgroundColor = 'var(--primary, #6674f0)'
    }
  }

  return styles
}

function Switch({
  className,
  size = "default",
  color = "default",
  ...props
}: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      data-color={color}
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 group/switch inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7 data-[size=lg]:h-6 data-[size=lg]:w-11",
        className
      )}
      style={{
        borderRadius: radius.full,
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block rounded-full ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=lg]/switch:size-5 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
        )}
        style={{
          borderRadius: radius.full,
          transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
