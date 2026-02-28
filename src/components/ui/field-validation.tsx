/**
 * INLINE FIELD VALIDATION
 *
 * Real-time form validation with inline feedback inspired by Linear and Vercel.
 *
 * FEATURES:
 * - Real-time validation as user types
 * - Inline error messages (no alerts)
 * - Success indicators
 * - Debounced validation (configurable)
 * - Accessible ARIA labels
 * - Support for complex validation rules
 *
 * DESIGN PHILOSOPHY:
 * - "Validate early, fail fast"
 * - Errors should appear inline, not in modals
 * - Success should be subtle, errors should be clear
 * - Don't overwhelm with validation
 *
 * @example
 * ```tsx
 * import { ValidatedInput, useFieldValidation } from "@/components/ui/field-validation"
 *
 * function MyForm() {
 *   const emailField = useFieldValidation({
 *     validate: (value) => {
 *       if (!value) return "Email is required"
 *       if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email"
 *     }
 *   })
 *
 *   return (
 *     <ValidatedInput
 *       field={emailField}
 *       type="email"
 *       label="Email"
 *       placeholder="you@example.com"
 *     />
 *   )
 * }
 * ```
 */

"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// TYPES
// =============================================================================

export type ValidationStatus = "idle" | "validating" | "valid" | "invalid"

export interface FieldValidationState {
  value: string
  error: string | null
  status: ValidationStatus
  touched: boolean
}

export interface UseFieldValidationOptions {
  initialValue?: string
  validate?: (value: string) => string | null | Promise<string | null>
  debounceMs?: number
  validateOnBlur?: boolean
  validateOnChange?: boolean
}

export type UseFieldValidationOptionsRequired = Required<Omit<UseFieldValidationOptions, 'validate'>> & {
  validate?: (value: string) => string | null | Promise<string | null>
};

export interface ValidatedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  field: ReturnType<typeof useFieldValidation>
  label?: string
  hint?: string
  size?: "sm" | "md" | "lg"
  showSuccessIcon?: boolean
  containerClassName?: string
}

export interface ValidatedTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  field: ReturnType<typeof useFieldValidation>
  label?: string
  hint?: string
  rows?: number
  showSuccessIcon?: boolean
  containerClassName?: string
}

// =============================================================================
// VALIDATION HOOK
// =============================================================================

export function useFieldValidation({
  initialValue = "",
  validate,
  debounceMs = 300,
  validateOnBlur = true,
  validateOnChange = true,
}: UseFieldValidationOptions = {}) {
  const [value, setValue] = React.useState(initialValue)
  const [error, setError] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<ValidationStatus>("idle")
  const [touched, setTouched] = React.useState(false)
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  const performValidation = React.useCallback(
    async (val: string): Promise<string | null> => {
      if (!validate) return null

      setStatus("validating")
      try {
        const result = await validate(val)
        setStatus(result ? "invalid" : "valid")
        return result
      } catch {
        setStatus("invalid")
        return "Validation failed"
      }
    },
    [validate]
  )

  const handleChange = React.useCallback(
    (newValue: string) => {
      setValue(newValue)
      setTouched(true)

      if (!validate) return

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      if (validateOnChange) {
        debounceTimerRef.current = setTimeout(() => {
          performValidation(newValue).then(setError)
        }, debounceMs)
      }
    },
    [validate, validateOnChange, debounceMs, performValidation]
  )

  const handleBlur = React.useCallback(() => {
    setTouched(true)

    if (validateOnBlur && validate) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      performValidation(value).then(setError)
    }
  }, [validate, validateOnBlur, value, performValidation])

  const reset = React.useCallback(() => {
    setValue(initialValue)
    setError(null)
    setStatus("idle")
    setTouched(false)
  }, [initialValue])

  return {
    value,
    error,
    status,
    touched,
    handleChange,
    handleBlur,
    reset,
    props: {
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value),
      onBlur: handleBlur,
    },
  }
}

// =============================================================================
// VALIDATED INPUT COMPONENT
// =============================================================================

const sizeStyles = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
}

export function ValidatedInput({
  field,
  label,
  hint,
  size = "md",
  showSuccessIcon = true,
  containerClassName,
  className,
  id,
  ...inputProps
}: ValidatedInputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  const hasError = field.touched && field.error !== null
  const isValid = field.touched && field.error === null && field.status === "valid" && field.value

  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          aria-invalid={hasError}
          aria-describedby={cn(
            hasError && errorId,
            hint && !hasError && hintId
          )}
          className={cn(
            "w-full rounded-md border transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-purple-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "pr-10", // Extra padding for icon
            sizeStyles[size],
            hasError
              ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700 dark:text-red-100"
              : isValid
                ? "border-green-300 text-gray-900 focus:border-green-500 focus:ring-green-500/20 dark:border-green-700 dark:text-gray-100"
                : "border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500",
            className
          )}
          {...field.props}
          {...inputProps}
        />

        {/* Status Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <AnimatePresence mode="wait">
            {field.status === "validating" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              </motion.div>
            )}

            {isValid && showSuccessIcon && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Check className="w-4 h-4 text-green-500" />
              </motion.div>
            )}

            {hasError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <AlertCircle className="w-4 h-4 text-red-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Hint or Error Message */}
      <AnimatePresence mode="wait">
        {hasError && field.error ? (
          <motion.p
            key="error"
            id={errorId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {field.error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            id={hintId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

// =============================================================================
// VALIDATED TEXTAREA COMPONENT
// =============================================================================

export function ValidatedTextarea({
  field,
  label,
  hint,
  rows = 3,
  showSuccessIcon = true,
  containerClassName,
  className,
  id,
  ...textareaProps
}: ValidatedTextareaProps) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
  const errorId = `${textareaId}-error`
  const hintId = `${textareaId}-hint`

  const hasError = field.touched && field.error !== null
  const isValid = field.touched && field.error === null && field.status === "valid" && field.value

  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <textarea
          id={textareaId}
          rows={rows}
          value={field.value}
          onChange={field.props.onChange as (e: React.ChangeEvent<any>) => void}
          onBlur={field.props.onBlur}
          aria-invalid={hasError}
          aria-describedby={cn(
            hasError && errorId,
            hint && !hasError && hintId
          )}
          className={cn(
            "w-full rounded-md border px-4 py-3 text-sm transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-y",
            "disabled:cursor-not-allowed disabled:opacity-50",
            hasError
              ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700"
              : isValid
                ? "border-green-300 text-gray-900 focus:border-green-500 focus:ring-green-500/20 dark:border-green-700"
                : "border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500 dark:border-gray-600",
            className
          )}
          {...(textareaProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      </div>

      {/* Hint or Error Message */}
      <AnimatePresence mode="wait">
        {hasError && field.error ? (
          <motion.p
            key="error"
            id={errorId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {field.error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            id={hintId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>

      {/* Character count for textarea */}
      {textareaProps.maxLength && (
        <div className="flex justify-end">
          <span
            className={cn(
              "text-xs",
              field.value.length > (textareaProps.maxLength || 0) * 0.9
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-gray-400"
            )}
          >
            {field.value.length} / {textareaProps.maxLength}
          </span>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// VALIDATION RULES
// =============================================================================

export const validationRules = {
  required: (message = "This field is required") => (value: string) => {
    if (!value || value.trim() === "") return message
    return null
  },

  email: (message = "Please enter a valid email address") => (value: string) => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) return message
    return null
  },

  minLength: (min: number, message?: string) => (value: string) => {
    if (!value) return null
    if (value.length < min) return message || `Must be at least ${min} characters`
    return null
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    if (!value) return null
    if (value.length > max) return message || `Must be no more than ${max} characters`
    return null
  },

  pattern: (regex: RegExp, message = "Invalid format") => (value: string) => {
    if (!value) return null
    if (!regex.test(value)) return message
    return null
  },

  phone: (message = "Please enter a valid phone number") => (value: string) => {
    if (!value) return null
    const phoneRegex = /^[\d\s\-+()]+$/
    if (!phoneRegex.test(value)) return message
    return null
  },

  url: (message = "Please enter a valid URL") => (value: string) => {
    if (!value) return null
    try {
      new URL(value)
      return null
    } catch {
      return message
    }
  },

  // Async validation example
  uniqueEmail: async (value: string): Promise<string | null> => {
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    // In real app, this would call an API
    const existingEmails = ["test@example.com", "admin@example.com"]
    if (existingEmails.includes(value)) return "This email is already registered"
    return null
  },
}

// =============================================================================
// COMPOSE VALIDATORS
// =============================================================================

export function composeValidators<T>(
  ...validators: Array<(value: T) => string | null | Promise<string | null>>
) {
  return async (value: T): Promise<string | null> => {
    for (const validator of validators) {
      const result = await validator(value)
      if (result) return result
    }
    return null
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ValidatedInput
