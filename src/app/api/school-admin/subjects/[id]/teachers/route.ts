/**
 * SUBJECT TEACHERS API
 *
 * GET /api/school-admin/subjects/[id]/teachers - Get teachers assigned to a subject
 * POST /api/school-admin/subjects/[id]/teachers - Assign a teacher to a subject
 * DELETE /api/school-admin/subjects/[id]/teachers - Remove a teacher from a subject
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { teacherAssignments, users, classes, subjects } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get teachers assigned to this subject
export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(["school-admin", "admin", "teacher"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { id: subjectId } = await context.params;

  try {
    console.log("[Subject teachers GET] Fetching teachers for subjectId:", subjectId);

    // Get all teacher assignments for this subject from teacherAssignments table
    const assignments = await db
      .select({
        id: teacherAssignments.id,
        teacherId: teacherAssignments.teacherId,
        role: teacherAssignments.role,
        isPrimary: teacherAssignments.isPrimary,
        classId: teacherAssignments.classId,
        academicYear: teacherAssignments.academicYear,
        teacher: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          employeeId: users.employeeId,
        },
      })
      .from(teacherAssignments)
      .innerJoin(users, eq(teacherAssignments.teacherId, users.id))
      .where(eq(teacherAssignments.subjectId, subjectId));

    // Get all unique classIds in ONE batch query (no N+1)
    const uniqueClassIds = [...new Set(assignments.map((a) => a.classId).filter(Boolean))] as string[];
    const classMap = new Map<string, { id: string; name: string; grade: number; section: string }>();

    if (uniqueClassIds.length > 0) {
      const classData = await db
        .select({ id: classes.id, name: classes.name, grade: classes.grade, section: classes.section })
        .from(classes)
        .where(inArray(classes.id, uniqueClassIds));

      for (const cls of classData) {
        classMap.set(cls.id, cls);
      }
    }

    // Attach class info to assignments
    const assignmentResults = assignments.map((assignment) => ({
      ...assignment,
      class: assignment.classId ? (classMap.get(assignment.classId) || null) : null,
    }));

    // SKIP teachers from signup for performance
    // This was causing the page to load very slowly by querying ALL teachers
    // Teachers should be properly assigned via the teacherAssignments table
    // TODO: Re-enable with proper indexing/school filtering if needed
    const teachersFromSignup: any[] = [];

    // Merge both lists, avoiding duplicates
    const existingTeacherIds = new Set(assignmentResults.map((a) => a.teacherId));
    const uniqueSignupTeachers = teachersFromSignup.filter(
      (t) => !existingTeacherIds.has(t.teacherId)
    );

    const result = [...assignmentResults, ...uniqueSignupTeachers];

    return NextResponse.json({
      success: true,
      data: { assignments: result },
    });
  } catch (error: any) {
    console.error("Subject teachers GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Assign a teacher to a subject
export async function POST(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(["school-admin", "admin"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { id: subjectId } = await context.params;

  try {
    const body = await request.json();
    const { teacherId, role = "subject_expert", isPrimary = false, classId } = body;

    if (!teacherId) {
      return NextResponse.json({ error: "teacherId is required" }, { status: 400 });
    }

    // Verify subject exists
    const subjectData = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, subjectId))
      .limit(1);

    if (subjectData.length === 0) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Get current academic year
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;

    // Check for duplicate assignment
    const existing = await db
      .select()
      .from(teacherAssignments)
      .where(
        and(
          eq(teacherAssignments.teacherId, teacherId),
          eq(teacherAssignments.subjectId, subjectId),
          classId ? eq(teacherAssignments.classId, classId) : eq(teacherAssignments.classId, "")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Teacher already assigned to this subject" }, { status: 400 });
    }

    // If isPrimary is true, remove primary flag from other assignments for this subject/class
    if (isPrimary) {
      await db
        .update(teacherAssignments)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(
          and(
            eq(teacherAssignments.subjectId, subjectId),
            classId ? eq(teacherAssignments.classId, classId) : eq(teacherAssignments.classId, "")
          )
        );
    }

    // Create the assignment
    const newAssignment = {
      id: nanoid(),
      teacherId,
      subjectId,
      classId: classId || null,
      role,
      isPrimary,
      academicYear,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(teacherAssignments).values(newAssignment);

    return NextResponse.json({
      success: true,
      data: { assignment: newAssignment },
    });
  } catch (error: any) {
    console.error("Subject teachers POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove a teacher assignment
export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(["school-admin", "admin"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { id: subjectId } = await context.params;

  try {
    const body = await request.json();
    const { teacherId, classId } = body;

    if (!teacherId) {
      return NextResponse.json({ error: "teacherId is required" }, { status: 400 });
    }

    // Delete the assignment
    await db
      .delete(teacherAssignments)
      .where(
        and(
          eq(teacherAssignments.teacherId, teacherId),
          eq(teacherAssignments.subjectId, subjectId),
          classId ? eq(teacherAssignments.classId, classId) : eq(teacherAssignments.classId, "")
        )
      );

    return NextResponse.json({
      success: true,
      data: { message: "Teacher removed from subject" },
    });
  } catch (error: any) {
    console.error("Subject teachers DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
