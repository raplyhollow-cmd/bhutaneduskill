/**
 * TEACHER BEHAVIOR LOGGING API
 *
 * POST /api/teacher/behavior - Log a merit/demerit incident
 * GET /api/teacher/behavior - Get behavior logs for teacher's students
 */

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teacherBehaviorLogs } from "@/lib/db/teacher-logs-schema";
import { users, classes, notifications, parentToStudent } from "@/lib/db/schema";
import { eq, desc, and, inArray, asc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createApiRoute, type AuthContext } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

/**
 * POST - Log a behavior incident (merit/demerit)
 */
export const POST = createApiRoute(
  async (request: NextRequest, auth: AuthContext) => {
    const { userId, user: currentUser } = auth;

    const body = await request.json();
    const { studentId, classId, type, category, points, description, actionTaken, severity } = body;

    // Validate required fields
    if (!studentId || !type || !category || !description) {
      return errorResponse("Missing required fields: studentId, type, category, description");
    }

    // Validate type
    if (!['merit', 'demerit'].includes(type)) {
      return errorResponse("Type must be 'merit' or 'demerit'");
    }

    // Validate category
    const validCategories = ['attendance', 'participation', 'discipline', 'homework', 'leadership', 'other'];
    if (!validCategories.includes(category)) {
      return errorResponse(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    // Validate severity
    if (severity && !['low', 'medium', 'high'].includes(severity)) {
      return errorResponse("Severity must be 'low', 'medium', or 'high'");
    }

    // Verify student exists
    const [student] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        parentId: users.parentId,
      })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student[0]) {
      return errorResponse("Student not found");
    }

    // If classId provided, verify teacher teaches this class
    if (classId) {
      const classRecord = await db.select().from(classes).where(eq(classes.id, classId)).limit(1).then(r => r[0]);

      if (!classRecord || classRecord.teacherId !== userId) {
        return errorResponse("You do not teach this class");
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
        const parentRelationship = await db.select().from(parentToStudent).where(and(
            eq(parentToStudent.parentId, student.parentId),
            eq(parentToStudent.studentId, studentId)
          )).limit(1).then(r => r[0]);

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
            type: 'alert',
            priority: severity === 'high' ? 'urgent' : 'normal',
            title: `Behavior Alert: Disciplinary Incident`,
            message: `${currentUser.firstName} ${currentUser.lastName} logged a ${category} ${type} for ${student.firstName} ${student.lastName || ''}. ${description}`,
            targetAudience: 'specific',
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
          });

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

    return successResponse({
      ...newLog,
      parentNotified,
      studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
    });
  },
  ['teacher']
);

/**
 * GET - Retrieve behavior logs
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth: AuthContext) => {
    const { userId, user: currentUser } = auth;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get teacher's classes if requesting as teacher
    let teacherClassIds: string[] = [];
    if (currentUser.type === 'teacher') {
      const teacherClasses = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.teacherId, userId));
      teacherClassIds = teacherClasses.map((c) => c.id);
    }

    // Build query conditions
    const conditions = [];

    if (currentUser.type === 'teacher') {
      if (classId) {
        // Verify teacher teaches this class
        if (!teacherClassIds.includes(classId)) {
          return errorResponse("You do not teach this class");
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
    const logs = await db.select()
      .from(teacherBehaviorLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(teacherBehaviorLogs.createdAt))
      .limit(limit);

    // Enrich with student and teacher names
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const [studentData, teacherData] = await Promise.all([
      db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage,
      })
      .from(users)
      .where(eq(users.id, log.studentId))
      .limit(1),
      db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, log.teacherId))
      .limit(1),
    ]);
    const student = studentData[0];
    const teacher = teacherData[0];

        return {
          ...log,
          studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown',
          studentImage: student?.profileImage || null,
          teacherName: teacher ? `${teacher.firstName} ${teacher.lastName || ''}`.trim() : 'Unknown',
        };
      })
    );

    return successResponse({
      data: enrichedLogs,
      count: enrichedLogs.length,
    });
  },
  ['teacher', 'admin', 'school-admin']
);