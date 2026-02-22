/**
 * GET /api/parent/behavior-logs
 *
 * API for parents to fetch their children's behavior logs
 * (merit/demerit logs created by teachers).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, parents, parentToStudent } from "@/lib/db/schema";
import { teacherBehaviorLogs } from "@/lib/db/teacher-logs-schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['parent']);

    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = authResult;

    // Get parent record
    const parentRecord = await db.query.parents.findFirst({
      where: eq(parents.userId, userId),
    });

    if (!parentRecord) {
      return NextResponse.json({ error: "Parent record not found" }, { status: 404 });
    }

    // Get linked children
    const relationships = await db.query.parentToStudent.findMany({
      where: eq(parentToStudent.parentId, parentRecord.id),
    });

    if (relationships.length === 0) {
      return NextResponse.json({
        success: true,
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
    const studentRecords = await db.query.users.findMany({
      where: inArray(users.id, studentIds),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
      },
    });

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

    return NextResponse.json({
      success: true,
      logs: enrichedLogs,
      children: studentRecords,
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/parent/behavior-logs", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch behavior logs", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
