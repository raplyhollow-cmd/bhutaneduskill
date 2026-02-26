import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, parents, parentToStudent, attendance as attendanceTable, classes, enrollments } from "@/lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse, forbiddenResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import type { AttendanceRecord, AttendanceStatistics } from "@/types";

/**
 * GET /api/parent/attendance - Get child's attendance records
 *
 * Query params:
 * - childId: required - the child's user ID
 * - startDate: optional - filter start date
 * - endDate: optional - filter end date
 * - limit: optional - max records (default 30)
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */
export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "30");

    if (!childId) {
      return badRequestResponse("childId is required");
    }

    try {
      // FERPA COMPLIANCE: Verify parent-child relationship via parent_to_student table
      const [parentRecord] = await db
        .select()
        .from(parents)
        .where(eq(parents.userId, userId))
        .limit(1);

      if (!parentRecord) {
        logger.warn("No parent record found for user", { userId });
        return forbiddenResponse("Parent record not found");
      }

      const [relationship] = await db
        .select()
        .from(parentToStudent)
        .where(
          and(
            eq(parentToStudent.parentId, parentRecord.id),
            eq(parentToStudent.studentId, childId)
          )
        )
        .limit(1);

      if (!relationship) {
        logger.warn("Parent-child relationship not verified", {
          parentId: parentRecord.id,
          childId,
        });
        return forbiddenResponse("Child not found or access denied");
      }

      // Verify the child exists and is a student
      const child = await db.query.users.findFirst({
        where: and(eq(users.id, childId), eq(users.type, "student")),
      });

      if (!child) {
        return notFoundResponse("Child");
      }

      // Build conditions
      let conditions = [eq(attendanceTable.studentId, childId)];

      if (startDate) {
        conditions.push(gte(attendanceTable.date, startDate));
      }
      if (endDate) {
        conditions.push(lte(attendanceTable.date, endDate));
      }

      // Fetch attendance records
      const records = await db.query.attendance.findMany({
        where: and(...conditions),
        orderBy: [desc(attendanceTable.date)],
        limit,
      });

      // Get child's class info
      const childEnrollment = await db.query.enrollments.findFirst({
        where: eq(enrollments.studentId, childId),
        with: {
          class: true,
        },
        orderBy: [desc(enrollments.createdAt)],
      });

      const childClass = childEnrollment?.class?.[0];

      // Calculate statistics
      const stats: AttendanceStatistics = {
        total: records.length,
        present: records.filter(r => r.status === "present").length,
        absent: records.filter(r => r.status === "absent").length,
        late: records.filter(r => r.status === "late").length,
        excused: records.filter(r => r.status === "excused").length,
        percentage: records.length > 0
          ? Math.round((records.filter(r => r.status === "present" || r.status === "excused").length / records.length) * 100)
          : 0,
      };

      // Transform records for frontend
      const attendance: AttendanceRecord[] = records.map(r => ({
        id: r.id,
        studentId: r.studentId,
        classId: r.classId,
        date: r.date,
        status: r.status as "present" | "absent" | "late" | "excused",
        notes: r.notes ?? undefined,
        recordedBy: r.recordedByBy ?? undefined,
        createdAt: r.createdAt,
      }));

      return successResponse({
        attendance,
        stats,
        child: {
          id: child.id,
          name: `${child.firstName} ${child.lastName || ""}`.trim(),
          classGrade: child.classGrade,
          section: child.section,
        },
        class: childClass ? {
          id: childClass.id,
          name: childClass.name,
          grade: childClass.grade,
          section: childClass.section,
        } : null,
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/parent/attendance", method: "GET" });
      return errorResponse("Failed to fetch attendance", 500);
    }
  },
  ['parent']
);
