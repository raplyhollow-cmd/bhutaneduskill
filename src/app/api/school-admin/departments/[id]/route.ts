import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { departments, subjects } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";

interface DepartmentUpdateData {
  name?: string;
  code?: string;
  description?: string;
  headOfDepartment?: string;
  updatedAt: Date;
}

// PATCH /api/school-admin/departments/[id] - Update department
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(["school-admin", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user, userId } = authResult;

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
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const department = deptRecords[0];

    // Check school access (unless platform admin)
    if (user.type !== "admin" && department.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if code is being changed and if new code already exists
    if (code && code !== department.code) {
      const existing = await db
        .select()
        .from(departments)
        .where(and(eq(departments.code, code), eq(departments.schoolId, department.schoolId)))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json({ error: "Department code already exists" }, { status: 400 });
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

    return NextResponse.json({ department: updatedDepartment });
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/departments/[id]", method: "PATCH" });
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}

// DELETE /api/school-admin/departments/[id] - Delete department
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(["school-admin", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user, userId } = authResult;

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
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const department = deptRecords[0];

    // Check school access (unless platform admin)
    if (user.type !== "admin" && department.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete associated subjects (they have departmentId foreign key)
    await db.delete(subjects).where(eq(subjects.departmentId, departmentId));

    // Delete department
    await db.delete(departments).where(eq(departments.id, departmentId));

    logger.info("Department deleted", { userId, departmentId, name: department.name });

    return NextResponse.json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/departments/[id]", method: "DELETE" });
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}
