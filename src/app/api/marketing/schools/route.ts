/**
 * MARKETING SCHOOLS API
 *
 * GET /api/marketing/schools - Get schools for marketing display
 *
 * Returns schools ordered by student count (most active first)
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schools, users } from "@/lib/db/schema";
import { desc, count, eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { successResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest) => {
    // Get schools with student counts
    const schoolsData = await db
      .select({
        id: schools.id,
        name: schools.name,
        schoolType: schools.schoolType,
        level: schools.level,
        city: schools.city,
        createdAt: schools.createdAt,
      })
      .from(schools)
      .orderBy(desc(schools.createdAt))
      .limit(8);

    // Format schools for display
    const formattedSchools = await Promise.all(
      schoolsData.map(async (school) => {
        // Get student count for this school
        const studentCountResult = await db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              eq(users.schoolId, school.id),
              eq(users.type, "student")
            )
          );

        return {
          id: school.id,
          name: school.name || "Unknown School",
          students: studentCountResult[0]?.count || 0,
        };
      })
    );

    return successResponse({ schools: formattedSchools });
  },
  [] // Open endpoint - no auth required
);
