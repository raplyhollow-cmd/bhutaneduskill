/**
 * SETTINGS STATUS API
 *
 * GET /api/school-admin/settings/status
 *
 * Returns the school's setup status, basic settings, and available grades
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schools, classes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, notFoundResponse } from "@/lib/api/response-helpers";
import { sql } from "drizzle-orm";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;

    if (!user.schoolId) {
      return successResponse({ setupComplete: false });
    }

    // Get school data
    const schoolResult = await db
      .select()
      .from(schools)
      .where(eq(schools.id, user.schoolId))
      .limit(1);

    if (schoolResult.length === 0) {
      return notFoundResponse("School");
    }

    const school = schoolResult[0];

    // Get distinct grades from classes to determine school type (PP vs regular)
    const classesResult = await db
      .selectDistinct({
        grade: classes.grade,
      })
      .from(classes)
      .where(eq(classes.schoolId, user.schoolId));

    // Convert numeric grades to string format (PP, 1-12)
    const grades = classesResult.map(c => {
      if (c.grade === 0) return "PP";
      return String(c.grade);
    });

    return successResponse({
      setupComplete: school.setupComplete || false,
      schoolId: school.id,
      name: school.name,
      code: school.code,
      email: school.email,
      phone: school.phone,
      address: school.address,
      city: school.city,
      website: school.website,
      grades, // Available grades for dynamic wizard display
    });
  },
  ["school-admin"]
);
