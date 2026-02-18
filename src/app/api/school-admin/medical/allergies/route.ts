import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { studentAllergies } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/school-admin/medical/allergies - Get student allergies/conditions
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
    const severity = searchParams.get('severity');
    const allergenType = searchParams.get('allergenType');

    let whereConditions: any[] = [
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

    const allergies = await db.query.studentAllergies.findMany({
      where: and(...whereConditions),
      with: {
        student: true,
      },
      orderBy: [desc(studentAllergies.createdAt)],
    });

    return NextResponse.json({
      success: true,
      data: { allergies },
    });
  } catch (error) {
    logger.error("Student allergies fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch allergies" }, { status: 500 });
  }
}

/**
 * POST /api/school-admin/medical/allergies - Add student allergy/condition
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
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      data: { allergy: newAllergy },
    });
  } catch (error) {
    logger.error("Student allergy creation error:", error);
    return NextResponse.json({ error: "Failed to add allergy" }, { status: 500 });
  }
}

/**
 * PATCH /api/school-admin/medical/allergies - Update allergy/condition
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const body = await request.json();

    const { id, isActive, verifiedBy } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing allergy ID" }, { status: 400 });
    }

    const updateData: any = {
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

    return NextResponse.json({
      success: true,
      data: { allergy: updatedAllergy },
    });
  } catch (error) {
    logger.error("Student allergy update error:", error);
    return NextResponse.json({ error: "Failed to update allergy" }, { status: 500 });
  }
}
