/**
 * PARENT DATA FETCHING UTILITIES
 *
 * Server-side data fetching functions for parent portal.
 * All functions verify parent-child relationships for FERPA compliance.
 *
 * CRITICAL: Always use verifyParentChildAccess() before returning child data
 */

import { db } from "@/lib/db";
import { parents, parentToStudent, users, enrollments, attendance, homework, homeworkSubmissions, studentFees, classes, subjects } from "@/lib/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface ParentChild {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  classGrade: number | null;
  section: string | null;
  schoolId: string | null;
  relationshipType: string;
  isPrimaryContact: boolean;
}

export type AttendanceRecord = typeof attendance.$inferSelect;
export type HomeworkRecord = typeof homework.$inferSelect;
export type StudentFeeRecord = typeof studentFees.$inferSelect;

export interface ParentChildWithEnrollment extends ParentChild {
  currentClass?: {
    id: string;
    name: string;
    grade: number;
    section: string | null;
  } | null;
}

// ============================================================================
// FERPA COMPLIANCE HELPERS
// ============================================================================

/**
 * Verify that a parent has access to a specific child's data.
 * Uses the parent_to_student join table for proper relationship verification.
 *
 * @param userId - The authenticated user's database ID
 * @param childId - The child's user ID to verify access to
 * @returns true if access is granted, false otherwise
 */
export async function verifyParentChildAccess(userId: string, childId: string): Promise<boolean> {
  try {
    // Get the parent record for this user
    const [parentRecord] = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (!parentRecord) {
      logger.warn("Parent record not found for user", { userId });
      return false;
    }

    // Verify the child is linked to this parent via parent_to_student join table
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
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Error verifying parent-child access", error);
    return false;
  }
}

/**
 * Get all children linked to a parent via parent_to_student join table.
 * This is the FERPA-compliant way to fetch parent's children.
 *
 * @param userId - The authenticated user's database ID
 * @returns Array of children with relationship details
 */
export async function getParentChildren(userId: string): Promise<ParentChild[]> {
  try {
    // Get the parent record for this user
    const [parentRecord] = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (!parentRecord) {
      logger.warn("Parent record not found for user", { userId });
      return [];
    }

    // Get all parent-student relationships
    const relationships = await db
      .select()
      .from(parentToStudent)
      .where(eq(parentToStudent.parentId, parentRecord.id));

    if (relationships.length === 0) {
      return [];
    }

    const studentIds = relationships.map((r) => r.studentId);

    // Build relationship map
    const relationshipMap = new Map(
      relationships.map((r) => [
        r.studentId,
        {
          relationshipType: r.relationshipType,
          isPrimaryContact: r.isPrimaryContact,
        },
      ])
    );

    // Get all students via user table
    const linkedChildren = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        name: users.name,
        classGrade: users.classGrade,
        section: users.section,
        schoolId: users.schoolId,
      })
      .from(users)
      .where(
        and(
          eq(users.type, "student"),
          inArray(users.id, studentIds)
        )
      );

    return linkedChildren.map((child) => ({
      ...child,
      ...relationshipMap.get(child.id)!,
    }));
  } catch (error) {
    logger.error("Error fetching parent children", error);
    return [];
  }
}

/**
 * Get all children linked to a parent with their enrollment details.
 *
 * @param userId - The authenticated user's database ID
 * @returns Array of children with class enrollment details
 */
export async function getParentChildrenWithEnrollment(userId: string): Promise<ParentChildWithEnrollment[]> {
  try {
    const children = await getParentChildren(userId);

    if (children.length === 0) {
      return [];
    }

    const studentIds = children.map((c) => c.id);

    // Get active enrollments for all children
    const enrollmentsData = await db
      .select({
        studentId: enrollments.studentId,
        classId: enrollments.classId,
        className: classes.name,
        classGrade: classes.grade,
        classSection: classes.section,
      })
      .from(enrollments)
      .innerJoin(classes, eq(enrollments.classId, classes.id))
      .where(
        and(
          sql`${enrollments.studentId} IN ${sql.raw(`('${studentIds.join("','")}'`)}`,
          eq(enrollments.status, "active")
        )
      );

    // Create a map of studentId -> enrollment
    const enrollmentMap = new Map(
      enrollmentsData.map((e) => [
        e.studentId,
        {
          id: e.classId,
          name: e.className,
          grade: e.classGrade,
          section: e.classSection,
        },
      ])
    );

    return children.map((child) => ({
      ...child,
      currentClass: enrollmentMap.get(child.id) || null,
    }));
  } catch (error) {
    logger.error("Error fetching parent children with enrollment", error);
    return [];
  }
}

/**
 * Batch fetch attendance records for multiple children.
 * Optimized to avoid N+1 queries.
 *
 * @param studentIds - Array of student IDs
 * @param limit - Maximum records per student (default 30)
 * @returns Map of studentId -> attendance records
 */
export async function batchFetchChildrenAttendance(
  studentIds: string[],
  limit: number = 30
): Promise<Map<string, AttendanceRecord[]>> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const records = await db
      .select()
      .from(attendance)
      .where(sql`${attendance.studentId} IN ${sql.raw(`('${studentIds.join("','")}'\)`)}`)
      .orderBy(desc(attendance.date))
      .limit(limit * studentIds.length); // Approximate limit

    const attendanceMap = new Map<string, AttendanceRecord[]>();
    for (const studentId of studentIds) {
      attendanceMap.set(
        studentId,
        records.filter((r) => r.studentId === studentId)
      );
    }

    return attendanceMap;
  } catch (error) {
    logger.error("Error batch fetching children attendance", error);
    return new Map();
  }
}

/**
 * Batch fetch homework records for multiple children.
 * Optimized to avoid N+1 queries.
 *
 * @param classIds - Array of class IDs
 * @param limit - Maximum records per class (default 10)
 * @returns Map of classId -> homework records
 */
export async function batchFetchChildrenHomework(
  classIds: string[],
  limit: number = 10
): Promise<Map<string, HomeworkRecord[]>> {
  try {
    const records = await db
      .select()
      .from(homework)
      .where(sql`${homework.classId} IN ${sql.raw(`('${classIds.join("','")}'\)`)}`)
      .orderBy(desc(homework.dueDate))
      .limit(limit * classIds.length);

    const homeworkMap = new Map<string, HomeworkRecord[]>();
    for (const classId of classIds) {
      homeworkMap.set(
        classId,
        records.filter((r) => r.classId === classId)
      );
    }

    return homeworkMap;
  } catch (error) {
    logger.error("Error batch fetching children homework", error);
    return new Map();
  }
}

/**
 * Batch fetch fee data for multiple children.
 * Optimized to avoid N+1 queries.
 *
 * @param studentIds - Array of student IDs
 * @returns Map of studentId -> fee records
 */
export async function batchFetchChildrenFees(studentIds: string[]): Promise<Map<string, StudentFeeRecord[]>> {
  try {
    const records = await db
      .select()
      .from(studentFees)
      .where(sql`${studentFees.studentId} IN ${sql.raw(`('${studentIds.join("','")}'\)`)}`)
      .orderBy(desc(studentFees.dueDate));

    const feesMap = new Map<string, StudentFeeRecord[]>();
    for (const studentId of studentIds) {
      feesMap.set(
        studentId,
        records.filter((r) => r.studentId === studentId)
      );
    }

    return feesMap;
  } catch (error) {
    logger.error("Error batch fetching children fees", error);
    return new Map();
  }
}
