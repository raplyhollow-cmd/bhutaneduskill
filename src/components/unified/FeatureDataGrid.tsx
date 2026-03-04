/**
 * UNIVERSAL FEATURE DATA GRID
 *
 * A reusable data grid component that works with any unified feature.
 * Automatically handles columns, sorting, filtering, pagination, and row actions.
 *
 * @example
 * <FeatureDataGrid
 *   feature={LessonFeature}
 *   onRowClick={(row) => navigate(`/lessons/${row.id}`)}
 *   actions={[{ label: "Edit", onClick: handleEdit }]}
 * />
 */

"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, MoreHorizontal, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types
export type SortOrder = "asc" | "desc" | null;

export interface ColumnConfig {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "boolean" | "enum" | "reference";
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  reference?: {
    table: string;
    displayField: string;
  };
}

export interface ActionConfig {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: any) => void;
  variant?: "default" | "destructive" | "outline" | "ghost";
  showInMenu?: boolean;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "boolean";
  options?: { label: string; value: any }[];
}

export interface FeatureDataGridProps {
  // Data
  data: any[];
  columns: ColumnConfig[];
  loading?: boolean;

  // Features
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  paginatable?: boolean;

  // Pagination state
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;

  // Sorting
  onSort?: (column: string, order: SortOrder) => void;
  sortColumn?: string;
  sortOrder?: SortOrder;

  // Filtering
  filters?: FilterConfig[];
  onFilterChange?: (filters: Record<string, any>) => void;

  // Row actions
  onRowClick?: (row: any) => void;
  actions?: ActionConfig[];
  rowActions?: ActionConfig[];

  // Selection
  selectable?: boolean;
  onSelectionChange?: (selectedRows: any[]) => void;

  // Styling
  className?: string;
  emptyMessage?: string;
}

/**
 * Render cell value based on column type
 */
function renderCellValue(value: any, column: ColumnConfig, row: any): React.ReactNode {
  // Custom renderer takes precedence
  if (column.render) {
    return column.render(value, row);
  }

  // Handle null/undefined
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  // Type-based rendering
  switch (column.type) {
    case "boolean":
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Yes" : "No"}
        </Badge>
      );

    case "date":
      return value ? new Date(value).toLocaleDateString() : "—";

    case "enum":
      return <Badge variant="outline">{String(value)}</Badge>;

    case "number":
      return <span className="tabular-nums">{String(value)}</span>;

    case "reference":
      // Try to get display value from nested object
      const displayValue = value?.[column.reference?.displayField || "name"] || value;
      return <span>{String(displayValue)}</span>;

    default:
      return <span>{String(value)}</span>;
  }
}

/**
 * Main DataGrid Component
 */
export function FeatureDataGrid({
  data,
  columns,
  loading = false,
  searchable = true,
  filterable = true,
  sortable = true,
  paginatable = true,
  pageSize = 10,
  total,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortOrder,
  onSort,
  filters,
  onFilterChange,
  onRowClick,
  actions = [],
  rowActions = [],
  selectable = false,
  onSelectionChange,
  className,
  emptyMessage = "No data found",
}: FeatureDataGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchQuery) {
      result = result.filter((row) =>
        columns.some((col) => {
          const value = row[col.key];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchQuery.toLowerCase());
        })
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        result = result.filter((row) => {
          const rowValue = row[key];
          if (Array.isArray(value)) {
            return value.includes(rowValue);
          }
          return rowValue === value;
        });
      }
    });

    return result;
  }, [data, searchQuery, activeFilters, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortOrder) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;

      let comparison = 0;
      if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortOrder]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginatable) return sortedData;

    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, paginatable]);

  const displayTotal = total ?? filteredData.length;
  const totalPages = Math.ceil(displayTotal / pageSize);

  // Handlers
  const handleSort = (columnKey: string) => {
    if (!sortable) return;

    let newOrder: SortOrder = "asc";
    if (sortColumn === columnKey) {
      if (sortOrder === "asc") newOrder = "desc";
      else if (sortOrder === "desc") newOrder = null;
    }
    onSort?.(columnKey, newOrder);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleRowSelect = (rowId: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId);
    } else {
      newSelection.add(rowId);
    }
    setSelectedRows(newSelection);
    onSelectionChange?.(
      paginatedData.filter((row) => newSelection.has(row.id))
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((row) => row.id)));
    }
    onSelectionChange?.(paginatedData);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with search and filters */}
      {(searchable || filterable || actions.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[200px] sm:w-[300px]"
                />
              </div>
            )}

            {filterable && filters && filters.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {Object.keys(activeFilters).some((k) => activeFilters[k]) && (
                      <Badge variant="secondary" className="ml-2">
                        {Object.keys(activeFilters).filter((k) => activeFilters[k]).length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {filters.map((filter) => (
                    <div key={filter.key} className="p-2">
                      <label className="text-xs font-medium">{filter.label}</label>
                      {filter.type === "select" && filter.options ? (
                        <select
                          className="w-full mt-1 text-sm rounded border p-1"
                          value={activeFilters[filter.key] || ""}
                          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        >
                          <option value="">All</option>
                          {filter.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : filter.type === "boolean" ? (
                        <select
                          className="w-full mt-1 text-sm rounded border p-1"
                          value={activeFilters[filter.key] ?? ""}
                          onChange={(e) => handleFilterChange(filter.key, e.target.value === "true" ? true : e.target.value === "false" ? false : null)}
                        >
                          <option value="">All</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : (
                        <Input
                          className="mt-1 h-8"
                          placeholder={`Filter by ${filter.label}`}
                          value={activeFilters[filter.key] || ""}
                          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {actions.length > 0 && (
            <div className="flex gap-2">
              {actions
                .filter((a) => !a.showInMenu)
                .map((action, idx) => (
                  <Button key={idx} variant={action.variant || "default"} size="sm" onClick={() => action.onClick(null)}>
                    {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                    {action.label}
                  </Button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="cursor-pointer"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.key}>
                  {column.sortable !== false && sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                    >
                      {column.label}
                      {sortColumn === column.key && (
                        sortOrder === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : sortOrder === "desc" ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : null
                      )}
                    </button>
                  ) : (
                    <span className="font-medium">{column.label}</span>
                  )}
                </TableHead>
              ))}
              {(rowActions.length > 0 || onRowClick) && (
                <TableHead className="w-[50px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1 + (selectable ? 1 : 0)} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1 + (selectable ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(onRowClick && "cursor-pointer hover:bg-muted/50")}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={() => handleRowSelect(row.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-pointer"
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCellValue(row[column.key], column, row)}
                    </TableCell>
                  ))}
                  {(rowActions.length > 0 || onRowClick) && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {rowActions.length > 0 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {rowActions.map((action, idx) => (
                              <DropdownMenuItem
                                key={idx}
                                onClick={() => action.onClick(row)}
                                className={cn(action.variant === "destructive" && "text-destructive")}
                              >
                                {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        onRowClick && (
                          <Button variant="ghost" size="sm" onClick={() => onRowClick(row)}>
                            View
                          </Button>
                        )
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {paginatable && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * pageSize + 1, displayTotal)} to{" "}
            {Math.min(currentPage * pageSize, displayTotal)} of {displayTotal} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentPage(1);
                onPageChange?.(1);
              }}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newPage = Math.max(1, currentPage - 1);
                setCurrentPage(newPage);
                onPageChange?.(newPage);
              }}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newPage = Math.min(totalPages, currentPage + 1);
                setCurrentPage(newPage);
                onPageChange?.(newPage);
              }}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentPage(totalPages);
                onPageChange?.(totalPages);
              }}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing DataGrid state
 */
export function useDataGrid(initialState?: {
  sortColumn?: string;
  sortOrder?: SortOrder;
  currentPage?: number;
  pageSize?: number;
}) {
  const [sortColumn, setSortColumn] = useState(initialState?.sortColumn);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialState?.sortOrder ?? null);
  const [currentPage, setCurrentPage] = useState(initialState?.currentPage ?? 1);
  const [pageSize, setPageSize] = useState(initialState?.pageSize ?? 10);

  const handleSort = (column: string, order: SortOrder) => {
    setSortColumn(column);
    setSortOrder(order);
  };

  return {
    sortColumn,
    sortOrder,
    currentPage,
    pageSize,
    setSortColumn,
    setSortOrder,
    setCurrentPage,
    setPageSize,
    handleSort,
  };
}
