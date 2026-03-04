/**
 * GET /api/parent/behavior-logs
 *
 * API for parents to fetch their children's behavior logs
 * (merit/demerit logs created by teachers).
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, parents, parentToStudent } from "@/lib/db/schema";
import { teacherBehaviorLogs } from "@/lib/db/teacher-logs-schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    // Get parent record
    const [parentRecord] = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (!parentRecord) {
      return errorResponse("Parent record not found", 404);
    }

    // Get linked children
    const relationships = await db
      .select()
      .from(parentToStudent)
      .where(eq(parentToStudent.parentId, parentRecord.id));

    if (relationships.length === 0) {
      return successResponse({
        logs: [],
        children: [],
      });
    }

    const studentIds = relationships.map((r) => r.studentId);

    // Fetch behavior logs for these children
    const logs = await db
      .select({
        id: teacherBehaviorLogs.id,
        studentId: teacherBehaviorLogs.studentId,
        type: teacherBehaviorLogs.type,
        category: teacherBehaviorLogs.category,
        points: teacherBehaviorLogs.points,
        description: teacherBehaviorLogs.description,
        actionTaken: teacherBehaviorLogs.actionTaken,
        severity: teacherBehaviorLogs.severity,
        createdAt: teacherBehaviorLogs.createdAt,
        teacher: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          name: users.name,
        },
      })
      .from(teacherBehaviorLogs)
      .innerJoin(users, eq(teacherBehaviorLogs.teacherId, users.id))
      .where(inArray(teacherBehaviorLogs.studentId, studentIds))
      .orderBy(desc(teacherBehaviorLogs.createdAt))
      .limit(50);

    // Get student names for the logs
    const studentRecords = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        name: users.name,
      })
      .from(users)
      .where(inArray(users.id, studentIds));

    const studentMap = new Map(studentRecords.map((s) => [s.id, s]));

    // Enrich logs with student names
    const enrichedLogs = logs.map((log) => ({
      ...log,
      student: studentMap.get(log.studentId),
    }));

    logger.info("Fetched behavior logs for parent", {
      route: "/api/parent/behavior-logs",
      userId,
      logCount: enrichedLogs.length,
    });

    return successResponse({
      logs: enrichedLogs,
      children: studentRecords,
    });
  },
  ['parent']
);
