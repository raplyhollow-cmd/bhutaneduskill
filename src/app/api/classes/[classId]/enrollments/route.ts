import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { enrollments, users, classes } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/classes/[classId]/enrollments
 * Get all students enrolled in a class
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, user } = authResult;
    const { classId } = await params;

    // Verify the class exists
    const classRecord = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    if (!classRecord) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Teachers can only view enrollments for their own classes
    if (user.type === 'teacher' && classRecord.teacherId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all enrollments for this class
    const enrollmentRecords = await db.query.enrollments.findMany({
      where: and(
        eq(enrollments.classId, classId),
        eq(enrollments.status, 'active')
      ),
      with: {
        student: true,
      },
      orderBy: desc(enrollments.createdAt),
    });

    // Transform the response to include student details
    const enrollmentsWithStudents = enrollmentRecords.map((enrollment: any) => ({
      id: enrollment.id,
      studentId: enrollment.studentId,
      classId: enrollment.classId,
      academicYear: enrollment.academicYear,
      enrollmentDate: enrollment.enrollmentDate,
      status: enrollment.status,
      rollNumber: enrollment.rollNumber,
      section: enrollment.section,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
      student: enrollment.student ? {
        id: enrollment.student.id,
        name: enrollment.student.name,
        firstName: enrollment.student.firstName,
        lastName: enrollment.student.lastName,
        email: enrollment.student.email,
        clerkUserId: enrollment.student.clerkUserId,
        type: enrollment.student.type,
      } : null,
    }));

    logger.info("Fetched class enrollments", { classId, count: enrollmentsWithStudents.length, userId });

    return NextResponse.json({
      success: true,
      enrollments: enrollmentsWithStudents,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/classes/[classId]/enrollments", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/classes/[classId]/enrollments
 * Add students to a class
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = authResult;
    const { classId } = await params;
    const body = await request.json();

    const { studentIds, academicYear, rollNumbers, section } = body;

    // Validate required fields
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "studentIds is required and must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!academicYear) {
      return NextResponse.json(
        { error: "academicYear is required" },
        { status: 400 }
      );
    }

    // Verify the class exists
    const classRecord = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    if (!classRecord) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Create enrollment records for each student
    const enrollmentPromises = studentIds.map(async (studentId: string) => {
      const enrollmentId = `enr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const now = new Date().toISOString();

      return db.insert(enrollments).values({
        id: enrollmentId,
        studentId,
        classId,
        academicYear,
        enrollmentDate: now,
        status: 'active',
        rollNumber: rollNumbers?.[studentId] || null,
        section: section || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
    });

    const results = await Promise.all(enrollmentPromises);
    const newEnrollments = results.flat();

    logger.info("Created enrollments", { classId, count: newEnrollments.length, userId });

    return NextResponse.json({
      success: true,
      enrollments: newEnrollments,
    }, { status: 201 });
  } catch (error) {
    logger.apiError(error, { route: "/api/classes/[classId]/enrollments", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create enrollments" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/classes/[classId]/enrollments/[studentId]
 * Note: This handler is for the dynamic route at /api/classes/[classId]/enrollments/[studentId]
 * Delete functionality should be implemented in a separate route file
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = authResult;
    const { classId } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId query parameter is required" },
        { status: 400 }
      );
    }

    // Find the enrollment record
    const enrollmentRecord = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.classId, classId),
        eq(enrollments.studentId, studentId)
      ),
    });

    if (!enrollmentRecord) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Delete the enrollment
    await db
      .delete(enrollments)
      .where(eq(enrollments.id, enrollmentRecord.id));

    logger.info("Deleted enrollment", { classId, studentId, userId });

    return NextResponse.json({
      success: true,
      message: "Student removed from class successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/classes/[classId]/enrollments", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete enrollment" },
      { status: 500 }
    );
  }
}
