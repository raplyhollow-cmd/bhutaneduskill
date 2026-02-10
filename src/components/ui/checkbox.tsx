"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
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
