import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, enrollments, classes } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

// POST /api/school-admin/applications/[id]/approve - Approve student/teacher application
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const params = await context.params;
    const applicantId = params.id;
    const body = await request.json();
    const { type } = body; // 'student' or 'teacher'

    // Check permission
    const permission = type === 'student' ? 'students.approve' : 'teachers.approve';
    const permCheck = await requirePermission(userId, permission);
    if (permCheck) return permCheck;

    // Get the applicant
    const applicants = await db
      .select()
      .from(users)
      .where(eq(users.id, applicantId))
      .limit(1);

    if (applicants.length === 0) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const applicant = applicants[0];

    // Verify type matches
    if (applicant.type !== type) {
      return NextResponse.json({ error: `Applicant is not a ${type}` }, { status: 400 });
    }

    // Check school access (unless platform admin)
    if (user.type !== 'admin' && applicant.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update user to approved
    await db
      .update(users)
      .set({
        onboardingComplete: true,
        onboardingStatus: 'complete',
        updatedAt: new Date(),
      })
      .where(eq(users.id, applicantId));

    // For students, create enrollment record
    if (type === 'student') {
      // Find or create a class for the student's grade
      if (applicant.classGrade) {
        const classRecords = await db
          .select()
          .from(classes)
          .where(
            and(
              eq(classes.schoolId, applicant.schoolId!),
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
            schoolId: applicant.schoolId!,
            name: `Class ${applicant.classGrade}A`,
            grade: parseInt(applicant.classGrade) || 0,
            section: 'A',
            roomNumber: "TBD",
            capacity: 40,
            homeroomTeacherName: "To be assigned",
            classTeacherName: "To be assigned",
            academicYear: new Date().getFullYear().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Create enrollment
        await db.insert(enrollments).values({
          id: `enr_${nanoid()}`,
          studentId: applicantId,
          classId,
          academicYear: new Date().getFullYear().toString(),
          status: 'active',
          enrollmentDate: new Date().toISOString().split('T')[0],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    logger.info(`${type} application approved`, {
      applicantId,
      schoolId: applicant.schoolId,
      approvedBy: userId,
    });

    return NextResponse.json({
      success: true,
      message: `${type === 'student' ? 'Student' : 'Teacher'} application approved successfully`,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/applications/[id]/approve", method: "POST" });
    return NextResponse.json({ error: "Failed to approve application" }, { status: 500 });
  }
}

// POST /api/school-admin/applications/[id]/reject - Reject student/teacher application
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const params = await context.params;
    const applicantId = params.id;
    const body = await request.json();
    const { type, reason } = body;

    // Check permission
    const permission = type === 'student' ? 'students.approve' : 'teachers.approve';
    const permCheck = await requirePermission(userId, permission);
    if (permCheck) return permCheck;

    // Get the applicant
    const applicants = await db
      .select()
      .from(users)
      .where(eq(users.id, applicantId))
      .limit(1);

    if (applicants.length === 0) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const applicant = applicants[0];

    // Verify type matches
    if (applicant.type !== type) {
      return NextResponse.json({ error: `Applicant is not a ${type}` }, { status: 400 });
    }

    // Check school access (unless platform admin)
    if (user.type !== 'admin' && applicant.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete the user (effectively rejecting them)
    // Alternatively, we could set a rejected flag, but deletion is cleaner for rejected applicants
    await db.delete(users).where(eq(users.id, applicantId));

    logger.info(`${type} application rejected`, {
      applicantId,
      schoolId: applicant.schoolId,
      rejectedBy: userId,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: `${type === 'student' ? 'Student' : 'Teacher'} application rejected`,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/applications/[id]/approve", method: "PATCH" });
    return NextResponse.json({ error: "Failed to reject application" }, { status: 500 });
  }
}

// Separate route for rejection to be clearer
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const params = await context.params;
    const applicantId = params.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'student' or 'teacher'
    const reason = searchParams.get('reason');

    if (!type) {
      return NextResponse.json({ error: "Type parameter required" }, { status: 400 });
    }

    // Check permission
    const permission = type === 'student' ? 'students.approve' : 'teachers.approve';
    const permCheck = await requirePermission(userId, permission);
    if (permCheck) return permCheck;

    // Get the applicant
    const applicants = await db
      .select()
      .from(users)
      .where(eq(users.id, applicantId))
      .limit(1);

    if (applicants.length === 0) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const applicant = applicants[0];

    // Verify type matches
    if (applicant.type !== type) {
      return NextResponse.json({ error: `Applicant is not a ${type}` }, { status: 400 });
    }

    // Check school access (unless platform admin)
    if (user.type !== 'admin' && applicant.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete the user (effectively rejecting them)
    await db.delete(users).where(eq(users.id, applicantId));

    logger.info(`${type} application rejected (DELETE)`, {
      applicantId,
      schoolId: applicant.schoolId,
      rejectedBy: userId,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: `${type === 'student' ? 'Student' : 'Teacher'} application rejected`,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/applications/[id]/approve", method: "DELETE" });
    return NextResponse.json({ error: "Failed to reject application" }, { status: 500 });
  }
}
