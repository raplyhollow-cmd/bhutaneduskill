/**
 * MODERN DATA GRID COMPONENT
 *
 * Reusable data grid with:
 * - Inline editing
 * - Bulk actions
 * - Filtering/sorting
 * - Row expansion
 * - Consistent styling
 */

"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, MoreVertical, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InlineEdit } from "@/components/ui/inline-edit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface Column<T = any> {
  id: string;
  header: string;
  width?: string;
  cell?: (row: T) => React.ReactNode;
  editable?: boolean;
  searchable?: boolean;
}

export interface Action<T = any> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: "default" | "danger";
  separator?: boolean;
}

interface ModernDataGridProps<T = any> {
  data: T[];
  columns: Column<T>[];
  keyField: string;
  isLoading?: boolean;
  searchable?: boolean;
  selectable?: boolean;
  expandable?: (row: T) => React.ReactNode;
  actions?: Action<T>[];
  bulkActions?: React.ReactNode;
  onUpdate?: (id: string, field: string, value: string) => Promise<void>;
  emptyState?: React.ReactNode;
  onClickRow?: (row: T) => void;
}

export function ModernDataGrid<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  isLoading = false,
  searchable = true,
  selectable = false,
  expandable,
  actions,
  bulkActions,
  onUpdate,
  emptyState,
  onClickRow,
}: ModernDataGridProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.id];
        if (typeof value === "string") {
          return value.toLowerCase().includes(query);
        }
        if (typeof value === "number") {
          return value.toString().includes(query);
        }
        return false;
      })
    );
  }, [data, searchQuery, columns]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map((row) => row[keyField])));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const allSelected = filteredData.length > 0 && selectedIds.size === filteredData.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="space-y-4">
      {/* Header with Search and Bulk Actions */}
      {(searchable || bulkActions) && (
        <div className="flex items-center justify-between gap-4">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}
          {selectedIds.size > 0 && bulkActions && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedIds.size} selected
              </span>
              {bulkActions}
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
          {selectable && (
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (someSelected && input) {
                    input.indeterminate = true;
                  }
                }}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
              />
            </div>
          )}
          {columns.map((col) => (
            <div
              key={col.id}
              style={{ width: col.width }}
              className={cn(
                "truncate",
                selectable ? "col-span-2" : "col-span-3"
              )}
            >
              {col.header}
            </div>
          ))}
          {actions && actions.length > 0 && (
            <div className="col-span-2 text-right">Actions</div>
          )}
          {expandable && <div className="col-span-1" />}
        </div>

        {/* Data Rows */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-12 text-center">
            {emptyState || (
              <>
                <p className="text-gray-500">No data found</p>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredData.map((row, index) => {
              const isSelected = selectedIds.has(row[keyField]);
              const isExpanded = expandedRows.has(row[keyField]);

              return (
                <motion.div
                  key={row[keyField]}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                >
                  {/* Main Row */}
                  <div
                    className={cn(
                      "grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-gray-100 transition-colors",
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                      onClickRow && "cursor-pointer hover:bg-violet-50",
                      isSelected && "bg-violet-50"
                    )}
                    onClick={() => onClickRow?.(row)}
                  >
                    {selectable && (
                      <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(row[keyField])}
                          className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                        />
                      </div>
                    )}

                    {columns.map((col) => (
                      <div
                        key={col.id}
                        style={{ width: col.width }}
                        className={cn(
                          "truncate",
                          selectable ? "col-span-2" : "col-span-3"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {col.editable && onUpdate ? (
                          <InlineEdit
                            value={String(row[col.id] ?? "")}
                            onSave={(value) => onUpdate(row[keyField], col.id, value)}
                            placeholder="—"
                            className="text-sm"
                          />
                        ) : col.cell ? (
                          col.cell(row)
                        ) : (
                          <span className="text-sm text-gray-900 truncate block">
                            {row[col.id] ?? "—"}
                          </span>
                        )}
                      </div>
                    ))}

                    {actions && actions.length > 0 && (
                      <div className="col-span-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.map((action, idx) =>
                              action.separator ? (
                                <DropdownMenuSeparator key={idx} />
                              ) : (
                              <DropdownMenuItem
                                key={idx}
                                onClick={() => action.onClick(row)}
                                className={cn(
                                  action.variant === "danger" && "text-red-600 focus:text-red-600"
                                )}
                              >
                                {action.icon}
                                {action.label}
                              </DropdownMenuItem>
                              )
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}

                    {expandable && (
                      <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleExpand(row[keyField])}
                          className="p-1 rounded hover:bg-gray-200 transition-colors"
                        >
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 text-gray-500 transition-transform",
                              isExpanded && "transform rotate-180"
                            )}
                          />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && expandable && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          {expandable(row)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Footer with count */}
        {filteredData.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Showing {filteredData.length} of {data.length} records
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Quick action button for inline row actions
 */
export function QuickActionButton({
  icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger" | "ghost";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
        variant === "default" && "bg-violet-100 text-violet-700 hover:bg-violet-200",
        variant === "danger" && "bg-red-100 text-red-700 hover:bg-red-200",
        variant === "ghost" && "text-gray-600 hover:bg-gray-100"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
