/**
 * PERMISSIONS HELPER
 *
 * Authorization helpers for class-level operations
 * Supports class teacher distinction via teacher_assignments.role
 */

import { db } from "@/lib/db";
import { classes, teacherAssignments } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

/**
 * Check if user is the class teacher for a specific class
 * Checks both classes.classTeacherId AND teacher_assignments.role
 */
export async function isClassTeacher(classId: string, userId: string): Promise<boolean> {
  // Check 1: classes.classTeacherId field
  const classRecord = await db
    .select({ classTeacherId: classes.classTeacherId })
    .from(classes)
    .where(eq(classes.id, classId))
    .limit(1);

  if (classRecord[0]?.classTeacherId === userId) return true;

  // Check 2: teacher_assignments with role='homeroom' or 'both'
  const assignment = await db
    .select()
    .from(teacherAssignments)
    .where(and(
      eq(teacherAssignments.classId, classId),
      eq(teacherAssignments.teacherId, userId),
      eq(teacherAssignments.isActive, true),
      sql`role IN ('homeroom', 'both')`
    ))
    .limit(1);

  return assignment.length > 0;
}

/**
 * Require user to be a class teacher for the specified class
 * School admins and platform admins bypass this check
 */
export async function requireClassTeacher(classId: string) {
  const auth = await requireAuth(['teacher', 'school-admin', 'admin']);
  if ('error' in auth) return auth;

  // School admins and platform admins can manage any class
  if (auth.user.type === 'school-admin' || auth.user.type === 'admin') {
    return auth;
  }

  // Teachers must be assigned as class teacher to this class
  const isAuthorized = await isClassTeacher(classId, auth.userId);
  if (!isAuthorized) {
    return { error: "Only class teachers can perform this action", status: 403 };
  }

  return auth;
}

/**
 * Get all classes where the user is the class teacher
 */
export async function getClassTeacherClasses(userId: string) {
  const assignments = await db
    .select({ classId: teacherAssignments.classId })
    .from(teacherAssignments)
    .where(and(
      eq(teacherAssignments.teacherId, userId),
      eq(teacherAssignments.isActive, true),
      sql`role IN ('homeroom', 'both')`
    ));

  // Also check classes.classTeacherId
  const directClasses = await db
    .select({ id: classes.id })
    .from(classes)
    .where(eq(classes.classTeacherId, userId));

  // Combine and dedupe
  const allClassIds = new Set([
    ...assignments.map(a => a.classId),
    ...directClasses.map(c => c.id)
  ]);

  return Array.from(allClassIds);
}
