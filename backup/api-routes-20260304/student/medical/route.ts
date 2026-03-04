/**
 * Student Medical Records API
 *
 * GET /api/student/medical - Get student's medical records summary
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 *
 * Returns:
 * - Recent medical visits
 * - Vaccination records
 * - Known allergies/conditions
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { medicalRecords, vaccinationRecords, studentAllergies, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET /api/student/medical - Get student's medical records summary
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user, userId } = auth;
    const { searchParams } = new URL(request.url);

    // Determine which student's records to fetch
    let targetStudentId = userId;
    if (user.type === 'parent') {
      // Parents can view their children's records
      const childId = searchParams.get('studentId');
      if (childId) {
        // Verify the child belongs to this parent using db.select (neon-http compatible)
        const childResult = await db
          .select()
          .from(users)
          .where(and(eq(users.id, childId), eq(users.parentId, userId)))
          .limit(1);
        const child = childResult[0];
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

    // Fetch medical records using db.select (neon-http compatible)
    const medicalHistory = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.studentId, targetStudentId))
      .orderBy(desc(medicalRecords.visitDate))
      .limit(20);

    // Fetch vaccination records using db.select (neon-http compatible)
    const vaccinations = await db
      .select()
      .from(vaccinationRecords)
      .where(eq(vaccinationRecords.studentId, targetStudentId))
      .orderBy(desc(vaccinationRecords.administrationDate));

    // Fetch allergies and conditions using db.select (neon-http compatible)
    const allergies = await db
      .select()
      .from(studentAllergies)
      .where(and(eq(studentAllergies.studentId, targetStudentId), eq(studentAllergies.isActive, true)));

    return {
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
    };
  },
  ['student', 'parent', 'school-admin', 'admin']
);
