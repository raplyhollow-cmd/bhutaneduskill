/**
 * Dialog Component - Engineer Premium (Vercel/Clerk Inspired)
 *
 * ENGINEER PREMIUM FEATURES:
 * - Slide from right animation: animate-in fade-in slide-in-from-right-4
 * - Dual-layer "milled" border shadow
 * - 20% backdrop opacity (bg-black/20)
 * - 150ms snappy transitions
 * - Consistent 8px border radius
 *
 * DESIGN PHILOSOPHY:
 * - "Clean overlays, not heavy modals"
 * - "Slide from side, not center zoom"
 * - "Subtle backdrop blur"
 * - "Keyboard-first interaction"
 */

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

// Types for ceramic variant
export type DialogVariant = "default" | "ceramic" | "hidden" | "engineer"

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & { variant?: DialogVariant }
>(({ className, variant = "default", ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 transition-opacity duration-150",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      // Engineer Premium: 20% backdrop opacity
      variant === "engineer" && "bg-black/20 backdrop-blur-sm",
      variant === "ceramic" && "bg-black/40 backdrop-blur-sm",
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
  side?: "center" | "right"
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, showClose = true, variant = "engineer", side = "center", ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (side === "right") {
    return (
      <DialogPortal>
        <DialogOverlay variant={variant} />
        <DialogPrimitive.Content
          ref={ref}
          {...props}
          asChild
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            onAnimationComplete={() => setIsOpen(true)}
            className={cn(
              "fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-white dark:bg-gray-900 flex flex-col",
              // Engineer Premium: Dual-layer border
              variant === "engineer" && "border-l border-gray-200/60 shadow-[0_0_0_1px_rgba(255,255,255,0.8)_inset,0_8px_32px_rgba(0,0,0,0.12)]",
              // Default variant styles
              variant === "default" && "border-l border-gray-200 dark:border-gray-700 shadow-2xl",
              // Ceramic variant styles
              variant === "ceramic" && "border-l border-[rgb(220,220,224)] dark:border-[rgb(62,62,75)] shadow-2xl",
              className
            )}
          >
            {children}
            {showClose && (
              <DialogPrimitive.Close className={cn(
                "absolute right-4 top-4 rounded-[6px] p-1.5 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none",
                "opacity-70 hover:bg-gray-100 dark:hover:bg-gray-800",
                "focus-visible:ring-2 focus-visible:ring-black/10"
              )}>
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  }

  return (
    <DialogPortal>
      <DialogOverlay variant={variant} />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-6 p-6",
          // Engineer Premium animation: slide from right
          "duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-right-4 data-[state=open]:slide-in-from-right-4",
          // Engineer Premium styles
          variant === "engineer" && "rounded-[8px] border border-gray-200/60 bg-white dark:border-gray-700/60 dark:bg-gray-900 shadow-[0_0_0_1px_rgba(255,255,255,0.8)_inset,0_8px_32px_rgba(0,0,0,0.12)]",
          // Default variant styles
          variant === "default" && "rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-lg",
          // Ceramic variant styles
          variant === "ceramic" && "rounded-xl border border-[rgb(220,220,224)] bg-white dark:border-[rgb(62,62,75)] dark:bg-[rgb(27,27,31)]",
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close className={cn(
            "absolute right-6 top-6 rounded-[6px] p-1.5 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none",
            "opacity-70 hover:bg-gray-100 dark:hover:bg-gray-800",
            "focus-visible:ring-2 focus-visible:ring-black/10"
          )}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: DialogVariant
}

const DialogHeader = ({
  className,
  variant = "engineer",
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
  variant = "engineer",
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
      "text-lg font-semibold leading-none tracking-tight text-[#000000] dark:text-gray-100",
      className
    )}
    style={{ letterSpacing: '-0.02em' }}
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
    className={cn("text-sm text-[#666666] dark:text-gray-400", className)}
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
