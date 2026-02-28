import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vaccinationRecords } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET /api/student/medical/vaccinations - Get vaccination records
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user, userId } = auth;
    const { searchParams } = new URL(request.url);

    let targetStudentId = userId;
    if (user.type === 'parent') {
      const childId = searchParams.get('studentId');
      if (childId) targetStudentId = childId;
    } else if (user.type === 'school-admin' || user.type === 'admin') {
      const studentId = searchParams.get('studentId');
      if (studentId) targetStudentId = studentId;
    }

    const vaccinations = await db
      .select()
      .from(vaccinationRecords)
      .where(eq(vaccinationRecords.studentId, targetStudentId))
      .orderBy(desc(vaccinationRecords.administrationDate));

    return {
      success: true,
      data: { vaccinations },
    };
  },
  ["student", "parent", "school-admin", "admin"]
);
