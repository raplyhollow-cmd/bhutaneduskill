/**
 * SCHOOLS [id] API
 *
 * Handles individual school operations (get, update, delete)
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { schools, users, classes, feePayments, studentFees, counselorResources, attendance, leaveRequests, leaveBalances } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/schools/[id] - Get single school
// ============================================================================

export const GET = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id } = await context!.params!;
    const { userId, user } = auth;

    // Platform admins (type: "admin") have all permissions - skip RBAC check
    if (user.type !== "admin") {
      const permCheck = await requirePermission(userId, "schools.read");
      if (permCheck) return permCheck;
    }

    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, id))
      .limit(1);

    if (!school) {
      return notFoundResponse("School");
    }

    return successResponse({ school });
  },
  [] // Permission check is done inside
);

// ============================================================================
// PUT /api/schools/[id] - Update school
// ============================================================================

export const PUT = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id } = await context!.params!;
    const { userId, user } = auth;

    // Platform admins (type: "admin") have all permissions - skip RBAC check
    // RBAC check is only for non-admin users with specific role assignments
    if (user.type !== "admin") {
      const permCheck = await requirePermission(userId, "schools.update");
      if (permCheck) return permCheck;
    }

    const body = await request.json();

    // Only update fields that exist in the schools schema
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.code !== undefined) updateData.code = body.code;
    if (body.schoolType !== undefined) updateData.schoolType = body.schoolType;
    if (body.level !== undefined) updateData.level = body.level;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail;
    if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    logger.info("Updating school", { route: "/api/schools/[id]", id, updateData });

    const [updatedSchool] = await db
      .update(schools)
      .set(updateData)
      .where(eq(schools.id, id))
      .returning();

    if (!updatedSchool) {
      return notFoundResponse("School");
    }

    return successResponse({ school: updatedSchool });
  },
  ['admin'] // Only admins can update schools
);

// ============================================================================
// DELETE /api/schools/[id] - Delete school
// ============================================================================

export const DELETE = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id } = await context!.params!;
    const { userId, user } = auth;

    // Platform admins (type: "admin") have all permissions - skip RBAC check
    if (user.type !== "admin") {
      const permCheck = await requirePermission(userId, "schools.delete");
      if (permCheck) return permCheck;
    }

    // Delete related records first (tables without cascade delete)
    // Note: Tables with cascade delete will be handled automatically by PostgreSQL

    // Delete fee payments for this school
    await db.delete(feePayments).where(eq(feePayments.schoolId, id));

    // Delete student fees for this school
    await db.delete(studentFees).where(eq(studentFees.schoolId, id));

    // Delete counselor resources for this school
    await db.delete(counselorResources).where(eq(counselorResources.schoolId, id));

    // Delete attendance records for this school
    await db.delete(attendance).where(eq(attendance.schoolId, id));

    // Delete leave requests for this school
    await db.delete(leaveRequests).where(eq(leaveRequests.schoolId, id));

    // Delete leave balances for this school
    await db.delete(leaveBalances).where(eq(leaveBalances.schoolId, id));

    // Finally delete the school (cascade will handle users, classes, etc.)
    await db.delete(schools).where(eq(schools.id, id));

    logger.info("School deleted successfully", { route: "/api/schools/[id]", method: "DELETE", schoolId: id, userId });

    return successResponse({ success: true });
  },
  ['admin'] // Only admins can delete schools
);
