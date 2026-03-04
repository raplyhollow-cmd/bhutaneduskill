/**
 * SCHOOL ADMIN CLASSES API
 *
 * GET /api/school-admin/classes - Fetch classes for the school admin's school
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, classes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, notFoundResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/school-admin/classes
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    // Auth is provided by createApiRoute wrapper
    const { userId } = auth;

    // Get school admin's school ID using db.select()
    const adminResult = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const admin = adminResult[0];

    if (!admin?.schoolId) {
      return notFoundResponse("School");
    }

    // Fetch active classes for this school using db.select()
    const schoolClasses = await db
      .select()
      .from(classes)
      .where(eq(classes.schoolId, admin.schoolId))
      .orderBy(classes.grade, classes.section);

    logger.info("Fetched classes for school admin", {
      schoolId: admin.schoolId,
      count: schoolClasses.length,
    });

    return successResponse({ classes: schoolClasses });
  },
  ['school-admin', 'admin']
);
