/**
 * Inventory Procurement API
 * Handles purchase orders and procurement requests
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  purchaseOrders,
  inventoryVendors,
  inventoryItems,
  inventorySettings,
} from "@/lib/db/schema";
import { eq, and, desc, sql, like } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";
import type { ApiSuccess, ApiErrorResponse, Pagination } from "@/types";

interface PaginatedData<T> {
  items: T[];
  pagination: Pagination;
}

interface PurchaseOrderItem {
  itemId?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  tax?: number;
}

interface CreatePurchaseOrderInput {
  vendorId: string;
  expectedDeliveryDate?: string;
  items: PurchaseOrderItem[];
  paymentTerms?: string;
  deliveryAddress?: string;
  deliveryInstructions?: string;
  notes?: string;
  termsAndConditions?: string;
}

interface UpdatePurchaseOrderInput {
  id: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status?: string;
  paymentStatus?: string;
  amountPaid?: number;
  approvedBy?: string;
  approvalNotes?: string;
  notes?: string;
}

// ============================================================================
// GET /api/inventory/procurement - List purchase orders
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { user, userId } = auth;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const status = searchParams.get("status") || "";
    const vendorId = searchParams.get("vendorId") || "";
    const search = searchParams.get("search") || "";

    // Build where conditions
    const conditions: ReturnType<typeof sql>[] = [];

    if (user.schoolId) {
      conditions.push(eq(purchaseOrders.schoolId, user.schoolId));
    }

    if (status) {
      conditions.push(eq(purchaseOrders.status, status));
    }

    if (vendorId) {
      conditions.push(eq(purchaseOrders.vendorId, vendorId));
    }

    if (search) {
      conditions.push(
        like(purchaseOrders.orderNumber, `%${search}%`)
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(purchaseOrders)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = countResult[0]?.count || 0;

    // Get purchase orders with pagination
    const orders = await db
      .select()
      .from(purchaseOrders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const pagination: Pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    logger.info("Fetched purchase orders", { userId, count: orders.length });

    return successResponse({
      items: orders,
      pagination,
    } satisfies PaginatedData<typeof orders[0]>);
  },
  ["admin"]
);

// ============================================================================
// POST /api/inventory/procurement - Create purchase order
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { user, userId } = auth;
    const data: CreatePurchaseOrderInput = await req.json();

    // Validate required fields
    if (!data.vendorId || !data.items || data.items.length === 0) {
      return badRequestResponse("Missing required fields: vendorId, items");
    }

    // Validate vendor exists
    const [vendor] = await db
      .select()
      .from(inventoryVendors)
      .where(eq(inventoryVendors.id, data.vendorId))
      .limit(1);

    if (!vendor) {
      return notFoundResponse("Vendor");
    }

    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = data.items.reduce((sum, item) => sum + (item.tax || 0), 0);
    const totalAmount = subtotal + taxAmount;

    // Generate PO number
    const [settings] = await db
      .select()
      .from(inventorySettings)
      .where(eq(inventorySettings.schoolId, user.schoolId || ""))
      .limit(1);

    const prefix = settings?.purchaseOrderPrefix || "PO";
    const nextNumber = settings?.purchaseOrderNextNumber || 1;
    const orderNumber = `${prefix}-${new Date().getFullYear()}-${String(nextNumber).padStart(4, "0")}`;

    const now = new Date();
    const orderId = `po-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const [newOrder] = await db
      .insert(purchaseOrders)
      .values({
        id: orderId,
        schoolId: user.schoolId || "",
        orderNumber,
        orderDate: now.toISOString().split("T")[0],
        expectedDeliveryDate: data.expectedDeliveryDate || null,
        actualDeliveryDate: null,
        vendorId: data.vendorId,
        vendorName: vendor.name,
        vendorAddress: vendor.address,
        vendorContact: vendor.contactPerson,
        vendorPhone: vendor.phone,
        vendorEmail: vendor.email,
        items: data.items as PurchaseOrderItem[],
        subtotal,
        taxAmount,
        discountAmount: 0,
        shippingCost: 0,
        otherCharges: 0,
        totalAmount,
        paymentTerms: data.paymentTerms || vendor.paymentTerms || "NET 30",
        paymentStatus: "pending",
        paymentDueDate: null,
        amountPaid: 0,
        deliveryAddress: data.deliveryAddress || null,
        deliveryInstructions: data.deliveryInstructions || null,
        status: "pending",
        approvedBy: null,
        approvedDate: null,
        approvalNotes: null,
        notes: data.notes || null,
        termsAndConditions: data.termsAndConditions || null,
        documentUrls: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Update PO number counter in settings
    if (settings) {
      await db
        .update(inventorySettings)
        .set({ purchaseOrderNextNumber: nextNumber + 1 })
        .where(eq(inventorySettings.id, settings.id));
    }

    logger.info("Created purchase order", { userId, orderId, orderNumber });

    return successResponse({
      order: newOrder,
      message: "Purchase order created successfully",
    });
  },
  ["admin"]
);

// ============================================================================
// PATCH /api/inventory/procurement - Update purchase order
// ============================================================================

export const PATCH = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const data: UpdatePurchaseOrderInput = await req.json();

    if (!data.id) {
      return badRequestResponse("Purchase order ID is required");
    }

    // Check if PO exists
    const [existingOrder] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, data.id))
      .limit(1);

    if (!existingOrder) {
      return notFoundResponse("Purchase order");
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const allowedFields: (keyof UpdatePurchaseOrderInput)[] = [
      "expectedDeliveryDate",
      "actualDeliveryDate",
      "status",
      "paymentStatus",
      "amountPaid",
      "approvedBy",
      "approvalNotes",
      "notes",
    ];

    for (const field of allowedFields) {
      if (field in data && data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (data.status === "approved" && !existingOrder.approvedDate) {
      updateData.approvedDate = new Date().toISOString();
    }

    const [updatedOrder] = await db
      .update(purchaseOrders)
      .set(updateData as typeof updateData & Record<string, unknown>)
      .where(eq(purchaseOrders.id, data.id))
      .returning();

    logger.info("Updated purchase order", { userId, orderId: data.id });

    return successResponse({
      order: updatedOrder,
      message: "Purchase order updated successfully",
    });
  },
  ["admin"]
);
