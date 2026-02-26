/**
 * Clerk-Style Toast Types
 *
 * Type definitions for the enhanced toast notification system
 * Inspired by Clerk.com's toast notifications
 */

export type ToastVariant = "default" | "success" | "error" | "warning" | "info" | "loading"
export type ToastPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center"

export interface ToastAction {
  label: string
  onClick: () => void
  variant?: "default" | "primary" | "danger" | "ghost"
}

export interface ToastOptions {
  id?: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: ToastAction
  onDismiss?: () => void
  showProgress?: boolean
  position?: ToastPosition
  icon?: React.ReactNode
  dismissOnClick?: boolean
  closeable?: boolean
}

export interface Toast extends ToastOptions {
  id: string
  createdAt: number
}

export interface ToasterState {
  toasts: Toast[]
}

export interface ToastContextValue {
  toasts: Toast[]
  toast: (options: ToastOptions) => string
  success: (options: Omit<ToastOptions, "variant">) => string
  error: (options: Omit<ToastOptions, "variant">) => string
  warning: (options: Omit<ToastOptions, "variant">) => string
  info: (options: Omit<ToastOptions, "variant">) => string
  loading: (options: Omit<ToastOptions, "variant">) => string
  dismiss: (id: string) => void
  dismissAll: () => void
}

export interface ToastProps {
  toast: Toast
  onDismiss: (id: string) => void
  position: ToastPosition
  index: number
}
