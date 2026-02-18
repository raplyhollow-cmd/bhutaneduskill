/**
 * Inventory Transactions API
 * Handles stock movement transactions (issue, return, transfer, adjustments)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import {
  inventoryItems,
  inventoryTransactions,
  inventoryAlerts,
  inventoryCategories,
  users,
} from "@/lib/db/schema";
import { eq, and, desc, sql, gt } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse, Pagination } from "@/types";

interface PaginatedData<T> {
  items: T[];
  pagination: Pagination;
}

// ============================================================================
// GET /api/inventory/transactions - List inventory transactions
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { user, userId } = authResult;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const itemId = searchParams.get("itemId") || "";
    const transactionType = searchParams.get("type") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    // Build where conditions
    const conditions: ReturnType<typeof sql>[] = [];

    // Only show transactions from user's school
    if (user.schoolId) {
      conditions.push(eq(inventoryTransactions.schoolId, user.schoolId));
    }

    if (itemId) {
      conditions.push(eq(inventoryTransactions.itemId, itemId));
    }

    if (transactionType) {
      conditions.push(eq(inventoryTransactions.transactionType, transactionType));
    }

    if (startDate) {
      conditions.push(sql`${inventoryTransactions.transactionDate} >= ${startDate}`);
    }

    if (endDate) {
      conditions.push(sql`${inventoryTransactions.transactionDate} <= ${endDate}`);
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(inventoryTransactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = countResult[0]?.count || 0;

    // Get transactions with pagination
    const transactions = await db
      .select()
      .from(inventoryTransactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(inventoryTransactions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    // Fetch related items and users
    const itemIds = Array.from(new Set(transactions.map((t) => t.itemId)));
    const performedByIds = Array.from(
      new Set(transactions.map((t) => t.performedBy).filter((id): id is string => id !== null))
    );

    const [itemsData, usersData] = await Promise.all([
      db
        .select()
        .from(inventoryItems)
        .where(itemIds.length > 0 ? sql`id = ANY(${itemIds})` : undefined),
      db
        .select({ id: users.id, name: users.name, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(performedByIds.length > 0 ? sql`id = ANY(${performedByIds})` : undefined),
    ]);

    const itemMap = new Map(itemsData.map((item) => [item.id, item]));
    const userMap = new Map(
      usersData.map((u) => [
        u.id,
        `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.name || "Unknown",
      ])
    );

    // Attach item and user details
    const transactionsWithDetails = transactions.map((transaction) => ({
      ...transaction,
      itemName: itemMap.get(transaction.itemId)?.name || "Unknown Item",
      performedByName: userMap.get(transaction.performedBy || "") || "Unknown",
    }));

    const pagination: Pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    logger.info("Fetched inventory transactions", { userId, count: transactions.length });

    return NextResponse.json({
      data: {
        items: transactionsWithDetails,
        pagination,
      },
    } satisfies ApiSuccess<PaginatedData<typeof transactionsWithDetails[0]>>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/transactions", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch transactions", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/inventory/transactions - Create transaction (issue/return/adjust)
// ============================================================================

interface CreateTransactionInput {
  itemId: string;
  transactionType: string;
  quantity: number;
  unitPrice?: number;
  referenceNumber?: string;
  referenceType?: string;
  sourceLocation?: string;
  destinationLocation?: string;
  reason?: string;
  documentUrls?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { user, userId } = authResult;

    const data: CreateTransactionInput = await request.json();

    // Validate required fields
    if (!data.itemId || !data.transactionType || data.quantity === undefined) {
      return NextResponse.json(
        {
          error: "Missing required fields: itemId, transactionType, quantity",
          status: 400,
        } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Valid transaction types
    const validTypes = [
      "purchase",
      "sale",
      "transfer",
      "adjustment",
      "return",
      "damage",
      "loss",
      "disposal",
      "issue",
      "receive",
    ];

    if (!validTypes.includes(data.transactionType)) {
      return NextResponse.json(
        { error: `Invalid transaction type. Must be one of: ${validTypes.join(", ")}`, status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get current item
    const item = await db.query.inventoryItems.findFirst({
      where: eq(inventoryItems.id, data.itemId),
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Calculate quantity change (positive for incoming, negative for outgoing)
    let quantityChange = data.quantity;
    const outgoingTypes = ["sale", "issue", "damage", "loss", "disposal", "transfer"];
    if (outgoingTypes.includes(data.transactionType)) {
      quantityChange = -Math.abs(data.quantity);
    } else {
      quantityChange = Math.abs(data.quantity);
    }

    // Check if sufficient stock for outgoing transactions
    const newQuantity = item.quantity + quantityChange;
    if (newQuantity < 0) {
      return NextResponse.json(
        {
          error: `Insufficient stock. Current: ${item.quantity}, Requested: ${Math.abs(quantityChange)}`,
          status: 400,
        } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const now = new Date();
    const transactionDate = now.toISOString().split("T")[0];

    // Create transaction record
    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const [newTransaction] = await db
      .insert(inventoryTransactions)
      .values({
        id: transactionId,
        schoolId: user.schoolId || "",
        itemId: data.itemId,
        transactionType: data.transactionType,
        transactionDate,
        quantity: quantityChange,
        balanceAfter: newQuantity,
        unitPrice: data.unitPrice || null,
        totalValue: data.unitPrice ? Math.abs(data.quantity) * data.unitPrice : null,
        referenceNumber: data.referenceNumber || null,
        referenceType: data.referenceType || null,
        sourceLocation: data.sourceLocation || null,
        destinationLocation: data.destinationLocation || null,
        performedBy: userId,
        authorizedBy: null,
        reason: data.reason || null,
        documentUrls: data.documentUrls || null,
        createdAt: now,
      })
      .returning();

    // Update item quantity
    await db
      .update(inventoryItems)
      .set({
        quantity: newQuantity,
        updatedAt: now,
      })
      .where(eq(inventoryItems.id, data.itemId));

    // Check if low stock alert needed
    const category = await db.query.inventoryCategories.findFirst({
      where: eq(inventoryCategories.id, item.categoryId),
    });

    const minimumStock = item.minimumStock ?? category?.alertThreshold ?? 10;
    const isLowStock = newQuantity <= minimumStock;

    if (isLowStock) {
      // Check if alert already exists and is active
      const existingAlert = await db.query.inventoryAlerts.findFirst({
        where: and(
          eq(inventoryAlerts.itemId, data.itemId),
          eq(inventoryAlerts.alertType, "low_stock"),
          eq(inventoryAlerts.status, "active")
        ),
      });

      if (!existingAlert) {
        await db.insert(inventoryAlerts).values({
          id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          schoolId: user.schoolId || "",
          alertType: "low_stock",
          severity: newQuantity <= minimumStock / 2 ? "critical" : "warning",
          itemId: data.itemId,
          itemName: item.name,
          title: `Low Stock: ${item.name}`,
          message: `Item "${item.name}" is running low on stock. Current quantity: ${newQuantity}, Minimum: ${minimumStock}`,
          status: "active",
          notificationSent: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    logger.info("Created inventory transaction", {
      userId,
      transactionId,
      transactionType: data.transactionType,
      quantityChange,
    });

    return NextResponse.json({
      data: {
        transaction: newTransaction,
        newQuantity,
        lowStockAlert: isLowStock,
      },
      message: "Transaction recorded successfully",
    } satisfies ApiSuccess<{
      transaction: typeof newTransaction;
      newQuantity: number;
      lowStockAlert: boolean;
    }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/transactions", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create transaction", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/inventory/transactions/bulk-issue - Bulk issue items
// ============================================================================

interface BulkIssueInput {
  items: Array<{
    itemId: string;
    quantity: number;
    reason?: string;
  }>;
  issuedTo: string;
  issuedToName: string;
  issuedToType: string;
  expectedReturnDate?: string;
  notes?: string;
}

