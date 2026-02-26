/**
 * MINISTRY SCHOOLS API
 * GET /api/ministry/schools - List all schools with filtering
 * PATCH /api/ministry/schools/bulk-status - Update status of multiple schools
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 *
 * Provides school management for Ministry of Education:
 * - List all schools with search and filter
 * - Update school status (active, inactive, suspended)
 * - Bulk status operations
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { schools, users } from "@/lib/db/schema";
import { eq, or, like, desc, inArray, and, count, sql } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";

// ============================================================================
// TYPES
// ============================================================================

type SchoolStatus = "active" | "inactive" | "suspended";

interface SchoolListResponse {
  id: string;
  name: string;
  code: string;
  state: string;
  city: string;
  schoolType: string | null;
  level: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
  students?: number;
  teachers?: number;
  createdAt: Date;
}

interface BulkStatusRequest {
  schoolIds: string[];
  status: SchoolStatus;
}

interface BulkStatusResponse {
  success: boolean;
  updated: number;
  failed: number;
  errors?: Array<{ schoolId: string; error: string }>;
}

// ============================================================================
// GET HANDLER - List Schools
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest) => {
    const auth = getAuth(req);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const district = searchParams.get("district");
    const schoolType = searchParams.get("schoolType");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    logger.info("Ministry schools list accessed", {
      route: "/api/ministry/schools",
      userId,
      filters: { search, status, district, schoolType },
    });

    // Build query conditions
    const conditions: Array<ReturnType<typeof like | typeof eq>> = [];

    if (search) {
      conditions.push(
        or(
          like(schools.name, `%${search}%`),
          like(schools.code, `%${search}%`)
        )!
      );
    }

    if (status === "active") {
      conditions.push(eq(schools.isActive, true));
    } else if (status === "inactive") {
      conditions.push(eq(schools.isActive, false));
    }

    if (district) {
      conditions.push(eq(schools.state, district));
    }

    if (schoolType) {
      conditions.push(eq(schools.schoolType, schoolType));
    }

    // Fetch schools with counts
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const schoolList = await db.query.schools.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: desc(schools.createdAt),
    });

    // OPTIMIZATION: Batch fetch student and teacher counts instead of N queries
    const schoolIds = schoolList.map((s) => s.id);

    // Batch fetch student counts
    const studentCounts = await db
      .select({
        schoolId: users.schoolId,
        count: count(),
      })
      .from(users)
      .where(
        and(
          sql`${users.schoolId} IN ${sql.raw(`('${schoolIds.join("','")}')`)}`,
          eq(users.type, "student"),
          eq(users.isActive, true)
        )
      )
      .groupBy(users.schoolId);

    const studentCountMap = new Map(
      studentCounts.map((c) => [c.schoolId || "", c.count])
    );

    // Batch fetch teacher counts
    const teacherCounts = await db
      .select({
        schoolId: users.schoolId,
        count: count(),
      })
      .from(users)
      .where(
        and(
          sql`${users.schoolId} IN ${sql.raw(`('${schoolIds.join("','")}')`)}`,
          eq(users.type, "teacher"),
          eq(users.isActive, true)
        )
      )
      .groupBy(users.schoolId);

    const teacherCountMap = new Map(
      teacherCounts.map((c) => [c.schoolId || "", c.count])
    );

    // Enrich with batched counts (no more queries!)
    const enrichedSchools: SchoolListResponse[] = schoolList.map((school) => ({
      id: school.id,
      name: school.name,
      code: school.code,
      state: school.state || "",
      city: school.city || "",
      schoolType: school.schoolType,
      level: school.level,
      contactEmail: school.contactEmail,
      contactPhone: school.contactPhone,
      isActive: school.isActive ?? false,
      students: studentCountMap.get(school.id) || 0,
      teachers: teacherCountMap.get(school.id) || 0,
      createdAt: school.createdAt,
    }));

    // Get total count for pagination
    const totalCount = await db
      .select({ count: count() })
      .from(schools)
      .where(whereClause);

    logger.info("Ministry schools list retrieved successfully", {
      route: "/api/ministry/schools",
      userId,
      count: enrichedSchools.length,
    });

    return NextResponse.json({
      data: {
        schools: enrichedSchools,
        total: totalCount[0]?.count || 0,
        limit,
        offset,
      },
      status: 200,
    } satisfies ApiSuccess<{ schools: SchoolListResponse[]; total: number; limit: number; offset: number }>);
  },
  ['ministry', 'admin']
);

// ============================================================================
// PATCH HANDLER - Bulk Status Update
// ============================================================================

export const PATCH = createApiRoute(
  async (req: NextRequest) => {
    const auth = getAuth(req);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    const body = await req.json();
    const { schoolIds, status } = body as BulkStatusRequest;

    if (!schoolIds || !Array.isArray(schoolIds) || schoolIds.length === 0) {
      return badRequestResponse("schoolIds is required and must be a non-empty array");
    }

    if (!status || !["active", "inactive", "suspended"].includes(status)) {
      return badRequestResponse("status must be one of: active, inactive, suspended");
    }

    logger.info("Ministry bulk school status update", {
      route: "/api/ministry/schools",
      userId,
      schoolIds: schoolIds.length,
      status,
    });

    // For "suspended" and "inactive", we set isActive to false
    // We could add a separate "status" column to the schema for more granular control
    const isActiveValue = status === "active";

    // Update all schools
    let updated = 0;
    const errors: Array<{ schoolId: string; error: string }> = [];

    for (const schoolId of schoolIds) {
      try {
        const result = await db
          .update(schools)
          .set({
            isActive: isActiveValue,
            updatedAt: new Date(),
          })
          .where(eq(schools.id, schoolId))
          .returning();

        if (result.length > 0) {
          updated++;
        } else {
          errors.push({ schoolId, error: "School not found" });
        }
      } catch (error) {
        errors.push({ schoolId, error: String(error) });
      }
    }

    const response: BulkStatusResponse = {
      success: errors.length === 0,
      updated,
      failed: errors.length,
      ...(errors.length > 0 && { errors }),
    };

    logger.info("Ministry bulk school status update completed", {
      route: "/api/ministry/schools",
      userId,
      updated,
      failed: errors.length,
    });

    return NextResponse.json({
      data: response,
      status: 200,
    } satisfies ApiSuccess<BulkStatusResponse>);
  },
  ['ministry', 'admin']
);
