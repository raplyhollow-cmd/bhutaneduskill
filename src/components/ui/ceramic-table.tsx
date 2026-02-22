"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// =============================================================================
// TYPES
// =============================================================================

interface TableProps extends React.ComponentProps<"table">, VariantProps<typeof tableVariants> {}

interface TableCellProps extends React.ComponentProps<"td">, VariantProps<typeof cellVariants> {}

interface TableHeaderProps extends React.ComponentProps<"th">, VariantProps<typeof cellVariants> {}

// =============================================================================
// VARIANTS
// =============================================================================

const tableVariants = cva(
  "w-full border-collapse separate border-spacing-0 overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-white dark:bg-gray-950",
        ceramic: "data-table-clerk",
        "ceramic-flat": "bg-transparent border-0",
      },
      rounded: {
        none: "",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      rounded: "xl",
    },
  }
)

const cellVariants = cva("", {
  variants: {
    variant: {
      default: "",
      ceramic: "text-ceramic-primary dark:text-ceramic-gray-200",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

// =============================================================================
// TABLE COMPONENTS
// =============================================================================

function CeramicTable({ className, variant, rounded, ...props }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        data-slot="table"
        className={cn(tableVariants({ variant, rounded }), className)}
        {...props}
      />
    </div>
  )
}

function CeramicTableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "border-b transition-colors bg-ceramic-gray-50 dark:bg-ceramic-gray-1300",
        className
      )}
      {...props}
    />
  )
}

function CeramicTableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "[&_tr:last-child]:border-0",
        className
      )}
      {...props}
    />
  )
}

function CeramicTableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function CeramicTableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-ceramic-gray-50 dark:hover:bg-ceramic-gray-800/50 data-[state=selected]:bg-ceramic-purple-50 dark:data-[state=selected]:bg-ceramic-purple-950/30",
        className
      )}
      {...props}
    />
  )
}

function CeramicTableHead({ className, ...props }: TableHeaderProps) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 h-11 px-4 text-sm font-medium text-ceramic-secondary dark:text-ceramic-gray-400 border-b border-ceramic-border",
        className
      )}
      {...props}
    />
  )
}

function CeramicTableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0 p-4 text-sm border-b border-ceramic-border text-ceramic-primary dark:text-ceramic-gray-200",
        className
      )}
      {...props}
    />
  )
}

function CeramicTableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

// =============================================================================
// WRAPPER COMPONENTS (for compatibility)
// =============================================================================

interface DataTableProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "ceramic"
  rounded?: "none" | "sm" | "md" | "lg" | "xl"
}

/**
 * Ceramic Data Table component
 * A full-featured data table with ceramic styling
 */
export function CeramicDataTable({ children, className, variant = "ceramic", rounded = "xl" }: DataTableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className={cn(tableVariants({ variant, rounded }))}>
        {children}
      </table>
    </div>
  )
}

interface DataTableHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CeramicDataTableHeader({ children, className }: DataTableHeaderProps) {
  return (
    <thead className={cn("bg-ceramic-gray-50 dark:bg-ceramic-gray-1300", className)}>
      {children}
    </thead>
  )
}

interface DataTableRowProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function CeramicDataTableRow({ children, className, onClick }: DataTableRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-ceramic-border hover:bg-ceramic-gray-50 dark:hover:bg-ceramic-gray-800/50 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

interface DataTableCellProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "center" | "right"
}

export function CeramicDataTableCell({ children, className, align = "left" }: DataTableCellProps) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-sm text-ceramic-primary dark:text-ceramic-gray-200",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
    >
      {children}
    </td>
  )
}

interface DataTableHeaderCellProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "center" | "right"
}

export function CeramicDataTableHeaderCell({ children, className, align = "left" }: DataTableHeaderCellProps) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-medium text-ceramic-secondary dark:text-ceramic-gray-400 uppercase tracking-wider",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
    >
      {children}
    </th>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  CeramicTable,
  CeramicTableHeader,
  CeramicTableBody,
  CeramicTableFooter,
  CeramicTableRow,
  CeramicTableHead,
  CeramicTableCell,
  CeramicTableCaption,
  tableVariants,
  cellVariants,
}

export type { TableProps, TableCellProps, TableHeaderProps }
