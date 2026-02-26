/**
 * TUITION ENROLLMENTS API
 *
 * GET /api/tuition/enrollments - List enrollments
 * POST /api/tuition/enrollments - Enroll in course
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { tuitionEnrollments, tuitionCourses, users, tutors } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

// GET /api/tuition/enrollments - List enrollments
export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user: currentUser, userId: currentUserId } = auth;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "tutor", "student", or "all" for school-admin
    const schoolId = searchParams.get("schoolId");

    interface EnrollmentWithRelations {
      id: string;
      studentId: string;
      courseId: string;
      tutorId: string;
      status: string;
      enrollmentDate: string;
      student?: {
        id: string;
        name: string | null;
        email: string | null;
      };
      course?: {
        id: string;
        title: string;
        schoolId: string;
      };
      tutor?: {
        id: string;
        user?: {
          id: string;
          name: string | null;
        };
      };
    }
    let enrollments: EnrollmentWithRelations[];

    if (type === "all" || (currentUser.type === 'school-admin' || currentUser.type === 'admin')) {
      // School-admin can see all enrollments for their school
      const filterSchoolId = schoolId || currentUser.schoolId;

      enrollments = await db.query.tuitionEnrollments.findMany({
        with: {
          student: true,
          course: true,
          tutor: {
            with: {
              user: true,
            },
          },
        },
        orderBy: [desc(tuitionEnrollments.enrollmentDate)],
      });

      // Filter by school if needed
      if (filterSchoolId) {
        enrollments = enrollments.filter((e: typeof enrollments[0]) =>
          e.course?.schoolId === filterSchoolId
        );
      }
    } else if (type === "tutor" || currentUser.type === 'teacher') {
      // Get tutor's enrollments
      const tutor = await db.query.tutors.findFirst({
        where: eq(tutors.userId, currentUserId),
      });

      if (!tutor) {
        return notFoundResponse("Tutor profile");
      }

      enrollments = await db.query.tuitionEnrollments.findMany({
        where: eq(tuitionEnrollments.tutorId, tutor.id),
        with: {
          student: true,
          course: true,
        },
        orderBy: [desc(tuitionEnrollments.enrollmentDate)],
      });
    } else {
      // Get student's enrollments
      enrollments = await db.query.tuitionEnrollments.findMany({
        where: eq(tuitionEnrollments.studentId, currentUserId),
        with: {
          tutor: {
            with: {
              user: true,
            },
          },
          course: true,
        },
        orderBy: [desc(tuitionEnrollments.enrollmentDate)],
      });
    }

    return successResponse({ enrollments });
  },
  ['student', 'admin', 'school-admin', 'teacher']
);

// POST /api/tuition/enrollments - Enroll in course
export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user: currentUser } = auth;

    const body = await request.json();
    const { courseId, paymentMethod, paymentId } = body;

    // Get course details
    const course = await db.query.tuitionCourses.findFirst({
      where: eq(tuitionCourses.id, courseId),
    });

    if (!course) {
      return notFoundResponse("Course");
    }

    if (course.status !== "published") {
      return badRequestResponse("Course is not available");
    }

    // Check if already enrolled
    const existing = await db.query.tuitionEnrollments.findFirst({
      where: and(
        eq(tuitionEnrollments.courseId, courseId),
        eq(tuitionEnrollments.studentId, currentUser.id)
      ),
    });

    if (existing) {
      return badRequestResponse("Already enrolled");
    }

    // Check enrollment limit
    if (course.maxStudents && (course.currentEnrollments || 0) >= course.maxStudents) {
      return badRequestResponse("Course is full");
    }

    const price = course.discountPrice || course.price;
    const platformFee = Math.round(price * 0.2); // 20% platform fee
    const tutorEarnings = price - platformFee;

    const now = new Date();
    const [enrollment] = await db.insert(tuitionEnrollments).values({
      id: `enroll_${Date.now()}`,
      courseId,
      studentId: currentUser.id,
      tutorId: course.tutorId,
      status: "active",
      enrollmentDate: now.toISOString().split('T')[0],
      enrolledAt: now,
      completionDate: null,
      completedAt: null,
      sessionsCompleted: 0,
      totalPaid: price,
      amountPaid: price,
      tutorEarnings: tutorEarnings,
      notes: "",
      rating: null,
      review: null,
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Increment course enrollment count
    await db.update(tuitionCourses)
      .set({
        currentEnrollments: (course.currentEnrollments || 0) + 1,
      })
      .where(eq(tuitionCourses.id, courseId));

    return successResponse(enrollment);
  },
  ['student', 'admin', 'school-admin']
);
