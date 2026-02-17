/**
 * MINISTRY SCHOOLS API
 * GET /api/ministry/schools - List all schools with filtering
 * PATCH /api/ministry/schools/bulk-status - Update status of multiple schools
 *
 * Provides school management for Ministry of Education:
 * - List all schools with search and filter
 * - Update school status (active, inactive, suspended)
 * - Bulk status operations
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { schools, users } from "@/lib/db/schema";
import { eq, or, like, desc, inArray, and, count, sql } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

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

export async function GET(req: NextRequest) {
  try {
    // Authenticate and authorize - only ministry and admin users can access
    const authResult = await requireAuth(["ministry", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } as ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

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

    // Enrich with student and teacher counts
    const enrichedSchools: SchoolListResponse[] = await Promise.all(
      schoolList.map(async (school) => {
        // Get student count
        const studentCount = await db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              eq(users.schoolId, school.id),
              eq(users.type, "student"),
              eq(users.isActive, true)
            )
          );

        // Get teacher count
        const teacherCount = await db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              eq(users.schoolId, school.id),
              eq(users.type, "teacher"),
              eq(users.isActive, true)
            )
          );

        return {
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
          students: studentCount[0]?.count || 0,
          teachers: teacherCount[0]?.count || 0,
          createdAt: school.createdAt,
        };
      })
    );

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
  } catch (error) {
    logger.apiError(error, { route: "/api/ministry/schools", method: "GET" });

    return NextResponse.json(
      {
        error: "Failed to fetch schools",
        status: 500,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH HANDLER - Bulk Status Update
// ============================================================================

export async function PATCH(req: NextRequest) {
  try {
    // Authenticate and authorize - only ministry users can access
    const authResult = await requireAuth(["ministry", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } as ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    const body = await req.json();
    const { schoolIds, status } = body as BulkStatusRequest;

    if (!schoolIds || !Array.isArray(schoolIds) || schoolIds.length === 0) {
      return NextResponse.json(
        { error: "schoolIds is required and must be a non-empty array", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    if (!status || !["active", "inactive", "suspended"].includes(status)) {
      return NextResponse.json(
        { error: "status must be one of: active, inactive, suspended", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
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
  } catch (error) {
    logger.apiError(error, { route: "/api/ministry/schools", method: "PATCH" });

    return NextResponse.json(
      {
        error: "Failed to update school status",
        status: 500,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
