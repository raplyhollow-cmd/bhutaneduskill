import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { medicalReferrals, medicalRecords } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/school-admin/medical/referrals - Get medical referrals
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');

    let whereConditions: any[] = [eq(medicalReferrals.schoolId, user.schoolId)];

    if (status) {
      whereConditions.push(eq(medicalReferrals.status, status));
    }
    if (studentId) {
      whereConditions.push(eq(medicalReferrals.studentId, studentId));
    }

    const referrals = await db.query.medicalReferrals.findMany({
      where: whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0],
      with: {
        student: true,
        medicalRecord: true,
      },
      orderBy: [desc(medicalReferrals.referralDate)],
    });

    return NextResponse.json({
      success: true,
      data: { referrals },
    });
  } catch (error) {
    logger.error("Medical referrals fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

/**
 * POST /api/school-admin/medical/referrals - Create a medical referral
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
      medicalRecordId,
      facilityName,
      facilityType,
      facilityAddress,
      facilityPhone,
      reason,
      urgency,
      specialty,
      appointmentDate,
      appointmentTime,
      parentNotified,
      notes,
    } = body;

    if (!studentId || !facilityName || !reason || !urgency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const referralId = `ref-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const [newReferral] = await db.insert(medicalReferrals).values({
      id: referralId,
      studentId,
      schoolId: user.schoolId,
      medicalRecordId,
      referralDate: new Date(),
      referredBy: userId,
      facilityName,
      facilityType: facilityType || 'hospital',
      facilityAddress,
      facilityPhone,
      reason,
      urgency,
      specialty,
      status: 'pending',
      appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
      appointmentTime,
      parentNotified: parentNotified || false,
      parentNotifiedAt: parentNotified ? new Date() : null,
      followUpRequired: false,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    logger.info("Medical referral created", { referralId, studentId, schoolId: user.schoolId });

    return NextResponse.json({
      success: true,
      data: { referral: newReferral },
    });
  } catch (error) {
    logger.error("Medical referral creation error:", error);
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}

/**
 * PATCH /api/school-admin/medical/referrals - Update referral status
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const body = await request.json();

    const { id, status, appointmentDate, appointmentTime, responseReceived, responseNotes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (appointmentDate) {
      updateData.appointmentDate = new Date(appointmentDate);
    }
    if (appointmentTime) {
      updateData.appointmentTime = appointmentTime;
    }
    if (responseReceived !== undefined) {
      updateData.responseReceived = responseReceived;
    }
    if (responseNotes) {
      updateData.responseNotes = responseNotes;
    }

    const [updatedReferral] = await db.update(medicalReferrals)
      .set(updateData)
      .where(eq(medicalReferrals.id, id))
      .returning();

    logger.info("Medical referral updated", { id, status, schoolId: user.schoolId });

    return NextResponse.json({
      success: true,
      data: { referral: updatedReferral },
    });
  } catch (error) {
    logger.error("Medical referral update error:", error);
    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
  }
}
