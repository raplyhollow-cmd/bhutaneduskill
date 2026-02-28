/**
 * SCHOOL ADMIN DEPARTMENTS BY ID API
 *
 * PATCH /api/school-admin/departments/[id] - Update department
 * DELETE /api/school-admin/departments/[id] - Delete department
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { departments, subjects } from "@/lib/db/schema";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse, conflictResponse } from "@/lib/api/response-helpers";

// ============================================================================
// TYPES
// ============================================================================

interface DepartmentUpdateData {
  name?: string;
  code?: string;
  description?: string;
  headOfDepartment?: string;
  updatedAt: Date;
}

// PATCH /api/school-admin/departments/[id] - Update department
export const PATCH = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { user, userId } = auth;

    const permCheck = await requirePermission(userId, "departments.manage");
    if (permCheck) return permCheck;

    const params = await context.params;
    const departmentId = params.id;
    const body = await request.json();
    const { name, code, description, headOfDepartment } = body;

    // Get the department
    const deptRecords = await db
      .select()
      .from(departments)
      .where(eq(departments.id, departmentId))
      .limit(1);

    if (deptRecords.length === 0) {
      return notFoundResponse("Department");
    }

    const department = deptRecords[0];

    // Check school access (unless platform admin)
    if (user.type !== "admin" && department.schoolId !== user.schoolId) {
      return errorResponse("Access denied", 403);
    }

    // Check if code is being changed and if new code already exists
    if (code && code !== department.code) {
      const existing = await db
        .select()
        .from(departments)
        .where(and(eq(departments.code, code), eq(departments.schoolId, department.schoolId)))
        .limit(1);

      if (existing.length > 0) {
        return conflictResponse("Department code already exists");
      }
    }

    // Build update object
    const updateData: DepartmentUpdateData = {
      updatedAt: new Date(),
    };
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (headOfDepartment !== undefined) updateData.headOfDepartment = headOfDepartment;

    const [updatedDepartment] = await db
      .update(departments)
      .set(updateData)
      .where(eq(departments.id, departmentId))
      .returning();

    logger.info("Department updated", { userId, departmentId });

    return successResponse({ department: updatedDepartment });
  },
  ["school-admin", "admin"]
);

// DELETE /api/school-admin/departments/[id] - Delete department
export const DELETE = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { user, userId } = auth;

    const permCheck = await requirePermission(userId, "departments.manage");
    if (permCheck) return permCheck;

    const params = await context.params;
    const departmentId = params.id;

    // Get the department
    const deptRecords = await db
      .select()
      .from(departments)
      .where(eq(departments.id, departmentId))
      .limit(1);

    if (deptRecords.length === 0) {
      return notFoundResponse("Department");
    }

    const department = deptRecords[0];

    // Check school access (unless platform admin)
    if (user.type !== "admin" && department.schoolId !== user.schoolId) {
      return errorResponse("Access denied", 403);
    }

    // Delete associated subjects (they have departmentId foreign key)
    await db.delete(subjects).where(eq(subjects.departmentId, departmentId));

    // Delete department
    await db.delete(departments).where(eq(departments.id, departmentId));

    logger.info("Department deleted", { userId, departmentId, name: department.name });

    return successResponse({
      success: true,
      message: "Department deleted successfully",
    });
  },
  ["school-admin", "admin"]
);
