/**
 * SCHOOL ADMIN - INVENTORY MANAGEMENT
 *
 * Features:
 * - Dashboard with inventory statistics
 * - List all inventory items with filters
 * - Low stock alerts
 * - Recent transactions
 * - Create, edit, delete items
 * - Issue/return items
 */

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
  ArrowUpDown,
  ShoppingCart,
  RefreshCw,
  Filter,
  Box,
  Users,
  DollarSign,
  Activity,
} from "lucide-react";
import { fetchInventoryStats, fetchInventoryItems, fetchLowStockAlerts, fetchRecentTransactions, fetchInventoryCategories } from "../_actions";
import { InventoryClient } from "./inventory-client";

export default async function SchoolAdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    categoryId?: string;
    itemType?: string;
    status?: string;
    lowStock?: string;
  }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const categoryId = params.categoryId || "";
  const itemType = params.itemType || "";
  const status = params.status || "";
  const lowStock = params.lowStock === "true";

  // Fetch all data in parallel
  const [statsResult, itemsResult, alertsResult, transactionsResult, categoriesResult] =
    await Promise.all([
      fetchInventoryStats(),
      fetchInventoryItems({
        search,
        categoryId,
        itemType,
        status,
        lowStock,
        limit: 20,
        offset: (page - 1) * 20,
      }),
      fetchLowStockAlerts(),
      fetchRecentTransactions(5),
      fetchInventoryCategories(),
    ]);

  const stats = statsResult;
  const { items, total } = itemsResult;
  const { alerts } = alertsResult;
  const { transactions } = transactionsResult;
  const { categories } = categoriesResult;

  const totalPages = Math.ceil(total / 20);

  // Pass data to client component
  return (
    <InventoryClient
      initialStats={stats}
      initialItems={items}
      initialTotal={total}
      initialAlerts={alerts}
      initialTransactions={transactions}
      initialCategories={categories}
      initialPage={page}
      initialTotalPages={totalPages}
      initialFilters={{ search, categoryId, itemType, status, lowStock }}
    />
  );
}
