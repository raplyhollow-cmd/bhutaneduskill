/**
 * Asset Maintenance API
 * Handles asset maintenance schedules and records
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { assetMaintenance, inventoryItems, inventoryVendors } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";
import type { ApiSuccess, ApiErrorResponse, Pagination } from "@/types";

interface PaginatedData<T> {
  items: T[];
  pagination: Pagination;
}

interface CreateMaintenanceInput {
  itemId: string;
  itemName: string;
  maintenanceType: string;
  description: string;
  scheduledDate?: string;
  estimatedCost?: number;
  vendorId?: string;
  vendorName?: string;
  performedBy?: string;
}

interface UpdateMaintenanceInput {
  id: string;
  scheduledDate?: string;
  completedDate?: string;
  nextMaintenanceDate?: string;
  actualCost?: number;
  status?: string;
  workPerformed?: string;
  partsReplaced?: Array<{
    partName: string;
    partNumber: string;
    quantity: number;
    cost: number;
  }>;
  reportUrls?: string[];
  invoiceUrls?: string[];
}

// ============================================================================
// GET /api/inventory/maintenance - List maintenance records
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { user, userId } = auth;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const status = searchParams.get("status") || "";
    const maintenanceType = searchParams.get("type") || "";
    const itemId = searchParams.get("itemId") || "";
    const upcomingOnly = searchParams.get("upcomingOnly") === "true";
    const overdueOnly = searchParams.get("overdueOnly") === "true";

    // Build where conditions
    const conditions: ReturnType<typeof sql>[] = [];

    if (user.schoolId) {
      conditions.push(eq(assetMaintenance.schoolId, user.schoolId));
    }

    if (status) {
      conditions.push(eq(assetMaintenance.status, status));
    }

    if (maintenanceType) {
      conditions.push(eq(assetMaintenance.maintenanceType, maintenanceType));
    }

    if (itemId) {
      conditions.push(eq(assetMaintenance.itemId, itemId));
    }

    if (upcomingOnly) {
      const today = new Date().toISOString().split("T")[0];
      conditions.push(sql`${assetMaintenance.scheduledDate} >= ${today}`);
      conditions.push(eq(assetMaintenance.status, "scheduled"));
    }

    if (overdueOnly) {
      const today = new Date().toISOString().split("T")[0];
      conditions.push(sql`${assetMaintenance.scheduledDate} < ${today}`);
      conditions.push(eq(assetMaintenance.status, "scheduled"));
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(assetMaintenance)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = countResult[0]?.count || 0;

    // Get maintenance records with pagination
    const records = await db
      .select()
      .from(assetMaintenance)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(assetMaintenance.scheduledDate, desc(assetMaintenance.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    // Fetch related items
    const itemIds = Array.from(new Set(records.map((r) => r.itemId)));
    const itemsData = await db
      .select({ id: inventoryItems.id, name: inventoryItems.name, location: inventoryItems.location })
      .from(inventoryItems)
      .where(itemIds.length > 0 ? sql`id = ANY(${itemIds})` : undefined);

    const itemMap = new Map(itemsData.map((item) => [item.id, item]));

    // Attach item details
    const recordsWithDetails = records.map((record) => ({
      ...record,
      itemName: itemMap.get(record.itemId)?.name || record.itemName || "Unknown Item",
      itemLocation: itemMap.get(record.itemId)?.location || null,
      isOverdue:
        record.status === "scheduled" &&
        record.scheduledDate &&
        record.scheduledDate < new Date().toISOString().split("T")[0],
    }));

    const pagination: Pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    logger.info("Fetched maintenance records", { userId, count: records.length });

    return successResponse({
      items: recordsWithDetails,
      pagination,
    } satisfies PaginatedData<typeof recordsWithDetails[0]>);
  },
  ["admin"]
);

// ============================================================================
// POST /api/inventory/maintenance - Create maintenance record
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { user, userId } = auth;
    const data: CreateMaintenanceInput = await req.json();

    // Validate required fields
    if (!data.itemId || !data.maintenanceType || !data.description) {
      return badRequestResponse("Missing required fields: itemId, maintenanceType, description");
    }

    // Check if item exists
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, data.itemId))
      .limit(1);

    if (!item) {
      return notFoundResponse("Item");
    }

    const now = new Date();
    const maintenanceId = `maint-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // If vendor provided, fetch vendor name
    let vendorName = data.vendorName;
    if (data.vendorId && !vendorName) {
      const [vendor] = await db
        .select()
        .from(inventoryVendors)
        .where(eq(inventoryVendors.id, data.vendorId))
        .limit(1);
      vendorName = vendor?.name;
    }

    const [newMaintenance] = await db
      .insert(assetMaintenance)
      .values({
        id: maintenanceId,
        schoolId: user.schoolId || "",
        itemId: data.itemId,
        itemName: data.itemName || item.name,
        maintenanceType: data.maintenanceType,
        description: data.description,
        scheduledDate: data.scheduledDate || null,
        completedDate: null,
        nextMaintenanceDate: null,
        estimatedCost: data.estimatedCost || null,
        actualCost: null,
        vendorId: data.vendorId || null,
        vendorName: vendorName || null,
        performedBy: data.performedBy || null,
        status: "scheduled",
        workPerformed: null,
        partsReplaced: null,
        reportUrls: null,
        invoiceUrls: null,
        downtimeStart: null,
        downtimeEnd: null,
        downtimeReason: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    logger.info("Created maintenance record", { userId, maintenanceId, itemId: data.itemId });

    return successResponse({
      maintenance: newMaintenance,
      message: "Maintenance record created successfully",
    });
  },
  ["admin"]
);

// ============================================================================
// PATCH /api/inventory/maintenance - Update maintenance record
// ============================================================================

export const PATCH = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const data: UpdateMaintenanceInput = await req.json();

    if (!data.id) {
      return badRequestResponse("Maintenance ID is required");
    }

    // Check if record exists
    const [existingRecord] = await db
      .select()
      .from(assetMaintenance)
      .where(eq(assetMaintenance.id, data.id))
      .limit(1);

    if (!existingRecord) {
      return notFoundResponse("Maintenance record");
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    const allowedFields: (keyof UpdateMaintenanceInput)[] = [
      "scheduledDate",
      "completedDate",
      "nextMaintenanceDate",
      "actualCost",
      "status",
      "workPerformed",
      "partsReplaced",
      "reportUrls",
      "invoiceUrls",
    ];

    for (const field of allowedFields) {
      if (field in data && data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const [updatedRecord] = await db
      .update(assetMaintenance)
      .set(updateData)
      .where(eq(assetMaintenance.id, data.id))
      .returning();

    // If maintenance is completed, update item's next maintenance date
    if (data.status === "completed" && data.nextMaintenanceDate) {
      await db
        .update(inventoryItems)
        .set({
          lastMaintenanceDate: data.completedDate || now.toISOString().split("T")[0],
          nextMaintenanceDate: data.nextMaintenanceDate,
          updatedAt: now,
        })
        .where(eq(inventoryItems.id, existingRecord.itemId));
    }

    logger.info("Updated maintenance record", { userId, maintenanceId: data.id });

    return successResponse({
      maintenance: updatedRecord,
      message: "Maintenance record updated successfully",
    });
  },
  ["admin"]
);

// ============================================================================
// DELETE /api/inventory/maintenance - Delete maintenance record
// ============================================================================

export const DELETE = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const { searchParams } = new URL(req.url);
    const maintenanceId = searchParams.get("id");

    if (!maintenanceId) {
      return badRequestResponse("Maintenance ID is required");
    }

    // Check if record exists
    const [existingRecord] = await db
      .select()
      .from(assetMaintenance)
      .where(eq(assetMaintenance.id, maintenanceId))
      .limit(1);

    if (!existingRecord) {
      return notFoundResponse("Maintenance record");
    }

    // Only allow deletion of scheduled records
    if (existingRecord.status !== "scheduled") {
      return errorResponse("Cannot delete completed maintenance records", 400);
    }

    await db.delete(assetMaintenance).where(eq(assetMaintenance.id, maintenanceId));

    logger.info("Deleted maintenance record", { userId, maintenanceId });

    return successResponse({ message: "Maintenance record deleted successfully" });
  },
  ["admin"]
);
