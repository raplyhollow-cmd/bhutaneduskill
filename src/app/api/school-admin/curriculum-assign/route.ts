/**
 * SCHOOL ADMIN CURRICULUM ASSIGN API
 *
 * GET /api/school-admin/curriculum-assign - Get existing assignments
 * POST /api/school-admin/curriculum-assign - Save teacher-subject-class assignments
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { classes, users } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";

// POST /api/school-admin/curriculum-assign - Save teacher-subject-class assignments
export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const body = await req.json();
    const { department, grades, sections, academicYear, assignments } = body;

    if (!assignments || assignments.length === 0) {
      return badRequestResponse("No assignments provided");
    }

    // Get school admin's school ID
    const adminRecords = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (adminRecords.length === 0) {
      return errorResponse("School admin not found", 404);
    }

    const schoolId = adminRecords[0].schoolId;
    if (!schoolId) {
      return badRequestResponse("School admin not linked to a school");
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

    return successResponse({
      message: `${updatedAssignments.length} class assignments updated successfully`,
      count: updatedAssignments.length,
      summary,
    });
  },
  ["school-admin"]
);

// GET /api/school-admin/curriculum-assign - Get existing assignments
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    // Get school admin's school ID
    const adminRecords = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (adminRecords.length === 0) {
      return errorResponse("School admin not found", 404);
    }

    const schoolId = adminRecords[0].schoolId;
    if (!schoolId) {
      return badRequestResponse("School admin not linked to a school");
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

    return successResponse({ assignments });
  },
  ["school-admin"]
);
