/**
 * GOOGLE DRIVE STYLE DATA TABLE
 *
 * Universal component for all admin pages with:
 * - Horizontal scroll (no wrap)
 * - Sortable columns
 * - Column filters
 * - Column visibility toggle
 * - Inline editing
 * - Bulk actions
 * - Row selection
 *
 * Usage:
 *   <GoogleDataTable
 *     data={classes}
 *     columns={columns}
 *     onRowClick={handleClick}
 *   />
 */

"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  ChevronDown,
  X,
  Loader2,
  Grid3x3,
  List,
  Check,
  Plus,
} from "lucide-react";
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

export interface GoogleColumn<T = any> {
  id: string;
  label: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  render?: (row: T, value: any) => React.ReactNode;
  getFilterValue?: (row: T) => string;
  pinned?: "left" | "right"; // Column pinning for horizontal scroll
}

export interface GoogleAction<T = any> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: "default" | "danger";
  separator?: boolean;
}

export interface GoogleDataTableProps<T = any> {
  data: T[];
  columns: GoogleColumn<T>[];
  keyField: string;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  actions?: GoogleAction<T>[];
  bulkActions?: React.ReactNode;
  onCreate?: () => void;
  onRowClick?: (row: T) => void;
  onUpdate?: (id: string, field: string, value: string) => Promise<void>;
  onDelete?: (row: T) => void;
  emptyState?: React.ReactNode;
  rowActions?: boolean;
  toolbar?: React.ReactNode;
  // Row expansion
  expandable?: boolean | "single" | "multiple";
  renderExpanded?: (row: T) => React.ReactNode;
  defaultExpanded?: boolean;
}

type SortField = string;
type SortOrder = "asc" | "desc" | null;

export function GoogleDataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  isLoading = false,
  title,
  subtitle,
  actions,
  bulkActions,
  onCreate,
  onRowClick,
  onUpdate,
  onDelete,
  emptyState,
  rowActions = true,
  toolbar,
  expandable = false,
  renderExpanded,
  defaultExpanded = false,
}: GoogleDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((c) => c.id))
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    defaultExpanded ? new Set(data.map((d) => d[keyField])) : new Set()
  );

  // Apply filters, sort, and search
  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const value = row[col.id];
          if (typeof value === "string") {
            return value.toLowerCase().includes(query);
          }
          if (typeof value === "number") {
            return value.toString().includes(query);
          }
          if (col.getFilterValue) {
            return col.getFilterValue(row).toLowerCase().includes(query);
          }
          return false;
        })
      );
    }

    // Sort
    if (sortField && sortOrder) {
      const col = columns.find((c) => c.id === sortField);
      if (col) {
        result.sort((a, b) => {
          let aVal = a[sortField];
          let bVal = b[sortField];
          if (col.getFilterValue) {
            aVal = col.getFilterValue(a);
            bVal = col.getFilterValue(b);
          }
          if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
          if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
          return 0;
        });
      }
    }

    return result;
  }, [data, searchQuery, sortField, sortOrder, columns]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : sortOrder === "desc" ? null : "asc");
      if (sortOrder === "desc") setSortField(field);
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === processedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processedData.map((row) => row[keyField])));
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
    if (!expandable) return;
    const newExpanded = new Set(expandedIds);
    if (expandable === "single") {
      // Single mode: close all others
      newExpanded.clear();
      newExpanded.add(id);
    } else {
      // Multiple mode: toggle this row
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
    }
    setExpandedIds(newExpanded);
  };

  const allSelected = processedData.length > 0 && selectedIds.size === processedData.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  // Get unique filter values for each column
  const getFilterValues = (colId: string) => {
    const values = new Set<string>();
    data.forEach((row) => {
      const val = row[colId];
      if (val != null) values.add(String(val));
    });
    return Array.from(values).sort();
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200">
        {/* Title Row */}
        {(title || subtitle || onCreate || toolbar) && (
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              {title && <h1 className="text-xl font-semibold text-gray-900">{title}</h1>}
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              {toolbar}
              {onCreate && (
                <Button size="sm" className="gap-2" onClick={onCreate}>
                  <Plus className="w-4 h-4" />
                  Create
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Search & Filters Row */}
        <div className="flex items-center gap-3 px-6 pb-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Column Filters - only for filterable columns */}
          {columns.some((c) => c.filterable) && (
            <div className="flex items-center gap-2">
              {columns
                .filter((c) => c.filterable)
                .map((col) => (
                  <ColumnFilter
                    key={col.id}
                    column={col}
                    data={data}
                    onFilter={(value) => {
                      // Apply filter logic here
                      console.log("Filter", col.id, value);
                    }}
                  />
                ))}
            </div>
          )}

          {/* Column Visibility */}
          <ColumnVisibilityDropdown
            columns={columns}
            visible={visibleColumns}
            onChange={setVisibleColumns}
          />

          {/* Clear Selection */}
          {selectedIds.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              <X className="w-4 h-4 mr-1" />
              Clear ({selectedIds.size})
            </Button>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && bulkActions && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm text-blue-700 font-medium">
                {selectedIds.size} selected
              </span>
              <div className="flex items-center gap-2">{bulkActions}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : (
          <div className="h-full overflow-auto">
            {/* Header Row */}
            <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center min-w-max">
                {/* Expand/Collapse Column */}
                {expandable && (
                  <div className="w-10 h-12 flex items-center justify-center px-2">
                    <span className="text-xs text-gray-400">▼</span>
                  </div>
                )}

                {/* Checkbox */}
                <div className="w-12 h-12 flex items-center justify-center px-2">
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

                {/* Column Headers */}
                {columns.filter((c) => visibleColumns.has(c.id)).map((col) => (
                  <div
                    key={col.id}
                    className={cn(
                      "h-12 px-4 border-l border-gray-200 flex items-center",
                      onRowClick && "cursor-pointer"
                    )}
                    style={{ width: col.width || "auto" }}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900 transition-colors"
                      >
                        {col.label}
                        {sortField === col.id ? (
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform",
                              sortOrder === "desc" && "rotate-180"
                            )}
                          />
                        ) : (
                          <ChevronDown className="w-4 h-4 opacity-0 hover:opacity-50" />
                        )}
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-gray-600 uppercase">
                        {col.label}
                      </span>
                    )}
                  </div>
                ))}

                {/* Actions Header */}
                {rowActions && actions && actions.length > 0 && (
                  <div className="w-16 h-12 px-4 border-l border-gray-200 flex items-center justify-end">
                    <span className="text-xs text-gray-400">Actions</span>
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            {processedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                {emptyState || (
                  <>
                    <p>No data found</p>
                    {searchQuery && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setSearchQuery("")}
                      >
                        Clear search
                      </Button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {processedData.map((row, index) => {
                  const isSelected = selectedIds.has(row[keyField]);
                  const isExpanded = expandable && expandedIds.has(row[keyField]);
                  return (
                    <div key={row[keyField]} className="border-b border-gray-100">
                      {/* Main Row */}
                      <div
                        className={cn(
                          "flex items-center min-w-max group hover:bg-blue-50 transition-colors",
                          onRowClick && "cursor-pointer",
                          isSelected && "bg-blue-50"
                        )}
                        onClick={() => onRowClick?.(row)}
                      >
                        {/* Expand Button */}
                        {expandable && (
                          <div className="w-10 flex items-center justify-center px-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(row[keyField]);
                              }}
                              className="p-1 rounded hover:bg-gray-200 transition-colors"
                            >
                              <ChevronDown
                                className={cn(
                                  "w-4 h-4 text-gray-500 transition-transform",
                                  isExpanded && "rotate-90"
                                )}
                              />
                            </button>
                          </div>
                        )}

                        {/* Checkbox */}
                        <div className="w-12 flex items-center justify-center px-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(row[keyField])}
                            className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                          />
                        </div>

                      {/* Data Cells */}
                      {columns.filter((c) => visibleColumns.has(c.id)).map((col) => (
                        <div
                          key={col.id}
                          className="h-14 px-4 border-l border-gray-100 flex items-center"
                          style={{ width: col.width || "auto" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {col.editable && onUpdate ? (
                            <InlineEdit
                              value={String(row[col.id] ?? "")}
                              onSave={(value) => onUpdate(row[keyField], col.id, value)}
                              placeholder="—"
                              className="text-sm"
                            />
                          ) : col.render ? (
                            col.render(row, row[col.id])
                          ) : (
                            <span className="text-sm text-gray-900 truncate block">
                              {row[col.id] ?? "—"}
                            </span>
                          )}
                        </div>
                      ))}

                      {/* Row Actions */}
                      {rowActions && actions && actions.length > 0 && (
                        <div
                          className="w-16 px-4 border-l border-gray-100 flex items-center justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                              </button>
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
                                      action.variant === "danger" && "text-red-600"
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
                    </div>

                    {/* Expanded Content Panel */}
                    {expandable && isExpanded && renderExpanded && (
                      <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                        {renderExpanded(row)}
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing {processedData.length} of {data.length} records
                </span>
                {selectedIds.size > 0 && (
                  <span>{selectedIds.size} selected</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Column Filter Dropdown
 */
function ColumnFilter<T extends Record<string, any>>({
  column,
  data,
  onFilter,
}: {
  column: GoogleColumn<T>;
  data: T[];
  onFilter: (value: string | null) => void;
}) {
  const values = useMemo(() => {
    const uniqueValues = new Set<string>();
    data.forEach((row) => {
      const val = row[column.id];
      if (val != null && val !== "") uniqueValues.add(String(val));
    });
    return Array.from(uniqueValues).sort();
  }, [data, column.id]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          {column.label}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={() => onFilter(null)}>All</DropdownMenuItem>
        <DropdownMenuSeparator />
        {values.map((value) => (
          <DropdownMenuItem key={value} onClick={() => onFilter(value)}>
            {value}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Column Visibility Dropdown
 */
function ColumnVisibilityDropdown<T extends Record<string, any>>({
  columns,
  visible,
  onChange,
}: {
  columns: GoogleColumn<T>[];
  visible: Set<string>;
  onChange: (visible: Set<string>) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Columns
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {columns.map((col) => (
          <DropdownMenuItem
            key={col.id}
            onClick={() => {
              const newVisible = new Set(visible);
              if (newVisible.has(col.id)) {
                if (newVisible.size > 1) newVisible.delete(col.id);
              } else {
                newVisible.add(col.id);
              }
              onChange(newVisible);
            }}
          >
            <div className="flex items-center gap-2 pr-4">
              <input
                type="checkbox"
                checked={visible.has(col.id)}
                readOnly
                className="w-4 h-4"
              />
              {col.label}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Export helper for common column types
 */
export const ColumnTypes = {
  text: <T,>(id: string, label: string, opts?: Partial<GoogleColumn<T>>): GoogleColumn<T> => ({
    id,
    label,
    width: "180px",
    sortable: true,
    filterable: true,
    ...opts,
  }),

  number: <T,>(id: string, label: string, opts?: Partial<GoogleColumn<T>>): GoogleColumn<T> => ({
    id,
    label,
    width: "120px",
    sortable: true,
    ...opts,
  }),

  status: <T,>(id: string, label: string, opts?: Partial<GoogleColumn<T>>): GoogleColumn<T> => ({
    id,
    label,
    width: "120px",
    sortable: true,
    filterable: true,
    render: (row) => {
      const val = row[id];
      const isActive = val === "active" || val === true;
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            isActive
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-gray-100 text-gray-600 border-gray-200"
          )}
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
    ...opts,
  }),

  badge: <T,>(id: string, label: string, getColor: (val: any) => string, opts?: Partial<GoogleColumn<T>>): GoogleColumn<T> => ({
    id,
    label,
    width: "120px",
    render: (row) => {
      const val = row[id];
      return (
        <Badge variant="outline" className={cn("text-xs", getColor(val))}>
          {val || "—"}
        </Badge>
      );
    },
    ...opts,
  }),
};
