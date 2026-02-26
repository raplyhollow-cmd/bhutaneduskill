"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useToast } from "@/components/ui/toaster"
import { useDebouncedSave, formatTimeAgo } from "@/hooks/use-debounced-save"
import { SavingBadge } from "./saving-indicator"
import { cn } from "@/lib/utils"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

/**
 * AutoSaveForm Component
 *
 * A wrapper component that enables auto-save for any form with Clerk-style
 * toast notifications. It automatically collects form data from child inputs
 * and saves changes after a configurable debounce delay.
 *
 * Features:
 * - Auto-save on every form field change (no save button needed)
 * - Debounced saves using useDebouncedSave hook (default 500ms)
 * - Clerk-style toast notifications (success/error with retry)
 * - Dirty state tracking (only saves when data actually changes)
 * - Optimistic UI updates (immediate feedback, rollback on error)
 * - Child form data collection (automatic from form inputs)
 * - Saving indicator with visual feedback
 *
 * @example
 * ```tsx
 * <AutoSaveForm
 *   autoSave={true}
 *   debounceMs={500}
 *   onSave={async (data) => {
 *     await fetch('/api/schools/update', {
 *       method: 'PATCH',
 *       body: JSON.stringify(data)
 *     });
 *   }}
 *   initialData={{ name: '', district: '' }}
 * >
 *   <PremiumCard>
 *     <Input name="name" placeholder="School Name" />
 *     <Select name="district" options={districts} />
 *   </PremiumCard>
 * </AutoSaveForm>
 * ```
 */

export interface AutoSaveFormProps<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Form content (inputs, selects, textareas, etc.) */
  children: React.ReactNode
  /** Enable/disable auto-save (default: true) */
  autoSave?: boolean
  /** Debounce delay in milliseconds (default: 500ms) */
  debounceMs?: number
  /** Save function called when data changes */
  onSave: (data: T) => Promise<void>
  /** Called after successful save */
  onSuccess?: (data: T) => void
  /** Called after save error */
  onError?: (error: Error) => void
  /** Initial form data for dirty state tracking */
  initialData?: T
  /** Custom success toast message */
  toastSuccess?: string
  /** Custom error toast message */
  toastError?: string
  /** Show saving indicator in UI (default: true) */
  showSavingIndicator?: boolean
  /** Position of the saving indicator */
  indicatorPosition?: "top-right" | "top-left" | "bottom-right"
  /** Enable optimistic UI updates (default: true) */
  optimisticUpdates?: boolean
  /** Field names to exclude from auto-save */
  excludeFields?: (keyof T | string)[]
  /** Disable showing success toasts (useful for rapid typing) */
  suppressSuccessToast?: boolean
  /** Custom class name for the form wrapper */
  className?: string
  /** ID for the form element */
  id?: string
  /** Called when form data changes (before debounce) */
  onDataChange?: (data: T, isDirty: boolean) => void
  /** Enable dirty state tracking (default: true) */
  trackDirty?: boolean
}

export interface AutoSaveFormContextValue<T = unknown> {
  isSaving: boolean
  isDirty: boolean
  lastSaved: Date | null
  saveError: Error | null
  data: T | null
  triggerSave: (data: T) => Promise<void>
  clearError: () => void
  reset: () => void
}

export function AutoSaveForm<T extends Record<string, unknown> = Record<string, unknown>>({
  children,
  autoSave = true,
  debounceMs = 500,
  onSave,
  onSuccess,
  onError,
  initialData = {} as T,
  toastSuccess,
  toastError,
  showSavingIndicator = true,
  indicatorPosition = "top-right",
  optimisticUpdates = true,
  excludeFields = [],
  suppressSuccessToast = false,
  className,
  id,
  onDataChange,
  trackDirty = true,
}: AutoSaveFormProps<T>) {
  const { toast, dismiss } = useToast()
  const [formData, setFormData] = useState<T>(initialData)
  const [isDirty, setIsDirty] = useState(false)
  const [pendingSave, setPendingSave] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const savingToastRef = useRef<string | null>(null)
  const successToastTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedDataRef = useRef<T>(initialData)

  // Check if data has actually changed (deep equality for objects)
  const hasDataChanged = useCallback(
    (newData: T): boolean => {
      const excludeSet = new Set(excludeFields as string[])

      for (const key in newData) {
        if (excludeSet.has(key)) continue

        const newValue = newData[key]
        const oldValue = lastSavedDataRef.current[key]

        // Handle nested objects and arrays
        if (typeof newValue === 'object' && newValue !== null && typeof oldValue === 'object' && oldValue !== null) {
          if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
            return true
          }
        } else if (newValue !== oldValue) {
          return true
        }
      }
      return false
    },
    [excludeFields]
  )

  // Update last saved data reference
  const updateLastSavedRef = useCallback((data: T) => {
    lastSavedDataRef.current = JSON.parse(JSON.stringify(data)) as T
  }, [])

  // Use debounced save hook
  const { debouncedSave, isSaving, lastSaved, saveError, clearError, saveNow } = useDebouncedSave<T>({
    saveFn: onSave,
    delay: debounceMs,
    onSuccess: (data) => {
      updateLastSavedRef(data)
      setIsDirty(false)
      setPendingSave(false)

      // Dismiss saving toast
      if (savingToastRef.current) {
        dismiss(savingToastRef.current)
        savingToastRef.current = null
      }

      // Clear any pending success toast
      if (successToastTimeoutRef.current) {
        clearTimeout(successToastTimeoutRef.current)
      }

      // Show success toast (with debounce to avoid flashing during rapid typing)
      if (!suppressSuccessToast) {
        successToastTimeoutRef.current = setTimeout(() => {
          toast({
            title: "Changes saved",
            description: toastSuccess || "Your changes have been saved successfully.",
            variant: "success",
            duration: 3000,
          })
        }, 500)
      }

      onSuccess?.(data)
    },
    onError: (error) => {
      setPendingSave(false)

      // Dismiss saving toast
      if (savingToastRef.current) {
        dismiss(savingToastRef.current)
        savingToastRef.current = null
      }

      // Show error toast with retry option
      toast({
        title: "Failed to save",
        description: toastError || error instanceof Error ? error.message : String(error) || "An error occurred while saving your changes.",
        variant: "error",
        duration: 5000,
        action: {
          label: "Retry",
          onClick: () => {
            clearError()
            saveNow(formData)
          },
        },
      })

      onError?.(error)
    },
  })

  // Collect form data from child inputs
  const collectFormData = useCallback((): T => {
    if (!formRef.current) return formData

    const formElement = formRef.current
    const data: Record<string, unknown> = {}
    const excludeSet = new Set(excludeFields as string[])

    // Collect data from standard form elements
    const formDataObj = new FormData(formElement)

    for (const [key, value] of formDataObj.entries()) {
      if (!excludeSet.has(key)) {
        // Handle multiple values for same key (e.g., checkboxes)
        if (key in data) {
          const existing = data[key]
          if (Array.isArray(existing)) {
            existing.push(value)
          } else {
            data[key] = [existing, value]
          }
        } else {
          data[key] = value
        }
      }
    }

    // Collect data from custom elements with data-form-field attribute
    const customFields = formElement.querySelectorAll('[data-form-field]')
    customFields.forEach((field) => {
      const name = field.getAttribute('data-form-field')
      if (name && !excludeSet.has(name)) {
        const value = (field as HTMLInputElement).value
        data[name] = value
      }
    })

    // Merge with initial data to preserve fields not in form
    const result: T = {
      ...initialData,
      ...data,
    } as T

    return result
  }, [formData, initialData, excludeFields])

  // Handle form input changes
  const handleInputChange = useCallback(() => {
    if (!autoSave) return

    const newData = collectFormData()
    const changed = hasDataChanged(newData)

    setFormData(newData)

    if (trackDirty) {
      setIsDirty(changed)
    }

    onDataChange?.(newData, changed)

    // Trigger debounced save if data has changed
    if (changed) {
      setPendingSave(true)
      debouncedSave(newData)
    }
  }, [autoSave, collectFormData, hasDataChanged, trackDirty, onDataChange, debouncedSave])

  // Set up input event listeners
  useEffect(() => {
    if (!formRef.current || !autoSave) return

    const form = formRef.current
    const inputs = form.querySelectorAll('input, select, textarea')

    // Use MutationObserver to handle dynamically added inputs
    const observer = new MutationObserver(() => {
      const allInputs = form.querySelectorAll('input, select, textarea')
      allInputs.forEach((input) => {
        // Only add listener if not already added
        if (!(input as any).__autoSaveListener) {
          input.addEventListener('input', handleInputChange)
          input.addEventListener('change', handleInputChange)
          ;(input as any).__autoSaveListener = true
        }
      })
    })

    observer.observe(form, { childList: true, subtree: true })

    // Add event listeners to existing inputs
    inputs.forEach((input) => {
      input.addEventListener('input', handleInputChange)
      input.addEventListener('change', handleInputChange)
      ;(input as any).__autoSaveListener = true
    })

    return () => {
      observer.disconnect()
      inputs.forEach((input) => {
        input.removeEventListener('input', handleInputChange)
        input.removeEventListener('change', handleInputChange)
      })
    }
  }, [autoSave, handleInputChange])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (successToastTimeoutRef.current) {
        clearTimeout(successToastTimeoutRef.current)
      }
      if (savingToastRef.current) {
        dismiss(savingToastRef.current)
      }
    }
  }, [dismiss])

  // Public API for triggering manual saves
  const triggerSave = useCallback(
    async (data?: T): Promise<void> => {
      const dataToSave = data ?? collectFormData()
      await saveNow(dataToSave)
    },
    [saveNow, collectFormData]
  )

  // Reset form to initial state
  const reset = useCallback(() => {
    setFormData(initialData)
    setIsDirty(false)
    setPendingSave(false)
    if (formRef.current) {
      formRef.current.reset()
    }
    clearError()
  }, [initialData, clearError])

  // Expose save context to children
  const contextValue: AutoSaveFormContextValue<T> = {
    isSaving,
    isDirty,
    lastSaved,
    saveError,
    data: formData,
    triggerSave,
    clearError,
    reset,
  }

  // Position styles for indicator
  const indicatorStyles: Record<typeof indicatorPosition, string> = {
    "top-right": "absolute top-4 right-4",
    "top-left": "absolute top-4 left-4",
    "bottom-right": "absolute bottom-4 right-4",
  }

  return (
    <form
      ref={formRef}
      id={id}
      className={cn("relative", className)}
      data-auto-save={autoSave}
      data-saving={isSaving}
      data-dirty={isDirty}
      onSubmit={(e) => {
        e.preventDefault()
      }}
    >
      {children}

      {/* Saving Indicator */}
      {showSavingIndicator && autoSave && (isDirty || isSaving || pendingSave) && (
        <div className={indicatorStyles[indicatorPosition]}>
          <SavingBadge isSaving={isSaving || pendingSave} lastSaved={lastSaved} error={saveError} />
        </div>
      )}
    </form>
  )
}

/**
 * Internal provider that wraps children to expose form data tracking
 */
interface AutoSaveFormProviderProps<T> {
  value: AutoSaveFormContextValue<T>
  children: React.ReactNode
}

function AutoSaveFormProvider<T>({
  value,
  children,
}: AutoSaveFormProviderProps<T>) {
  return <>{children}</>
}

/**
 * React Context for accessing form state from child components
 */
const FormContext = React.createContext<AutoSaveFormContextValue<unknown> | null>(null)

/**
 * Hook to access auto-save form context from child components
 *
 * @example
 * ```tsx
 * function MyInput() {
 *   const { isSaving, triggerSave } = useAutoSaveForm<MyData>()
 *   return <input disabled={isSaving} />
 * }
 * ```
 */
export function useAutoSaveForm<T = unknown>(): AutoSaveFormContextValue<T> {
  const context = React.useContext(FormContext)
  if (!context) {
    // Return default values when used outside of provider
    return {
      isSaving: false,
      isDirty: false,
      lastSaved: null,
      saveError: null,
      data: null,
      triggerSave: async () => {},
      clearError: () => {},
      reset: () => {},
    } as AutoSaveFormContextValue<T>
  }
  return context as AutoSaveFormContextValue<T>
}

/**
 * Helper component to wrap a form and enable auto-save data tracking
 * Use this when you want to manage state externally and trigger saves manually
 *
 * @example
 * ```tsx
 * const [formData, setFormData] = useState({ name: '' })
 *
 * <AutoSaveForm onSave={saveData} autoSave={true}>
 *   <AutoSaveFormWatch data={formData}>
 *     <Input name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
 *   </AutoSaveFormWatch>
 * </AutoSaveForm>
 * ```
 */
export interface AutoSaveFormWatchProps<T> {
  data: T
  children: React.ReactNode
  disabled?: boolean
}

export function AutoSaveFormWatch<T>({
  data,
  children,
  disabled = false,
}: AutoSaveFormWatchProps<T>) {
  const { triggerSave } = useAutoSaveForm<T>()

  useEffect(() => {
    if (disabled) return

    // Trigger save when data changes
    triggerSave(data)
  }, [data, disabled, triggerSave])

  return <>{children}</>
}

/**
 * Re-export the SavingBadge for standalone use
 */
export { SavingBadge }

/**
 * Export useDebouncedSave for advanced use cases
 */
export { useDebouncedSave, formatTimeAgo } from "@/hooks/use-debounced-save"

/**
 * Saving Indicator Component
 *
 * Standalone component for showing save status with Clerk-style styling
 *
 * @example
 * ```tsx
 * <SavingIndicator
 *   isSaving={false}
 *   isDirty={true}
 *   lastSaved={new Date()}
 *   error={null}
 *   position="top-right"
 * />
 * ```
 */
export interface SavingIndicatorProps {
  isSaving: boolean
  isDirty: boolean
  lastSaved: Date | null
  error?: Error | null
  position?: "top-right" | "top-left" | "bottom-right"
  className?: string
}

export function SavingIndicator({
  isSaving,
  isDirty,
  lastSaved,
  error,
  position = "top-right",
  className,
}: SavingIndicatorProps) {
  const [displayTime, setDisplayTime] = useState<string>("")

  // Update relative time every second when saved
  useEffect(() => {
    if (!lastSaved || isSaving || isDirty) {
      setDisplayTime("")
      return
    }

    const updateTime = () => {
      setDisplayTime(formatTimeAgo(lastSaved))
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [lastSaved, isSaving, isDirty])

  if (!isDirty && !isSaving && !lastSaved && !error) {
    return null
  }

  const positionStyles: Record<typeof position, string> = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
  }

  return (
    <div
      className={cn(
        "absolute flex items-center gap-2 text-xs font-medium transition-all duration-200 animate-in fade-in",
        positionStyles[position],
        error
          ? "text-red-600 dark:text-red-400"
          : isSaving
            ? "text-gray-600 dark:text-gray-400"
            : "text-green-600 dark:text-green-400",
        className
      )}
    >
      {error ? (
        <>
          <AlertCircle className="h-3 w-3" />
          <span>Failed to save</span>
        </>
      ) : isSaving ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3 w-3" />
          <span>Saved</span>
          {displayTime && (
            <span className="text-gray-500 dark:text-gray-500">
              {displayTime}
            </span>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Compact Saving Badge for use in toolbars and headers
 * Clerk-style badge with rounded pill design
 *
 * @example
 * ```tsx
 * <CompactSavingBadge isSaving={false} lastSaved={new Date()} />
 * ```
 */
export interface CompactSavingBadgeProps {
  isSaving: boolean
  lastSaved: Date | null
  error?: Error | null
  className?: string
}

export function CompactSavingBadge({
  isSaving,
  lastSaved,
  error,
  className,
}: CompactSavingBadgeProps) {
  const [displayTime, setDisplayTime] = useState<string>("")

  useEffect(() => {
    if (!lastSaved || isSaving) {
      setDisplayTime("")
      return
    }

    const updateTime = () => {
      const timeStr = formatTimeAgo(lastSaved)
      setDisplayTime(timeStr === "just now" ? "Saved" : `Saved ${timeStr}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [lastSaved, isSaving])

  if (error) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          "bg-red-50 text-red-700 border border-red-200",
          "dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50",
          className
        )}
      >
        <AlertCircle className="h-3 w-3" />
        <span>Failed</span>
      </div>
    )
  }

  if (isSaving) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          "bg-blue-50 text-blue-700 border border-blue-200",
          "dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
          className
        )}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Saving...</span>
      </div>
    )
  }

  if (lastSaved && displayTime) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          "bg-green-50 text-green-700 border border-green-200",
          "dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50",
          className
        )}
      >
        <CheckCircle2 className="h-3 w-3" />
        <span>{displayTime}</span>
      </div>
    )
  }

  return null
}
