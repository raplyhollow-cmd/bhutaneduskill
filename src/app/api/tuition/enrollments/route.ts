import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { tuitionEnrollments, tuitionCourses, users, tutors } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/tuition/enrollments - List enrollments
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user: currentUser, userId: currentUserId } = authResult;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "tutor", "student", or "all" for school-admin
    const schoolId = searchParams.get("schoolId");

    let enrollments: any[];

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
        return NextResponse.json({ error: "Tutor profile not found" }, { status: 404 });
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

    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error("Enrollments fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
  }
}

// POST /api/tuition/enrollments - Enroll in course
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user: currentUser } = authResult;

    const body = await request.json();
    const { courseId, paymentMethod, paymentId } = body;

    // Get course details
    const course = await db.query.tuitionCourses.findFirst({
      where: eq(tuitionCourses.id, courseId),
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.status !== "published") {
      return NextResponse.json({ error: "Course is not available" }, { status: 400 });
    }

    // Check if already enrolled
    const existing = await db.query.tuitionEnrollments.findFirst({
      where: and(
        eq(tuitionEnrollments.courseId, courseId),
        eq(tuitionEnrollments.studentId, currentUser.id)
      ),
    });

    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 400 });
    }

    // Check enrollment limit
    if (course.maxStudents && (course.currentEnrollments || 0) >= course.maxStudents) {
      return NextResponse.json({ error: "Course is full" }, { status: 400 });
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

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
  }
}
