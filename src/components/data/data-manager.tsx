"use client";

/**
 * COMPREHENSIVE DATA MANAGER COMPONENT
 *
 * A universal component for viewing, filtering, exporting, and managing all data in the ecosystem.
 * This is the "control center" for all data operations.
 *
 * Features:
 * - View any data source
 * - Filter and search
 * - Export to multiple formats
 * - Batch operations
 * - Data visualization
 */


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  FileJson,
  FileSpreadsheet,
  FileText,
  Download,
  Filter,
  Search,
  RefreshCw,
  Eye,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { dataSources } from "@/lib/data-export";
import { getNavigationItems } from "@/lib/routing-manager";

type ExportFormat = "json" | "csv" | "xml" | "excel";

export interface DataManagerProps {
  dataSource?: string; // Pre-selected data source
  allowedRoles?: string[]; // Restrict to certain roles
  onExport?: (format: ExportFormat, data: Record<string, unknown>[]) => void;
  readonly?: boolean; // View-only mode
  embedded?: boolean; // Embedded in another page
}

export function DataManager({
  dataSource: initialSource,
  allowedRoles,
  onExport,
  readonly = false,
  embedded = false,
}: DataManagerProps) {
  const [selectedSource, setSelectedSource] = useState(initialSource || "users");
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>(["json"]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const sourceConfig = dataSources[selectedSource as keyof typeof dataSources];

  // Load fields when source changes
  useEffect(() => {
    if (sourceConfig) {
      setSelectedFields(sourceConfig.fields.map((f) => f.key));
    }
  }, [selectedSource, sourceConfig]);

  // Fetch data when source changes
  useEffect(() => {
    fetchData();
  }, [selectedSource]);

  // Filter data based on search
  const filteredData = data.filter((item) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return selectedFields.some((field) => {
      const value = getNestedValue(item, field);
      return String(value ?? "").toLowerCase().includes(searchLower);
    });
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/data-export?source=${selectedSource}`);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      // For now, use mock data until we implement full API
      // In production, this would call the actual export endpoint
      setData([]);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format: ExportFormat) {
    try {
      const response = await fetch("/api/data-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataSource: selectedSource,
          format,
          fields: selectedFields,
          limit: filteredData.length,
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || `${selectedSource}_export.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (onExport) {
        onExport(format, filteredData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce((current: unknown, key) => {
      if (current && typeof current === "object" && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  function toggleRowSelection(id: string) {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRows(newSelection);
  }

  function toggleAllRows() {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((d) => String(d.id || d._id || JSON.stringify(d)))));
    }
  }

  const formatIcons: Record<ExportFormat, React.ReactNode> = {
    json: <FileJson className="w-4 h-4" />,
    csv: <FileSpreadsheet className="w-4 h-4" />,
    xml: <FileText className="w-4 h-4" />,
    excel: <FileSpreadsheet className="w-4 h-4 text-green-600" />,
  };

  return (
    <div className={`space-y-4 ${embedded ? "" : "p-6"}`}>
      {!embedded && (
        <div>
          <h2 className="text-2xl font-bold mb-2">Data Manager</h2>
          <p className="text-gray-600">
            View, filter, and export data from any source in the ecosystem.
          </p>
        </div>
      )}

      {/* Data Source Selection */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <CardTitle>Data Source</CardTitle>
              <CardDescription>Select the data you want to work with</CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dataSources).map(([key, source]) => (
                    <SelectItem key={key} value={key}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={fetchData}
                disabled={loading}
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {sourceConfig && (
            <p className="text-sm text-gray-600">{sourceConfig.description}</p>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Fields ({selectedFields.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {sourceConfig?.fields.map((field) => (
                  <DropdownMenuCheckboxItem
                    key={field.key}
                    checked={selectedFields.includes(field.key)}
                    onCheckedChange={(checked) => {
                      setSelectedFields((prev) =>
                        checked
                          ? [...prev, field.key]
                          : prev.filter((f) => f !== field.key)
                      );
                    }}
                  >
                    {field.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("json")}>
                  <FileJson className="w-4 h-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("xml")}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as XML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("excel")}>
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Total: {filteredData.length} records</span>
            {searchQuery && <span>Filtered from {data.length} total</span>}
            {selectedRows.size > 0 && (
              <span className="text-blue-600">{selectedRows.size} selected</span>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
              <Button
                variant="link"
                className="ml-2"
                onClick={() => {
                  setError(null);
                  fetchData();
                }}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Data Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : paginatedData.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleAllRows}
                          className="h-8 w-8 p-0"
                        >
                          {selectedRows.size === paginatedData.length ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </Button>
                      </TableHead>
                      {sourceConfig?.fields
                        .filter((f) => selectedFields.includes(f.key))
                        .map((field) => (
                          <TableHead key={field.key}>{field.label}</TableHead>
                        ))}
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item, index) => {
                      const itemId = String(item.id || item._id || index.toString());
                      const isSelected = selectedRows.has(itemId);

                      return (
                        <TableRow key={itemId as React.Key} className={isSelected ? "bg-blue-50" : ""}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowSelection(itemId)}
                              className="h-8 w-8 p-0"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </Button>
                          </TableCell>
                          {sourceConfig?.fields
                            .filter((f) => selectedFields.includes(f.key))
                            .map((field) => (
                              <TableCell key={field.key}>
                                {formatCellValue(getNestedValue(item, field.key), field.type)}
                              </TableCell>
                            ))}
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Rows per page:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-16 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? "No matching records found" : "No data available"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatCellValue(value: unknown, type: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-400">-</span>;
  }

  switch (type) {
    case "boolean":
      return value ? (
        <Badge variant="outline" className="bg-green-50 text-green-700">Yes</Badge>
      ) : (
        <Badge variant="outline" className="bg-gray-50 text-gray-700">No</Badge>
      );
    case "date":
      return value ? new Date(value as string | Date).toLocaleDateString() : "-";
    case "array":
      return Array.isArray(value) ? (
        <span className="text-xs">[{value.length} items]</span>
      ) : (
        String(value)
      );
    case "object":
      return typeof value === "object" ? (
        <span className="text-xs text-gray-500">{JSON.stringify(value).slice(0, 30)}...</span>
      ) : (
        String(value)
      );
    default:
      return String(value);
  }
}
