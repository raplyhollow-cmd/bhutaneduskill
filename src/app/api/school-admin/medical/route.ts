import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";
import { db } from "@/lib/db";
import { medicalRecords, medicalReferrals, users, studentAllergies, vaccinationRecords, medicineInventory, medicineTransactions } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, sql, Sql } from "drizzle-orm";

type DrizzleCondition = Sql<boolean> | ReturnType<typeof eq> | ReturnType<typeof gte> | ReturnType<typeof lte>;

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
    const recentVisits = await db.query.medicalRecords.findMany({
      where: dateConditions.length > 0
        ? and(eq(medicalRecords.schoolId, schoolId), ...dateConditions)
        : eq(medicalRecords.schoolId, schoolId),
      with: {
        student: true,
      },
      orderBy: [desc(medicalRecords.visitDate)],
      limit: 20,
    });

    // Get students with known allergies
    const studentsWithAllergies = await db.query.studentAllergies.findMany({
      where: and(eq(studentAllergies.schoolId, schoolId), eq(studentAllergies.isActive, true)),
      with: {
        student: true,
      },
    });

    // Get medicines with low stock
    const lowStockMedicines = await db.query.medicineInventory.findMany({
      where: and(
        eq(medicineInventory.schoolId, schoolId),
        sql`${medicineInventory.currentStock} <= ${medicineInventory.minimumStock}`
      ),
    });

    // Get pending referrals count
    const pendingReferrals = await db.query.medicalReferrals.findMany({
      where: and(
        eq(medicalReferrals.schoolId, schoolId),
        eq(medicalReferrals.status, 'pending')
      ),
    });

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
