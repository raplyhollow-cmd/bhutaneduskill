/**
 * EXPRESS ADD MODAL
 *
 * A progressive, single-field quick-add modal inspired by Clerk's interactions.
 *
 * FEATURES:
 * - Single field focused for quick input
 * - Auto-submit on blur/enter (configurable)
 * - No save button required - just type and done
 * - Toast confirmation on success
 * - Skeleton loading state
 * - Framer Motion animations
 *
 * DESIGN PHILOSOPHY:
 * - "No more save, ok, cancel buttons"
 * - Progressive disclosure - ask for essentials first
 * - Auto-commit on blur for speed
 * - Clear visual feedback
 *
 * @example
 * ```tsx
 * import { ExpressAddModal, useExpressAdd } from "@/components/ui/express-add-modal"
 *
 * function StudentList() {
 *   const { isOpen, open, close } = useExpressAdd()
 *
 *   const handleAdd = async (name: string) => {
 *     await createStudent({ name })
 *     return { success: true }
 *   }
 *
 *   return (
 *     <>
 *       <button onClick={open}>Add Student</button>
 *       <ExpressAddModal
 *         isOpen={isOpen}
 *         onClose={close}
 *         onSubmit={handleAdd}
 *         title="Add Student"
 *         placeholder="Enter student name..."
 *         successMessage="Student added successfully"
 *       />
 *     </>
 *   )
 * }
 * ```
 */

"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, X, Sparkles, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toaster"

// =============================================================================
// TYPES
// =============================================================================

export interface ExpressAddOptions {
  title: string
  description?: string
  placeholder?: string
  submitLabel?: string
  successMessage?: string
  errorMessage?: string
  autoFocus?: boolean
  submitOnBlur?: boolean
  submitOnEnter?: boolean
  minLength?: number
  maxLength?: number
  icon?: React.ComponentType<{ className?: string }>
}

export type ExpressAddResult =
  | { success: true; data?: unknown }
  | { success: false; error: string }

export type ExpressAddSubmitFn = (value: string) => Promise<ExpressAddResult>

export interface ExpressAddModalProps extends ExpressAddOptions {
  isOpen: boolean
  onClose: () => void
  onSubmit: ExpressAddSubmitFn
  defaultValue?: string
}

// =============================================================================
// HOOK
// =============================================================================

export function useExpressAdd() {
  const [isOpen, setIsOpen] = React.useState(false)

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  }
}

// =============================================================================
// TRIGGER BUTTON COMPONENT
// =============================================================================

export interface ExpressAddButtonProps {
  onClick: () => void
  children?: React.ReactNode
  variant?: "default" | "ghost" | "outline"
  size?: "sm" | "md" | "lg"
  className?: string
  icon?: React.ComponentType<{ className?: string }>
}

export function ExpressAddButton({
  onClick,
  children = "Add New",
  variant = "default",
  size = "md",
  className,
  icon: Icon = Plus,
}: ExpressAddButtonProps) {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  }

  const variantStyles = {
    default: "bg-purple-600 text-white hover:bg-purple-700 shadow-md",
    ghost: "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
    outline: "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="w-4 h-4" />
      {children}
    </motion.button>
  )
}

// =============================================================================
// MAIN MODAL COMPONENT
// =============================================================================

export function ExpressAddModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  placeholder = "Type here...",
  submitLabel = "Press Enter or click outside to save",
  successMessage = "Added successfully!",
  errorMessage = "Failed to add. Please try again.",
  autoFocus = true,
  submitOnBlur = true,
  submitOnEnter = true,
  minLength = 1,
  maxLength = 100,
  icon: Icon = Sparkles,
  defaultValue = "",
}: ExpressAddModalProps) {
  const [value, setValue] = React.useState(defaultValue)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { success, error: showError } = useToast()

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setValue(defaultValue)
      setError(null)
      if (autoFocus) {
        // Small delay to ensure transition has started
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
  }, [isOpen, defaultValue, autoFocus])

  const handleSubmit = React.useCallback(async () => {
    const trimmed = value.trim()

    // Validation
    if (trimmed.length < minLength) {
      setError(`Must be at least ${minLength} character${minLength > 1 ? "s" : ""}`)
      inputRef.current?.focus()
      return
    }

    if (maxLength && trimmed.length > maxLength) {
      setError(`Must be less than ${maxLength} characters`)
      inputRef.current?.focus()
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await onSubmit(trimmed)

      if (result.success) {
        success({ title: successMessage, duration: 2000 })
        setValue("")
        onClose()
      } else {
        const errorMsg = result.error || errorMessage
        setError(errorMsg)
        showError({ title: errorMsg })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : errorMessage
      setError(errorMsg)
      showError({ title: errorMsg })
    } finally {
      setIsSubmitting(false)
    }
  }, [value, minLength, maxLength, onSubmit, successMessage, errorMessage, success, showError, onClose])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && submitOnEnter && !isSubmitting) {
        e.preventDefault()
        handleSubmit()
      }
      if (e.key === "Escape") {
        onClose()
      }
    },
    [submitOnEnter, isSubmitting, handleSubmit, onClose]
  )

  const handleBlur = React.useCallback(
    (e: React.FocusEvent) => {
      // Only submit if we're not focusing another child element
      if (submitOnBlur && !isSubmitting && !e.currentTarget.contains(e.relatedTarget)) {
        handleSubmit()
      }
    },
    [submitOnBlur, isSubmitting, handleSubmit]
  )

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.15 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.1 },
    },
  }

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: { duration: 0.1 },
    },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="bg-white dark:bg-[rgb(27,27,31)] rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden"
                style={{
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                }}
                onBlur={handleBlur}
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {title}
                    </h2>
                    {description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Input */}
                <div className="px-5 py-4">
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={placeholder}
                      disabled={isSubmitting}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border-2 text-base transition-all",
                        "focus:outline-none focus:ring-0",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        error
                          ? "border-red-300 dark:border-red-700 focus:border-red-500"
                          : "border-gray-200 dark:border-gray-700 focus:border-purple-500",
                        "bg-gray-50 dark:bg-gray-800/50",
                        "text-gray-900 dark:text-gray-100",
                        "placeholder-gray-400"
                      )}
                    />
                    {isSubmitting && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Error message */}
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center gap-1"
                    >
                      {error}
                    </motion.p>
                  )}

                  {/* Helper text */}
                  {!error && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">
                        Enter
                      </kbd>
                      <span>{submitLabel}</span>
                    </p>
                  )}

                  {/* Character count */}
                  {maxLength && (
                    <div className="mt-2 flex justify-end">
                      <span
                        className={cn(
                          "text-xs transition-colors",
                          value.length > maxLength
                            ? "text-red-500"
                            : value.length > maxLength * 0.9
                            ? "text-yellow-500"
                            : "text-gray-400"
                        )}
                      >
                        {value.length}/{maxLength}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress indicator (for auto-submit) */}
                {submitOnBlur && (
                  <div className="h-1 bg-gray-100 dark:bg-gray-800">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// =============================================================================
// QUICK ADD PATTERN (Multi-field progressive)
// =============================================================================

export interface QuickAddField {
  key: string
  label: string
  placeholder?: string
  type?: "text" | "email" | "number"
  required?: boolean
  validate?: (value: string) => string | undefined
}

export interface QuickAddConfig {
  title: string
  description?: string
  fields: QuickAddField[]
  submitLabel?: string
  successMessage?: string
  icon?: React.ComponentType<{ className?: string }>
}

export type QuickAddSubmitFn = (values: Record<string, string>) => Promise<ExpressAddResult>

export function useQuickAdd(config: QuickAddConfig, onSubmit: QuickAddSubmitFn) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [values, setValues] = React.useState<Record<string, string>>({})
  const { success, error: showError } = useToast()

  const open = () => {
    setValues({})
    setCurrentIndex(0)
    setIsOpen(true)
  }

  const close = () => setIsOpen(false)

  const handleFieldSubmit = async (fieldValue: string) => {
    const field = config.fields[currentIndex]
    const newValues = { ...values, [field.key]: fieldValue }
    setValues(newValues)

    // Check if there's a validation error
    if (field.validate) {
      const error = field.validate(fieldValue)
      if (error) {
        showError({ title: error })
        return
      }
    }

    // Move to next field or submit
    if (currentIndex < config.fields.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      // Final submission
      const result = await onSubmit(newValues)
      if (result.success) {
        success({ title: config.successMessage || "Added successfully!", duration: 2000 })
        close()
      } else {
        showError({ title: result.error || "Failed to add" })
      }
    }
  }

  const currentField = config.fields[currentIndex]

  return {
    isOpen,
    open,
    close,
    currentIndex,
    setCurrentIndex,
    values,
    setValues,
    handleFieldSubmit,
    currentField,
    progress: ((currentIndex + 1) / config.fields.length) * 100,
  }
}
