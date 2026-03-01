/**
 * Input Component - Engineer Premium (Vercel/Clerk Inspired)
 *
 * ENGINEER PREMIUM FEATURES:
 * - Floating label pattern (peer-placeholder-shown)
 * - Consistent 6px border radius (rounded-[6px])
 * - Keyboard-only focus: focus-visible:ring-2 focus-visible:ring-black/10
 * - Dual-layer border with inner highlight
 * - 150ms transitions (snappy, feels instantaneous)
 * - Precise gray scaling: #000, #666, #888
 *
 * DESIGN PHILOSOPHY:
 * - "Consistent sizing is predictable"
 * - "Focus states should be subtle, not flashy"
 * - "No shadows, just borders"
 * - "Keyboard-first interaction"
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "w-full transition-all duration-150 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
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
  label?: string
}

/**
 * Get inline styles for Engineer Premium input variants
 * Uses dual-layer border and proper gray scaling
 */
function getInputStyles(variant?: string, size?: string): React.CSSProperties {
  const styles: React.CSSProperties = {
    borderRadius: '6px',
    padding: size === 'sm' ? '0.5rem 0.75rem' : size === 'lg' ? '0.875rem 1.25rem' : '0.625rem 0.75rem',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    // Dual-layer border
    boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.5) inset',
    backgroundColor: '#ffffff',
    color: '#000000',
  }

  return styles
}

/**
 * Floating Label Input Component
 * Wrapper for input with floating label functionality
 */
interface FloatingLabelInputProps extends InputProps {
  id?: string
}

function FloatingLabelInput({ className, type, variant = "default", size = "default", style, label, id, ...props }: FloatingLabelInputProps) {
  const inputId = id || `input-${React.useId()}`

  return (
    <div className="relative">
      <input
        id={inputId}
        type={type}
        data-slot="input"
        data-variant={variant}
        data-size={size}
        className={cn(
          inputVariants({ variant, size }),
          // Base styles - Engineer Premium
          "peer w-full bg-white border border-gray-200 rounded-[6px]",
          // Text color - pure black
          "text-[#000000]",
          // Placeholder transparent for floating label
          "placeholder:text-transparent",
          // Focus - subtle, not overwhelming
          "focus:border-gray-400 focus:bg-white",
          "focus:shadow-[0_0_0_1px_rgba(255,255,255,0.8)_inset,0_0_0_2px_rgba(0,0,0,0.1)]",
          // Keyboard-only focus ring (hidden for mouse users)
          "focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:outline-none",
          // Size styles
          size === "sm" && "h-9 px-3 py-2 text-sm",
          size === "default" && "h-10 px-3 py-2.5 text-sm",
          size === "lg" && "h-11 px-4 py-3 text-base",
          // Error state
          "aria-invalid:border-red-500 aria-invalid:ring-red-500/20",
          "dark:aria-invalid:border-red-400 dark:aria-invalid:ring-red-400/20",
          // Dark mode
          "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-500",
          className
        )}
        placeholder={label || " "}
        style={getInputStyles(variant, size)}
        {...props}
      />
      {/* Floating Label */}
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "absolute left-3 bg-white px-1 transition-all duration-150 pointer-events-none",
            // Position based on peer state
            "peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#888888]",
            "peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[#666666]",
            "peer-focus:bg-white peer-focus:dark:bg-gray-800",
            // Base label styles
            "text-xs text-[#888888]",
            "dark:peer-placeholder-shown:text-gray-500 dark:peer-focus:text-gray-400"
          )}
          style={{ marginTop: '-1px' }}
        >
          {label}
        </label>
      )}
    </div>
  )
}

function Input({ className, type, variant = "default", size = "default", style, label, id, ...props }: InputProps) {
  // If label is provided, use floating label component
  if (label) {
    return <FloatingLabelInput {...{ className, type, variant, size, style, label, id, ...props }} />
  }

  const tokenStyles = getInputStyles(variant, size)

  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      data-size={size}
      className={cn(
        inputVariants({ variant, size }),
        // Base styles - Engineer Premium
        "rounded-[6px] border border-gray-200 bg-white",
        // Text color - pure black
        "text-[#000000]",
        // Placeholder color - tertiary gray
        "placeholder:text-[#888888]",
        // Focus - subtle, not overwhelming
        "focus:border-gray-400 focus:bg-white",
        "focus:shadow-[0_0_0_1px_rgba(255,255,255,0.8)_inset,0_0_0_2px_rgba(0,0,0,0.1)]",
        // Keyboard-only focus ring (hidden for mouse users)
        "focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:outline-none",
        // Selection style
        "selection:bg-gray-200 selection:text-black",
        // Size styles - consistent heights
        size === "sm" && "h-9 px-3 py-2 text-sm",
        size === "default" && "h-10 px-3 py-2.5 text-sm",
        size === "lg" && "h-11 px-4 py-3 text-base",
        // Error state
        "aria-invalid:border-red-500 aria-invalid:ring-red-500/20",
        "dark:aria-invalid:border-red-400 dark:aria-invalid:ring-red-400/20",
        // Dark mode
        "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-500",
        // Transition
        "transition-all duration-150",
        className
      )}
      style={{ ...tokenStyles, ...style }}
      {...props}
    />
  )
}

export { Input, inputVariants, FloatingLabelInput }
