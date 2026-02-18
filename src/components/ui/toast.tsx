"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// =============================================================================
// TYPES
// =============================================================================

export type ToastVariant = "default" | "destructive" | "success"

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: ToastAction
  onDismiss?: () => void
}

export interface ToastAction {
  label: string
  onClick: () => void
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
    // Return a no-op context for SSR
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

    // Auto-dismiss after duration
    if (newToast.duration && newToast.duration > 0) {
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
      <Toaster />
    </ToasterContext.Provider>
  )
}

// =============================================================================
// TOAST HOOK (Main API - Sonner-compatible)
// =============================================================================

interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: ToastAction
}

export function useToast() {
  const context = useToasterContext()

  const toastFn = React.useCallback(
    (options: ToastOptions): string => {
      return context.toast(options)
    },
    [context.toast]
  )

  const success = React.useCallback(
    (options: Omit<ToastOptions, "variant">): string => {
      return context.toast({ ...options, variant: "success" })
    },
    [context.toast]
  )

  const error = React.useCallback(
    (options: Omit<ToastOptions, "variant">): string => {
      return context.toast({ ...options, variant: "destructive" })
    },
    [context.toast]
  )

  const info = React.useCallback(
    (options: Omit<ToastOptions, "variant">): string => {
      return context.toast({ ...options, variant: "default" })
    },
    [context.toast]
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
    info,
  }
}

// =============================================================================
// TOAST VARIANTS
// =============================================================================

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-4 overflow-hidden rounded-xl border p-4 shadow-lg transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "bg-white text-gray-950 border-gray-200 dark:bg-gray-950 dark:text-gray-50 dark:border-gray-800 [&_svg]:text-gray-900 dark:[&_svg]:text-gray-50",
        destructive:
          "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-900/50 [&_svg]:text-red-600 dark:[&_svg]:text-red-400",
        success:
          "bg-green-50 text-green-900 border-green-200 dark:bg-green-950/50 dark:text-green-200 dark:border-green-900/50 [&_svg]:text-green-600 dark:[&_svg]:text-green-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// =============================================================================
// ICONS
// =============================================================================

const DefaultIcon = () => (
  <div className="size-5 rounded-full bg-gray-900 dark:bg-gray-100" />
)

const ErrorIcon = () => (
  <svg
    className="size-5 shrink-0"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
      clipRule="evenodd"
    />
  </svg>
)

const SuccessIcon = () => (
  <svg
    className="size-5 shrink-0"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
      clipRule="evenodd"
    />
  </svg>
)

const iconByVariant: Record<ToastVariant, React.ReactNode> = {
  default: <DefaultIcon />,
  destructive: <ErrorIcon />,
  success: <SuccessIcon />,
}

// =============================================================================
// TOAST COMPONENT
// =============================================================================

interface ToastItemProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof toastVariants> {
  toast: Toast
  onDismiss: (id: string) => void
}

function Toast({ className, toast, onDismiss, variant, ...props }: ToastItemProps) {
  const { title, description, action } = toast

  return (
    <div
      data-slot="toast"
      data-state="open"
      data-variant={toast.variant}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      {/* Status Icon */}
      <div className="flex shrink-0 items-center justify-center pt-0.5">
        {iconByVariant[toast.variant ?? "default"]}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5">
        {title && (
          <div className="text-sm font-semibold leading-tight tracking-tight">
            {title}
          </div>
        )}
        {description && (
          <div className="text-sm opacity-90 leading-relaxed">
            {description}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-transparent px-3 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {action.label}
          </button>
        )}
        <button
          onClick={() => onDismiss(toast.id)}
          className="min-w-[44px] min-h-[44px] inline-flex shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          aria-label="Close notification"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// TOASTER (Viewport)
// =============================================================================

type ToastPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "bottom-center"
  | "footer-center"

interface ToasterProps {
  position?: ToastPosition
  className?: string
}

const positionStyles: Record<ToastPosition, string> = {
  "top-right": "top-0 right-0 flex-col-reverse",
  "top-left": "top-0 left-0 flex-col-reverse",
  "top-center": "top-0 left-1/2 -translate-x-1/2 flex-col-reverse sm:max-w-[360px]",
  "bottom-right": "bottom-0 right-0 flex-col",
  "bottom-left": "bottom-0 left-0 flex-col",
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2 flex-col sm:max-w-[360px]",
  "footer-center": "bottom-6 left-1/2 -translate-x-1/2 flex-col items-center sm:max-w-[420px]",
}

function Toaster({ position = "bottom-right", className }: ToasterProps) {
  const { toasts, dismiss } = useToasterContext()

  return (
    <div
      data-slot="toaster"
      className={cn(
        "fixed z-[100] flex max-h-screen w-full flex-col gap-2 p-4",
        positionStyles[position],
        className
      )}
    >
      {toasts.map((t) => (
        <Toast
          key={t.id}
          toast={t}
          variant={t.variant}
          onDismiss={dismiss}
        />
      ))}
    </div>
  )
}

// =============================================================================
// SUB-COMPONENTS (for API compatibility)
// =============================================================================

export interface ToastTitleProps extends React.ComponentProps<"div"> {
  children: React.ReactNode
}

function ToastTitle({ className, children, ...props }: ToastTitleProps) {
  return (
    <div
      data-slot="toast-title"
      className={cn("text-sm font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export interface ToastDescriptionProps extends React.ComponentProps<"div"> {
  children: React.ReactNode
}

function ToastDescription({ className, children, ...props }: ToastDescriptionProps) {
  return (
    <div
      data-slot="toast-description"
      className={cn("text-sm opacity-90 leading-relaxed", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export interface ToastCloseProps extends React.ComponentProps<"button"> {}

function ToastClose({ className, ...props }: ToastCloseProps) {
  return (
    <button
      data-slot="toast-close"
      className={cn(
        "min-w-[44px] min-h-[44px] inline-flex shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      aria-label="Close notification"
      {...props}
    >
      <X className="size-4" />
    </button>
  )
}

export interface ToastActionProps extends React.ComponentProps<"button"> {
  altText?: string
}

function ToastAction({ className, altText = "Action", children, ...props }: ToastActionProps) {
  return (
    <button
      data-slot="toast-action"
      className={cn(
        "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-transparent bg-transparent px-3 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// =============================================================================
// CLERK-STYLE FOOTER TOAST
// =============================================================================

interface ClerkStyleToastProps {
  message: string
  variant?: "default" | "success" | "error"
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: "default" | "primary" | "danger"
  }>
  onDismiss?: () => void
}

const clerkToastStyles = {
  container: cn(
    "mx-auto flex min-h-10 w-fit min-w-[21.25rem] items-center gap-2 rounded-lg p-2 pl-3 text-white shadow-lg transition-all duration-300"
  ),
  variants: {
    default: "bg-gradient-to-b from-gray-700 to-gray-800 border border-gray-600",
    success: "bg-gradient-to-b from-green-600 to-green-700 border border-green-500",
    error: "bg-gradient-to-b from-red-600 to-red-700 border border-red-500",
  }
}

const clerkButtonStyles = {
  base: "inline-flex min-w-fit shrink-0 select-none transition rounded-[0.375rem] text-sm font-medium",
  variants: {
    default: "bg-gray-600 hover:bg-gray-500 text-white",
    primary: "bg-blue-600 hover:bg-blue-500 text-white",
    danger: "bg-red-700 hover:bg-red-600 text-white",
  }
}

export function ClerkStyleFooterToast({
  message,
  variant = "default",
  actions = [],
  onDismiss,
}: ClerkStyleToastProps) {
  return (
    <div
      className={cn(
        clerkToastStyles.container,
        clerkToastStyles.variants[variant]
      )}
      style={{
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 2px 0 rgba(255,255,255,0.12), 0 16px 36px -6px rgba(0,0,0,0.36), 0 6px 16px -2px rgba(0,0,0,0.2)"
      }}
    >
      {/* Status Icon */}
      <div className="flex shrink-0 items-center justify-center">
        {variant === "error" && (
          <svg
            className="w-4 h-4"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="var(--icon-fill, rgba(255,255,255,0.15))"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M10 11V13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M10 7.01V7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
        {variant === "success" && (
          <svg
            className="w-4 h-4"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="var(--icon-fill, rgba(255,255,255,0.15))"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M7 10L9 12L13 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {variant === "default" && (
          <svg
            className="w-4 h-4"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="var(--icon-fill, rgba(255,255,255,0.15))"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M10 6V14M6 10H14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* Message */}
      <div className="flex-1 pr-2 text-sm">
        {message}
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex shrink-0 items-center gap-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick()
                onDismiss?.()
              }}
              className={cn(
                clerkButtonStyles.base,
                clerkButtonStyles.variants[action.variant || "default"],
                "px-3 py-1.5"
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Dismiss Button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="min-w-[32px] min-h-[32px] inline-flex shrink-0 items-center justify-center rounded transition-opacity hover:bg-white/10 opacity-70 hover:opacity-100"
          aria-label="Close notification"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

// =============================================================================
// FOOTER TOASTER (Clerk-style container)
// =============================================================================

export function FooterToaster({ toasts, onDismiss }: { toasts: Array<Omit<Toast, 'id'> & { id: string }>, onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <ClerkStyleFooterToast
          key={toast.id}
          message={toast.description || toast.title || ""}
          variant={toast.variant === "destructive" ? "error" : toast.variant === "success" ? "success" : "default"}
          actions={toast.action ? [{ label: toast.action.label, onClick: toast.action.onClick }] : []}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  )
}

// =============================================================================
// TOAST VIEWPORT (alias for Toaster)
// =============================================================================

export { Toaster as ToastViewport }

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Toast,
  toastVariants,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}

export type { ToastItemProps, ToasterProps, ToastPosition, ClerkStyleToastProps }
