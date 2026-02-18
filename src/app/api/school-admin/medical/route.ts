import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { medicalRecords, medicalReferrals, users, studentAllergies, vaccinationRecords, medicineInventory, medicineTransactions } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

/**
 * GET /api/school-admin/medical - Get infirmary dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);

    const schoolId = user.schoolId;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date conditions
    let dateConditions: any[] = [];
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

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentVisits,
        studentsWithAllergies,
        lowStockMedicines,
        pendingReferrals,
      },
    });
  } catch (error) {
    logger.error("Medical dashboard fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch medical dashboard data" }, { status: 500 });
  }
}

/**
 * POST /api/school-admin/medical - Create a new medical visit record
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
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      data: { record: newRecord },
    });
  } catch (error) {
    logger.error("Medical record creation error:", error);
    return NextResponse.json({ error: "Failed to create medical record" }, { status: 500 });
  }
}
