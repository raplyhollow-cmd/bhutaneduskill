import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { classes, users } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// POST /api/school-admin/curriculum-assign - Save teacher-subject-class assignments
export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(["school-admin"]);
    if ("error" in authResult) {
      return Response.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    const body = await req.json();
    const { department, grades, sections, academicYear, assignments } = body;

    if (!assignments || assignments.length === 0) {
      return Response.json(
        { error: "No assignments provided", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get school admin's school ID
    const adminRecords = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (adminRecords.length === 0) {
      return Response.json(
        { error: "School admin not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    const schoolId = adminRecords[0].schoolId;
    if (!schoolId) {
      return Response.json(
        { error: "School admin not linked to a school", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Create new assignments by updating classes directly
    const updatedAssignments = [];
    const summary: Record<string, number> = {};

    for (const assignment of assignments) {
      // Find matching class
      const matchingClasses = await db
        .select({ id: classes.id, name: classes.name })
        .from(classes)
        .where(
          and(
            eq(classes.schoolId, schoolId),
            eq(classes.grade, parseInt(assignment.grade)),
            eq(classes.section, assignment.section)
          )
        )
        .limit(1);

      if (matchingClasses.length === 0) {
        // Create class if it doesn't exist
        const classId = `class_${nanoid()}`;
        await db.insert(classes).values({
          id: classId,
          schoolId,
          name: `Class ${assignment.grade}-${assignment.section}`,
          grade: parseInt(assignment.grade),
          section: assignment.section,
          roomNumber: "TBD",
          capacity: 40,
          homeroomTeacherName: "To be assigned",
          classTeacherName: "To be assigned",
          teacherId: assignment.teacherId,
          academicYear,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        updatedAssignments.push(classId);
      } else {
        // Update existing class
        await db
          .update(classes)
          .set({
            teacherId: assignment.teacherId,
            updatedAt: new Date(),
          })
          .where(eq(classes.id, matchingClasses[0].id));
        updatedAssignments.push(matchingClasses[0].id);
      }

      // Track summary by subject
      summary[assignment.subject] = (summary[assignment.subject] || 0) + 1;
    }

    logger.info("Class teacher assignments updated", {
      schoolId,
      department,
      grades,
      sections,
      count: updatedAssignments.length,
    });

    return Response.json({
      data: {
        message: `${updatedAssignments.length} class assignments updated successfully`,
        count: updatedAssignments.length,
        summary,
      },
    } satisfies ApiSuccess<{ message: string; count: number; summary: Record<string, number> }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/curriculum-assign", method: "POST" });
    return Response.json(
      { error: "Failed to save assignments", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// GET /api/school-admin/curriculum-assign - Get existing assignments
export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(["school-admin"]);
    if ("error" in authResult) {
      return Response.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    // Get school admin's school ID
    const adminRecords = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (adminRecords.length === 0) {
      return Response.json(
        { error: "School admin not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    const schoolId = adminRecords[0].schoolId;
    if (!schoolId) {
      return Response.json(
        { error: "School admin not linked to a school", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get classes with teacher assignments
    const classesData = await db
      .select({
        id: classes.id,
        name: classes.name,
        grade: classes.grade,
        section: classes.section,
        teacherId: classes.teacherId,
        academicYear: classes.academicYear,
      })
      .from(classes)
      .where(eq(classes.schoolId, schoolId))
      .orderBy(classes.grade, classes.section)
      .limit(200);

    // Get teacher names
    const teacherIds = classesData.map((c) => c.teacherId).filter(Boolean);
    const teachersData = teacherIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(sql`${users.id} IN ${teacherIds}`)
      : [];

    const teacherMap = new Map(teachersData.map((t) => [t.id, t.name]));

    const assignments = classesData.map((c) => ({
      classId: c.id,
      className: c.name,
      grade: c.grade?.toString(),
      section: c.section,
      teacherId: c.teacherId,
      teacherName: teacherMap.get(c.teacherId || "") || "Not assigned",
      academicYear: c.academicYear,
    }));

    return Response.json({
      data: { assignments },
    } satisfies ApiSuccess<{ assignments: typeof assignments }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/curriculum-assign", method: "GET" });
    return Response.json(
      { error: "Failed to fetch assignments", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
