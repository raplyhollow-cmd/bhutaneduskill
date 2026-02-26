"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Types for ceramic variant
export type DropdownMenuVariant = "default" | "ceramic" | "hidden"

interface DropdownMenuProps extends React.ComponentProps<typeof DropdownMenuPrimitive.Root> {
  // Note: variant prop is not used in DropdownMenu itself.
  // Pass variant to DropdownMenuContent if needed.
}

function DropdownMenu({
  ...props
}: DropdownMenuProps) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

interface DropdownMenuContentProps extends React.ComponentProps<typeof DropdownMenuPrimitive.Content> {
  variant?: DropdownMenuVariant
  sideOffset?: number
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  variant = "default",
  ...props
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg p-1.5",
          // Default variant styles
          variant === "default" && "bg-white border border-gray-200 shadow-lg dark:bg-gray-900 dark:border-gray-700",
          // Ceramic variant styles
          variant === "ceramic" && "bg-white border border-[rgb(220,220,224)] dark:bg-[rgb(27,27,31)] dark:border-[rgb(62,62,75)]",
          variant === "ceramic" && "shadow-xl",
          className
        )}
        style={variant === "ceramic" ? {
          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1), 0 0 0 1px rgb(0 0 0 / 0.05)"
        } : undefined}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

interface DropdownMenuItemProps extends React.ComponentProps<typeof DropdownMenuPrimitive.Item> {
  inset?: boolean
  variant?: "default" | "destructive"
  ceramicVariant?: DropdownMenuVariant
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ceramicVariant = "default",
  ...props
}: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm px-3 py-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Default variant styles
        ceramicVariant === "default" && [
          "focus:bg-accent focus:text-accent-foreground",
          "data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground"
        ],
        // Ceramic variant styles
        ceramicVariant === "ceramic" && [
          "text-gray-700 dark:text-gray-200",
          "focus:bg-gray-100 dark:focus:bg-gray-800 focus:text-gray-900 dark:focus:text-gray-50",
          "data-[variant=destructive]:text-red-600 dark:data-[variant=destructive]:text-red-400",
          "data-[variant=destructive]:focus:bg-red-50 dark:data-[variant=destructive]:focus:bg-red-900/20",
          "[&_svg:not([class*='text-'])]:text-gray-500 dark:[&_svg:not([class*='text-'])]:text-gray-400"
        ],
        className
      )}
      {...props}
    />
  )
}

interface DropdownMenuCheckboxItemProps extends React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> {
  ceramicVariant?: DropdownMenuVariant
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ceramicVariant = "default",
  ...props
}: DropdownMenuCheckboxItemProps) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-2 pr-3 pl-10 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        ceramicVariant === "default" && "focus:bg-accent focus:text-accent-foreground",
        ceramicVariant === "ceramic" && "text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-800",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-3 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

interface DropdownMenuRadioItemProps extends React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem> {
  ceramicVariant?: DropdownMenuVariant
}

function DropdownMenuRadioItem({
  className,
  children,
  ceramicVariant = "default",
  ...props
}: DropdownMenuRadioItemProps) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-2 pr-3 pl-10 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        ceramicVariant === "default" && "focus:bg-accent focus:text-accent-foreground",
        ceramicVariant === "ceramic" && "text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-800",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-3 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

interface DropdownMenuLabelProps extends React.ComponentProps<typeof DropdownMenuPrimitive.Label> {
  inset?: boolean
  ceramicVariant?: DropdownMenuVariant
}

function DropdownMenuLabel({
  className,
  inset,
  ceramicVariant = "default",
  ...props
}: DropdownMenuLabelProps) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-3 py-2 text-sm font-medium data-[inset]:pl-10",
        ceramicVariant === "default" && "text-muted-foreground",
        ceramicVariant === "ceramic" && "text-gray-500 dark:text-gray-400",
        className
      )}
      {...props}
    />
  )
}

interface DropdownMenuSeparatorProps extends React.ComponentProps<typeof DropdownMenuPrimitive.Separator> {
  ceramicVariant?: DropdownMenuVariant
}

function DropdownMenuSeparator({
  className,
  ceramicVariant = "default",
  ...props
}: DropdownMenuSeparatorProps) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(
        "-mx-1.5 my-1.5 h-px",
        ceramicVariant === "default" && "bg-border",
        ceramicVariant === "ceramic" && "bg-gray-200 dark:bg-gray-700",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

interface DropdownMenuSubTriggerProps extends React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> {
  inset?: boolean
  ceramicVariant?: DropdownMenuVariant
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ceramicVariant = "default",
  ...props
}: DropdownMenuSubTriggerProps) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center gap-2 rounded-sm px-3 py-2 text-sm outline-hidden select-none data-[inset]:pl-10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        ceramicVariant === "default" && [
          "focus:bg-accent focus:text-accent-foreground",
          "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
          "[&_svg:not([class*='text-'])]:text-muted-foreground"
        ],
        ceramicVariant === "ceramic" && [
          "text-gray-700 dark:text-gray-200",
          "focus:bg-gray-100 dark:focus:bg-gray-800 focus:text-gray-900 dark:focus:text-gray-50",
          "data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-gray-800",
          "[&_svg:not([class*='text-'])]:text-gray-500 dark:[&_svg:not([class*='text-'])]:text-gray-400"
        ],
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

interface DropdownMenuSubContentProps extends React.ComponentProps<typeof DropdownMenuPrimitive.SubContent> {
  ceramicVariant?: DropdownMenuVariant
}

function DropdownMenuSubContent({
  className,
  ceramicVariant = "default",
  ...props
}: DropdownMenuSubContentProps) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-lg p-1.5 shadow-lg",
        ceramicVariant === "default" && "bg-popover border",
        ceramicVariant === "ceramic" && "bg-white border border-[rgb(220,220,224)] dark:bg-[rgb(27,27,31)] dark:border-[rgb(62,62,75)]",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
