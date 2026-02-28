/**
 * Inventory Alerts API
 * Handles low stock and other inventory alerts
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { inventoryAlerts, inventoryItems, inventoryCategories } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse, Pagination } from "@/types";

interface PaginatedData<T> {
  items: T[];
  pagination: Pagination;
}

// ============================================================================
// GET /api/inventory/alerts - List inventory alerts
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user, userId } = auth;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const status = searchParams.get("status") || "";
    const severity = searchParams.get("severity") || "";
    const alertType = searchParams.get("type") || "";

    // Build where conditions
    const conditions: ReturnType<typeof sql>[] = [];

    // Only show alerts from user's school
    if (user.schoolId) {
      conditions.push(eq(inventoryAlerts.schoolId, user.schoolId));
    }

    if (status) {
      conditions.push(eq(inventoryAlerts.status, status));
    } else {
      // By default, show only active alerts
      conditions.push(eq(inventoryAlerts.status, "active"));
    }

    if (severity) {
      conditions.push(eq(inventoryAlerts.severity, severity));
    }

    if (alertType) {
      conditions.push(eq(inventoryAlerts.alertType, alertType));
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(inventoryAlerts)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = countResult[0]?.count || 0;

    // Get alerts with pagination
    const alerts = await db
      .select()
      .from(inventoryAlerts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        sql`CASE ${inventoryAlerts.severity}
          WHEN 'critical' THEN 1
          WHEN 'warning' THEN 2
          WHEN 'info' THEN 3
          ELSE 4
        END`,
        desc(inventoryAlerts.createdAt)
      )
      .limit(limit)
      .offset((page - 1) * limit);

    // Fetch related items
    const itemIds = Array.from(new Set(alerts.map((alert) => alert.itemId)));
    const itemsData = await db
      .select({
        id: inventoryItems.id,
        quantity: inventoryItems.quantity,
        minimumStock: inventoryItems.minimumStock,
        categoryId: inventoryItems.categoryId,
      })
      .from(inventoryItems)
      .where(itemIds.length > 0 ? sql`id = ANY(${itemIds})` : undefined);

    const itemMap = new Map(
      itemsData.map((item) => [
        item.id,
        { quantity: item.quantity, minimumStock: item.minimumStock, categoryId: item.categoryId },
      ])
    );

    // Attach item details
    const alertsWithDetails = alerts.map((alert) => {
      const itemDetails = itemMap.get(alert.itemId);
      return {
        ...alert,
        currentQuantity: itemDetails?.quantity || 0,
        minimumStock: itemDetails?.minimumStock || 0,
      };
    });

    const pagination: Pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    logger.info("Fetched inventory alerts", { userId, count: alerts.length });

    return {
      data: {
        items: alertsWithDetails,
        pagination,
      },
    };
  },
  ["admin"]
);

// ============================================================================
// PATCH /api/inventory/alerts - Update alert status (acknowledge, resolve, dismiss)
// ============================================================================

interface UpdateAlertInput {
  id: string;
  status: string;
  resolutionNotes?: string;
}

export const PATCH = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const data: UpdateAlertInput = await request.json();

    if (!data.id || !data.status) {
      return { error: "Missing required fields: id, status", status: 400 };
    }

    const validStatuses = ["active", "acknowledged", "resolved", "dismissed"];
    if (!validStatuses.includes(data.status)) {
      return { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`, status: 400 };
    }

    // Check if alert exists
    const [existingAlert] = await db
      .select()
      .from(inventoryAlerts)
      .where(eq(inventoryAlerts.id, data.id))
      .limit(1);

    if (!existingAlert) {
      return { error: "Alert not found", status: 404 };
    }

    const now = new Date();

    const [updatedAlert] = await db
      .update(inventoryAlerts)
      .set({
        status: data.status,
        resolvedBy: data.status === "resolved" || data.status === "dismissed" ? userId : null,
        resolvedDate: data.status === "resolved" || data.status === "dismissed" ? now.toISOString() : null,
        resolutionNotes: data.resolutionNotes || null,
        updatedAt: now,
      })
      .where(eq(inventoryAlerts.id, data.id))
      .returning();

    logger.info("Updated inventory alert", { userId, alertId: data.id, status: data.status });

    return {
      data: updatedAlert,
      message: "Alert updated successfully",
    };
  },
  ["admin"]
);
