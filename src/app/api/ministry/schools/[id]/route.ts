/**
 * MINISTRY SCHOOL DETAIL API
 * GET /api/ministry/schools/[id] - Get single school details
 * PATCH /api/ministry/schools/[id] - Update school status
 * DELETE /api/ministry/schools/[id] - Delete a school
 *
 * Provides individual school management for Ministry of Education
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { schools, users, assessments } from "@/lib/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import { createApiRoute } from "@/lib/api/route-handler";

// ============================================================================
// TYPES
// ============================================================================

interface MinistrySchoolParams extends Record<string, unknown> {
  id: string;
}

type SchoolStatus = "active" | "inactive" | "suspended";

interface SchoolDetailResponse {
  id: string;
  name: string;
  code: string;
  state: string;
  city: string;
  schoolType: string | null;
  level: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string;
  isActive: boolean;
  students: number;
  teachers: number;
  counselors: number;
  assessments: number;
  principalName: string;
  principalEmail: string;
  principalPhone: string;
  establishedYear: number;
  createdAt: Date;
  updatedAt: Date;
}

interface StatusUpdateRequest {
  status: SchoolStatus;
  reason?: string;
}

// ============================================================================
// GET HANDLER - Get School Details
// ============================================================================

export const GET = createApiRoute<MinistrySchoolParams>(
  async (req: NextRequest, auth, context) => {
    const { userId } = auth;
    const { id } = await context!.params;

    logger.info("Ministry school detail accessed", {
      route: "/api/ministry/schools/[id]",
      userId,
      schoolId: id,
    });

    // Fetch school
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, id))
      .limit(1);

    if (!school) {
      return { error: "School not found", status: 404 };
    }

    // Get student count
    const studentCount = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(eq(users.schoolId, id), eq(users.type, "student"), eq(users.isActive, true))
      );

    // Get teacher count
    const teacherCount = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(eq(users.schoolId, id), eq(users.type, "teacher"), eq(users.isActive, true))
      );

    // Get counselor count
    const counselorCount = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(eq(users.schoolId, id), eq(users.type, "counselor"), eq(users.isActive, true))
      );

    // Get assessment count
    const assessmentCount = await db
      .select({ count: count() })
      .from(assessments)
      .innerJoin(users, eq(assessments.userId, users.id))
      .where(eq(users.schoolId, id));

    const response: SchoolDetailResponse = {
      id: school.id,
      name: school.name,
      code: school.code,
      state: school.state || "",
      city: school.city || "",
      schoolType: school.schoolType,
      level: school.level,
      contactEmail: school.contactEmail,
      contactPhone: school.contactPhone,
      address: school.address,
      isActive: school.isActive ?? false,
      students: studentCount[0]?.count || 0,
      teachers: teacherCount[0]?.count || 0,
      counselors: counselorCount[0]?.count || 0,
      assessments: assessmentCount[0]?.count || 0,
      principalName: school.principalName,
      principalEmail: school.principalEmail,
      principalPhone: school.principalPhone,
      establishedYear: school.establishedYear,
      createdAt: school.createdAt,
      updatedAt: school.updatedAt,
    };

    logger.info("Ministry school detail retrieved successfully", {
      route: "/api/ministry/schools/[id]",
      userId,
      schoolId: id,
    });

    return { data: response };
  },
  ["ministry", "admin"]
);

// ============================================================================
// PATCH HANDLER - Update School Status
// ============================================================================

export const PATCH = createApiRoute<MinistrySchoolParams>(
  async (req: NextRequest, auth, context) => {
    const { userId } = auth;
    const { id } = await context!.params;

    const body = await req.json();
    const { status, reason } = body as StatusUpdateRequest;

    if (!status || !["active", "inactive", "suspended"].includes(status)) {
      return {
        error: "status must be one of: active, inactive, suspended",
        status: 400
      };
    }

    logger.info("Ministry school status update", {
      route: "/api/ministry/schools/[id]",
      userId,
      schoolId: id,
      status,
      reason,
    });

    // Check if school exists
    const [existingSchool] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, id))
      .limit(1);

    if (!existingSchool) {
      return { error: "School not found", status: 404 };
    }

    // For "suspended" and "inactive", we set isActive to false
    const isActiveValue = status === "active";

    const [updatedSchool] = await db
      .update(schools)
      .set({
        isActive: isActiveValue,
        updatedAt: new Date(),
      })
      .where(eq(schools.id, id))
      .returning();

    logger.info("Ministry school status updated successfully", {
      route: "/api/ministry/schools/[id]",
      userId,
      schoolId: id,
      oldStatus: existingSchool.isActive ? "active" : "inactive",
      newStatus: status,
    });

    return {
      data: {
        school: updatedSchool,
        message: `School status updated to ${status}`,
      }
    };
  },
  ["ministry", "admin"]
);

// ============================================================================
// DELETE HANDLER - Delete School
// ============================================================================

export const DELETE = createApiRoute<MinistrySchoolParams>(
  async (req: NextRequest, auth, context) => {
    const { userId } = auth;
    const { id } = await context!.params;

    logger.info("Ministry school deletion requested", {
      route: "/api/ministry/schools/[id]",
      userId,
      schoolId: id,
    });

    // Check if school exists
    const [existingSchool] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, id))
      .limit(1);

    if (!existingSchool) {
      return { error: "School not found", status: 404 };
    }

    // Check if school has active users (students, teachers, etc.)
    const userCounts = await db
      .select({ count: count(), type: users.type })
      .from(users)
      .where(eq(users.schoolId, id))
      .groupBy(users.type);

    const totalUsers = userCounts.reduce((sum, uc) => sum + (uc.count || 0), 0);

    if (totalUsers > 0) {
      logger.security("school_deletion_blocked_active_users", {
        userId,
        schoolId: id,
        totalUsers,
      });

      return {
        error: "Cannot delete school with active users",
        status: 400,
        details: `This school has ${totalUsers} associated users. Please deactivate the school or reassign users first.`,
      };
    }

    // Delete the school
    await db.delete(schools).where(eq(schools.id, id));

    logger.security("school_deleted", {
      userId,
      schoolId: id,
      schoolName: existingSchool.name,
    });

    return {
      data: {
        success: true,
        message: "School deleted successfully",
        deletedSchool: {
          id: existingSchool.id,
          name: existingSchool.name,
          code: existingSchool.code,
        },
      }
    };
  },
  ["ministry", "admin"]
);
