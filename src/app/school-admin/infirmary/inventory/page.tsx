"use client";

/**
 * SCHOOL ADMIN INFIRMARY INVENTORY PAGE
 *
 * School administrators can:
 * - View medicine inventory
 * - Add new medicines
 * - Update stock levels
 * - Track medicine usage
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Package,
  Plus,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";

interface MedicineInventory {
  id: string;
  medicineName: string;
  genericName?: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  unit: string;
  unitCost?: string;
  expiryDate?: string;
  batchNumber?: string;
  manufacturer?: string;
  supplier?: string;
  status: string;
}

interface InventorySummary {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  expiredItems: number;
}

export default function InfirmaryInventoryPage() {
  const [inventory, setInventory] = useState<MedicineInventory[]>([]);
  const [summary, setSummary] = useState<InventorySummary>({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    expiredItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineInventory | null>(null);
  const [updating, setUpdating] = useState(false);

  // Add medicine form state
  const [addFormData, setAddFormData] = useState({
    medicineName: "",
    genericName: "",
    category: "tablet",
    description: "",
    currentStock: 0,
    minimumStock: 10,
    maximumStock: 100,
    unit: "tablets",
    unitCost: "",
    expiryDate: "",
    batchNumber: "",
    manufacturer: "",
    supplier: "",
    storageLocation: "",
    storageConditions: "",
    isPrescriptionRequired: false,
    notes: "",
  });

  // Update stock form state
  const [updateFormData, setUpdateFormData] = useState({
    action: "restock",
    quantity: 0,
    notes: "",
  });

  const categories = [
    { value: "tablet", label: "Tablets" },
    { value: "syrup", label: "Syrups" },
    { value: "injection", label: "Injections" },
    { value: "ointment", label: "Ointments" },
    { value: "drops", label: "Drops" },
    { value: "supplies", label: "Medical Supplies" },
  ];

  useEffect(() => {
    fetchInventory();
  }, [categoryFilter, statusFilter]);

  const fetchInventory = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/school-admin/medical/inventory?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setInventory(data.data.inventory);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const response = await fetch("/api/school-admin/medical/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addFormData),
      });

      const data = await response.json();

      if (data.success) {
        setShowAddDialog(false);
        setAddFormData({
          medicineName: "",
          genericName: "",
          category: "tablet",
          description: "",
          currentStock: 0,
          minimumStock: 10,
          maximumStock: 100,
          unit: "tablets",
          unitCost: "",
          expiryDate: "",
          batchNumber: "",
          manufacturer: "",
          supplier: "",
          storageLocation: "",
          storageConditions: "",
          isPrescriptionRequired: false,
          notes: "",
        });
        await fetchInventory();
        alert("Medicine added to inventory!");
      } else {
        alert(data.error || "Failed to add medicine");
      }
    } catch (error) {
      console.error("Error adding medicine:", error);
      alert("Failed to add medicine");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicine) return;

    setUpdating(true);

    try {
      const response = await fetch("/api/school-admin/medical/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedMedicine.id,
          ...updateFormData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowUpdateDialog(false);
        setSelectedMedicine(null);
        setUpdateFormData({ action: "restock", quantity: 0, notes: "" });
        await fetchInventory();
        alert("Stock updated successfully!");
      } else {
        alert(data.error || "Failed to update stock");
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Failed to update stock");
    } finally {
      setUpdating(false);
    }
  };

  const filteredInventory = inventory.filter((item) =>
    item.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.genericName && item.genericName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStockStatus = (item: MedicineInventory) => {
    const percentage = (item.currentStock / item.minimumStock) * 100;

    if (item.expiryDate && new Date(item.expiryDate) < new Date()) {
      return { label: "Expired", color: "bg-gray-100 text-gray-700 border-gray-200" };
    }
    if (percentage <= 50) {
      return { label: "Critical", color: "bg-red-100 text-red-700 border-red-200" };
    }
    if (percentage <= 100) {
      return { label: "Low Stock", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
    }
    return { label: "In Stock", color: "bg-green-100 text-green-700 border-green-200" };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry < thirtyDaysFromNow && expiry > new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/school-admin/infirmary">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-purple-600" />
              Medicine Inventory
            </h1>
            <p className="text-gray-600 mt-1">Manage infirmary medicines and supplies</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Medicine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Medicine</DialogTitle>
                <DialogDescription>Enter details for the new medicine item</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMedicine} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Medicine Name *</Label>
                    <Input
                      required
                      value={addFormData.medicineName}
                      onChange={(e) => setAddFormData({ ...addFormData, medicineName: e.target.value })}
                      placeholder="e.g., Paracetamol"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Generic Name</Label>
                    <Input
                      value={addFormData.genericName}
                      onChange={(e) => setAddFormData({ ...addFormData, genericName: e.target.value })}
                      placeholder="e.g., Acetaminophen"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={addFormData.category}
                      onValueChange={(value) => setAddFormData({ ...addFormData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unit *</Label>
                    <Select
                      value={addFormData.unit}
                      onValueChange={(value) => setAddFormData({ ...addFormData, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tablets">Tablets</SelectItem>
                        <SelectItem value="ml">Milliliters</SelectItem>
                        <SelectItem value="bottles">Bottles</SelectItem>
                        <SelectItem value="tubes">Tubes</SelectItem>
                        <SelectItem value="pieces">Pieces</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Initial Stock *</Label>
                    <Input
                      type="number"
                      required
                      min="0"
                      value={addFormData.currentStock}
                      onChange={(e) => setAddFormData({ ...addFormData, currentStock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Stock Level *</Label>
                    <Input
                      type="number"
                      required
                      min="0"
                      value={addFormData.minimumStock}
                      onChange={(e) => setAddFormData({ ...addFormData, minimumStock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Stock Level</Label>
                    <Input
                      type="number"
                      min="0"
                      value={addFormData.maximumStock}
                      onChange={(e) => setAddFormData({ ...addFormData, maximumStock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unit Cost</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={addFormData.unitCost}
                      onChange={(e) => setAddFormData({ ...addFormData, unitCost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={addFormData.expiryDate}
                      onChange={(e) => setAddFormData({ ...addFormData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Batch Number</Label>
                    <Input
                      value={addFormData.batchNumber}
                      onChange={(e) => setAddFormData({ ...addFormData, batchNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Manufacturer</Label>
                    <Input
                      value={addFormData.manufacturer}
                      onChange={(e) => setAddFormData({ ...addFormData, manufacturer: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Input
                      value={addFormData.supplier}
                      onChange={(e) => setAddFormData({ ...addFormData, supplier: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Storage Location</Label>
                    <Input
                      value={addFormData.storageLocation}
                      onChange={(e) => setAddFormData({ ...addFormData, storageLocation: e.target.value })}
                      placeholder="e.g., Shelf A, Refrigerator"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={addFormData.description}
                    onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <Button type="submit" disabled={updating} className="w-full">
                  {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add to Inventory
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={fetchInventory}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{summary.totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Nu. {summary.totalValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.lowStockItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">Expired Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.expiredItems}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search medicines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <CardTitle>Medicine Inventory</CardTitle>
          <CardDescription>
            {filteredInventory.length} items found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p>No medicines found in inventory.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item);
                const isLowStock = item.currentStock <= item.minimumStock;
                const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();

                return (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                      isExpired ? "bg-gray-50 border-gray-300" : isLowStock ? "bg-yellow-50 border-yellow-200" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          isExpired ? "bg-gray-200" : isLowStock ? "bg-yellow-200" : "bg-green-100"
                        }`}>
                          <Package className={`w-5 h-5 ${
                            isExpired ? "text-gray-500" : isLowStock ? "text-yellow-600" : "text-green-600"
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{item.medicineName}</p>
                            {isExpiringSoon(item.expiryDate) && (
                              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                                Expiring Soon
                              </Badge>
                            )}
                          </div>
                          {item.genericName && (
                            <p className="text-sm text-gray-500">{item.genericName}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{item.category}</Badge>
                            {item.manufacturer && (
                              <span className="text-xs text-gray-500">{item.manufacturer}</span>
                            )}
                          </div>
                          {item.expiryDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Expires: {formatDate(item.expiryDate)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          isExpired ? "text-gray-500" : isLowStock ? "text-yellow-600" : "text-green-600"
                        }`}>
                          {item.currentStock} {item.unit}
                        </p>
                        <p className="text-xs text-gray-500">
                          Min: {item.minimumStock} {item.unit}
                        </p>
                        <Badge className={stockStatus.color} variant="outline">
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Dialog open={showUpdateDialog && selectedMedicine?.id === item.id} onOpenChange={(open) => {
                        setShowUpdateDialog(open);
                        if (open) setSelectedMedicine(item);
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Restock
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Stock: {item.medicineName}</DialogTitle>
                            <DialogDescription>
                              Current stock: {item.currentStock} {item.unit}
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleUpdateStock} className="space-y-4">
                            <div className="space-y-2">
                              <Label>Action</Label>
                              <Select
                                value={updateFormData.action}
                                onValueChange={(value) => setUpdateFormData({ ...updateFormData, action: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="restock">Add Stock (Restock)</SelectItem>
                                  <SelectItem value="usage">Record Usage</SelectItem>
                                  <SelectItem value="discard">Discard/Expire</SelectItem>
                                  <SelectItem value="adjustment">Set Stock Level</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>
                                {updateFormData.action === "adjustment" ? "New Stock Level" : "Quantity"}
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                required
                                value={updateFormData.quantity}
                                onChange={(e) => setUpdateFormData({ ...updateFormData, quantity: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Notes</Label>
                              <Textarea
                                value={updateFormData.notes}
                                onChange={(e) => setUpdateFormData({ ...updateFormData, notes: e.target.value })}
                                rows={2}
                              />
                            </div>
                            <Button type="submit" disabled={updating} className="w-full">
                              {updating ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                              )}
                              Update Stock
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
