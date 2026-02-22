"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Types for ceramic variant
export type AlertDialogVariant = "default" | "ceramic"

interface AlertDialogProps extends React.ComponentProps<typeof AlertDialogPrimitive.Root> {
  variant?: AlertDialogVariant
}

function AlertDialog({
  variant = "default",
  ...props
}: AlertDialogProps) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger
      data-slot="alert-dialog-trigger"
      {...props}
    />
  )
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

interface AlertDialogOverlayProps extends React.ComponentProps<typeof AlertDialogPrimitive.Overlay> {
  variant?: AlertDialogVariant
}

function AlertDialogOverlay({
  className,
  variant = "default",
  ...props
}: AlertDialogOverlayProps) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        variant === "default" && "bg-black/50 backdrop-blur-sm",
        variant === "ceramic" && "bg-black/40 backdrop-blur-md",
        className
      )}
      {...props}
    />
  )
}

interface AlertDialogContentProps extends React.ComponentProps<typeof AlertDialogPrimitive.Content> {
  variant?: AlertDialogVariant
}

function AlertDialogContent({
  className,
  variant = "default",
  ...props
}: AlertDialogContentProps) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay variant={variant} />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl",
          // Default variant styles
          variant === "default" && "rounded-lg border bg-white dark:bg-gray-800",
          // Ceramic variant styles
          variant === "ceramic" && "rounded-xl border border-[rgb(220,220,224)] bg-white dark:border-[rgb(62,62,75)] dark:bg-[rgb(27,27,31)]",
          className
        )}
        style={variant === "ceramic" ? {
          boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)"
        } : undefined}
        {...props}
      />
    </AlertDialogPortal>
  )
}

interface AlertDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertDialogVariant
}

function AlertDialogHeader({
  className,
  variant = "default",
  ...props
}: AlertDialogHeaderProps) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        variant === "ceramic" && "pb-2",
        className
      )}
      {...props}
    />
  )
}

interface AlertDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertDialogVariant
}

function AlertDialogFooter({
  className,
  variant = "default",
  ...props
}: AlertDialogFooterProps) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-3",
        variant === "ceramic" && "border-t border-gray-200 pt-4 dark:border-gray-700",
        className
      )}
      {...props}
    />
  )
}

interface AlertDialogTitleProps extends React.ComponentProps<typeof AlertDialogPrimitive.Title> {
  variant?: AlertDialogVariant
}

function AlertDialogTitle({
  className,
  variant = "default",
  ...props
}: AlertDialogTitleProps) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        "text-lg font-semibold",
        variant === "default" && "text-gray-900 dark:text-gray-50",
        variant === "ceramic" && "text-gray-900 dark:text-gray-100",
        className
      )}
      {...props}
    />
  )
}

interface AlertDialogDescriptionProps extends React.ComponentProps<typeof AlertDialogPrimitive.Description> {
  variant?: AlertDialogVariant
}

function AlertDialogDescription({
  className,
  variant = "default",
  ...props
}: AlertDialogDescriptionProps) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        "text-sm",
        variant === "default" && "text-gray-500 dark:text-gray-400",
        variant === "ceramic" && "text-gray-600 dark:text-gray-400",
        className
      )}
      {...props}
    />
  )
}

interface AlertDialogActionProps extends React.ComponentProps<typeof AlertDialogPrimitive.Action> {
  variant?: AlertDialogVariant
}

function AlertDialogAction({
  className,
  variant = "default",
  ...props
}: AlertDialogActionProps) {
  return (
    <AlertDialogPrimitive.Action
      data-slot="alert-dialog-action"
      className={cn(
        buttonVariants(),
        "min-h-[44px]",
        variant === "ceramic" && "bg-[rgb(132,107,255)] hover:bg-[rgb(118,92,255)] text-white border-transparent",
        className
      )}
      {...props}
    />
  )
}

interface AlertDialogCancelProps extends React.ComponentProps<typeof AlertDialogPrimitive.Cancel> {
  variant?: AlertDialogVariant
}

function AlertDialogCancel({
  className,
  variant = "default",
  ...props
}: AlertDialogCancelProps) {
  return (
    <AlertDialogPrimitive.Cancel
      data-slot="alert-dialog-cancel"
      className={cn(
        buttonVariants({ variant: "outline" }),
        "min-h-[44px] mt-2.5 sm:mt-0",
        variant === "ceramic" && "border-[rgb(220,220,224)] text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
        className
      )}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
