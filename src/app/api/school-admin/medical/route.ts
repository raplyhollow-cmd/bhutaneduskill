import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";
import { db } from "@/lib/db";
import { medicalRecords, medicalReferrals, users, studentAllergies, vaccinationRecords, medicineInventory, medicineTransactions } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

type DrizzleCondition = ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof gte> | ReturnType<typeof lte>;

/**
 * GET /api/school-admin/medical - Get infirmary dashboard statistics
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;
    const { searchParams } = new URL(request.url);

    const schoolId = user.schoolId;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date conditions
    const dateConditions: DrizzleCondition[] = [];
    if (startDate) {
      dateConditions.push(gte(medicalRecords.visitDate, new Date(startDate)));
    }
    if (endDate) {
      dateConditions.push(lte(medicalRecords.visitDate, new Date(endDate)));
    }

    // Get recent medical visits
    const recentVisits = await db
      .select({
        id: medicalRecords.id,
        studentId: medicalRecords.studentId,
        schoolId: medicalRecords.schoolId,
        visitDate: medicalRecords.visitDate,
        visitType: medicalRecords.visitType,
        chiefComplaint: medicalRecords.chiefComplaint,
        symptoms: medicalRecords.symptoms,
        temperature: medicalRecords.temperature,
        bloodPressure: medicalRecords.bloodPressure,
        pulseRate: medicalRecords.pulseRate,
        respiratoryRate: medicalRecords.respiratoryRate,
        weight: medicalRecords.weight,
        height: medicalRecords.height,
        oxygenSaturation: medicalRecords.oxygenSaturation,
        diagnosis: medicalRecords.diagnosis,
        treatment: medicalRecords.treatment,
        medicationsPrescribed: medicalRecords.medicationsPrescribed,
        notes: medicalRecords.notes,
        followUpDate: medicalRecords.followUpDate,
        isEmergency: medicalRecords.isEmergency,
        parentNotified: medicalRecords.parentNotified,
        dischargeCondition: medicalRecords.dischargeCondition,
        dischargeTime: medicalRecords.dischargeTime,
        status: medicalRecords.status,
        visitedBy: medicalRecords.visitedBy,
        createdAt: medicalRecords.createdAt,
        updatedAt: medicalRecords.updatedAt,
      })
      .from(medicalRecords)
      .where(dateConditions.length > 0
        ? and(eq(medicalRecords.schoolId, schoolId), ...dateConditions)
        : eq(medicalRecords.schoolId, schoolId))
      .orderBy(desc(medicalRecords.visitDate))
      .limit(20);

    // Get students with known allergies
    const studentsWithAllergies = await db
      .select({
        id: studentAllergies.id,
        studentId: studentAllergies.studentId,
        schoolId: studentAllergies.schoolId,
        allergenName: studentAllergies.allergenName,
        allergenType: studentAllergies.allergenType,
        severity: studentAllergies.severity,
        reaction: studentAllergies.reaction,
        isActive: studentAllergies.isActive,
        createdAt: studentAllergies.createdAt,
        updatedAt: studentAllergies.updatedAt,
      })
      .from(studentAllergies)
      .where(and(eq(studentAllergies.schoolId, schoolId), eq(studentAllergies.isActive, true)));

    // Get medicines with low stock
    const lowStockMedicines = await db
      .select()
      .from(medicineInventory)
      .where(and(
        eq(medicineInventory.schoolId, schoolId),
        sql`${medicineInventory.currentStock} <= ${medicineInventory.minimumStock}`
      ));

    // Get pending referrals count
    const pendingReferrals = await db
      .select()
      .from(medicalReferrals)
      .where(and(
        eq(medicalReferrals.schoolId, schoolId),
        eq(medicalReferrals.status, 'pending')
      ));

    // Calculate statistics
    const stats = {
      totalVisits: recentVisits.length,
      emergencyVisits: recentVisits.filter(v => v.isEmergency).length,
      studentsWithAllergies: new Set(studentsWithAllergies.map(a => a.studentId)).size,
      lowStockMedicines: lowStockMedicines.length,
      pendingReferrals: pendingReferrals.length,
    };

    return successResponse({
      stats,
      recentVisits,
      studentsWithAllergies,
      lowStockMedicines,
      pendingReferrals,
    });
  },
  ['school-admin', 'admin']
);

/**
 * POST /api/school-admin/medical - Create a new medical visit record
 */
export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user, userId } = auth;
    const body = await request.json();

    const {
      studentId,
      visitType,
      chiefComplaint,
      symptoms,
      temperature,
      bloodPressure,
      pulseRate,
      respiratoryRate,
      weight,
      height,
      oxygenSaturation,
      diagnosis,
      treatment,
      medicationsPrescribed,
      notes,
      followUpDate,
      isEmergency,
      parentNotified,
      dischargeCondition,
    } = body;

    if (!studentId || !chiefComplaint || !treatment) {
      return badRequestResponse("Missing required fields");
    }

    // Generate ID and create record
    const recordId = `med-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const [newRecord] = await db.insert(medicalRecords).values({
      id: recordId,
      studentId,
      schoolId: user.schoolId,
      visitedBy: userId,
      visitDate: new Date(),
      visitType: visitType || 'routine',
      chiefComplaint,
      symptoms: symptoms || [],
      temperature,
      bloodPressure,
      pulseRate,
      respiratoryRate,
      weight,
      height,
      oxygenSaturation,
      diagnosis,
      treatment,
      medicationsPrescribed: medicationsPrescribed || [],
      notes,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      isEmergency: isEmergency || false,
      parentNotified: parentNotified || false,
      dischargeCondition: dischargeCondition || 'stable',
      dischargeTime: new Date(),
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    logger.info("Medical record created", { recordId, studentId, schoolId: user.schoolId });

    return successResponse({ record: newRecord });
  },
  ['school-admin', 'admin']
);
