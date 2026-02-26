/**
 * Enhanced Clerk-Style Toast System
 *
 * A comprehensive toast notification system inspired by Clerk.com's design.
 *
 * FEATURES:
 * - Top-right positioning (Clerk's default)
 * - Smooth slide-in animation (200ms)
 * - Progress bar for auto-dismiss
 * - Stacked toasts (max 5 visible)
 * - Click to dismiss
 * - Multiple variants: success, error, warning, info, loading
 *
 * @example
 * ```tsx
 * // Basic usage
 * import { useToast } from "@/components/ui/toast"
 *
 * function MyComponent() {
 *   const { toast, success, error, warning, info, loading } = useToast()
 *
 *   const handleSave = async () => {
 *     const id = loading({ title: "Saving..." })
 *     try {
 *       await saveData()
 *       success({ title: "Saved successfully!" })
 *     } catch (err) {
 *       error({ title: "Failed to save", description: err.message })
 *     } finally {
 *       dismiss(id)
 *     }
 *   }
 *
 *   return <button onClick={handleSave}>Save</button>
 * }
 * ```
 */

"use client"

import * as React from "react"
import { X, Loader2, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// =============================================================================
// TYPES
// =============================================================================

export type ToastVariant = "default" | "success" | "error" | "warning" | "info" | "loading" | "destructive"

export interface ToastAction {
  label: string
  onClick: () => void
  variant?: "default" | "primary" | "danger"
}

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: ToastAction
  onDismiss?: () => void
  showSaveButton?: boolean
  onSave?: () => void
}

type ToasterContextValue = {
  toasts: Toast[]
  toast: (props: Omit<Toast, "id">) => string
  dismiss: (id: string) => void
}

// =============================================================================
// CONTEXT
// =============================================================================

const ToasterContext = React.createContext<ToasterContextValue | undefined>(undefined)

function useToasterContext() {
  const context = React.useContext(ToasterContext)
  if (!context) {
    return {
      toasts: [],
      toast: () => "",
      dismiss: () => {},
    }
  }
  return context
}

// =============================================================================
// PROVIDER
// =============================================================================

export interface ToastProviderProps {
  children: React.ReactNode
  defaultDuration?: number
  maxToasts?: number
}

export function ToastProvider({
  children,
  defaultDuration = 5000,
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const toastCountRef = React.useRef(0)

  const toast = React.useCallback((props: Omit<Toast, "id">) => {
    const id = `toast-${++toastCountRef.current}-${Date.now()}`
    const newToast: Toast = {
      ...props,
      id,
      variant: props.variant ?? "default",
      duration: props.duration ?? defaultDuration,
    }

    setToasts((prev) => {
      // Remove oldest toast if at max capacity
      const filtered = prev.length >= maxToasts ? prev.slice(1) : prev
      return [...filtered, newToast]
    })

    // Auto-dismiss after duration (unless loading/indefinite)
    if (newToast.duration && newToast.duration > 0 && newToast.variant !== "loading") {
      setTimeout(() => {
        dismiss(id)
      }, newToast.duration)
    }

    return id
  }, [defaultDuration, maxToasts])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => {
      const t = prev.find((t) => t.id === id)
      t?.onDismiss?.()
      return prev.filter((t) => t.id !== id)
    })
  }, [])

  const value = React.useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss])

  return (
    <ToasterContext.Provider value={value}>
      {children}
      <CeramicToaster />
    </ToasterContext.Provider>
  )
}

// =============================================================================
// HOOKS
// =============================================================================

export function useToast() {
  const context = useToasterContext()

  const toastFn = React.useCallback(
    (options: Omit<Toast, "id">): string => {
      return context.toast(options)
    },
    [context.toast]
  )

  const success = React.useCallback(
    (options: Omit<Toast, "id" | "variant">): string => {
      return toastFn({ ...options, variant: "success" })
    },
    [toastFn]
  )

  const error = React.useCallback(
    (options: Omit<Toast, "id" | "variant">): string => {
      return toastFn({ ...options, variant: "error" })
    },
    [toastFn]
  )

  const warning = React.useCallback(
    (options: Omit<Toast, "id" | "variant">): string => {
      return toastFn({ ...options, variant: "warning" })
    },
    [toastFn]
  )

  const info = React.useCallback(
    (options: Omit<Toast, "id" | "variant">): string => {
      return toastFn({ ...options, variant: "info" })
    },
    [toastFn]
  )

  const loading = React.useCallback(
    (options: Omit<Toast, "id" | "variant" | "duration">): string => {
      return toastFn({ ...options, variant: "loading", duration: 0 })
    },
    [toastFn]
  )

  const dismiss = React.useCallback(
    (id: string) => {
      context.dismiss(id)
    },
    [context.dismiss]
  )

  return {
    toasts: context.toasts,
    toast: toastFn,
    dismiss,
    success,
    error,
    warning,
    info,
    loading,
  }
}

// =============================================================================
// CLERK CERAMIC DESIGN TOKENS
// =============================================================================

const ceramicIcons = {
  success: <CheckCircle className="w-5 h-5" style={{ color: "#31c854" }} />,
  error: <AlertCircle className="w-5 h-5" style={{ color: "#f73d3d" }} />,
  warning: <AlertTriangle className="w-5 h-5" style={{ color: "#fd7224" }} />,
  info: <Info className="w-5 h-5" style={{ color: "#307ff6" }} />,
  default: <Info className="w-5 h-5" style={{ color: "#90909d" }} />,
  loading: <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#846bff" }} />,
  destructive: <AlertCircle className="w-5 h-5" style={{ color: "#f73d3d" }} />,
}

// =============================================================================
// ENHANCED TOAST COMPONENT (with Framer Motion)
// =============================================================================

interface EnhancedToastProps {
  toast: Toast
  onDismiss: (id: string) => void
  index: number
}

function EnhancedToast({ toast, onDismiss }: EnhancedToastProps) {
  const icon = ceramicIcons[toast.variant || "default"]

  // Slide in from right animation (Clerk-style)
  const variants = {
    hidden: {
      x: 400,
      opacity: 0,
      scale: 0.95,
    },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "tween",
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      x: 400,
      opacity: 0,
      scale: 0.95,
      transition: {
        type: "tween",
        duration: 0.15,
        ease: [0.4, 0, 1, 1],
      },
    },
  }

  return (
    <motion.div
      layout
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{
        minHeight: "44px",
        width: "360px",
        maxWidth: "calc(100vw - 48px)",
        background: "linear-gradient(135deg, rgb(27, 27, 31) 0%, rgb(21, 21, 24) 100%)",
        border: "1px solid rgb(62, 62, 75)",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
        cursor: "pointer",
      }}
      className="flex items-start gap-3 pointer-events-auto"
      onClick={() => !toast.showSaveButton && onDismiss(toast.id)}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0 mt-0.5" style={{ width: "20px", height: "20px" }}>
        {toast.variant === "loading" ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, repeatType: "loop", duration: 1, ease: "linear" }}
          >
            {icon}
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            {icon}
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {toast.title && (
          <p className="text-sm font-semibold text-white leading-tight">
            {toast.title}
          </p>
        )}
        {toast.description && (
          <p className="text-sm text-gray-300 leading-relaxed mt-1">
            {toast.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
        {toast.showSaveButton && toast.onSave && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation()
              toast.onSave?.()
              onDismiss(toast.id)
            }}
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md"
            style={{
              background: "rgb(62, 62, 75)",
              color: "white",
              border: "1px solid rgb(93, 93, 105)",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Save
          </motion.button>
        )}
        {toast.action && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation()
              toast.action.onClick()
              onDismiss(toast.id)
            }}
            className={cn(
              "inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              toast.action.variant === "primary"
                ? "bg-[#846bff] text-white hover:bg-[#6c47ff]"
                : toast.action.variant === "danger"
                ? "bg-[#f73d3d] text-white hover:bg-[#e02e2e]"
                : "bg-transparent text-gray-300 hover:text-white hover:bg-white/10"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {toast.action.label}
          </motion.button>
        )}
        <motion.button
          onClick={(e) => {
            e.stopPropagation()
            onDismiss(toast.id)
          }}
          className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          aria-label="Close"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}

// =============================================================================
// ENHANCED TOASTER (top-right position with stacking)
// =============================================================================

function CeramicToaster() {
  const { toasts, dismiss } = useToasterContext()

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            className="pointer-events-auto"
          >
            <EnhancedToast toast={toast} onDismiss={dismiss} index={0} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Toast with save option - appears when user makes changes
 * Shows "Unsaved changes" with Save button
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
      showSaveButton: true,
      onSave,
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

// =============================================================================
// EXPORTS
// =============================================================================

export { EnhancedToast, CeramicToaster }
