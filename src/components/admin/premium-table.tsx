/**
 * PREMIUM TABLE COMPONENT
 *
 * Reusable table with EXACT Vercel/Clerk-style interactions:
 * - 150ms hover transition
 * - Gray-50 background on hover
 * - Subtle shadow on row hover
 * - Border-bottom with gray-100
 *
 * Usage:
 *   <PremiumTable headers={["Name", "Email", "Status"]}>
 *     <PremiumTableRow onClick={() => handleRowClick(id)}>
 *       <td>Name</td>
 *       <td>Email</td>
 *       <td>Status</td>
 *     </PremiumTableRow>
 *   </PremiumTable>
 */

"use client";

import { cn } from "@/lib/utils";
import { forwardRef, HTMLAttributes, ReactNode } from "react";

interface PremiumTableProps extends HTMLAttributes<HTMLDivElement> {
  headers: string[];
  children: ReactNode;
  stickyHeader?: boolean;
}

/**
 * Premium Table Container
 *
 * Wraps table with premium border and rounded corners
 */
export const PremiumTable = forwardRef<HTMLDivElement, PremiumTableProps>(
  ({ headers, children, className, stickyHeader = false }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden rounded-lg border border-gray-200",
          className
        )}
      >
        <table className="w-full">
          <thead
            className={cn(
              "bg-gray-50 border-b border-gray-200",
              stickyHeader && "sticky top-0 z-10"
            )}
          >
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {children}
          </tbody>
        </table>
      </div>
    );
  }
);

PremiumTable.displayName = "PremiumTable";

interface PremiumTableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  onClick?: () => void;
}

/**
 * Premium Table Row
 *
 * Applies EXACT Vercel hover effect:
 * - transition: 150ms
 * - hover: bg-gray-50
 * - Optional: click handler with cursor pointer
 * - Optional: subtle shadow on hover when clickable
 */
export const PremiumTableRow = forwardRef<HTMLTableRowElement, PremiumTableRowProps>(
  ({ children, onClick, className, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          // EXACT Vercel hover effect
          "transition-colors duration-150 ease-out",
          "hover:bg-gray-50",
          "group",
          onClick && "cursor-pointer hover:shadow-sm",
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </tr>
    );
  }
);

PremiumTableRow.displayName = "PremiumTableRow";

/**
 * Premium Table Cell
 */
export const PremiumTableCell = forwardRef<
  HTMLTableCellElement,
  HTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  return <td ref={ref} className={cn("px-4 py-3", className)} {...props} />;
});

PremiumTableCell.displayName = "PremiumTableCell";

/**
 * Premium Table Head (for nested headers)
 */
export const PremiumTableHead = forwardRef<
  HTMLTableCellElement,
  HTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  return (
    <th
      ref={ref}
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider",
        className
      )}
      {...props}
    />
  );
});

PremiumTableHead.displayName = "PremiumTableHead";

/**
 * Checkbox Cell (for bulk selection)
 */
export const CheckboxCell = forwardRef<
  HTMLTableCellElement,
  {
    checked: boolean;
    onChange: () => void;
    indeterminate?: boolean;
    className?: string;
  }
>(({ checked, onChange, indeterminate, className }, ref) => {
  return (
    <td ref={ref} className={cn("w-12 px-4 py-3", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        ref={(el) => {
          if (el && indeterminate) {
            el.indeterminate = true;
          }
        }}
        className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500 focus:ring-offset-0 transition duration-150 cursor-pointer"
      />
    </td>
  );
});

CheckboxCell.displayName = "CheckboxCell";

/**
 * Actions Cell (for edit/delete buttons)
 */
export const ActionsCell = forwardRef<
  HTMLTableCellElement,
  { children: ReactNode; className?: string }
>(({ children, className }, ref) => {
  return (
    <td ref={ref} className={cn("w-32 px-4 py-3 text-right", className)}>
      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {children}
      </div>
    </td>
  );
});

ActionsCell.displayName = "ActionsCell";
