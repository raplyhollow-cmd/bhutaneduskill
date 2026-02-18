import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { vaccinationRecords } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/student/medical/vaccinations - Get vaccination records
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

    const vaccinations = await db.query.vaccinationRecords.findMany({
      where: eq(vaccinationRecords.studentId, targetStudentId),
      orderBy: [desc(vaccinationRecords.administrationDate)],
    });

    return NextResponse.json({
      success: true,
      data: { vaccinations },
    });
  } catch (error) {
    logger.error("Vaccination records fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch vaccination records" }, { status: 500 });
  }
}
