/**
 * Clerk-Style Toast System
 *
 * A comprehensive toast notification system inspired by Clerk.com
 *
 * @example
 * ```tsx
 * // Import and use in your app
 * import { ToastProvider, useToast } from "@/components/ui/toaster"
 *
 * // In your root layout
 * export default function Layout({ children }) {
 *   return (
 *     <ToastProvider defaultPosition="top-right">
 *       {children}
 *     </ToastProvider>
 *   )
 * }
 *
 * // In any component
 * function MyComponent() {
 *   const { toast, success, error, warning, info, loading } = useToast()
 *
 *   return (
 *     <div>
 *       <button onClick={() => success({ title: "Saved!" })}>
 *         Save
 *       </button>
 *       <button onClick={() => error({ title: "Error!", description: "Something went wrong" })}>
 *         Fail
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */

// Provider & Context
export { ToastProvider, useToast, useToastLoading, useToastSuccess, useToastError, useUnsavedChangesToast } from "./context"
export type { ToastProviderProps } from "./context"

// Components
export { Toaster, MultiPositionToaster, TopRightToaster, BottomRightToaster, CenterTopToaster } from "./toaster"
export { ClerkToast, CompactClerkToast } from "./clerk-toast"

// Types
export type { Toast, ToastOptions, ToastAction, ToastVariant, ToastPosition, ToastProps, ToasterState, ToastContextValue } from "./types"

// Tokens (for customization)
export { toastColors, toastSpacing, toastAnimation, toastShadow, toastTypography, toastSize, toastPosition, toastProgress, toastBackdrop, getVariantStyles, getPositionStyles } from "./tokens"

// Animations (for advanced customization)
export { slideInRight, slideInLeft, slideInTop, slideInBottom, scaleIn, progressShrink, checkmarkDraw, errorX, spinner, iconBounce, subtlePulse, stackChildren, getAnimationForPosition, getIconAnimation } from "./animations"
