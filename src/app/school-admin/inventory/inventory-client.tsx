"use client";

/**
 * INVENTORY CLIENT COMPONENT
 *
 * Client-side interactive component for inventory management
 * Handles modals, filters, and state updates
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingDown,
  ShoppingCart,
  RefreshCw,
  ArrowUpDown,
  Filter,
  Box,
  Users,
  DollarSign,
  Activity,
  MoreVertical,
  ArrowUpRight,
  ArrowDownLeft,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  categoryId: string;
  categoryName: string | null;
  itemType: string;
  quantity: number;
  minimumStock: number | null;
  unit: string;
  location: string | null;
  condition: string;
  status: string;
  assignedTo: string | null;
  purchasePrice: number | null;
  currentValue: number | null;
  isLowStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  categories: number;
  vendors: number;
  pendingOrders: number;
  recentTransactions: number;
}

interface InventoryAlert {
  id: string;
  itemId: string;
  itemName: string;
  severity: string;
  title: string;
  message: string;
  createdAt: Date;
}

interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  transactionType: string;
  transactionDate: string;
  quantity: number;
  balanceAfter: number;
  performedBy: string | null;
  reason: string | null;
  createdAt: Date;
}

interface Category {
  id: string;
  name: string;
  code: string | null;
}

interface InventoryClientProps {
  initialStats: InventoryStats;
  initialItems: InventoryItem[];
  initialTotal: number;
  initialAlerts: InventoryAlert[];
  initialTransactions: Transaction[];
  initialCategories: Category[];
  initialPage: number;
  initialTotalPages: number;
  initialFilters: {
    search: string;
    categoryId: string;
    itemType: string;
    status: string;
    lowStock: boolean;
  };
}

const itemTypeLabels: Record<string, string> = {
  asset: "Fixed Asset",
  consumable: "Consumable",
  equipment: "Equipment",
  furniture: "Furniture",
  stationery: "Stationery",
  book: "Book",
};

const conditionLabels: Record<string, string> = {
  new: "New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  damaged: "Damaged",
};

const statusLabels: Record<string, string> = {
  available: "Available",
  in_use: "In Use",
  reserved: "Reserved",
  maintenance: "Maintenance",
  disposed: "Disposed",
  lost: "Lost",
};

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  in_use: "bg-blue-100 text-blue-700",
  reserved: "bg-yellow-100 text-yellow-700",
  maintenance: "bg-orange-100 text-orange-700",
  disposed: "bg-gray-100 text-gray-700",
  lost: "bg-red-100 text-red-700",
};

export function InventoryClient({
  initialStats,
  initialItems,
  initialTotal,
  initialAlerts,
  initialTransactions,
  initialCategories,
  initialPage,
  initialTotalPages,
  initialFilters,
}: InventoryClientProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "N/A";
    return new Intl.NumberFormat("en-BT", {
      style: "currency",
      currency: "BTN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: "Purchase",
      sale: "Sale",
      transfer: "Transfer",
      adjustment: "Adjustment",
      return: "Return",
      damage: "Damage",
      loss: "Loss",
      disposal: "Disposal",
      issue: "Issued",
      receive: "Received",
    };
    return labels[type] || type;
  };

  // Handle filter change
  const updateFilter = (key: string, value: string | boolean) => {
    const params = new URLSearchParams();
    if (initialFilters.search) params.set("search", initialFilters.search);
    if (initialFilters.categoryId) params.set("categoryId", initialFilters.categoryId);
    if (initialFilters.itemType) params.set("itemType", initialFilters.itemType);
    if (initialFilters.status) params.set("status", initialFilters.status);
    if (initialFilters.lowStock) params.set("lowStock", "true");

    if (value === "" || value === false) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }

    router.push(`/school-admin/inventory?${params.toString()}`);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;
    updateFilter("search", search);
  };

  // Handle delete item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/inventory/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId }),
      });

      const result = await response.json();
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to delete item");
      }
    } catch (error) {
      alert("Failed to delete item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">
            {initialTotal} item{initialTotal !== 1 ? "s" : ""} in stock
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.refresh()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            className="bg-violet-600 hover:bg-violet-700"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                <Box className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{initialStats.totalItems}</p>
                <p className="text-sm text-gray-500">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{initialStats.lowStockItems}</p>
                <p className="text-sm text-gray-500">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{initialStats.outOfStockItems}</p>
                <p className="text-sm text-gray-500">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(initialStats.totalValue)}
                </p>
                <p className="text-sm text-gray-500">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Transactions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        {initialAlerts.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-5 h-5" />
                Low Stock Alerts ({initialAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {initialAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.severity === "critical"
                        ? "bg-red-50 border-red-200"
                        : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{alert.itemName}</p>
                        <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          alert.severity === "critical"
                            ? "bg-red-100 text-red-700 border-red-300"
                            : "bg-yellow-100 text-yellow-700 border-yellow-300"
                        }
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {initialTransactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent transactions</p>
            ) : (
              <div className="space-y-3">
                {initialTransactions.map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          txn.quantity > 0
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {txn.quantity > 0 ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{txn.itemName}</p>
                        <p className="text-xs text-gray-500">
                          {getTransactionTypeLabel(txn.transactionType)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${
                          txn.quantity > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {txn.quantity > 0 ? "+" : ""}
                        {txn.quantity}
                      </p>
                      <p className="text-xs text-gray-500">
                        Bal: {txn.balanceAfter}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, SKU, or location..."
                  defaultValue={initialFilters.search}
                  name="search"
                  className="pl-10"
                />
              </div>
            </div>

            <select
              name="categoryId"
              defaultValue={initialFilters.categoryId}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
              onChange={(e) => updateFilter("categoryId", e.target.value)}
            >
              <option value="">All Categories</option>
              {initialCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              name="itemType"
              defaultValue={initialFilters.itemType}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
              onChange={(e) => updateFilter("itemType", e.target.value)}
            >
              <option value="">All Types</option>
              {Object.entries(itemTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={initialFilters.status}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
              onChange={(e) => updateFilter("status", e.target.value)}
            >
              <option value="">All Status</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant={initialFilters.lowStock ? "default" : "outline"}
              className={initialFilters.lowStock ? "bg-yellow-500 hover:bg-yellow-600" : ""}
              onClick={() => updateFilter("lowStock", !initialFilters.lowStock)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Low Stock Only
            </Button>

            {initialFilters.search ||
            initialFilters.categoryId ||
            initialFilters.itemType ||
            initialFilters.status ||
            initialFilters.lowStock ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/school-admin/inventory")}
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      {/* Items Grid */}
      {initialItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No inventory items found</p>
            <Button
              className="mt-4 bg-violet-600 hover:bg-violet-700"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialItems.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center text-white">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <p className="text-xs text-gray-500">{item.sku || "No SKU"}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedItem(item); setShowIssueModal(true); }}>
                          <ArrowUpRight className="w-4 h-4 mr-2" />
                          Issue Item
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedItem(item); setShowReturnModal(true); }}>
                          <ArrowDownLeft className="w-4 h-4 mr-2" />
                          Return Item
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Category and Type */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{item.categoryName || "Uncategorized"}</Badge>
                    <Badge variant="secondary">{itemTypeLabels[item.itemType] || item.itemType}</Badge>
                  </div>

                  {/* Quantity */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-500">Quantity</p>
                      <p className={`text-sm font-medium ${item.isLowStock ? "text-red-600" : "text-gray-900"}`}>
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                    {item.isLowStock && (
                      <p className="text-xs text-red-500">
                        Minimum: {item.minimumStock || 10} {item.unit}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  {item.location && (
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm">{item.location}</p>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <Badge className={statusColors[item.status] || "bg-gray-100 text-gray-700"}>
                      {statusLabels[item.status] || item.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        item.condition === "new"
                          ? "bg-green-50 text-green-700"
                          : item.condition === "good"
                          ? "bg-blue-50 text-blue-700"
                          : item.condition === "damaged"
                          ? "bg-red-50 text-red-700"
                          : "bg-gray-50 text-gray-700"
                      }
                    >
                      {conditionLabels[item.condition] || item.condition}
                    </Badge>
                  </div>

                  {/* Assigned To */}
                  {item.assignedTo && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Users className="w-4 h-4" />
                      <span>Assigned to: {item.assignedTo}</span>
                    </div>
                  )}

                  {/* Value */}
                  {item.currentValue && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500">Current Value</p>
                      <p className="text-sm font-medium">{formatCurrency(item.currentValue)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {initialTotalPages > 1 && (
            <div className="flex items-center justify-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={initialPage === 1}
                onClick={() =>
                  router.push(
                    `/school-admin/inventory?page=${initialPage - 1}&search=${initialFilters.search}&categoryId=${initialFilters.categoryId}&itemType=${initialFilters.itemType}&status=${initialFilters.status}&lowStock=${initialFilters.lowStock}`
                  )
                }
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(initialTotalPages, 5) }, (_, i) => {
                let pageNum;
                if (initialTotalPages <= 5) {
                  pageNum = i + 1;
                } else if (initialPage <= 3) {
                  pageNum = i + 1;
                } else if (initialPage >= initialTotalPages - 2) {
                  pageNum = initialTotalPages - 4 + i;
                } else {
                  pageNum = initialPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={initialPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className={initialPage === pageNum ? "bg-violet-600 hover:bg-violet-700" : ""}
                    onClick={() =>
                      router.push(
                        `/school-admin/inventory?page=${pageNum}&search=${initialFilters.search}&categoryId=${initialFilters.categoryId}&itemType=${initialFilters.itemType}&status=${initialFilters.status}&lowStock=${initialFilters.lowStock}`
                      )
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={initialPage === initialTotalPages}
                onClick={() =>
                  router.push(
                    `/school-admin/inventory?page=${initialPage + 1}&search=${initialFilters.search}&categoryId=${initialFilters.categoryId}&itemType=${initialFilters.itemType}&status=${initialFilters.status}&lowStock=${initialFilters.lowStock}`
                  )
                }
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Add Item Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add Inventory Item</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Use the API endpoint or create a full form component here.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                  onClick={() => setShowAddModal(false)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issue Item Modal Placeholder */}
      {showIssueModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Issue Item: {selectedItem.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Current stock: {selectedItem.quantity} {selectedItem.unit}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowIssueModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                  onClick={() => setShowIssueModal(false)}
                >
                  Issue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Return Item Modal Placeholder */}
      {showReturnModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Return Item: {selectedItem.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                This will mark the item as returned and available.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowReturnModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                  onClick={() => setShowReturnModal(false)}
                >
                  Return
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
