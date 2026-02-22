import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, schools } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { getCapacityStatus } from "@/lib/billing-utils";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// GET /api/school-admin/capacity - Get current school's seat capacity status
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId, user } = authResult;

    const schoolId = user.schoolId;
    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID not found for user", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get capacity status from billing utils
    const capacityInfo = await getCapacityStatus(schoolId);

    // Get school info for additional context
    const [school] = await db
      .select({
        subscriptionTier: schools.subscriptionTier,
        maxStudents: schools.maxStudents,
        name: schools.name,
      })
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    logger.info("Capacity status fetched", {
      schoolId,
      userId,
      usagePercentage: capacityInfo.usagePercentage,
    });

    return NextResponse.json({
      data: {
        ...capacityInfo,
        schoolName: school?.name,
        subscriptionTier: school?.subscriptionTier,
      },
    } satisfies ApiSuccess<typeof capacityInfo & { schoolName?: string; subscriptionTier?: string }>);

  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/capacity", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch capacity status", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
