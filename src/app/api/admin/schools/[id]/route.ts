/**
 * SCHOOL DETAIL API
 *
 * GET /api/admin/schools/[id] - Get school details with users
 * DELETE /api/admin/schools/[id] - Delete a school
 * PATCH /api/admin/schools/[id] - Update school
 */

import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { schools, users, tenants, districts } from "@/lib/db/schema";
import { eq, and, count, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET - Fetch school details with users
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status === 401 ? 401 : 403 }
      );
    }

    const { id } = await params;

    // Fetch school with tenant and district info
    const schoolResult = await db
      .select({
        id: schools.id,
        name: schools.name,
        code: schools.code,
        schoolType: schools.schoolType,
        level: schools.level,
        contactEmail: schools.contactEmail,
        contactPhone: schools.contactPhone,
        address: schools.address,
        city: schools.city,
        districtId: schools.districtId,
        tenantId: schools.tenantId,
        isActive: schools.isActive,
        createdAt: schools.createdAt,
        tenantName: tenants.name,
        districtName: districts.name,
      })
      .from(schools)
      .leftJoin(tenants, eq(schools.tenantId, tenants.id))
      .leftJoin(districts, eq(schools.districtId, districts.id))
      .where(eq(schools.id, id))
      .limit(1);

    if (schoolResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "School not found" },
        { status: 404 }
      );
    }

    const school = schoolResult[0];

    // Get user counts
    const [students, teachers, counselors] = await Promise.all([
      db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.schoolId, id), eq(users.type, "student"))),
      db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.schoolId, id), eq(users.type, "teacher"))),
      db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.schoolId, id), eq(users.type, "counselor"))),
    ]);

    // Get recent users (limit 10)
    const schoolUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        type: users.type,
        role: users.role,
      })
      .from(users)
      .where(eq(users.schoolId, id))
      .orderBy(desc(users.createdAt))
      .limit(10);

    const response = {
      success: true,
      data: {
        ...school,
        stats: {
          students: students[0]?.count || 0,
          teachers: teachers[0]?.count || 0,
          counselors: counselors[0]?.count || 0,
        },
        users: schoolUsers,
      },
    };

    return NextResponse.json(response.data);
  } catch (error) {
    logger.error("Failed to fetch school details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch school details" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a school
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status === 401 ? 401 : 403 }
      );
    }

    const { userId } = authResult;
    const { id } = await params;

    // Check if school exists
    const school = await db
      .select()
      .from(schools)
      .where(eq(schools.id, id))
      .limit(1);

    if (school.length === 0) {
      return NextResponse.json(
        { success: false, error: "School not found" },
        { status: 404 }
      );
    }

    // Check if school has users
    const userCount = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.schoolId, id));

    if ((userCount[0]?.count || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete school with associated users. Please reassign or delete users first.",
        },
        { status: 400 }
      );
    }

    // Delete the school
    await db.delete(schools).where(eq(schools.id, id));

    logger.info("School deleted", { schoolId: id, deletedBy: userId });

    return NextResponse.json({ success: true, message: "School deleted successfully" });
  } catch (error) {
    logger.error("Failed to delete school:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete school" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update school
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status === 401 ? 401 : 403 }
      );
    }

    const { userId } = authResult;
    const { id } = await params;
    const body = await req.json();

    // Check if school exists
    const school = await db
      .select()
      .from(schools)
      .where(eq(schools.id, id))
      .limit(1);

    if (school.length === 0) {
      return NextResponse.json(
        { success: false, error: "School not found" },
        { status: 404 }
      );
    }

    // Update allowed fields only
    const allowedFields = [
      "name",
      "code",
      "schoolType",
      "level",
      "contactEmail",
      "contactPhone",
      "address",
      "city",
      "districtId",
      "isActive",
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updateData.updatedAt = new Date();

    await db
      .update(schools)
      .set(updateData)
      .where(eq(schools.id, id));

    logger.info("School updated", { schoolId: id, updatedBy: userId });

    return NextResponse.json({ success: true, message: "School updated successfully" });
  } catch (error) {
    logger.error("Failed to update school:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update school" },
      { status: 500 }
    );
  }
}
