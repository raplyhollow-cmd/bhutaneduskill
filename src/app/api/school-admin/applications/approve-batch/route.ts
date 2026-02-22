import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, enrollments, classes, teacherAssignments, departments } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { enforceSeatCapacity } from "@/lib/billing-utils";
import { logger } from "@/lib/logger";
import { eq, and, inArray, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

interface ApproveBatchRequest {
  userIds: string[];
  type: "student" | "teacher";
  assignments?: Record<string, {
    departmentId?: string;
    classIds?: string[];
  }>;
}

interface ApprovalResult {
  success: boolean;
  count: number;
  approved: string[];
  failed: Array<{ userId: string; error: string }>;
}

// POST /api/school-admin/applications/approve-batch - Bulk approve multiple users
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

    const body: ApproveBatchRequest = await request.json();
    const { userIds, type, assignments = {} } = body;

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

    // Verify all users are of the correct type and belong to the same school (unless platform admin)
    const schoolId = user.type === 'admin' ? applicants[0].schoolId : user.schoolId;
    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID not found", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Validate each applicant
    const validApplicants: Array<typeof users.$inferSelect> = [];
    const failed: Array<{ userId: string; error: string }> = [];

    // Count student applicants for seat capacity check
    const studentApplicants = applicants.filter(a => a.type === 'student');

    // Check seat capacity for students (skip for teachers)
    if (type === 'student' && studentApplicants.length > 0) {
      try {
        await enforceSeatCapacity(schoolId, studentApplicants.length);
      } catch (capacityError) {
        return NextResponse.json(
          {
            error: capacityError instanceof Error ? capacityError.message : "Insufficient capacity",
            status: 409,
          } satisfies ApiErrorResponse,
          { status: 409 }
        );
      }
    }

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

      // Check if already onboarded
      if (applicant.onboardingComplete) {
        failed.push({ userId: applicant.id, error: "User already approved" });
        continue;
      }

      validApplicants.push(applicant);
    }

    const approvedIds: string[] = [];
    const approvalFailed: Array<{ userId: string; error: string }> = [...failed];

    // Process approvals in a transaction-like manner
    for (const applicant of validApplicants) {
      try {
        // Update user to approved
        await db
          .update(users)
          .set({
            onboardingComplete: true,
            onboardingStatus: 'active',
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, applicant.id));

        // Handle type-specific processing
        if (type === 'student') {
          await processStudentApproval(applicant, schoolId);
        } else {
          await processTeacherApproval(applicant, schoolId, assignments[applicant.id]);
        }

        approvedIds.push(applicant.id);
      } catch (error) {
        logger.error("Failed to approve user", { userId: applicant.id, error });
        approvalFailed.push({
          userId: applicant.id,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    logger.info(`Batch approval completed: ${approvedIds.length} ${type}s approved`, {
      schoolId,
      approvedBy: userId,
      count: approvedIds.length,
      failed: approvalFailed.length
    });

    return NextResponse.json({
      data: {
        success: true,
        count: approvedIds.length,
        approved: approvedIds,
        failed: approvalFailed
      } as ApprovalResult
    } satisfies ApiSuccess<ApprovalResult>);
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/applications/approve-batch", method: "POST" });
    return NextResponse.json(
      { error: "Failed to process batch approval", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * Process student approval - create enrollment record
 */
async function processStudentApproval(
  applicant: typeof users.$inferSelect,
  schoolId: string
): Promise<void> {
  if (!applicant.classGrade) {
    return; // No grade assigned, skip enrollment
  }

  // Find or create a class for the student's grade
  const classRecords = await db
    .select()
    .from(classes)
    .where(
      and(
        eq(classes.schoolId, schoolId),
        eq(classes.grade, applicant.classGrade)
      )
    )
    .orderBy(desc(classes.createdAt))
    .limit(1);

  let classId = classRecords[0]?.id;

  // If no class exists, create one
  if (!classId) {
    classId = `class_${nanoid()}`;
    await db.insert(classes).values({
      id: classId,
      schoolId,
      name: `Class ${applicant.classGrade}A`,
      grade: applicant.classGrade,
      section: 'A',
      roomNumber: "TBD",
      capacity: 40,
      homeroomTeacherName: "To be assigned",
      classTeacherName: "To be assigned",
      academicYear: new Date().getFullYear().toString(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Create enrollment
  await db.insert(enrollments).values({
    id: `enr_${nanoid()}`,
    studentId: applicant.id,
    classId,
    academicYear: new Date().getFullYear().toString(),
    status: 'active',
    enrollmentDate: new Date().toISOString().split('T')[0],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * Process teacher approval - create department assignment and class assignments
 */
async function processTeacherApproval(
  applicant: typeof users.$inferSelect,
  schoolId: string,
  assignment?: { departmentId?: string; classIds?: string[] }
): Promise<void> {
  // If department is provided, update the user's department
  if (assignment?.departmentId) {
    // Verify department belongs to the school
    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, assignment.departmentId)
    });

    if (dept && dept.schoolId === schoolId) {
      await db
        .update(users)
        .set({ department: dept.name })
        .where(eq(users.id, applicant.id));
    }
  }

  // If class IDs are provided, create teacher assignments
  if (assignment?.classIds && assignment.classIds.length > 0) {
    for (const classId of assignment.classIds) {
      // Verify class belongs to the school
      const cls = await db.query.classes.findFirst({
        where: eq(classes.id, classId)
      });

      if (cls && cls.schoolId === schoolId) {
        await db.insert(teacherAssignments).values({
          id: `ta_${nanoid()}`,
          teacherId: applicant.id,
          classId,
          academicYear: new Date().getFullYear().toString(),
          role: 'subject_teacher',
          isPrimary: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).onConflictDoNothing(); // Avoid duplicate errors
      }
    }
  }
}
