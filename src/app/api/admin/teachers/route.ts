/**
 * TEACHERS MANAGEMENT API (Platform Admin)
 *
 * GET /api/admin/teachers - List all teachers with approval details
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, teacherApplications, schools } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

interface TeacherWithApprovalDetails {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  schoolId?: string | null;
  emailVerified: boolean;
  onboardingStatus?: string | null;
  lastLogin?: string | null;
  school?: {
    id: string;
    name: string;
    code: string;
  } | null;
  // Application approval details
  applicationStatus?: string | null;
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedAt?: Date | null;
}

/**
 * GET /api/admin/teachers - List all teachers with approval details
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } as ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;

  try {
    // Fetch teachers with their application details
    // We need to join with teacherApplications to get approval info
    const teachers = await db
      .select({
        id: users.id,
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        schoolId: users.schoolId,
        emailVerified: users.emailVerified,
        onboardingStatus: users.onboardingStatus,
        lastLogin: users.lastLogin,
        // School details
        schoolId2: schools.id,
        schoolName: schools.name,
        schoolCode: schools.code,
        // Application details
        applicationId: teacherApplications.id,
        applicationStatus: teacherApplications.status,
        approvedBy: teacherApplications.reviewedBy,
        approvedAt: teacherApplications.reviewedAt,
      })
      .from(users)
      .leftJoin(schools, eq(users.schoolId, schools.id))
      .leftJoin(teacherApplications, and(
        eq(teacherApplications.userId, users.id),
        eq(teacherApplications.schoolId, users.schoolId)
      ))
      .where(eq(users.type, "teacher"))
      .orderBy(desc(users.createdAt));

    // Get user IDs of approvers to fetch their names
    const approverIds = teachers
      .map(t => t.approvedBy)
      .filter((id): id is string => id !== null);

    let approvers: Record<string, string> = {};
    if (approverIds.length > 0) {
      const approverUsers = await db
        .select({
          id: users.id,
          name: users.name,
        })
        .from(users)
        .where(eq(users.type, "school-admin")); // Approvers are school admins

      approvers = Object.fromEntries(
        approverUsers.map(u => [u.id, u.name])
      );
    }

    // Format response
    const formattedTeachers: TeacherWithApprovalDetails[] = teachers.map((t) => ({
      id: t.id,
      name: t.name,
      firstName: t.firstName || '',
      lastName: t.lastName || '',
      email: t.email,
      schoolId: t.schoolId,
      emailVerified: t.emailVerified || false,
      onboardingStatus: t.onboardingStatus,
      lastLogin: t.lastLogin,
      school: t.schoolId2 ? {
        id: t.schoolId2,
        name: t.schoolName || '',
        code: t.schoolCode || '',
      } : null,
      applicationStatus: t.applicationStatus,
      approvedBy: t.approvedBy,
      approvedByName: t.approvedBy ? approvers[t.approvedBy] || null : null,
      approvedAt: t.approvedAt,
    }));

    logger.info("Teachers list fetched with approval details", { userId, count: formattedTeachers.length });

    return NextResponse.json({
      data: formattedTeachers,
    } satisfies ApiSuccess<typeof formattedTeachers>);

  } catch (error) {
    logger.apiError(error, { route: '/api/admin/teachers', method: 'GET', userId });
    return NextResponse.json(
      { error: 'Failed to fetch teachers', status: 500, details: error instanceof Error ? error.message : undefined } as ApiErrorResponse,
      { status: 500 }
    );
  }
}
