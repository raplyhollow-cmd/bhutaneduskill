import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { medicalRecords } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/student/medical/visits - Get medical visit history
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'parent', 'school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user, userId } = authResult;
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

    const visits = await db.query.medicalRecords.findMany({
      where: eq(medicalRecords.studentId, targetStudentId),
      orderBy: [desc(medicalRecords.visitDate)],
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: { visits },
    });
  } catch (error) {
    logger.error("Medical visits fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
  }
}
