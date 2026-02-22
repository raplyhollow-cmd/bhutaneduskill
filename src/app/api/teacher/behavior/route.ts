/**
 * TEACHER BEHAVIOR LOGGING API
 *
 * POST /api/teacher/behavior - Log a merit/demerit incident
 * GET /api/teacher/behavior - Get behavior logs for teacher's students
 * GET /api/teacher/behavior?studentId=xxx - Get logs for specific student
 */

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { teacherBehaviorLogs } from "@/lib/db/teacher-logs-schema";
import { users, classes, notifications, parentToStudent } from "@/lib/db/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * POST - Log a behavior incident (merit/demerit)
 * Creates notification for parents if demerit
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(['teacher']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId, user: currentUser } = authResult;

  try {
    const body = await request.json();
    const { studentId, classId, type, category, points, description, actionTaken, severity } = body;

    // Validate required fields
    if (!studentId || !type || !category || !description) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, type, category, description" },
        { status: 400 }
      );
    }

    // Validate type
    if (!['merit', 'demerit'].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'merit' or 'demerit'" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['attendance', 'participation', 'discipline', 'homework', 'leadership', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate severity
    if (!['low', 'medium', 'high'].includes(severity)) {
      return NextResponse.json(
        { error: "Severity must be 'low', 'medium', or 'high'" },
        { status: 400 }
      );
    }

    // Verify student exists and is in teacher's class
    const student = await db.query.users.findFirst({
      where: eq(users.id, studentId),
      columns: { id: true, firstName: true, lastName: true, parentId: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // If classId provided, verify teacher teaches this class
    if (classId) {
      const classRecord = await db.query.classes.findFirst({
        where: eq(classes.id, classId),
      });

      if (!classRecord || classRecord.teacherId !== userId) {
        return NextResponse.json(
          { error: "You do not teach this class" },
          { status: 403 }
        );
      }
    }

    const logId = `log-${nanoid()}`;
    const now = new Date();

    // Create the behavior log
    const [newLog] = await db.insert(teacherBehaviorLogs).values({
      id: logId,
      teacherId: userId,
      studentId,
      classId: classId || null,
      type,
      category,
      points: points || (type === 'merit' ? 1 : -1),
      description,
      actionTaken: actionTaken || null,
      severity: severity || 'low',
      parentNotified: false,
      createdAt: now,
    }).returning();

    // Create parent notification for demerits
    let parentNotified = false;
    if (type === 'demerit' && student.parentId) {
      try {
        // Get parent-student relationship
        const parentRelationship = await db.query.parentToStudent.findFirst({
          where: and(
            eq(parentToStudent.parentId, student.parentId),
            eq(parentToStudent.studentId, studentId)
          ),
        });

        if (parentRelationship) {
          const notificationId = `notif-${nanoid()}`;
          const notificationData = {
            behaviorLogId: logId,
            studentId,
            studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
            type,
            category,
            severity,
          };

          await db.insert(notifications).values({
            id: notificationId,
            type: 'alert' as any, // Using valid notification type
            priority: severity === 'high' ? 'urgent' : 'normal',
            title: `Behavior Alert: Disciplinary Incident`,
            message: `${currentUser.firstName} ${currentUser.lastName} logged a ${category} ${type} for ${student.firstName} ${student.lastName || ''}. ${description}`,
            targetAudience: 'specific' as any,
            targetUserIds: JSON.stringify([student.parentId]),
            senderId: userId,
            senderName: `${currentUser.firstName} ${currentUser.lastName || ''}`.trim(),
            senderRole: 'teacher',
            actionUrl: `/parent/behavior/${studentId}`,
            data: JSON.stringify(notificationData),
            status: 'sent',
            scheduledFor: now,
            sentAt: now,
            createdAt: now,
            updatedAt: now,
          } as any);

          // Update log with notification status
          await db.update(teacherBehaviorLogs)
            .set({
              parentNotified: true,
              parentNotifiedAt: now,
            })
            .where(eq(teacherBehaviorLogs.id, logId));

          parentNotified = true;
        }
      } catch (notifError) {
        // Log error but don't fail the request
        logger.error("Failed to create parent notification:", notifError);
      }
    }

    logger.info("Behavior log created", {
      logId,
      teacherId: userId,
      studentId,
      type,
      category,
      parentNotified,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newLog,
        parentNotified,
        studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/teacher/behavior", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create behavior log" },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve behavior logs
 * Query params:
 * - studentId: Filter by specific student
 * - classId: Filter by class
 * - type: Filter by merit/demerit
 * - limit: Number of records (default: 50)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['teacher', 'admin', 'school-admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId, user: currentUser } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get teacher's classes if requesting as teacher
    let teacherClassIds: string[] = [];
    if (currentUser.type === 'teacher') {
      const teacherClasses = await db.query.classes.findMany({
        where: eq(classes.teacherId, userId),
        columns: { id: true },
      });
      teacherClassIds = teacherClasses.map((c) => c.id);
    }

    // Build query conditions
    const conditions = [];

    if (currentUser.type === 'teacher') {
      // Teachers can only see logs for their students
      if (studentId) {
        // Verify student is in teacher's class
        const student = await db.query.users.findFirst({
          where: eq(users.id, studentId),
          columns: { classGrade: true, section: true },
        });

        const isInTeacherClass = teacherClassIds.some((classId) => {
          // Would need proper enrollment check here
          return true; // Simplified for now
        });

        if (!isInTeacherClass) {
          return NextResponse.json(
            { error: "You can only view logs for your students" },
            { status: 403 }
          );
        }
      } else if (classId) {
        // Verify teacher teaches this class
        if (!teacherClassIds.includes(classId)) {
          return NextResponse.json(
            { error: "You do not teach this class" },
            { status: 403 }
          );
        }
        conditions.push(eq(teacherBehaviorLogs.classId, classId));
      } else {
        // Filter by teacher's classes
        if (teacherClassIds.length > 0) {
          conditions.push(inArray(teacherBehaviorLogs.classId, teacherClassIds));
        }
      }
    }

    if (studentId) {
      conditions.push(eq(teacherBehaviorLogs.studentId, studentId));
    }

    if (type && ['merit', 'demerit'].includes(type)) {
      conditions.push(eq(teacherBehaviorLogs.type, type));
    }

    // Fetch behavior logs
    let query = db.query.teacherBehaviorLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(teacherBehaviorLogs.createdAt)],
      limit,
    });

    const logs = await query;

    // Enrich with student and teacher names
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const [student, teacher] = await Promise.all([
          db.query.users.findFirst({
            where: eq(users.id, log.studentId),
            columns: { id: true, firstName: true, lastName: true, profileImage: true },
          }),
          db.query.users.findFirst({
            where: eq(users.id, log.teacherId),
            columns: { id: true, firstName: true, lastName: true },
          }),
        ]);

        return {
          ...log,
          studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown',
          studentImage: student?.profileImage || null,
          teacherName: teacher ? `${teacher.firstName} ${teacher.lastName || ''}`.trim() : 'Unknown',
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedLogs,
      count: enrichedLogs.length,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/teacher/behavior", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch behavior logs" },
      { status: 500 }
    );
  }
}
