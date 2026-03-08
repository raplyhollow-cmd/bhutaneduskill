/**
 * CLASS ENROLLMENTS API
 *
 * Routes:
 * GET    /api/classes/[id]/enrollments          → list all enrollments for a class
 * POST   /api/classes/[id]/enrollments          → add students to a class
 * PUT    /api/classes/[id]/enrollments/[sid]    → update enrollment (roll number)
 * DELETE /api/classes/[id]/enrollments/[sid]    → remove student from class
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { enrollments, users, students, classes } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - List all enrollments for a class with student details
export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(["school-admin", "admin", "teacher"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { id: classId } = await context.params;

  try {
    // Verify class exists
    const classRecord = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (classRecord.length === 0) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Get enrollments with student details
    const enrollmentList = await db
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        classId: enrollments.classId,
        academicYear: enrollments.academicYear,
        enrollmentDate: enrollments.enrollmentDate,
        status: enrollments.status,
        rollNumber: enrollments.rollNumber,
        section: enrollments.section,
        createdAt: enrollments.createdAt,
        updatedAt: enrollments.updatedAt,
        // Student fields
        studentFirstName: users.firstName,
        studentLastName: users.lastName,
        studentName: users.name,
        studentEmail: users.email,
        studentPhone: users.phone,
        dbStudentId: students.id,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .innerJoin(students, eq(users.id, students.userId))
      .where(eq(enrollments.classId, classId))
      .orderBy(enrollments.rollNumber);

    // Format response
    const formattedEnrollments = enrollmentList.map((e) => ({
      id: e.id,
      studentId: e.studentId,
      classId: e.classId,
      academicYear: e.academicYear,
      enrollmentDate: e.enrollmentDate,
      status: e.status,
      rollNumber: e.rollNumber,
      section: e.section,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      student: {
        id: e.studentId,
        firstName: e.studentFirstName,
        lastName: e.studentLastName,
        name: e.studentName || `${e.studentFirstName || ""} ${e.studentLastName || ""}`.trim(),
        email: e.studentEmail,
        phone: e.studentPhone,
      },
    }));

    return NextResponse.json({
      success: true,
      enrollments: formattedEnrollments,
    });
  } catch (error: any) {
    console.error("Enrollments GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}

// POST - Add students to a class
export async function POST(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(["school-admin", "admin"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { id: classId } = await context.params;

  try {
    const body = await request.json();
    const { studentIds, academicYear, section } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "studentIds array is required" }, { status: 400 });
    }

    // Verify class exists
    const classRecord = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (classRecord.length === 0) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Get current academic year if not provided
    const currentYear = new Date().getFullYear();
    const yearToUse = academicYear || `${currentYear}-${currentYear + 1}`;

    // Check for existing enrollments to avoid duplicates
    const existingEnrollments = await db
      .select({ studentId: enrollments.studentId })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.classId, classId),
          eq(enrollments.academicYear, yearToUse),
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

    // Create new enrollments
    const enrollmentDate = new Date().toISOString().split('T')[0];
    const newEnrollments = newStudentIds.map((studentId: string) => ({
      id: nanoid(),
      studentId,
      classId,
      academicYear: yearToUse,
      enrollmentDate,
      status: "active",
      rollNumber: null,
      section: section || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(enrollments).values(newEnrollments);

    return NextResponse.json({
      success: true,
      message: `${newEnrollments.length} student(s) enrolled successfully`,
      enrolled: newEnrollments,
    });
  } catch (error: any) {
    console.error("Enrollments POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to enroll students" },
      { status: 500 }
    );
  }
}
