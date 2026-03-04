/**
 * SCHOOL DETAIL API
 *
 * GET /api/admin/schools/[id] - Get school details with users
 * DELETE /api/admin/schools/[id] - Delete a school
 * PATCH /api/admin/schools/[id] - Update school
 */

import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { schools, users, districts } from "@/lib/db/schema";
import { eq, and, count, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET - Fetch school details with users
 */
export const GET = createApiRoute(
  async (req: Request, auth, { params }: { params?: Promise<{ id: string }> }) => {
    const { id } = await params!;

    // Fetch school with district info
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
        state: schools.state,
        country: schools.country,
        postalCode: schools.postalCode,
        districtId: schools.districtId,
        isActive: schools.isActive,
        subscriptionStatus: schools.subscriptionStatus,
        subscriptionTier: schools.subscriptionTier,
        activatedAt: schools.activatedAt,
        setupComplete: schools.setupComplete,
        setupCompletedAt: schools.setupCompletedAt,
        principalName: schools.principalName,
        principalEmail: schools.principalEmail,
        principalPhone: schools.principalPhone,
        establishedYear: schools.establishedYear,
        accreditationStatus: schools.accreditationStatus,
        maxStudents: schools.maxStudents,
        campusSize: schools.campusSize,
        facilities: schools.facilities,
        board: schools.board,
        counselorName: schools.counselorName,
        counselorEmail: schools.counselorEmail,
        counselorPhone: schools.counselorPhone,
        vicePrincipalName: schools.vicePrincipalName,
        logo: schools.logo,
        website: schools.website,
        createdAt: schools.createdAt,
        updatedAt: schools.updatedAt,
        districtName: districts.name,
      })
      .from(schools)
      .leftJoin(districts, eq(schools.districtId, districts.id))
      .where(eq(schools.id, id))
      .limit(1);

    if (schoolResult.length === 0) {
      return { error: "School not found", status: 404 };
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

    return {
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
  },
  ["admin"]
);

/**
 * DELETE - Delete a school
 */
export const DELETE = createApiRoute(
  async (req: Request, auth, { params }: { params?: Promise<{ id: string }> }) => {
    const { userId } = auth;
    const { id } = await params!;

    // Check if school exists
    const school = await db
      .select()
      .from(schools)
      .where(eq(schools.id, id))
      .limit(1);

    if (school.length === 0) {
      return { error: "School not found", status: 404 };
    }

    // Check if school has users
    const userCount = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.schoolId, id));

    if ((userCount[0]?.count || 0) > 0) {
      return {
        error: "Cannot delete school with associated users. Please reassign or delete users first.",
        status: 400,
      };
    }

    // Delete the school
    await db.delete(schools).where(eq(schools.id, id));

    logger.info("School deleted", { schoolId: id, deletedBy: userId });

    return { success: true, message: "School deleted successfully" };
  },
  ["admin"]
);

/**
 * PATCH - Update school
 */
export const PATCH = createApiRoute(
  async (req: Request, auth, { params }: { params?: Promise<{ id: string }> }) => {
    const { userId } = auth;
    const { id } = await params!;
    const body = await req.json();

    // Check if school exists
    const school = await db
      .select()
      .from(schools)
      .where(eq(schools.id, id))
      .limit(1);

    if (school.length === 0) {
      return { error: "School not found", status: 404 };
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

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return { error: "No valid fields to update", status: 400 };
    }

    updateData.updatedAt = new Date();

    await db
      .update(schools)
      .set(updateData)
      .where(eq(schools.id, id));

    logger.info("School updated", { schoolId: id, updatedBy: userId });

    return { success: true, message: "School updated successfully" };
  },
  ["admin"]
);
