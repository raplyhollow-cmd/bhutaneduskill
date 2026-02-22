import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// PATCH /api/admin/schools/[id]/tier - Update school subscription tier
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } as ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId: adminId } = authResult;
  const { id: schoolId } = await params;

  try {
    const body = await request.json();
    const { tier } = body;

    if (!tier || !['basic', 'standard', 'premium'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be basic, standard, or premium', status: 400 } as ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get current school
    const [currentSchool] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    if (!currentSchool) {
      return NextResponse.json(
        { error: 'School not found', status: 404 } as ApiErrorResponse,
        { status: 404 }
      );
    }

    // Update maxStudents based on tier
    const tierCapacity = {
      basic: 100,
      standard: 500,
      premium: 1000,
    };
    const newMaxStudents = tierCapacity[tier as keyof typeof tierCapacity] || 500;

    // Update school
    const [updatedSchool] = await db
      .update(schools)
      .set({
        subscriptionTier: tier,
        maxStudents: newMaxStudents,
        updatedAt: new Date(),
      })
      .where(eq(schools.id, schoolId))
      .returning();

    logger.info('School tier updated', {
      schoolId,
      oldTier: currentSchool.subscriptionTier,
      newTier: tier,
      oldMaxStudents: currentSchool.maxStudents,
      newMaxStudents,
      updatedBy: adminId,
    });

    return NextResponse.json({
      data: updatedSchool,
      message: `School tier updated to ${tier}`,
    } satisfies ApiSuccess<typeof updatedSchool>);

  } catch (error) {
    logger.apiError(error, { route: `/api/admin/schools/${schoolId}/tier`, method: 'PATCH', adminId });
    return NextResponse.json(
      { error: 'Failed to update tier', status: 500 } as ApiErrorResponse,
      { status: 500 }
    );
  }
}
