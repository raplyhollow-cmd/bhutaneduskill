import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools, users } from "@/lib/db/schema";
import { eq, count, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// GET /api/admin/schools/[id]/seat-usage - Get real seat usage for a school
export async function GET(
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
    // Get school details
    const [school] = await db
      .select({
        maxStudents: schools.maxStudents,
        subscriptionTier: schools.subscriptionTier,
      })
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    if (!school) {
      return NextResponse.json(
        { error: 'School not found', status: 404 } as ApiErrorResponse,
        { status: 404 }
      );
    }

    // Count active students
    const [studentResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.schoolId, schoolId),
          eq(users.type, 'student'),
          eq(users.isActive, true)
        )
      );

    // Count active teachers
    const [teacherResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.schoolId, schoolId),
          eq(users.type, 'teacher'),
          eq(users.isActive, true)
        )
      );

    // Calculate usage percentage
    const maxStudents = school.maxStudents || 500;
    const studentCountValue = studentResult?.count || 0;
    const teacherCountValue = teacherResult?.count || 0;
    const usagePercentage = Math.min(100, Math.round((studentCountValue / maxStudents) * 100));

    return NextResponse.json({
      data: {
        schoolId,
        maxStudents,
        studentCount: studentCountValue,
        teacherCount: teacherCountValue,
        totalUsers: studentCountValue + teacherCountValue,
        usagePercentage,
        subscriptionTier: school.subscriptionTier || 'standard',
        remainingSeats: Math.max(0, maxStudents - studentCountValue),
        isAtCapacity: studentCountValue >= maxStudents,
        needsUpgrade: studentCountValue >= (maxStudents * 0.9), // Alert at 90%
      },
    } satisfies ApiSuccess<{
      schoolId: string;
      maxStudents: number;
      studentCount: number;
      teacherCount: number;
      totalUsers: number;
      usagePercentage: number;
      subscriptionTier: string;
      remainingSeats: number;
      isAtCapacity: boolean;
      needsUpgrade: boolean;
    }>);

  } catch (error) {
    logger.apiError(error, { route: `/api/admin/schools/${schoolId}/seat-usage`, method: 'GET', adminId });
    return NextResponse.json(
      { error: 'Failed to fetch seat usage', status: 500 } as ApiErrorResponse,
      { status: 500 }
    );
  }
}
