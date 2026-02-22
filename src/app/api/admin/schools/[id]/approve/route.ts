import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// POST /api/admin/schools/[id]/approve - Approve school and activate subscription
export async function POST(
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
    const { subscriptionTier = "standard" } = body;

    // Check if school exists
    const existingSchool = await db
      .select()
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    if (existingSchool.length === 0) {
      return NextResponse.json(
        { error: 'School not found', status: 404 } as ApiErrorResponse,
        { status: 404 }
      );
    }

    const school = existingSchool[0];

    // Update school to active
    const [updatedSchool] = await db
      .update(schools)
      .set({
        subscriptionStatus: 'active',
        subscriptionTier,
        activatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schools.id, schoolId))
      .returning();

    logger.info('School approved and activated', {
      schoolId,
      schoolName: school.name,
      subscriptionTier,
      approvedBy: adminId,
    });

    return NextResponse.json({
      data: updatedSchool,
      message: 'School approved successfully',
    } satisfies ApiSuccess<typeof updatedSchool>);

  } catch (error) {
    logger.apiError(error, { route: `/api/admin/schools/${schoolId}/approve`, method: 'POST', adminId });
    return NextResponse.json(
      { error: 'Failed to approve school', status: 500, details: error instanceof Error ? error.message : undefined } as ApiErrorResponse,
      { status: 500 }
    );
  }
}
