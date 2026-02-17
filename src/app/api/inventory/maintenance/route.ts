/**
 * Asset Maintenance API
 * Handles asset maintenance schedules and records
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { assetMaintenance, inventoryItems, inventoryVendors } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse, Pagination } from "@/types";

interface PaginatedData<T> {
  items: T[];
  pagination: Pagination;
}

// ============================================================================
// GET /api/inventory/maintenance - List maintenance records
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

    return NextResponse.json({
      data: {
        items: recordsWithDetails,
        pagination,
      },
    } satisfies ApiSuccess<PaginatedData<typeof recordsWithDetails[0]>>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/maintenance", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch maintenance records", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/inventory/maintenance - Create maintenance record
// ============================================================================

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

    const data: CreateMaintenanceInput = await request.json();

    // Validate required fields
    if (!data.itemId || !data.maintenanceType || !data.description) {
      return NextResponse.json(
        { error: "Missing required fields: itemId, maintenanceType, description", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check if item exists
    const item = await db.query.inventoryItems.findFirst({
      where: eq(inventoryItems.id, data.itemId),
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    const now = new Date();
    const maintenanceId = `maint-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // If vendor provided, fetch vendor name
    let vendorName = data.vendorName;
    if (data.vendorId && !vendorName) {
      const vendor = await db.query.inventoryVendors.findFirst({
        where: eq(inventoryVendors.id, data.vendorId),
      });
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

    return NextResponse.json({
      data: newMaintenance,
      message: "Maintenance record created successfully",
    } satisfies ApiSuccess<typeof newMaintenance>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/maintenance", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create maintenance record", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/inventory/maintenance - Update maintenance record
// ============================================================================

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

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const data: UpdateMaintenanceInput = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: "Maintenance ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check if record exists
    const existingRecord = await db.query.assetMaintenance.findFirst({
      where: eq(assetMaintenance.id, data.id),
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Maintenance record not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
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

    return NextResponse.json({
      data: updatedRecord,
      message: "Maintenance record updated successfully",
    } satisfies ApiSuccess<typeof updatedRecord>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/maintenance", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update maintenance record", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/inventory/maintenance - Delete maintenance record
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const maintenanceId = searchParams.get("id");

    if (!maintenanceId) {
      return NextResponse.json(
        { error: "Maintenance ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check if record exists
    const existingRecord = await db.query.assetMaintenance.findFirst({
      where: eq(assetMaintenance.id, maintenanceId),
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Maintenance record not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Only allow deletion of scheduled records
    if (existingRecord.status !== "scheduled") {
      return NextResponse.json(
        { error: "Cannot delete completed maintenance records", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    await db.delete(assetMaintenance).where(eq(assetMaintenance.id, maintenanceId));

    logger.info("Deleted maintenance record", { userId, maintenanceId });

    return NextResponse.json({
      data: { message: "Maintenance record deleted successfully" },
    } satisfies ApiSuccess<{ message: string }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/maintenance", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete maintenance record", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
