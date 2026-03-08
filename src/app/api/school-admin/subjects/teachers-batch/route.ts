/**
 * BATCH SUBJECT TEACHERS API
 *
 * GET /api/school-admin/subjects/teachers-batch?subjectIds=id1,id2,id3
 *
 * Returns all teacher assignments for multiple subjects in a single query.
 * This eliminates N+1 API calls when loading the subjects page.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { teacherAssignments, users, classes, subjects } from "@/lib/db/schema";
import { eq, inArray, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["school-admin", "admin", "teacher"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subjectIds = searchParams.get("subjectIds")?.split(",").filter(Boolean);

    if (!subjectIds || subjectIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { assignments: [] },
      });
    }

    console.log("[Batch teachers] Fetching for subjectIds:", subjectIds.length);

    // Get all teacher assignments for these subjects in ONE query
    const assignments = await db
      .select({
        id: teacherAssignments.id,
        teacherId: teacherAssignments.teacherId,
        subjectId: teacherAssignments.subjectId,
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
      .where(inArray(teacherAssignments.subjectId, subjectIds));

    console.log("[Batch teachers] Found assignments:", assignments.length);

    // Get all unique classIds in ONE query
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

    // Attach class info and group by subjectId
    const assignmentsBySubject: Record<string, any[]> = {};

    for (const assignment of assignments) {
      const classInfo = assignment.classId ? classMap.get(assignment.classId) || null : null;

      if (!assignmentsBySubject[assignment.subjectId]) {
        assignmentsBySubject[assignment.subjectId] = [];
      }

      assignmentsBySubject[assignment.subjectId].push({
        ...assignment,
        class: classInfo,
      });
    }

    // Also get teachers who selected subjects during signup (optional - skip for speed)
    // This can be added later if needed

    return NextResponse.json({
      success: true,
      data: { assignments: assignmentsBySubject },
    });
  } catch (error: any) {
    console.error("Batch teachers GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
