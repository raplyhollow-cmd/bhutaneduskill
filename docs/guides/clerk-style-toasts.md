# Clerk-Style Toast Notification System

A comprehensive toast notification system inspired by Clerk.com's design aesthetic.

## Features

- **Top-right positioning** (Clerk's default)
- **Smooth slide-in animation** (200ms from right)
- **Progress bar** for auto-dismiss countdown
- **Stacked toasts** (max 5 visible)
- **Click to dismiss**
- **Multiple variants**: success, error, warning, info, loading
- **Action buttons** with custom variants
- **Dark theme** with premium aesthetics

## Files Created

```
src/components/ui/toaster/
├── index.ts           # Barrel exports
├── types.ts           # Type definitions
├── tokens.ts          # Design tokens
├── animations.tsx     # Framer Motion variants
├── context.tsx        # React Context & Provider
├── toaster.tsx        # Toaster container component
└── clerk-toast.tsx    # Individual toast component
```

## Basic Usage

### 1. Import and use in components

```tsx
"use client"

import { useToast } from "@/components/ui/toast"

export default function MyComponent() {
  const { toast, success, error, warning, info, loading, dismiss } = useToast()

  const handleSave = async () => {
    const id = loading({ title: "Saving..." })

    try {
      await saveData()
      dismiss(id)
      success({ title: "Saved successfully!" })
    } catch (err) {
      dismiss(id)
      error({
        title: "Failed to save",
        description: err.message,
      })
    }
  }

  return (
    <div>
      <button onClick={handleSave}>Save</button>
      <button onClick={() => info({ title: "Just so you know..." })}>
        Show Info
      </button>
      <button onClick={() => warning({ title: "Warning!" })}>
        Show Warning
      </button>
    </div>
  )
}
```

### 2. Provider setup (already in app/layout.tsx)

The `ToastProvider` is already set up in the root layout:

```tsx
// src/app/layout.tsx
import { ToastProvider } from "@/components/ui/toast"

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ClerkProvider>
  )
}
```

## API Reference

### `useToast()` Hook

Returns an object with the following methods:

| Method | Description | Example |
|--------|-------------|---------|
| `toast(options)` | Show a toast with custom options | `toast({ title: "Custom", variant: "success" })` |
| `success(options)` | Show a success toast | `success({ title: "Success!" })` |
| `error(options)` | Show an error toast | `error({ title: "Error!", description: "..." })` |
| `warning(options)` | Show a warning toast | `warning({ title: "Warning!" })` |
| `info(options)` | Show an info toast | `info({ title: "Info", description: "..." })` |
| `loading(options)` | Show a loading toast (no auto-dismiss) | `loading({ title: "Loading..." })` |
| `dismiss(id)` | Dismiss a specific toast | `dismiss(toastId)` |
| `toasts` | Array of active toasts | `toasts.map(t => t.id)` |

### Toast Options

```tsx
interface ToastOptions {
  id?: string                    // Auto-generated if not provided
  title?: string                 // Bold title text
  description?: string           // Secondary description text
  variant?: ToastVariant         // "default" | "success" | "error" | "warning" | "info" | "loading"
  duration?: number              // Auto-dismiss duration in ms (0 = no auto-dismiss)
  action?: ToastAction           // Action button
  onDismiss?: () => void         // Callback when toast is dismissed
  showProgress?: boolean         // Show progress bar (default: true)
  position?: ToastPosition       // "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center"
  icon?: ReactNode              // Custom icon
  dismissOnClick?: boolean       // Dismiss on click (default: true)
  closeable?: boolean            // Show close button (default: true)
}
```

### Action Button

```tsx
interface ToastAction {
  label: string                  // Button text
  onClick: () => void            // Click handler
  variant?: "default" | "primary" | "danger" | "ghost"  // Button style
}
```

## Advanced Examples

### Toast with action button

```tsx
const { toast } = useToast()

toast({
  title: "Changes not saved",
  description: "You have unsaved changes.",
  action: {
    label: "Save",
    onClick: () => saveChanges(),
    variant: "primary"
  }
})
```

### Loading toasts with success/error handling

```tsx
import { useToastLoading } from "@/components/ui/toaster"

function MyComponent() {
  const toast = useToastLoading()

  const handleSubmit = async () => {
    const id = toast.show("Submitting...")

    try {
      await submitForm()
      toast.success(id, { title: "Submitted!" })
    } catch (err) {
      toast.error(id, { title: "Submission failed" })
    }
  }

  return <button onClick={handleSubmit}>Submit</button>
}
```

### Unsaved changes toast helper

```tsx
import { useUnsavedChangesToast } from "@/components/ui/toast"

function FormWithAutoSave() {
  const { showUnsaved, showSaved } = useUnsavedChangesToast()

  const handleSave = () => {
    // Save logic
    showSaved()
  }

  return (
    <form onChange={() => showUnsaved(handleSave)}>
      {/* Form fields */}
    </form>
  )
}
```

### Custom positioning

```tsx
// Show toast in a specific position
toast({
  title: "Bottom left toast",
  position: "bottom-left"
})
```

### Custom icon

```tsx
import { Sparkles } from "lucide-react"

toast({
  title: "Special feature unlocked!",
  icon: <Sparkles className="w-5 h-5 text-yellow-500" />
})
```

## Design Tokens

You can customize the toast appearance using the design tokens in `tokens.ts`:

```tsx
import {
  toastColors,
  toastSpacing,
  toastAnimation,
  toastShadow,
  toastTypography
} from "@/components/ui/toaster"

// Override colors
toastColors.icon.success = "#10b981"
```

## Migration from Old Toast System

The new system is backward compatible with the existing API. Existing code will continue to work:

```tsx
// Old API (still works)
const { toast, success, error } = useToast()

// New convenience methods
const { warning, info, loading } = useToast()
```

## Clerk Design Characteristics

| Feature | Implementation |
|---------|---------------|
| **Position** | Top-right corner (default) |
| **Height** | ~44px (compact) |
| **Border** | 1px, rgb(62, 62, 75) |
| **Background** | Linear gradient from rgb(27, 27, 31) to rgb(21, 21, 24) |
| **Shadow** | 0 4px 12px rgba(0, 0, 0, 0.15) |
| **Animation** | Slide in from right, 200ms, cubic-bezier(0.16, 1, 0.3, 1) |
| **Icon colors** | Success: #31c854, Error: #f73d3d, Warning: #fd7224, Info: #307ff6 |
| **Auto-dismiss** | 5000ms (default) |
| **Max toasts** | 5 visible |
