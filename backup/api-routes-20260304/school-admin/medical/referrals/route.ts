import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { medicalReferrals } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";

type DrizzleCondition = SQL | ReturnType<typeof eq>;

interface ReferralUpdateData {
  status: string;
  appointmentDate?: Date;
  appointmentTime?: string;
  responseReceived?: boolean;
  responseNotes?: string;
  updatedAt: Date;
}

interface ReferralsResponse {
  referrals: unknown[];
}

interface ReferralResponse {
  referral: unknown;
}

interface ReferralRequest {
  studentId: string;
  medicalRecordId?: string;
  facilityName: string;
  facilityType?: string;
  facilityAddress?: string;
  facilityPhone?: string;
  reason: string;
  urgency: string;
  specialty?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  parentNotified?: boolean;
  notes?: string;
}

interface ReferralUpdateRequest {
  id: string;
  status: string;
  appointmentDate?: string;
  appointmentTime?: string;
  responseReceived?: boolean;
  responseNotes?: string;
}

/**
 * GET /api/school-admin/medical/referrals - Get medical referrals
 */
export const GET = createApiRoute<{}, ReferralsResponse>(
  async (req, { user }) => {
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');

    const whereConditions: DrizzleCondition[] = [eq(medicalReferrals.schoolId, user.schoolId)];

    if (status) {
      whereConditions.push(eq(medicalReferrals.status, status));
    }
    if (studentId) {
      whereConditions.push(eq(medicalReferrals.studentId, studentId));
    }

    const referrals = await db
      .select()
      .from(medicalReferrals)
      .where(whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0])
      .orderBy(desc(medicalReferrals.referralDate));

    return { data: { referrals } };
  },
  ['school-admin', 'admin']
);

/**
 * POST /api/school-admin/medical/referrals - Create a medical referral
 */
export const POST = createApiRoute<{}, ReferralResponse>(
  async (req, { user, userId }) => {
    const body: ReferralRequest = await req.json();

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
      return { error: "Missing required fields", status: 400 };
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

    return { data: { referral: newReferral } };
  },
  ['school-admin', 'admin']
);

/**
 * PATCH /api/school-admin/medical/referrals - Update referral status
 */
export const PATCH = createApiRoute<{}, ReferralResponse>(
  async (req, { user }) => {
    const body: ReferralUpdateRequest = await req.json();

    const { id, status, appointmentDate, appointmentTime, responseReceived, responseNotes } = body;

    if (!id || !status) {
      return { error: "Missing required fields", status: 400 };
    }

    const updateData: ReferralUpdateData = {
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

    return { data: { referral: updatedReferral } };
  },
  ['school-admin', 'admin']
);
