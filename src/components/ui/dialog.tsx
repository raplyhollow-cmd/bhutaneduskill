import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

// Types for ceramic variant
export type DialogVariant = "default" | "ceramic"

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & { variant?: DialogVariant }
>(({ className, variant = "default", ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      variant === "ceramic" && "backdrop-blur-sm bg-black/40",
      variant === "default" && "bg-black/50",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  showClose?: boolean
  variant?: DialogVariant
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, showClose = true, variant = "default", ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay variant={variant} />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-6 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl",
        // Default variant styles
        variant === "default" && "rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
        // Ceramic variant styles
        variant === "ceramic" && "rounded-xl border border-[rgb(220,220,224)] bg-white dark:border-[rgb(62,62,75)] dark:bg-[rgb(27,27,31)]",
        className
      )}
      style={variant === "ceramic" ? {
        boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)"
      } : undefined}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close className={cn(
          "absolute right-6 top-6 rounded-sm transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none",
          "opacity-70 ring-offset-background data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
          variant === "default" && "focus:ring-orange-500",
          variant === "ceramic" && "hover:bg-gray-100 text-gray-500 focus:ring-purple-500 dark:hover:bg-gray-800 dark:text-gray-400"
        )}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: DialogVariant
}

const DialogHeader = ({
  className,
  variant = "default",
  ...props
}: DialogHeaderProps) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      variant === "ceramic" && "border-b border-gray-200 pb-4 dark:border-gray-700",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: DialogVariant
}

const DialogFooter = ({
  className,
  variant = "default",
  ...props
}: DialogFooterProps) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3",
      variant === "ceramic" && "border-t border-gray-200 pt-4 dark:border-gray-700",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
