import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vaccinationRecords, users } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";

type VaccinationCondition = ReturnType<typeof eq> | ReturnType<typeof sql>;

interface VaccinationsResponse {
  vaccinations: unknown[];
}

interface VaccinationResponse {
  vaccination: unknown;
}

interface VaccinationRequest {
  studentId: string;
  vaccineName: string;
  vaccineType: string;
  manufacturer?: string;
  batchNumber?: string;
  lotNumber?: string;
  administrationDate: string;
  administrationSite?: string;
  doseNumber?: number;
  requiresFollowUp?: boolean;
  nextDoseDue?: string;
  certificateNumber?: string;
  isSchoolProvided?: boolean;
  notes?: string;
}

/**
 * GET /api/school-admin/medical/vaccinations - Get vaccination records
 */
export const GET = createApiRoute<{}, VaccinationsResponse>(
  async (req, { user }) => {
    const { searchParams } = new URL(req.url);

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

    const vaccinations = await db
      .select({
        id: vaccinationRecords.id,
        studentId: vaccinationRecords.studentId,
        schoolId: vaccinationRecords.schoolId,
        vaccineName: vaccinationRecords.vaccineName,
        vaccineType: vaccinationRecords.vaccineType,
        manufacturer: vaccinationRecords.manufacturer,
        batchNumber: vaccinationRecords.batchNumber,
        lotNumber: vaccinationRecords.lotNumber,
        administrationDate: vaccinationRecords.administrationDate,
        administrationSite: vaccinationRecords.administrationSite,
        doseNumber: vaccinationRecords.doseNumber,
        requiresFollowUp: vaccinationRecords.requiresFollowUp,
        nextDoseDue: vaccinationRecords.nextDoseDue,
        certificateNumber: vaccinationRecords.certificateNumber,
        certificateIssued: vaccinationRecords.certificateIssued,
        isSchoolProvided: vaccinationRecords.isSchoolProvided,
        administeredBy: vaccinationRecords.administeredBy,
        recordedBy: vaccinationRecords.recordedBy,
        notes: vaccinationRecords.notes,
        createdAt: vaccinationRecords.createdAt,
        updatedAt: vaccinationRecords.updatedAt,
        // Student info
        studentFirstName: users.firstName,
        studentLastName: users.lastName,
        studentName: users.name,
      })
      .from(vaccinationRecords)
      .innerJoin(users, eq(vaccinationRecords.studentId, users.id))
      .where(whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0])
      .orderBy(desc(vaccinationRecords.administrationDate));

    return { data: { vaccinations } };
  },
  ['school-admin', 'admin']
);

/**
 * POST /api/school-admin/medical/vaccinations - Add vaccination record
 */
export const POST = createApiRoute<{}, VaccinationResponse>(
  async (req, { user, userId }) => {
    const body: VaccinationRequest = await req.json();

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
      return { error: "Missing required fields", status: 400 };
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

    return { data: { vaccination: newVaccination } };
  },
  ['school-admin', 'admin']
);
