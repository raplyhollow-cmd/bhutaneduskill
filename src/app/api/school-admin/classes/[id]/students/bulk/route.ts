/**
 * BULK ADD STUDENTS TO CLASS
 *
 * POST /api/school-admin/classes/[id]/students/bulk
 *
 * Adds multiple students to a class by creating enrollment records.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { enrollments, classes, users, students } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(["school-admin", "admin"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { id: classId } = await context.params;

  try {
    const body = await request.json();
    const { studentIds } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "studentIds array is required" }, { status: 400 });
    }

    console.log("[Bulk Add Students] Adding students to class:", { classId, studentIds });

    // Verify class exists
    const classRecord = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (classRecord.length === 0) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const classInfo = classRecord[0];

    // Get current academic year
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;

    // Check for existing enrollments
    const existingEnrollments = await db
      .select({ studentId: enrollments.studentId })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.classId, classId),
          eq(enrollments.academicYear, academicYear),
          inArray(enrollments.studentId, studentIds)
        )
      );

    const existingStudentIds = new Set(existingEnrollments.map((e) => e.studentId));
    const newStudentIds = studentIds.filter((id: string) => !existingStudentIds.has(id));

    if (newStudentIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All students are already enrolled in this class",
        enrolled: [],
      });
    }

    // Get student records to find their userIds
    const studentRecords = await db
      .select({ id: students.id, userId: students.userId })
      .from(students)
      .where(inArray(students.id, newStudentIds));

    // Create enrollment records
    const enrollmentDate = new Date().toISOString().split('T')[0];
    const newEnrollments = studentRecords.map((student) => ({
      id: nanoid(),
      studentId: student.userId, // Store userId in studentId field
      classId,
      academicYear,
      enrollmentDate,
      status: "active",
      rollNumber: null,
      section: classInfo.section || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(enrollments).values(newEnrollments);

    // Also update students.currentClass for each student
    for (const student of studentRecords) {
      await db
        .update(students)
        .set({ currentClass: classId, updatedAt: new Date() })
        .where(eq(students.id, student.id));
    }

    console.log("[Bulk Add Students] Enrolled and updated students:", { count: studentRecords.length });

    return NextResponse.json({
      success: true,
      message: `${newEnrollments.length} student(s) enrolled successfully`,
      enrolled: newEnrollments,
    });
  } catch (error: any) {
    console.error("[Bulk Add Students] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to enroll students" },
      { status: 500 }
    );
  }
}
