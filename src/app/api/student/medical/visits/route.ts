import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { medicalRecords } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET /api/student/medical/visits - Get medical visit history
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

    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Use db.select instead of db.query (neon-http compatible)
    const visits = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.studentId, targetStudentId))
      .orderBy(desc(medicalRecords.visitDate))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: { visits },
    };
  },
  ["student", "parent", "school-admin", "admin"]
);
