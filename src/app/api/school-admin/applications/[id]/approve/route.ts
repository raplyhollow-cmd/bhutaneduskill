/**
 * SCHOOL ADMIN APPLICATION APPROVE API
 *
 * POST /api/school-admin/applications/[id]/approve - Approve student/teacher application
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, enrollments, classes } from "@/lib/db/schema";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse, forbiddenResponse } from "@/lib/api/response-helpers";

// POST /api/school-admin/applications/[id]/approve - Approve student/teacher application
// Now supports: school-admin, platform admin, and class teachers
export const POST = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { userId, user } = auth;

    const params = await context.params;
    const applicantId = params.id;
    const body = await request.json();
    const { type } = body; // 'student' or 'teacher'

    // Check permission based on user type
    // - Platform admins (admin) can approve anyone
    // - School admins can approve their school's applications
    // - Teachers can approve students for classes they teach
    if (user.type === 'teacher') {
      // Teachers can only approve students, not other teachers
      if (type !== 'student') {
        return forbiddenResponse("Teachers can only approve student applications");
      }
      // Permission check for teachers is done below (class assignment)
    } else if (user.type === 'school-admin') {
      // School admins use RBAC (if available) or are implicitly allowed
      const permission = type === 'student' ? 'students.approve' : 'teachers.approve';
      const permCheck = await requirePermission(userId, permission);
      if (permCheck) return permCheck;
    }
    // Platform admins (type: 'admin') have implicit permission

    // Get the applicant
    const applicants = await db
      .select()
      .from(users)
      .where(eq(users.id, applicantId))
      .limit(1);

    if (applicants.length === 0) {
      return notFoundResponse("Applicant");
    }

    const applicant = applicants[0];

    // Verify type matches
    if (applicant.type !== type) {
      return badRequestResponse(`Applicant is not a ${type}`);
    }

    // Check school access (unless platform admin)
    if (user.type !== 'admin' && applicant.schoolId !== user.schoolId) {
      return forbiddenResponse("Access denied");
    }

    // For teachers: verify they are the CLASS TEACHER for this specific class (grade + section)
    if (user.type === 'teacher' && type === 'student') {
      const teacherClass = await db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.schoolId, user.schoolId!),
            eq(classes.classTeacherId, userId), // Teacher must be assigned as class teacher
            eq(classes.grade, applicant.classGrade || 0),
            eq(classes.section, (applicant.section || '').toUpperCase())
          )
        )
        .limit(1);

      if (teacherClass.length === 0) {
        return forbiddenResponse("You can only approve students for classes where you are assigned as the class teacher");
      }
    }

    // Update user to approved - use 'enrolled' status for students
    await db
      .update(users)
      .set({
        onboardingComplete: true,
        onboardingStatus: type === 'student' ? 'enrolled' : 'complete',
        approvedBy: userId, // Track who approved this user
        approvedAt: new Date(), // Track when approval happened
        updatedAt: new Date(),
      })
      .where(eq(users.id, applicantId));

    // For students, create enrollment record
    if (type === 'student') {
      // Find or create a class for the student's grade AND section
      if (applicant.classGrade) {
        const studentSection = (applicant.section || 'A').toUpperCase();

        // Search for existing class with matching grade AND section
        const classRecords = await db
          .select()
          .from(classes)
          .where(
            and(
              eq(classes.schoolId, applicant.schoolId!),
              eq(classes.grade, applicant.classGrade),
              eq(classes.section, studentSection)
            )
          )
          .orderBy(desc(classes.createdAt))
          .limit(1);

        let classId = classRecords[0]?.id;

        // If no class exists, create one with the correct section
        if (!classId) {
          classId = `class_${nanoid()}`;

          // If teacher is approving, assign them as the class teacher
          const approverIsTeacher = user.type === 'teacher';

          await db.insert(classes).values({
            id: classId,
            schoolId: applicant.schoolId!,
            name: `Class ${applicant.classGrade} ${studentSection}`,
            grade: parseInt(applicant.classGrade) || 0,
            section: studentSection,
            roomNumber: "TBD",
            capacity: 40,
            classTeacherId: approverIsTeacher ? userId : null, // Assign teacher as class teacher
            homeroomTeacherName: approverIsTeacher ? user.name : "To be assigned",
            classTeacherName: approverIsTeacher ? user.name : "To be assigned",
            academicYear: new Date().getFullYear().toString(),
            isActive: true,
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

        logger.info("Student enrolled in class", {
          studentId: applicantId,
          classId,
          className: `Class ${applicant.classGrade} ${studentSection}`,
        });
      }
    }

    logger.info(`${type} application approved`, {
      applicantId,
      schoolId: applicant.schoolId,
      approvedBy: userId,
    });

    return successResponse({
      success: true,
      message: `${type === 'student' ? 'Student' : 'Teacher'} application approved successfully`,
    });
  },
  ['school-admin', 'admin', 'teacher']
);

// PATCH /api/school-admin/applications/[id]/reject - Reject student/teacher application
// Supports: school-admin, platform admin, and class teachers (for students)
export const PATCH = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { userId, user } = auth;

    const params = await context.params;
    const applicantId = params.id;
    const body = await request.json();
    const { type, reason } = body;

    // Check permission based on user type
    if (user.type === 'teacher') {
      // Teachers can only reject students, not other teachers
      if (type !== 'student') {
        return forbiddenResponse("Teachers can only reject student applications");
      }
    } else if (user.type === 'school-admin') {
      // School admins use RBAC (if available) or are implicitly allowed
      const permission = type === 'student' ? 'students.approve' : 'teachers.approve';
      const permCheck = await requirePermission(userId, permission);
      if (permCheck) return permCheck;
    }
    // Platform admins (type: 'admin') have implicit permission

    // Get the applicant
    const applicants = await db
      .select()
      .from(users)
      .where(eq(users.id, applicantId))
      .limit(1);

    if (applicants.length === 0) {
      return notFoundResponse("Applicant");
    }

    const applicant = applicants[0];

    // Verify type matches
    if (applicant.type !== type) {
      return badRequestResponse(`Applicant is not a ${type}`);
    }

    // Check school access (unless platform admin)
    if (user.type !== 'admin' && applicant.schoolId !== user.schoolId) {
      return forbiddenResponse("Access denied");
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

    return successResponse({
      success: true,
      message: `${type === 'student' ? 'Student' : 'Teacher'} application rejected`,
    });
  },
  ['school-admin', 'admin', 'teacher']
);

// Separate route for rejection to be clearer
// Supports: school-admin, platform admin, and class teachers (for students)
export const DELETE = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { userId, user } = auth;

    const params = await context.params;
    const applicantId = params.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'student' or 'teacher'
    const reason = searchParams.get('reason');

    if (!type) {
      return badRequestResponse("Type parameter required");
    }

    // Check permission based on user type
    if (user.type === 'teacher') {
      // Teachers can only reject students, not other teachers
      if (type !== 'student') {
        return forbiddenResponse("Teachers can only reject student applications");
      }
    } else if (user.type === 'school-admin') {
      // School admins use RBAC (if available) or are implicitly allowed
      const permission = type === 'student' ? 'students.approve' : 'teachers.approve';
      const permCheck = await requirePermission(userId, permission);
      if (permCheck) return permCheck;
    }
    // Platform admins (type: 'admin') have implicit permission

    // Get the applicant
    const applicants = await db
      .select()
      .from(users)
      .where(eq(users.id, applicantId))
      .limit(1);

    if (applicants.length === 0) {
      return notFoundResponse("Applicant");
    }

    const applicant = applicants[0];

    // Verify type matches
    if (applicant.type !== type) {
      return badRequestResponse(`Applicant is not a ${type}`);
    }

    // Check school access (unless platform admin)
    if (user.type !== 'admin' && applicant.schoolId !== user.schoolId) {
      return forbiddenResponse("Access denied");
    }

    // Delete the user (effectively rejecting them)
    await db.delete(users).where(eq(users.id, applicantId));

    logger.info(`${type} application rejected (DELETE)`, {
      applicantId,
      schoolId: applicant.schoolId,
      rejectedBy: userId,
      reason,
    });

    return successResponse({
      success: true,
      message: `${type === 'student' ? 'Student' : 'Teacher'} application rejected`,
    });
  },
  ['school-admin', 'admin', 'teacher']
);
