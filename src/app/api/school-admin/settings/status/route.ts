/**
 * SETTINGS STATUS API
 *
 * GET /api/school-admin/settings/status
 *
 * Returns the school's setup status and basic settings
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, notFoundResponse } from "@/lib/api/response-helpers";

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
    });
  },
  ["school-admin"]
);
