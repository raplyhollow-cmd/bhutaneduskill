import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { studentAllergies, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";

type DrizzleCondition = SQL | ReturnType<typeof eq>;

interface AllergyUpdateData {
  updatedAt: Date;
  isActive?: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

interface AllergiesResponse {
  allergies: unknown[];
}

interface AllergyResponse {
  allergy: unknown;
}

interface AllergyRequest {
  studentId: string;
  allergenType?: string;
  allergenName?: string;
  severity?: string;
  reaction?: string;
  conditionType?: string;
  conditionDetails?: string;
  specialNeeds?: string;
  dietaryRestrictions?: string[];
  requiresEmergencyMedication?: boolean;
  emergencyMedication?: string;
  emergencyActionPlan?: string;
}

/**
 * GET /api/school-admin/medical/allergies - Get student allergies/conditions
 */
export const GET = createApiRoute<{}, AllergiesResponse>(
  async (req, { user }) => {
    const { searchParams } = new URL(req.url);

    const studentId = searchParams.get('studentId');
    const severity = searchParams.get('severity');
    const allergenType = searchParams.get('allergenType');

    const whereConditions: DrizzleCondition[] = [
      eq(studentAllergies.schoolId, user.schoolId),
      eq(studentAllergies.isActive, true),
    ];

    if (studentId) {
      whereConditions.push(eq(studentAllergies.studentId, studentId));
    }
    if (severity) {
      whereConditions.push(eq(studentAllergies.severity, severity));
    }
    if (allergenType) {
      whereConditions.push(eq(studentAllergies.allergenType, allergenType));
    }

    const allergies = await db
      .select({
        id: studentAllergies.id,
        studentId: studentAllergies.studentId,
        schoolId: studentAllergies.schoolId,
        allergenName: studentAllergies.allergenName,
        allergenType: studentAllergies.allergenType,
        severity: studentAllergies.severity,
        reaction: studentAllergies.reaction,
        conditionType: studentAllergies.conditionType,
        conditionDetails: studentAllergies.conditionDetails,
        isActive: studentAllergies.isActive,
        verifiedBy: studentAllergies.verifiedBy,
        verifiedAt: studentAllergies.verifiedAt,
        createdAt: studentAllergies.createdAt,
        updatedAt: studentAllergies.updatedAt,
        student: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(studentAllergies)
      .leftJoin(users, eq(studentAllergies.studentId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(studentAllergies.createdAt));

    return { data: { allergies } };
  },
  ['school-admin', 'admin']
);

/**
 * POST /api/school-admin/medical/allergies - Add student allergy/condition
 */
export const POST = createApiRoute<{}, AllergyResponse>(
  async (req, { user, userId }) => {
    const body: AllergyRequest = await req.json();

    const {
      studentId,
      allergenType,
      allergenName,
      severity,
      reaction,
      conditionType,
      conditionDetails,
      specialNeeds,
      dietaryRestrictions,
      requiresEmergencyMedication,
      emergencyMedication,
      emergencyActionPlan,
    } = body;

    if (!studentId) {
      return { error: "Student ID is required", status: 400 };
    }

    const allergyId = `allergy-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const [newAllergy] = await db.insert(studentAllergies).values({
      id: allergyId,
      studentId,
      schoolId: user.schoolId,
      allergenType: allergenType || null,
      allergenName: allergenName || null,
      severity: severity || null,
      reaction: reaction || null,
      conditionType: conditionType || null,
      conditionDetails: conditionDetails || null,
      specialNeeds: specialNeeds || null,
      dietaryRestrictions: dietaryRestrictions || [],
      requiresEmergencyMedication: requiresEmergencyMedication || false,
      emergencyMedication: emergencyMedication || null,
      emergencyActionPlan: emergencyActionPlan || null,
      reportedBy: userId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    logger.info("Student allergy/condition added", { allergyId, studentId, schoolId: user.schoolId });

    return { data: { allergy: newAllergy } };
  },
  ['school-admin', 'admin']
);

/**
 * PATCH /api/school-admin/medical/allergies - Update allergy/condition
 */
export const PATCH = createApiRoute<{}, AllergyResponse>(
  async (req, { user }) => {
    const body = await req.json();

    const { id, isActive, verifiedBy } = body;

    if (!id) {
      return { error: "Missing allergy ID", status: 400 };
    }

    const updateData: AllergyUpdateData = {
      updatedAt: new Date(),
    };

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    if (verifiedBy) {
      updateData.verifiedBy = verifiedBy;
      updateData.verifiedAt = new Date();
    }

    const [updatedAllergy] = await db.update(studentAllergies)
      .set(updateData)
      .where(eq(studentAllergies.id, id))
      .returning();

    logger.info("Student allergy updated", { id, schoolId: user.schoolId });

    return { data: { allergy: updatedAllergy } };
  },
  ['school-admin', 'admin']
);
