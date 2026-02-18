import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { medicalRecords, vaccinationRecords, studentAllergies, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/student/medical - Get student's medical records summary
 *
 * Returns:
 * - Recent medical visits
 * - Vaccination records
 * - Known allergies/conditions
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'parent', 'school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user, userId } = authResult;
    const { searchParams } = new URL(request.url);

    // Determine which student's records to fetch
    let targetStudentId = userId;
    if (user.type === 'parent') {
      // Parents can view their children's records
      const childId = searchParams.get('studentId');
      if (childId) {
        // Verify the child belongs to this parent
        const child = await db.query.users.findFirst({
          where: and(eq(users.id, childId), eq(users.parentId, userId)),
        });
        if (child) {
          targetStudentId = childId;
        }
      }
    } else if (user.type === 'school-admin' || user.type === 'admin') {
      // Admins can view specific student's records
      const studentId = searchParams.get('studentId');
      if (studentId) {
        targetStudentId = studentId;
      }
    }

    // Fetch medical records
    const medicalHistory = await db.query.medicalRecords.findMany({
      where: eq(medicalRecords.studentId, targetStudentId),
      orderBy: [desc(medicalRecords.visitDate)],
      limit: 20,
    });

    // Fetch vaccination records
    const vaccinations = await db.query.vaccinationRecords.findMany({
      where: eq(vaccinationRecords.studentId, targetStudentId),
      orderBy: [desc(vaccinationRecords.administrationDate)],
    });

    // Fetch allergies and conditions
    const allergies = await db.query.studentAllergies.findMany({
      where: and(eq(studentAllergies.studentId, targetStudentId), eq(studentAllergies.isActive, true)),
    });

    return NextResponse.json({
      success: true,
      data: {
        studentId: targetStudentId,
        medicalHistory,
        vaccinations,
        allergies,
        summary: {
          totalVisits: medicalHistory.length,
          emergencyVisits: medicalHistory.filter(v => v.isEmergency).length,
          totalVaccinations: vaccinations.length,
          knownAllergies: allergies.filter(a => a.allergenType === 'food' || a.allergenType === 'medication').length,
          chronicConditions: allergies.filter(a => a.conditionType !== null).length,
        },
      },
    });
  } catch (error) {
    logger.error("Student medical records fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch medical records" }, { status: 500 });
  }
}
