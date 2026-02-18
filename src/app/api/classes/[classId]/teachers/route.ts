import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { teacherAssignments, users, classes, subjects } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/classes/[classId]/teachers
 * Get all teachers assigned to a class
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

    // Get all teacher assignments for this class
    const assignmentRecords = await db.query.teacherAssignments.findMany({
      where: and(
        eq(teacherAssignments.classId, classId),
        eq(teacherAssignments.isActive, true)
      ),
      with: {
        teacher: true,
        subject: true,
      },
      orderBy: desc(teacherAssignments.createdAt),
    });

    // Transform the response to include teacher and subject details
    const assignmentsWithDetails = assignmentRecords.map((assignment: any) => ({
      id: assignment.id,
      teacherId: assignment.teacherId,
      classId: assignment.classId,
      subjectId: assignment.subjectId,
      academicYear: assignment.academicYear,
      role: assignment.role,
      isPrimary: assignment.isPrimary,
      isActive: assignment.isActive,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      teacher: assignment.teacher ? {
        id: assignment.teacher.id,
        name: assignment.teacher.name,
        firstName: assignment.teacher.firstName,
        lastName: assignment.teacher.lastName,
        email: assignment.teacher.email,
        employeeId: assignment.teacher.employeeId,
        type: assignment.teacher.type,
      } : null,
      subject: assignment.subject ? {
        id: assignment.subject.id,
        name: assignment.subject.name,
        code: assignment.subject.code,
      } : null,
    }));

    logger.info("Fetched class teacher assignments", { classId, count: assignmentsWithDetails.length, userId });

    return NextResponse.json({
      success: true,
      assignments: assignmentsWithDetails,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/classes/[classId]/teachers", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch teacher assignments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/classes/[classId]/teachers
 * Assign a teacher to a class
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

    const { teacherId, subjectId, role, isPrimary } = body;

    // Validate required fields
    if (!teacherId) {
      return NextResponse.json(
        { error: "teacherId is required" },
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

    // Verify the teacher exists
    const teacherRecord = await db.query.users.findFirst({
      where: eq(users.id, teacherId),
    });

    if (!teacherRecord) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Verify the subject exists if provided
    if (subjectId) {
      const subjectRecord = await db.query.subjects.findFirst({
        where: eq(subjects.id, subjectId),
      });

      if (!subjectRecord) {
        return NextResponse.json({ error: "Subject not found" }, { status: 404 });
      }
    }

    // Determine role based on isPrimary flag if not explicitly provided
    let assignmentRole = role || 'subject_teacher';
    if (isPrimary && !role) {
      assignmentRole = 'homeroom';
    }

    // Create the teacher assignment
    const assignmentId = `ta_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const [newAssignment] = await db.insert(teacherAssignments).values({
      id: assignmentId,
      teacherId,
      classId,
      subjectId: subjectId || null,
      academicYear: classRecord.academicYear || new Date().getFullYear().toString(),
      role: assignmentRole,
      isPrimary: isPrimary ?? false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    logger.info("Created teacher assignment", { classId, teacherId, role: assignmentRole, userId });

    return NextResponse.json({
      success: true,
      assignment: newAssignment,
    }, { status: 201 });
  } catch (error) {
    logger.apiError(error, { route: "/api/classes/[classId]/teachers", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create teacher assignment" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/classes/[classId]/teachers
 * Remove a teacher assignment from a class
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
    const teacherId = searchParams.get('teacherId');
    const subjectId = searchParams.get('subjectId');

    if (!teacherId) {
      return NextResponse.json(
        { error: "teacherId query parameter is required" },
        { status: 400 }
      );
    }

    // Build the where conditions
    const conditions = [
      eq(teacherAssignments.classId, classId),
      eq(teacherAssignments.teacherId, teacherId),
    ];

    // If subjectId is provided, include it in the conditions
    if (subjectId) {
      conditions.push(eq(teacherAssignments.subjectId, subjectId));
    }

    // Find the assignment record
    const assignmentRecord = await db.query.teacherAssignments.findFirst({
      where: and(...conditions),
    });

    if (!assignmentRecord) {
      return NextResponse.json({ error: "Teacher assignment not found" }, { status: 404 });
    }

    // Delete the assignment
    await db
      .delete(teacherAssignments)
      .where(eq(teacherAssignments.id, assignmentRecord.id));

    logger.info("Deleted teacher assignment", { classId, teacherId, subjectId, userId });

    return NextResponse.json({
      success: true,
      message: "Teacher removed from class successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/classes/[classId]/teachers", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete teacher assignment" },
      { status: 500 }
    );
  }
}
