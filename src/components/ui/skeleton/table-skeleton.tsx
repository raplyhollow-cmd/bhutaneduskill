import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface TableSkeletonProps {
  /**
   * Number of rows to display
   * @default 5
   */
  rows?: number
  /**
   * Number of columns to display
   * @default 4
   */
  columns?: number
  /**
   * Whether to show the header row
   * @default true
   */
  showHeader?: boolean
  /**
   * Array of column widths (percentage or Tailwind width classes)
   * @default undefined (equal widths)
   */
  columnWidths?: string[]
  /**
   * Custom className for the table container
   */
  className?: string
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  columnWidths,
  className,
}: TableSkeletonProps) {
  const getColumnWidth = (index: number) => {
    if (columnWidths && columnWidths[index]) {
      return columnWidths[index]
    }
    return undefined
  }

  return (
    <div className={cn("w-full", className)}>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i}>
                  <div
                    className={cn(
                      "h-4 animate-pulse rounded bg-muted",
                      getColumnWidth(i)
                    )}
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <div
                    className={cn(
                      "h-4 animate-pulse rounded bg-muted",
                      colIndex === 0 && "w-3/4",
                      colIndex === 1 && "w-full",
                      colIndex === 2 && "w-5/6",
                      colIndex === 3 && "w-2/3",
                      colIndex > 3 && "w-full",
                      getColumnWidth(colIndex)
                    )}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * A compact table skeleton variant for smaller tables
 */
export function CompactTableSkeleton({
  rows = 3,
  columns = 3,
  className,
}: Omit<TableSkeletonProps, "showHeader" | "columnWidths">) {
  return (
    <TableSkeleton
      rows={rows}
      columns={columns}
      showHeader={true}
      className={className}
    />
  )
}

/**
 * A wide table skeleton variant for data-heavy tables
 */
export function WideTableSkeleton({
  rows = 8,
  columns = 6,
  columnWidths = ["w-12", "w-1/4", "w-1/6", "w-full", "w-1/5", "w-24"],
  className,
}: Omit<TableSkeletonProps, "showHeader">) {
  return (
    <TableSkeleton
      rows={rows}
      columns={columns}
      showHeader={true}
      columnWidths={columnWidths}
      className={className}
    />
  )
}
