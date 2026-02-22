import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, studentApplications } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { eq, inArray } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

interface RejectBatchRequest {
  userIds: string[];
  type: "student" | "teacher";
  reason: string;
}

interface RejectionResult {
  success: boolean;
  count: number;
  rejected: string[];
  failed: Array<{ userId: string; error: string }>;
}

// POST /api/school-admin/applications/reject-batch - Bulk reject multiple users
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId, user } = authResult;

    const body: RejectBatchRequest = await request.json();
    const { userIds, type, reason } = body;

    // Validate input
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "userIds must be a non-empty array", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    if (type !== 'student' && type !== 'teacher') {
      return NextResponse.json(
        { error: "Type must be 'student' or 'teacher'", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Rejection reason is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check permission
    const permission = type === 'student' ? 'students.approve' : 'teachers.approve';
    const permCheck = await requirePermission(userId, permission);
    if (permCheck) return permCheck;

    // Get all applicants
    const applicants = await db
      .select()
      .from(users)
      .where(inArray(users.id, userIds));

    if (applicants.length === 0) {
      return NextResponse.json(
        { error: "No valid applicants found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Validate each applicant
    const validApplicants: Array<typeof users.$inferSelect> = [];
    const failed: Array<{ userId: string; error: string }> = [];

    for (const applicant of applicants) {
      // Verify type matches
      if (applicant.type !== type) {
        failed.push({ userId: applicant.id, error: `User is not a ${type}` });
        continue;
      }

      // Check school access (unless platform admin)
      if (user.type !== 'admin' && applicant.schoolId !== user.schoolId) {
        failed.push({ userId: applicant.id, error: "Access denied to this user" });
        continue;
      }

      // Check if already rejected
      if (applicant.onboardingStatus === 'rejected') {
        failed.push({ userId: applicant.id, error: "User already rejected" });
        continue;
      }

      validApplicants.push(applicant);
    }

    const rejectedIds: string[] = [];
    const rejectionFailed: Array<{ userId: string; error: string }> = [...failed];

    // Process rejections
    for (const applicant of validApplicants) {
      try {
        // Update user status to rejected
        await db
          .update(users)
          .set({
            onboardingStatus: 'rejected',
            onboardingComplete: false,
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(users.id, applicant.id));

        // For students, also update the student application record
        if (type === 'student') {
          const existingApplications = await db
            .select()
            .from(studentApplications)
            .where(eq(studentApplications.studentId, applicant.id))
            .limit(1);

          if (existingApplications.length > 0) {
            await db
              .update(studentApplications)
              .set({
                status: 'rejected',
                rejectionReason: reason,
                reviewedAt: new Date(),
                reviewedBy: userId,
                updatedAt: new Date(),
              })
              .where(eq(studentApplications.id, existingApplications[0].id));
          }
        }

        rejectedIds.push(applicant.id);
      } catch (error) {
        logger.error("Failed to reject user", { userId: applicant.id, error });
        rejectionFailed.push({
          userId: applicant.id,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    logger.info(`Batch rejection completed: ${rejectedIds.length} ${type}s rejected`, {
      schoolId: user.schoolId,
      rejectedBy: userId,
      count: rejectedIds.length,
      reason,
      failed: rejectionFailed.length
    });

    return NextResponse.json({
      data: {
        success: true,
        count: rejectedIds.length,
        rejected: rejectedIds,
        failed: rejectionFailed
      } as RejectionResult
    } satisfies ApiSuccess<RejectionResult>);
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/applications/reject-batch", method: "POST" });
    return NextResponse.json(
      { error: "Failed to process batch rejection", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
