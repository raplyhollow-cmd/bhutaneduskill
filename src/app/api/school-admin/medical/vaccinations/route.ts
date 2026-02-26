import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { vaccinationRecords } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

type VaccinationCondition = ReturnType<typeof eq> | ReturnType<typeof sql>;

/**
 * GET /api/school-admin/medical/vaccinations - Get vaccination records
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);

    const studentId = searchParams.get('studentId');
    const vaccineType = searchParams.get('vaccineType');
    const upcoming = searchParams.get('upcoming') === 'true';

    let whereConditions: VaccinationCondition[] = [eq(vaccinationRecords.schoolId, user.schoolId!)];

    if (studentId) {
      whereConditions.push(eq(vaccinationRecords.studentId, studentId));
    }
    if (vaccineType) {
      whereConditions.push(eq(vaccinationRecords.vaccineType, vaccineType));
    }
    if (upcoming) {
      const today = new Date();
      whereConditions.push(sql`${vaccinationRecords.nextDoseDue} > ${today}`);
    }

    const vaccinations = await db.query.vaccinationRecords.findMany({
      where: whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0],
      with: {
        student: true,
      },
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

/**
 * POST /api/school-admin/medical/vaccinations - Add vaccination record
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user, userId } = authResult;
    const body = await request.json();

    const {
      studentId,
      vaccineName,
      vaccineType,
      manufacturer,
      batchNumber,
      lotNumber,
      administrationDate,
      administrationSite,
      doseNumber,
      requiresFollowUp,
      nextDoseDue,
      certificateNumber,
      isSchoolProvided,
      notes,
    } = body;

    if (!studentId || !vaccineName || !vaccineType || !administrationDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const vaccinationId = `vax-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const [newVaccination] = await db.insert(vaccinationRecords).values({
      id: vaccinationId,
      studentId,
      schoolId: user.schoolId,
      vaccineName,
      vaccineType,
      manufacturer,
      batchNumber,
      lotNumber,
      administrationDate: new Date(administrationDate),
      administeredBy: userId,
      administrationSite,
      doseNumber,
      requiresFollowUp: requiresFollowUp || false,
      nextDoseDue: nextDoseDue ? new Date(nextDoseDue) : null,
      certificateNumber,
      certificateIssued: certificateNumber ? new Date() : null,
      isSchoolProvided: isSchoolProvided || false,
      recordedBy: userId,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    logger.info("Vaccination record added", { vaccinationId, studentId, schoolId: user.schoolId });

    return NextResponse.json({
      success: true,
      data: { vaccination: newVaccination },
    });
  } catch (error) {
    logger.error("Vaccination record creation error:", error);
    return NextResponse.json({ error: "Failed to add vaccination record" }, { status: 500 });
  }
}
