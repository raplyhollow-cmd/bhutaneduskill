/**
 * UNIVERSAL FEATURE DATA GRID
 *
 * Auto-generated data table for any feature.
 *
 * Usage:
 * <FeatureDataGrid
 *   feature={StudentFeature}
 *   columns={StudentFeature.config.ui.columns}
 *   onEdit={(item) => ...}
 *   onDelete={(item) => ...}
 * />
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Loader2,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ColumnConfig {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  type?: "text" | "number" | "date" | "email" | "boolean" | "reference";
  reference?: {
    table: string;
    displayField: string;
  };
  render?: (value: any, row: any) => React.ReactNode;
}

interface FeatureDataGridProps {
  feature: any;
  columns?: ColumnConfig[];
  data?: any[];
  isLoading?: boolean;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onView?: (item: any) => void;
  onRefresh?: () => void;
  rowActions?: "all" | "view-only" | "none";
  showSearch?: boolean;
  showPagination?: boolean;
  basePath?: string;
}

export function FeatureDataGrid({
  feature,
  columns,
  data,
  isLoading = false,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  rowActions = "all",
  showSearch = true,
  showPagination = true,
  basePath,
}: FeatureDataGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const effectiveColumns = columns || feature.config.ui?.columns || [];
  const title = feature.config.ui?.titlePlural || feature.name;

  // Fetch data if not provided
  const [fetchedData, setFetchedData] = useState(data);
  const [fetching, setFetching] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  useEffect(() => {
    if (data) {
      setFetchedData(data);
    } else {
      fetchData();
    }
  }, [data, currentPage, pageSize, searchQuery, sortConfig, filters]);

  const fetchData = async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...filters,
      });

      if (searchQuery) params.append("search", searchQuery);
      if (sortConfig) {
        params.append("sortBy", sortConfig.key);
        params.append("sortOrder", sortConfig.direction);
      }

      const response = await fetch(`/api/resources/${feature.name}?${params}`);
      const result = await response.json();

      if (result.data) {
        setFetchedData(result.data.data || result.data);
        setPagination({
          total: result.data.pagination?.total || 0,
          totalPages: result.data.pagination?.totalPages || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleSort = (key: string) => {
    if (sortConfig?.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSortConfig({ key, direction: "asc" });
    }
  };

  const renderCellValue = (column: ColumnConfig, row: any) => {
    const value = row[column.key];

    if (column.render) {
      return column.render(value, row);
    }

    switch (column.type) {
      case "boolean":
        return value ? (
          <Badge className="bg-green-100 text-green-700">Active</Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-600">Inactive</Badge>
        );
      case "reference":
        return value || "-";
      default:
        return value || "-";
    }
  };

  const renderRowActions = (row: any) => {
    if (rowActions === "none") return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {rowActions !== "view-only" && onEdit && (
            <DropdownMenuItem onClick={() => onEdit(row)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}
          {onView && (
            <DropdownMenuItem onClick={() => onView(row)}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
          )}
          {rowActions !== "view-only" && onDelete && (
            <DropdownMenuItem
              onClick={() => onDelete(row)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { fetchData(); onRefresh?.(); }}
                disabled={fetching}
              >
                {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        {showSearch && (
          <div className="p-4 border-b flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Filter dropdowns could go here */}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {effectiveColumns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-left text-sm font-medium text-gray-600",
                      column.sortable && "cursor-pointer hover:bg-gray-100"
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {column.sortable && (
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </th>
                ))}
                {rowActions !== "none" && (
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {(isLoading || fetching) ? (
                <tr>
                  <td colSpan={effectiveColumns.length + 1} className="px-4 py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : fetchedData?.length === 0 ? (
                <tr>
                  <td colSpan={effectiveColumns.length + 1} className="px-4 py-8 text-center text-gray-500">
                    No {title.toLowerCase()} found
                  </td>
                </tr>
              ) : (
                fetchedData?.map((row: any, index: number) => (
                  <tr key={row.id || index} className="border-t hover:bg-gray-50">
                    {effectiveColumns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-sm">
                        {renderCellValue(column, row)}
                      </td>
                    ))}
                    {rowActions !== "none" && (
                      <td className="px-4 py-3 text-right">
                        {renderRowActions(row)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {showPagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to{" "}
              {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm">
                Page {currentPage} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
