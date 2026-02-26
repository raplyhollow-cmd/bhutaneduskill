import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, schools } from "@/lib/db/schema";
import { getCapacityStatus } from "@/lib/billing-utils";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

// GET /api/school-admin/capacity - Get current school's seat capacity status
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    const schoolId = user.schoolId;
    if (!schoolId) {
      return { error: "School ID not found for user" };
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

    return {
      data: {
        ...capacityInfo,
        schoolName: school?.name,
        subscriptionTier: school?.subscriptionTier,
      }
    };
  },
  ['school-admin']
);