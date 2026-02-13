"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// FULL SCREEN MODAL
// ============================================================================
// Adaptive modal component that:
// - Shows as full-screen slide-up on mobile (app-like experience)
// - Shows as centered dialog on desktop (traditional modal)
// - Uses safe-area-inset for notched devices
// - Supports swipe-down to close on mobile
// ============================================================================

const FullScreenModal = DialogPrimitive.Root;

const FullScreenModalTrigger = DialogPrimitive.Trigger;

const FullScreenModalPortal = DialogPrimitive.Portal;

const FullScreenModalClose = DialogPrimitive.Close;

interface FullScreenModalOverlayProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> {}

const FullScreenModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  FullScreenModalOverlayProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
FullScreenModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface FullScreenModalContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  showClose?: boolean;
  closeOnSwipe?: boolean;
}

const FullScreenModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  FullScreenModalContentProps
>(({ className, children, showClose = true, closeOnSwipe = true, ...props }, ref) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [currentY, setCurrentY] = React.useState(0);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const dialogRef = ref as React.RefObject<HTMLDivElement>;

  // Swipe down to close (mobile only)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!closeOnSwipe) return;
    // Only enable swipe from top edge of content
    if (e.touches[0].clientY < 100) {
      setIsDragging(true);
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) {
      setCurrentY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // If dragged more than 100px, close the modal
    if (currentY > 100) {
      // Trigger close via Radix's close handler
      const closeButton = contentRef.current?.querySelector('[data-radix-dialog-close]') as HTMLButtonElement;
      closeButton?.click();
    }
    setCurrentY(0);
  };

  // Combine refs
  const setRefs = React.useCallback(
    (node: HTMLDivElement) => {
      (contentRef as React.MutableRefObject<HTMLDivElement>).current = node;
      if (typeof dialogRef === 'function') {
        dialogRef(node);
      } else if (dialogRef) {
        dialogRef.current = node;
      }
    },
    [dialogRef]
  );

  return (
    <FullScreenModalPortal>
      <FullScreenModalOverlay />
      <DialogPrimitive.Content
        ref={setRefs}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isDragging ? `translateY(${currentY}px)` : undefined,
          transition: isDragging ? 'none' : undefined,
        }}
        className={cn(
          // Mobile: Full screen with slide-up from bottom
          "fixed inset-x-0 bottom-0 z-50 flex h-[85vh] w-full flex-col rounded-t-2xl border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          // Desktop: Centered dialog
          "md:fixed md:left-[50%] md:top-[50%] md:max-w-lg md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-xl md:h-auto md:max-h-[90vh]",
          // Scrollable content
          "overflow-y-auto",
          // Safe area for notched devices
          "[padding-bottom:env(safe-area-inset-bottom)]",
          // Custom scrollbar
          "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400",
          className
        )}
        {...props}
      >
        {/* Drag handle indicator (mobile only) */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300 md:hidden" />

        {children}

        {showClose && (
          <DialogPrimitive.Close
            data-radix-dialog-close
            className={cn(
              "absolute right-4 top-4 rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900",
              "md:right-4 md:top-4"
            )}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </FullScreenModalPortal>
  );
});
FullScreenModalContent.displayName = DialogPrimitive.Content.displayName;

const FullScreenModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left mb-4",
      className
    )}
    {...props}
  />
);
FullScreenModalHeader.displayName = "FullScreenModalHeader";

const FullScreenModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 mt-6",
      className
    )}
    {...props}
  />
);
FullScreenModalFooter.displayName = "FullScreenModalFooter";

const FullScreenModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-gray-900",
      className
    )}
    {...props}
  />
));
FullScreenModalTitle.displayName = DialogPrimitive.Title.displayName;

const FullScreenModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
));
FullScreenModalDescription.displayName = DialogPrimitive.Description.displayName;

export {
  FullScreenModal,
  FullScreenModalPortal,
  FullScreenModalOverlay,
  FullScreenModalClose,
  FullScreenModalTrigger,
  FullScreenModalContent,
  FullScreenModalHeader,
  FullScreenModalFooter,
  FullScreenModalTitle,
  FullScreenModalDescription,
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================
/*
import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalDescription,
  FullScreenModalFooter,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalTrigger,
} from "@/components/ui/full-screen-modal";
import { Button } from "@/components/ui/button";

export function Example() {
  return (
    <FullScreenModal>
      <FullScreenModalTrigger asChild>
        <Button>Open Modal</Button>
      </FullScreenModalTrigger>
      <FullScreenModalContent>
        <FullScreenModalHeader>
          <FullScreenModalTitle>Modal Title</FullScreenModalTitle>
          <FullScreenModalDescription>
            Modal description goes here
          </FullScreenModalDescription>
        </FullScreenModalHeader>
        <div className="py-4">
          Modal content goes here
        </div>
        <FullScreenModalFooter>
          <FullScreenModalClose asChild>
            <Button variant="outline">Cancel</Button>
          </FullScreenModalClose>
          <Button>Confirm</Button>
        </FullScreenModalFooter>
      </FullScreenModalContent>
    </FullScreenModal>
  );
}
*/
