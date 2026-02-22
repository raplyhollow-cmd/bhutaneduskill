"use client"

import * as React from "react"
import { X, Loader2, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// CLERK CERAMIC DESIGN SYSTEM TOAST
// =============================================================================

export type ToastVariant = "default" | "success" | "error" | "warning" | "loading" | "destructive"

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

export interface ToastAction {
  label: string
  onClick: () => void
  variant?: "default" | "primary" | "danger"
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

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const toastCountRef = React.useRef(0)

  const toast = React.useCallback((props: Omit<Toast, "id">) => {
    const id = `toast-${++toastCountRef.current}-${Date.now()}`
    const newToast: Toast = {
      ...props,
      id,
      variant: props.variant ?? "default",
      duration: props.duration ?? 5000,
    }

    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss after duration (unless loading/indefinite)
    if (newToast.duration && newToast.duration > 0 && newToast.variant !== "loading") {
      setTimeout(() => {
        dismiss(id)
      }, newToast.duration)
    }

    return id
  }, [])

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
}

// =============================================================================
// CERAMIC TOAST COMPONENT (Clerk Design System)
// =============================================================================

interface CeramicToastProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function CeramicToast({ toast, onDismiss }: CeramicToastProps) {
  const icon = ceramicIcons[toast.variant || "default"]

  return (
    <div
      className="flex items-start gap-3 min-w-[320px] max-w-[420px] p-4 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      style={{
        background: 'linear-gradient(135deg, rgb(27,27,31) 0%, rgb(21,21,24) 100%)',
        border: '1px solid rgb(62,62,75)'
      }}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {icon}
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
          <button
            onClick={() => {
              toast.onSave?.()
              onDismiss(toast.id)
            }}
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
            style={{
              background: 'rgb(62,62,75)',
              color: 'white',
              border: '1px solid rgb(93,93,105)'
            }}
          >
            Save
          </button>
        )}
        {toast.action && (
          <button
            onClick={() => {
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
          >
            {toast.action.label}
          </button>
        )}
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// CERAMIC TOASTER (bottom-right position, Clerk style)
// =============================================================================

function CeramicToaster() {
  const { toasts, dismiss } = useToasterContext()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <CeramicToast toast={toast} onDismiss={dismiss} />
        </div>
      ))}
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

export {
  CeramicToast,
  CeramicToaster,
}
