/**
 * Asset Assignments API
 * Handles asset assignment to users/departments
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { assetAssignments, inventoryItems, users } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";
import type { ApiSuccess, ApiErrorResponse, Pagination } from "@/types";

interface PaginatedData<T> {
  items: T[];
  pagination: Pagination;
}

interface CreateAssignmentInput {
  itemId: string;
  assignedToId: string;
  assignedToName: string;
  assignedToType: string;
  assignmentType: string;
  expectedReturnDate?: string;
  conditionAtAssignment?: string;
  assignmentNotes?: string;
}

interface UpdateAssignmentInput {
  id: string;
  status?: string;
  actualReturnDate?: string;
  conditionAtReturn?: string;
  returnNotes?: string;
}

// ============================================================================
// GET /api/inventory/assignments - List asset assignments
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { user, userId } = auth;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const status = searchParams.get("status") || "";
    const assignedTo = searchParams.get("assignedTo") || "";
    const assignmentType = searchParams.get("assignmentType") || "";
    const overdueOnly = searchParams.get("overdueOnly") === "true";

    // Build where conditions
    const conditions: ReturnType<typeof sql>[] = [];

    if (user.schoolId) {
      conditions.push(eq(assetAssignments.schoolId, user.schoolId));
    }

    if (status) {
      conditions.push(eq(assetAssignments.status, status));
    }

    if (assignedTo) {
      conditions.push(eq(assetAssignments.assignedToId, assignedTo));
    }

    if (assignmentType) {
      conditions.push(eq(assetAssignments.assignmentType, assignmentType));
    }

    if (overdueOnly) {
      conditions.push(
        sql`${assetAssignments.expectedReturnDate} < ${new Date().toISOString().split("T")[0]}`
      );
      conditions.push(eq(assetAssignments.status, "active"));
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(assetAssignments)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = countResult[0]?.count || 0;

    // Get assignments with pagination
    const assignments = await db
      .select()
      .from(assetAssignments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(assetAssignments.assignmentDate))
      .limit(limit)
      .offset((page - 1) * limit);

    // Fetch related items and users
    const itemIds = Array.from(new Set(assignments.map((a) => a.itemId)));
    const userIds = Array.from(new Set(assignments.map((a) => a.assignedToId)));

    const [itemsData, usersData] = await Promise.all([
      db.select().from(inventoryItems).where(itemIds.length > 0 ? sql`id = ANY(${itemIds})` : undefined),
      db.select({ id: users.id, name: users.name, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(userIds.length > 0 ? sql`id = ANY(${userIds})` : undefined),
    ]);

    const itemMap = new Map(itemsData.map((item) => [item.id, item]));
    const userMap = new Map(
      usersData.map((u) => [
        u.id,
        `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.name || "Unknown",
      ])
    );

    // Attach details
    const assignmentsWithDetails = assignments.map((assignment) => ({
      ...assignment,
      itemName: itemMap.get(assignment.itemId)?.name || "Unknown Item",
      assignedToName: userMap.get(assignment.assignedToId) || assignment.assignedToName || "Unknown",
      isOverdue:
        assignment.status === "active" &&
        assignment.expectedReturnDate &&
        assignment.expectedReturnDate < new Date().toISOString().split("T")[0],
    }));

    const pagination: Pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    logger.info("Fetched asset assignments", { userId, count: assignments.length });

    return successResponse({
      items: assignmentsWithDetails,
      pagination,
    } satisfies PaginatedData<typeof assignmentsWithDetails[0]>);
  },
  ["admin"]
);

// ============================================================================
// POST /api/inventory/assignments - Create new asset assignment
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { user, userId } = auth;
    const data: CreateAssignmentInput = await req.json();

    // Validate required fields
    if (!data.itemId || !data.assignedToId || !data.assignedToType || !data.assignmentType) {
      return badRequestResponse(
        "Missing required fields: itemId, assignedToId, assignedToType, assignmentType"
      );
    }

    // Check if item exists and is available
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, data.itemId))
      .limit(1);

    if (!item) {
      return notFoundResponse("Item");
    }

    if (item.quantity <= 0) {
      return errorResponse("Item is out of stock", 400);
    }

    const now = new Date();
    const assignmentDate = now.toISOString().split("T")[0];
    const assignmentId = `assign-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Create assignment record
    const [newAssignment] = await db
      .insert(assetAssignments)
      .values({
        id: assignmentId,
        schoolId: user.schoolId || "",
        itemId: data.itemId,
        itemName: item.name,
        assignedToId: data.assignedToId,
        assignedToName: data.assignedToName,
        assignedToType: data.assignedToType,
        assignmentType: data.assignmentType,
        assignmentDate,
        expectedReturnDate: data.expectedReturnDate || null,
        actualReturnDate: null,
        conditionAtAssignment: data.conditionAtAssignment || item.condition,
        conditionAtReturn: null,
        status: "active",
        approvedBy: userId,
        approvedDate: now.toISOString(),
        assignmentNotes: data.assignmentNotes || null,
        returnNotes: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Update item status
    await db
      .update(inventoryItems)
      .set({
        status: "in_use",
        assignedTo: data.assignedToId,
        assignedDate: assignmentDate,
        assignedUntil: data.expectedReturnDate || null,
        updatedAt: now,
      })
      .where(eq(inventoryItems.id, data.itemId));

    logger.info("Created asset assignment", { userId, assignmentId, itemId: data.itemId });

    return successResponse({
      assignment: newAssignment,
      message: "Asset assigned successfully",
    });
  },
  ["admin"]
);

// ============================================================================
// PATCH /api/inventory/assignments - Return or update assignment
// ============================================================================

export const PATCH = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const data: UpdateAssignmentInput = await req.json();

    if (!data.id) {
      return badRequestResponse("Assignment ID is required");
    }

    // Check if assignment exists
    const [existingAssignment] = await db
      .select()
      .from(assetAssignments)
      .where(eq(assetAssignments.id, data.id))
      .limit(1);

    if (!existingAssignment) {
      return notFoundResponse("Assignment");
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    if (data.status) {
      updateData.status = data.status;
    }
    if (data.actualReturnDate !== undefined) {
      updateData.actualReturnDate = data.actualReturnDate;
    }
    if (data.conditionAtReturn !== undefined) {
      updateData.conditionAtReturn = data.conditionAtReturn;
    }
    if (data.returnNotes !== undefined) {
      updateData.returnNotes = data.returnNotes;
    }

    const [updatedAssignment] = await db
      .update(assetAssignments)
      .set(updateData)
      .where(eq(assetAssignments.id, data.id))
      .returning();

    // If assignment is returned, update item status back to available
    if (data.status === "returned") {
      await db
        .update(inventoryItems)
        .set({
          status: "available",
          assignedTo: null,
          assignedDate: null,
          assignedUntil: null,
          condition: data.conditionAtReturn || existingAssignment.conditionAtAssignment,
          updatedAt: now,
        })
        .where(eq(inventoryItems.id, existingAssignment.itemId));
    }

    logger.info("Updated asset assignment", { userId, assignmentId: data.id });

    return successResponse({
      assignment: updatedAssignment,
      message: "Assignment updated successfully",
    });
  },
  ["admin"]
);
