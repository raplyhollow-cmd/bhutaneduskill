/**
 * GLOBAL SUBJECTS API
 *
 * GET /api/subjects/global - Get all global subject templates (for dropdown)
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { subjects } from "@/lib/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest) => {
    // Fetch all global subject templates (school_id IS NULL)
    const globalSubjects = await db
      .select({
        id: subjects.id,
        code: subjects.code,
        name: subjects.name,
        type: subjects.type,
        grade: subjects.grade,
        description: subjects.description,
      })
      .from(subjects)
      .where(isNull(subjects.schoolId))
      .orderBy(subjects.name, subjects.grade);

    return successResponse({ subjects: globalSubjects });
  },
  ['admin', 'school-admin']
);
