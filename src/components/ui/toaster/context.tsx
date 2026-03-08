/**
 * Clerk-Style Toast Context & Provider
 *
 * React context for managing toast notifications
 * - Centralized toast state
 * - Convenience methods (success, error, warning, info, loading)
 * - Auto-dismiss management
 * - Toast stacking with configurable limits
 *
 * @example
 * ```tsx
 * // In app root
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * // In components
 * const { toast, success, error } = useToast()
 * success({ title: "Saved!" })
 * ```
 */

"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import type { Toast, ToastContextValue, ToastOptions, ToastPosition } from "./types"
import { Toaster } from "./toaster"

// ============================================================================
// CONTEXT
// ============================================================================

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

// ============================================================================
// PROVIDER
// ============================================================================

export interface ToastProviderProps {
  children: React.ReactNode
  /**
   * Default position for toasts
   * @default "top-right"
   */
  defaultPosition?: ToastOptions["position"]
  /**
   * Default duration for auto-dismiss (ms)
   * @default 5000
   */
  defaultDuration?: number
  /**
   * Maximum number of toasts to show
   * @default 5
   */
  maxToasts?: number
  /**
   * Enable progress bar
   * @default true
   */
  showProgress?: boolean
}

export function ToastProvider({
  children,
  defaultPosition = "top-right",
  defaultDuration = 5000,
  maxToasts = 5,
  showProgress = true,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastCountRef = useRef(0)
  const timeoutRefsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      timeoutRefsRef.current.forEach((timeout) => clearTimeout(timeout))
      timeoutRefsRef.current.clear()
    }
  }, [])

  // Create a new toast
  const toast = useCallback((options: ToastOptions): string => {
    const id = options.id ?? `toast-${++toastCountRef.current}-${Date.now()}`

    const newToast: Toast = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant ?? "default",
      duration: options.duration ?? defaultDuration,
      action: options.action,
      onDismiss: options.onDismiss,
      showProgress: options.showProgress ?? showProgress,
      position: options.position ?? defaultPosition,
      icon: options.icon,
      dismissOnClick: options.dismissOnClick ?? true,
      closeable: options.closeable ?? true,
      createdAt: Date.now(),
    }

    setToasts((prev) => {
      // Remove oldest toast if at max capacity
      const filtered = prev.length >= maxToasts ? prev.slice(1) : prev
      return [...filtered, newToast]
    })

    // Auto-dismiss after duration (unless loading or indefinite)
    if (newToast.duration && newToast.duration > 0 && newToast.variant !== "loading") {
      const timeout = setTimeout(() => {
        dismiss(id)
      }, newToast.duration)
      timeoutRefsRef.current.set(id, timeout)
    }

    return id
  }, [defaultDuration, defaultPosition, showProgress, maxToasts])

  // Dismiss a specific toast
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => {
      const toastToRemove = prev.find((t) => t.id === id)
      if (toastToRemove?.onDismiss) {
        toastToRemove.onDismiss()
      }

      // Clear timeout if exists
      const timeout = timeoutRefsRef.current.get(id)
      if (timeout) {
        clearTimeout(timeout)
        timeoutRefsRef.current.delete(id)
      }

      return prev.filter((t) => t.id !== id)
    })
  }, [])

  // Dismiss all toasts
  const dismissAll = useCallback(() => {
    setToasts((prev) => {
      prev.forEach((t) => t.onDismiss?.())
      return []
    })
    timeoutRefsRef.current.forEach((timeout) => clearTimeout(timeout))
    timeoutRefsRef.current.clear()
  }, [])

  // Convenience methods
  const success = useCallback(
    (options: Omit<ToastOptions, "variant">): string => {
      return toast({ ...options, variant: "success" })
    },
    [toast]
  )

  const error = useCallback(
    (options: Omit<ToastOptions, "variant">): string => {
      return toast({ ...options, variant: "error" })
    },
    [toast]
  )

  const warning = useCallback(
    (options: Omit<ToastOptions, "variant">): string => {
      return toast({ ...options, variant: "warning" })
    },
    [toast]
  )

  const info = useCallback(
    (options: Omit<ToastOptions, "variant">): string => {
      return toast({ ...options, variant: "info" })
    },
    [toast]
  )

  const loading = useCallback(
    (options: Omit<ToastOptions, "variant" | "duration">): string => {
      return toast({ ...options, variant: "loading", duration: 0 })
    },
    [toast]
  )

  // Context value
  const value: ToastContextValue = React.useMemo(
    () => ({
      toasts,
      toast,
      success,
      error,
      warning,
      info,
      loading,
      dismiss,
      dismissAll,
    }),
    [toasts, toast, success, error, warning, info, loading, dismiss, dismissAll]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster position={defaultPosition} maxToasts={maxToasts} />
    </ToastContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * useToast hook
 *
 * Provides methods to trigger toast notifications
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { toast, success, error, dismiss } = useToast()
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData()
 *       success({ title: "Saved successfully!" })
 *     } catch (err) {
 *       error({ title: "Failed to save", description: err.message })
 *     }
 *   }
 *
 *   return <button onClick={handleSave}>Save</button>
 * }
 * ```
 */
export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext)

  // Return safe no-op functions if context is not available (e.g., during SSR)
  if (!context) {
    const noop = () => {}
    const noopToast = () => ""

    return {
      toast: noopToast,
      success: noopToast,
      error: noopToast,
      warning: noopToast,
      info: noopToast,
      loading: noopToast,
      dismiss: noop,
      dismissAll: noop,
      toasts: [],
    }
  }

  return context
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * useToastSuccess hook
 * Shorthand for only success toasts
 */
export function useToastSuccess() {
  const { success } = useToast()
  return success
}

/**
 * useToastError hook
 * Shorthand for only error toasts
 */
export function useToastError() {
  const { error } = useToast()
  return error
}

/**
 * useToastLoading hook
 * Shorthand for loading toasts with automatic success/error handling
 */
export function useToastLoading() {
  const { loading, success, error, dismiss } = useToast()

  /**
   * Show a loading toast and automatically replace it with success/error
   *
   * @example
   * ```tsx
   * const toast = useToastLoading()
   *
   * const handleAction = async () => {
   *   const id = toast.show("Saving...")
   *   try {
   *     await save()
   *     toast.success(id, { title: "Saved!" })
   *   } catch (err) {
   *     toast.error(id, { title: "Failed to save" })
   *   }
   * }
   * ```
   */
  const show = useCallback((options: Omit<ToastOptions, "variant" | "duration">) => {
    return loading(options)
  }, [loading])

  const updateToSuccess = useCallback((id: string, options?: Omit<ToastOptions, "variant">) => {
    dismiss(id)
    return success({ ...options, duration: 3000 })
  }, [dismiss, success])

  const updateToError = useCallback((id: string, options?: Omit<ToastOptions, "variant">) => {
    dismiss(id)
    return error({ ...options, duration: 5000 })
  }, [dismiss, error])

  return { show, success: updateToSuccess, error: updateToError }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ToastContext }

/**
 * Internal hook for accessing toaster context
 * Used by the Toaster component
 */
export function useToasterContext() {
  const context = React.useContext(ToastContext)
  if (!context) {
    return { toasts: [], toast: () => "", dismiss: () => "" }
  }
  return context
}

// ============================================================================
// UNSAVED CHANGES TOAST HOOK
// ============================================================================

/**
 * useUnsavedChangesToast hook
 *
 * Manages unsaved changes notification with save functionality
 * Similar to the simple toast.tsx but uses the full-featured toaster
 *
 * @example
 * ```tsx
 * const { showUnsaved, hideUnsaved, showSaved } = useUnsavedChangesToast()
 *
 * const handleInputChange = () => {
 *   showUnsaved(async () => {
 *     await saveChanges()
 *   })
 * }
 * ```
 */
export function useUnsavedChangesToast() {
  const { toast, dismiss } = useToast()
  const toastIdRef = React.useRef<string | null>(null)

  const showUnsaved = React.useCallback((onSave: () => void) => {
    // Dismiss existing toast first
    if (toastIdRef.current) {
      dismiss(toastIdRef.current)
    }

    const id = toast({
      title: "Unsaved changes",
      description: "You have unsaved changes. Save them before leaving?",
      variant: "warning",
      duration: 0, // Manual dismiss
      action: {
        label: "Save",
        onClick: onSave,
        variant: "primary",
      },
    })

    toastIdRef.current = id
    return id
  }, [toast, dismiss])

  const hideUnsaved = React.useCallback(() => {
    if (toastIdRef.current) {
      dismiss(toastIdRef.current)
      toastIdRef.current = null
    }
  }, [dismiss])

  const showSaved = React.useCallback(() => {
    hideUnsaved()
    toast({
      title: "Changes saved",
      variant: "success",
      duration: 2000,
    })
  }, [hideUnsaved, toast])

  return { showUnsaved, hideUnsaved, showSaved }
}
