import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools, users, classes, feePayments, studentFees, counselorResources, attendance, leaveRequests, leaveBalances } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";

// GET /api/schools/[id] - Get single school
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await requireAuth();
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // Check schools.read permission
    const permCheck = await requirePermission(userId, "schools.read");
    if (permCheck) return permCheck;

    const school = await db.query.schools.findFirst({
      where: eq(schools.id, id),
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({ school });
  } catch (error) {
    logger.error("School fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch school" }, { status: 500 });
  }
}

// PUT /api/schools/[id] - Update school
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // Check schools.update permission - platform admins have all permissions
    const permCheck = await requirePermission(userId, "schools.update");
    if (permCheck) return permCheck;

    const body = await request.json();

    // Only update fields that exist in the schools schema
    const updateData: Record<string, any> = {};
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
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({ school: updatedSchool });
  } catch (error) {
    logger.apiError(error, { route: "/api/schools/[id]", method: "PUT" });
    return NextResponse.json({ error: "Failed to update school" }, { status: 500 });
  }
}

// DELETE /api/schools/[id] - Delete school
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // Check schools.delete permission
    const permCheck = await requirePermission(userId, "schools.delete");
    if (permCheck) return permCheck;

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

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("School delete error:", error);
    return NextResponse.json({ error: "Failed to delete school" }, { status: 500 });
  }
}
