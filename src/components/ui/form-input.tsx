"use client"

import * as React from "react"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormInputProps extends Omit<React.ComponentProps<"input">, "size"> {
  label?: string
  error?: string
  hint?: string
  successMessage?: string
  leftIcon?: React.ReactNode
  rightAddon?: React.ReactNode
  showLastUsedBadge?: boolean
  containerClassName?: string
  inputClassName?: string
  size?: "sm" | "md" | "lg"
  icon?: string
}

/**
 * FormInput - Clerk-style input fields with focus states
 * Features:
 * - 1px border with focus color change
 * - Subtle focus ring (ring-2)
 * - Rounded-lg
 * - Clear label positioning
 * - Optional "Last used" badge
 *
 * @example
 * <FormInput
 *   label="Email address"
 *   type="email"
 *   placeholder="Enter your email"
 *   showLastUsedBadge
 *   hint="We'll never share your email"
 * />
 */
export function FormInput({
  label,
  error,
  hint,
  successMessage,
  leftIcon,
  rightAddon,
  showLastUsedBadge,
  containerClassName,
  inputClassName,
  size = "md",
  type,
  id,
  className,
  ...props
}: FormInputProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const inputId = id || React.useId()
  const isPassword = type === "password"
  const actualType = isPassword && showPassword ? "text" : type

  const sizeStyles = {
    sm: "h-9 text-sm px-3 py-1.5",
    md: "h-10 px-3 py-2",
    lg: "h-12 text-base px-4 py-3"
  }

  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      {/* Label Row with optional badge */}
      {(label || showLastUsedBadge) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={inputId}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {label}
            </label>
          )}
          {showLastUsedBadge && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Last used
            </span>
          )}
        </div>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          id={inputId}
          type={actualType}
          className={cn(
            "flex w-full rounded-lg border transition-all duration-200",
            "placeholder:text-gray-400",
            "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50",
            "focus:outline-none",
            sizeStyles[size],
            // Left icon padding
            leftIcon && "pl-10",
            // Right icon/addon padding
            (rightAddon || isPassword) && "pr-10",
            // States
            error
              ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : successMessage
              ? "border-green-300 text-green-900 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              : "border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
            // Dark mode
            "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500",
            "dark:focus:border-purple-400 dark:focus:ring-purple-400/20",
            inputClassName,
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {/* Password Toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}

        {/* Right Addon (non-password) */}
        {rightAddon && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightAddon}
          </div>
        )}
      </div>

      {/* Hint / Error / Success Message */}
      {(hint || error || successMessage) && (
        <div className="flex items-start gap-1.5 min-h-[20px]">
          {error && (
            <>
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <span className="text-sm text-red-600">{error}</span>
            </>
          )}
          {successMessage && !error && (
            <>
              <span className="text-green-600 mt-0.5 shrink-0">✓</span>
              <span className="text-sm text-green-600">{successMessage}</span>
            </>
          )}
          {hint && !error && !successMessage && (
            <span className="text-sm text-gray-500">{hint}</span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * FormInputWithIcon - Preset with common icons
 */
interface FormInputWithIconProps extends Omit<FormInputProps, "leftIcon"> {
  icon?: "email" | "search" | "lock" | "user" | "phone" | "globe"
}

export function FormInputWithIcon({
  icon,
  ...props
}: FormInputWithIconProps) {
  const icons = {
    email: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>,
    search: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>,
    lock: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>,
    user: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>,
    phone: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>,
    globe: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  }

  return <FormInput leftIcon={icon && icons[icon]} {...props} />
}

/**
 * SearchInput - Specialized search input
 */
interface SearchInputProps extends Omit<FormInputProps, "leftIcon"> {
  onClear?: () => void
  showClearButton?: boolean
}

export function SearchInput({
  onClear,
  showClearButton = true,
  value,
  ...props
}: SearchInputProps) {
  const [localValue, setLocalValue] = React.useState(typeof value === "string" ? value : "")

  React.useEffect(() => {
    if (typeof value === "string") {
      setLocalValue(value)
    }
  }, [value])

  const handleClear = () => {
    setLocalValue("")
    onClear?.()
  }

  return (
    <div className="relative">
      <FormInput
        icon="search"
        value={value}
        {...props}
        rightAddon={
          showClearButton && localValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : undefined
        }
      />
    </div>
  )
}

/**
 * InputGroup - Group multiple inputs together
 */
interface InputGroupProps {
  children: React.ReactNode
  className?: string
  label?: string
  error?: string
}

export function InputGroup({ children, className, label, error }: InputGroupProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        {children}
      </div>
      {error && (
        <span className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </span>
      )}
    </div>
  )
}

/**
 * OTPInput - One-time password input
 */
interface OTPInputProps {
  length?: number
  value?: string
  onChange?: (value: string) => void
  error?: boolean
  className?: string
}

export function OTPInput({
  length = 6,
  value = "",
  onChange,
  error = false,
  className
}: OTPInputProps) {
  const [values, setValues] = React.useState<string[]>(() =>
    value.padEnd(length, "0").slice(0, length).split("")
  )
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  // Fix ref type
  const setInputRef = (index: number, el: HTMLInputElement | null) => {
    inputRefs.current[index] = el
  }

  React.useEffect(() => {
    if (value) {
      setValues(value.padEnd(length, "0").slice(0, length).split(""))
    }
  }, [value, length])

  const handleChange = (index: number, val: string) => {
    const newValues = [...values]
    newValues[index] = val.slice(-1)
    setValues(newValues)

    const newValue = newValues.join("")
    onChange?.(newValue)

    // Move to next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => setInputRef(index, el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={values[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className={cn(
            "w-12 h-14 text-center text-2xl font-bold",
            "border border-gray-300 rounded-lg",
            "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none",
            "transition-all",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
          )}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
