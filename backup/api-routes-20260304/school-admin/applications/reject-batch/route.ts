import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, studentApplications } from "@/lib/db/schema";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createApiRoute } from "@/lib/api/route-handler";
import type { AuthContext } from "@/lib/api/route-handler";

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
export const POST = createApiRoute(
  async (request: NextRequest, auth: AuthContext) => {
  const { userId, user } = auth;

    const body: RejectBatchRequest = await request.json();
    const { userIds, type, reason } = body;

    // Validate input
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return { error: "userIds must be a non-empty array" };
    }

    if (type !== 'student' && type !== 'teacher') {
      return { error: "Type must be 'student' or 'teacher'" };
    }

    if (!reason || reason.trim().length === 0) {
      return { error: "Rejection reason is required" };
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
      return { error: "No valid applicants found" };
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
      success: true,
      data: {
        success: true,
        count: rejectedIds.length,
        rejected: rejectedIds,
        failed: rejectionFailed
      } as RejectionResult
    });
  },
  ['school-admin', 'admin']
);
