/**
 * UNIVERSAL FEATURE LIST PAGE
 *
 * A complete page component that provides:
 * - Data grid with sorting, filtering, pagination
 * - Search functionality
 * - Create/Edit/Delete actions
 * - Bulk operations
 * - Export functionality
 *
 * @example
 * <FeatureListPage
 *   feature={LessonFeature}
 *   onCreate={() => navigate('/lessons/new')}
 *   onEdit={(id) => navigate(`/lessons/${id}/edit`)}
 *   onView={(id) => navigate(`/lessons/${id}`)}
 * />
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Eye, Trash2, Download, RefreshCw, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/toast";
import { FeatureDataGrid, ColumnConfig, ActionConfig, FilterConfig, useDataGrid } from "./FeatureDataGrid";
import { cn } from "@/lib/utils";

// Types
export interface FeatureConfig {
  name: string;
  tableName: string;
  schema: Record<string, any>;
  permissions?: {
    read?: string[];
    create?: string[];
    update?: string[];
    delete?: string[];
  };
  ui?: {
    title?: string;
    titlePlural?: string;
    basePath?: string;
    columns?: ColumnConfig[];
  };
  api?: {
    list?: any;
    get?: any;
    create?: any;
    update?: any;
    delete?: any;
  };
  table?: any;
}

export interface FeatureListPageProps {
  // Feature configuration
  feature: FeatureConfig;

  // Navigation callbacks
  onCreate?: () => void;
  onEdit?: (id: string, row: any) => void;
  onView?: (id: string, row: any) => void;
  onDelete?: (id: string, row: any) => Promise<void> | void;
  onRowClick?: (row: any) => void;

  // API configuration
  apiEndpoint?: string;
  fetchOnMount?: boolean;

  // UI configuration
  title?: string;
  description?: string;
  showHeader?: boolean;
  showActions?: boolean;
  showCreate?: boolean;
  showExport?: boolean;
  showRefresh?: boolean;

  // Bulk operations
  allowBulkDelete?: boolean;
  allowBulkExport?: boolean;
  onBulkAction?: (action: string, selectedRows: any[]) => Promise<void> | void;

  // Custom filters
  filters?: FilterConfig[];
  staticFilters?: Record<string, any>;

  // Styling
  className?: string;
  containerClassName?: string;
}

/**
 * Main FeatureListPage Component
 */
export function FeatureListPage({
  feature,
  onCreate,
  onEdit,
  onView,
  onDelete,
  onRowClick,
  apiEndpoint,
  fetchOnMount = true,
  title,
  description,
  showHeader = true,
  showActions = true,
  showCreate = true,
  showExport = true,
  showRefresh = true,
  allowBulkDelete = true,
  allowBulkExport = true,
  onBulkAction,
  filters,
  staticFilters = {},
  className,
  containerClassName,
}: FeatureListPageProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  // State
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: any } | null>(null);

  // Data grid state
  const { sortColumn, sortOrder, currentPage, pageSize, handleSort, setCurrentPage } = useDataGrid({
    pageSize: 20,
  });

  // API endpoint
  const endpoint = apiEndpoint || `/api/resources/${feature.name}`;

  // UI labels
  const displayTitle = title || feature.ui?.titlePlural || feature.name;
  const singularTitle = feature.ui?.title || feature.name.slice(0, -1);

  // Columns configuration
  const columns: ColumnConfig[] = feature.ui?.columns || [];

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!fetchOnMount) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
        ...(sortColumn && { sort: sortColumn }),
        ...(sortOrder && { order: sortOrder }),
        ...staticFilters,
      });

      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const result = await response.json();
      setData(result.data || []);
      setTotal(result.pagination?.total || result.data?.length || 0);
    } catch (err) {
      console.error("Error fetching data:", err);
      toastError({ title: `Failed to load ${displayTitle.toLowerCase()}` });
    } finally {
      setLoading(false);
    }
  }, [endpoint, currentPage, pageSize, sortColumn, sortOrder, staticFilters, fetchOnMount, displayTitle]);

  // Initial fetch and refetch on changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Default navigation handlers
  const handleCreate = useCallback(() => {
    if (onCreate) {
      onCreate();
    } else if (feature.ui?.basePath) {
      router.push(`${feature.ui.basePath}/new`);
    }
  }, [onCreate, feature.ui?.basePath, router]);

  const handleEdit = useCallback((row: any) => {
    if (onEdit) {
      onEdit(row.id, row);
    } else if (feature.ui?.basePath) {
      router.push(`${feature.ui.basePath}/${row.id}/edit`);
    }
  }, [onEdit, feature.ui?.basePath, router]);

  const handleView = useCallback((row: any) => {
    if (onView) {
      onView(row.id, row);
    } else if (feature.ui?.basePath) {
      router.push(`${feature.ui.basePath}/${row.id}`);
    }
  }, [onView, feature.ui?.basePath, router]);

  const handleDelete = useCallback(async () => {
    if (!deleteDialog?.item) return;

    const item = deleteDialog.item;
    setDeleteDialog(null);

    try {
      if (onDelete) {
        await onDelete(item.id, item);
      } else {
        const response = await fetch(`${endpoint}/${item.id}`, { method: "DELETE" });
        if (!response.ok) {
          throw new Error("Failed to delete");
        }
      }

      success({ title: `${singularTitle} deleted successfully` });
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Error deleting:", err);
      toastError({ title: `Failed to delete ${singularTitle.toLowerCase()}` });
    }
  }, [deleteDialog, onDelete, endpoint, singularTitle, fetchData, success, toastError]);

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = useCallback(async () => {
    try {
      const response = await fetch(`${endpoint}?${new URLSearchParams({
        ...staticFilters,
        limit: "1000",
      })}`);
      if (!response.ok) throw new Error("Failed to export");

      const result = await response.json();
      const data = result.data || [];

      // Convert to CSV
      const headers = columns.map((c) => c.label || c.key);
      const rows = data.map((row: any) =>
        columns.map((c) => {
          const value = row[c.key];
          return value === null || value === undefined ? "" : String(value);
        })
      );

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${feature.name}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      success({ title: "Export completed" });
    } catch (err) {
      console.error("Error exporting:", err);
      toastError({ title: "Failed to export data" });
    }
  }, [endpoint, columns, feature.name, staticFilters, success, toastError]);

  // Row actions
  const rowActions: ActionConfig[] = [
    {
      label: "View",
      icon: Eye,
      onClick: handleView,
      showInMenu: true,
    },
    {
      label: "Edit",
      icon: Pencil,
      onClick: handleEdit,
      showInMenu: true,
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: (row) => setDeleteDialog({ open: true, item: row }),
      variant: "destructive",
      showInMenu: true,
    },
  ];

  // Header actions
  const headerActions: ActionConfig[] = [];
  if (showCreate) {
    headerActions.push({
      label: `New ${singularTitle}`,
      icon: Plus,
      onClick: () => handleCreate(),
    });
  }

  return (
    <div className={cn("space-y-4", containerClassName)}>
      {/* Header */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{displayTitle}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>

          {showActions && (
            <div className="flex gap-2">
              {showRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  Refresh
                </Button>
              )}

              {showExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={loading || data.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {headerActions.map((action, idx) => (
                    <DropdownMenuItem
                      key={idx}
                      onClick={() => action.onClick(null)}
                    >
                      {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      )}

      {/* Data Grid */}
      <FeatureDataGrid
        data={data}
        columns={columns}
        loading={loading}
        total={total}
        sortColumn={sortColumn}
        sortOrder={sortOrder}
        onSort={handleSort}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        filters={filters}
        onRowClick={onRowClick || handleView}
        rowActions={rowActions}
        actions={headerActions}
        className={className}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteDialog?.open || false}
        onOpenChange={(open) => setDeleteDialog(open ? deleteDialog : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {singularTitle}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {singularTitle.toLowerCase()}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Hook for managing feature list state
 */
export function useFeatureList(feature: FeatureConfig, options?: {
  apiEndpoint?: string;
  staticFilters?: Record<string, any>;
  pageSize?: number;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const endpoint = options?.apiEndpoint || `/api/resources/${feature.name}`;

  const fetchData = useCallback(async (params?: {
    page?: number;
    sortColumn?: string;
    sortOrder?: "asc" | "desc" | null;
  }) => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: String(params?.page || currentPage),
        limit: String(options?.pageSize || 20),
        ...(params?.sortColumn && { sort: params.sortColumn }),
        ...(params?.sortOrder && { order: params.sortOrder }),
        ...options?.staticFilters,
      });

      const response = await fetch(`${endpoint}?${searchParams}`);
      if (!response.ok) throw new Error("Failed to fetch");

      const result = await response.json();
      setData(result.data || []);
      setTotal(result.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [endpoint, currentPage, options]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    total,
    currentPage,
    setCurrentPage,
    fetchData,
    refresh,
  };
}
