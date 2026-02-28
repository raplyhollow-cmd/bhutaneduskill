/**
 * IN-PLACE EDITOR
 *
 * Click-to-edit inline editing component inspired by Notion and Linear.
 *
 * FEATURES:
 * - Click to edit inline (no modal required)
 * - Auto-save on blur
 * - Escape to cancel
 * - Visual feedback during edit
 * - Optimistic UI updates
 * - Skeleton loading state
 * - Multi-line support
 *
 * DESIGN PHILOSOPHY:
 * - "Edit where you read"
 * - Zero context switching
 * - Immediate visual feedback
 * - Graceful failure recovery
 *
 * @example
 * ```tsx
 * import { InPlaceEditor, InPlaceText, InPlaceTextarea } from "@/components/ui/in-place-editor"
 *
 * function StudentName() {
 *   const [name, setName] = useState("Tashi Wangyel")
 *
 *   const handleSave = async (newValue: string) => {
 *     await updateStudent({ name: newValue })
 *     return { success: true }
 *   }
 *
 *   return (
 *     <InPlaceText
 *       value={name}
 *       onSave={handleSave}
 *       onChange={setName}
 *       placeholder="Student name"
 *     />
 *   )
 * }
 * ```
 */

"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, Loader2, Pencil, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toaster"

// =============================================================================
// TYPES
// =============================================================================

export interface InPlaceEditorBaseProps {
  value: string
  onSave: (value: string) => Promise<{ success: boolean; error?: string }>
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  minLength?: number
  required?: boolean
  editLabel?: string
  displayClassName?: string
  inputClassName?: string
  showIcon?: boolean
  loadingComponent?: React.ReactNode
  successDuration?: number
}

export interface InPlaceTextProps extends InPlaceEditorBaseProps {
  type?: "text" | "email" | "number" | "url" | "tel"
  multiline?: false
  rows?: never
}

export interface InPlaceTextareaProps extends InPlaceEditorBaseProps {
  multiline: true
  rows?: number
  type?: never
}

// =============================================================================
// SHARED EDITOR STATE
// =============================================================================

interface EditorState {
  isEditing: boolean
  editValue: string
  originalValue: string
  isSaving: boolean
  hasError: boolean
  errorMessage: string
}

function useInPlaceEditor(
  value: string,
  onSave: InPlaceEditorBaseProps["onSave"],
  onChange?: (value: string) => void,
  options: {
    minLength?: number
    maxLength?: number
    required?: boolean
    successDuration?: number
  } = {}
) {
  const [state, setState] = React.useState<EditorState>({
    isEditing: false,
    editValue: value,
    originalValue: value,
    isSaving: false,
    hasError: false,
    errorMessage: "",
  })

  const { success, error: showError } = useToast()
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Update edit value when prop changes (from outside edit mode)
  React.useEffect(() => {
    if (!state.isEditing) {
      setState((prev) => ({ ...prev, editValue: value, originalValue: value }))
    }
  }, [value, state.isEditing])

  const startEditing = React.useCallback(() => {
    setState({
      isEditing: true,
      editValue: state.originalValue,
      originalValue: state.originalValue,
      isSaving: false,
      hasError: false,
      errorMessage: "",
    })
  }, [state.originalValue])

  const cancelEditing = React.useCallback(() => {
    setState({
      isEditing: false,
      editValue: state.originalValue,
      originalValue: state.originalValue,
      isSaving: false,
      hasError: false,
      errorMessage: "",
    })
  }, [state.originalValue])

  const handleChange = React.useCallback((newValue: string) => {
    setState((prev) => ({ ...prev, editValue: newValue, hasError: false, errorMessage: "" }))
  }, [])

  const handleSave = React.useCallback(async () => {
    const trimmed = state.editValue.trim()

    // Validation
    if (options.required && !trimmed) {
      setState((prev) => ({
        ...prev,
        hasError: true,
        errorMessage: "This field is required",
      }))
      return false
    }

    if (options.minLength && trimmed.length < options.minLength) {
      setState((prev) => ({
        ...prev,
        hasError: true,
        errorMessage: `Minimum ${options.minLength} character${options.minLength > 1 ? "s" : ""} required`,
      }))
      return false
    }

    if (options.maxLength && trimmed.length > options.maxLength) {
      setState((prev) => ({
        ...prev,
        hasError: true,
        errorMessage: `Maximum ${options.maxLength} characters allowed`,
      }))
      return false
    }

    // No change
    if (trimmed === state.originalValue) {
      setState({ isEditing: false, editValue: trimmed, originalValue: trimmed, isSaving: false, hasError: false, errorMessage: "" })
      return true
    }

    setState((prev) => ({ ...prev, isSaving: true, hasError: false, errorMessage: "" }))

    try {
      const result = await onSave(trimmed)

      if (result.success) {
        setState({
          isEditing: false,
          editValue: trimmed,
          originalValue: trimmed,
          isSaving: false,
          hasError: false,
          errorMessage: "",
        })

        // Call onChange with new value
        onChange?.(trimmed)

        // Show success feedback
        if (options.successDuration && options.successDuration > 0) {
          success({ title: "Saved", duration: options.successDuration })
        }

        return true
      } else {
        setState((prev) => ({
          ...prev,
          isSaving: false,
          hasError: true,
          errorMessage: result.error || "Failed to save",
        }))
        showError({ title: result.error || "Failed to save" })
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save"
      setState((prev) => ({
        ...prev,
        isSaving: false,
        hasError: true,
        errorMessage,
      }))
      showError({ title: errorMessage })
      return false
    }
  }, [state.editValue, state.originalValue, onSave, onChange, options, success, showError])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSave()
      }
      if (e.key === "Escape") {
        e.preventDefault()
        cancelEditing()
      }
    },
    [handleSave, cancelEditing]
  )

  const handleBlur = React.useCallback(() => {
    // Don't save on blur if there's an error
    if (state.hasError) return
    // Auto-save on blur
    handleSave()
  }, [handleSave, state.hasError])

  return {
    state,
    startEditing,
    cancelEditing,
    handleChange,
    handleSave,
    handleKeyDown,
    handleBlur,
  }
}

// =============================================================================
// TEXT INPUT VARIANT
// =============================================================================

export function InPlaceText({
  value,
  onSave,
  onChange,
  placeholder = "Click to edit...",
  disabled = false,
  maxLength,
  minLength,
  required = false,
  type = "text",
  editLabel = "Edit",
  displayClassName,
  inputClassName,
  showIcon = true,
  loadingComponent,
  successDuration = 0,
}: InPlaceTextProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const displayRef = React.useRef<HTMLDivElement>(null)

  const {
    state,
    startEditing,
    cancelEditing,
    handleChange,
    handleSave,
    handleKeyDown,
    handleBlur,
  } = useInPlaceEditor(value, onSave, onChange, { minLength, maxLength, required, successDuration })

  // Focus input when editing starts
  React.useEffect(() => {
    if (state.isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [state.isEditing])

  // Handle display click
  const handleDisplayClick = React.useCallback(() => {
    if (!disabled && !state.isSaving) {
      startEditing()
    }
  }, [disabled, state.isSaving, startEditing])

  return (
    <div className="relative group">
      {/* Display Mode */}
      {!state.isEditing ? (
        <motion.div
          ref={displayRef}
          onClick={handleDisplayClick}
          className={cn(
            "inline-flex items-center gap-2 px-2 py-1 -mx-2 -my-1 rounded-md cursor-pointer transition-colors",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            disabled && "cursor-default hover:bg-transparent",
            displayClassName
          )}
          whileHover={disabled ? {} : { scale: 1.01 }}
          whileTap={disabled ? {} : { scale: 0.99 }}
        >
          {value ? (
            <span className="text-gray-900 dark:text-gray-100">{value}</span>
          ) : (
            <span className="text-gray-400 italic">{placeholder}</span>
          )}
          {showIcon && !disabled && (
            <motion.span
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <Pencil className="w-3.5 h-3.5 text-gray-400" />
            </motion.span>
          )}
        </motion.div>
      ) : (
        /* Edit Mode */
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type={type}
              value={state.editValue}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              disabled={state.isSaving}
              placeholder={placeholder}
              maxLength={maxLength}
              className={cn(
                "w-full px-2 py-1 rounded-md border-2 text-sm transition-all",
                "focus:outline-none focus:ring-0",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                state.hasError
                  ? "border-red-300 dark:border-red-700 focus:border-red-500"
                  : "border-purple-300 dark:border-purple-700 focus:border-purple-500",
                "bg-white dark:bg-gray-800",
                "text-gray-900 dark:text-gray-100",
                inputClassName
              )}
            />

            {/* Loading indicator */}
            {state.isSaving && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {loadingComponent || <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />}
              </div>
            )}

            {/* Action buttons */}
            {!state.isSaving && (
              <motion.div
                className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                  onMouseDown={(e) => e.preventDefault()} // Prevent blur
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600"
                  onMouseDown={(e) => e.preventDefault()} // Prevent blur
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </div>

          {/* Character count */}
          {maxLength && (
            <span
              className={cn(
                "text-xs shrink-0",
                state.editValue.length > maxLength
                  ? "text-red-500"
                  : state.editValue.length > maxLength * 0.9
                  ? "text-yellow-500"
                  : "text-gray-400"
              )}
            >
              {state.editValue.length}/{maxLength}
            </span>
          )}
        </div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {state.hasError && state.errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1"
          >
            {state.errorMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// =============================================================================
// TEXTAREA VARIANT
// =============================================================================

export function InPlaceTextarea({
  value,
  onSave,
  onChange,
  placeholder = "Click to edit...",
  disabled = false,
  maxLength,
  minLength,
  required = false,
  rows = 3,
  editLabel = "Edit",
  displayClassName,
  inputClassName,
  showIcon = true,
  loadingComponent,
  successDuration = 0,
}: InPlaceTextareaProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const {
    state,
    startEditing,
    cancelEditing,
    handleChange,
    handleSave,
    handleKeyDown,
    handleBlur,
  } = useInPlaceEditor(value, onSave, onChange, { minLength, maxLength, required, successDuration })

  // Focus textarea when editing starts
  React.useEffect(() => {
    if (state.isEditing && textareaRef.current) {
      textareaRef.current.focus()
      // Move cursor to end
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [state.isEditing])

  return (
    <div className="relative group">
      {/* Display Mode */}
      {!state.isEditing ? (
        <motion.div
          onClick={() => !disabled && !state.isSaving && startEditing()}
          className={cn(
            "p-3 rounded-lg border-2 border-transparent cursor-pointer transition-colors",
            "hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700",
            disabled && "cursor-default hover:bg-transparent hover:border-transparent",
            displayClassName
          )}
          whileHover={disabled ? {} : { scale: 1.01 }}
          whileTap={disabled ? {} : { scale: 0.99 }}
        >
          {value ? (
            <span className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
              {value}
            </span>
          ) : (
            <span className="text-gray-400 italic">{placeholder}</span>
          )}
          {showIcon && !disabled && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <Pencil className="w-3.5 h-3.5" />
              <span>{editLabel}</span>
            </div>
          )}
        </motion.div>
      ) : (
        /* Edit Mode */
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={state.editValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={state.isSaving}
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
            className={cn(
              "w-full p-3 rounded-lg border-2 text-sm resize-none transition-all",
              "focus:outline-none focus:ring-0",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              state.hasError
                ? "border-red-300 dark:border-red-700 focus:border-red-500"
                : "border-purple-300 dark:border-purple-700 focus:border-purple-500",
              "bg-white dark:bg-gray-800",
              "text-gray-900 dark:text-gray-100",
              inputClassName
            )}
          />

          {/* Footer with actions */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {state.isSaving ? (
                loadingComponent || <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="px-3 py-1.5 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center gap-1.5 transition-colors"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-3 py-1.5 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-1.5 transition-colors"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                    title="Reset to original"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* Character count */}
            {maxLength && (
              <span
                className={cn(
                  "text-xs",
                  state.editValue.length > maxLength
                    ? "text-red-500"
                    : state.editValue.length > maxLength * 0.9
                    ? "text-yellow-500"
                    : "text-gray-400"
                )}
              >
                {state.editValue.length}/{maxLength}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {state.hasError && state.errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1"
          >
            {state.errorMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// =============================================================================
// FIELD EDITOR (Label + Input)
// =============================================================================

export interface InPlaceFieldProps extends Omit<InPlaceTextProps, "value"> {
  label: string
  value: string
  layout?: "horizontal" | "vertical"
  labelWidth?: string
}

export function InPlaceField({
  label,
  layout = "horizontal",
  labelWidth = "120px",
  ...editorProps
}: InPlaceFieldProps) {
  return (
    <div className={cn(
      "flex gap-3",
      layout === "horizontal" ? "flex-row items-center" : "flex-col"
    )}>
      {label && (
        <label
          className={cn(
            "text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0",
            layout === "horizontal" ? labelWidth : ""
          )}
        >
          {label}
        </label>
      )}
      <div className="flex-1 min-w-0">
        <InPlaceText {...editorProps} />
      </div>
    </div>
  )
}

// =============================================================================
// REVERTIBLE EDITOR (Shows undo after save)
// =============================================================================

export function InPlaceTextWithUndo({
  value,
  onSave,
  onChange,
  ...props
}: Omit<InPlaceTextProps, "successDuration">) {
  const [lastSavedValue, setLastSavedValue] = React.useState(value)
  const [showUndo, setShowUndo] = React.useState(false)
  const undoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    setLastSavedValue(value)
  }, [value])

  const handleSave = async (newValue: string) => {
    const result = await onSave(newValue)
    if (result.success) {
      setLastSavedValue(newValue)
      setShowUndo(true)

      // Auto-hide undo after 5 seconds
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current)
      }
      undoTimeoutRef.current = setTimeout(() => {
        setShowUndo(false)
      }, 5000)
    }
    return result
  }

  const handleUndo = async () => {
    const result = await onSave(lastSavedValue)
    if (result.success) {
      setShowUndo(false)
      onChange?.(lastSavedValue)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <InPlaceText
        value={value}
        onSave={handleSave}
        onChange={onChange}
        {...props}
        showIcon={!showUndo}
      />
      <AnimatePresence>
        {showUndo && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleUndo}
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 text-sm flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Undo
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default InPlaceText
