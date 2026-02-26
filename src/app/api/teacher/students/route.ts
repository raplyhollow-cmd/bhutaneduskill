/**
 * TEACHER STUDENTS API
 *
 * GET /api/teacher/students - Get teacher's students across all classes
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 *
 * Returns:
 * - All students taught by this teacher
 * - With class info, attendance summary, homework status
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, classes, enrollments, homeworkSubmissions, attendance } from "@/lib/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import type {
  StudentWithParent,
  ParentGuardianInfo,
  AttendanceSummary,
  HomeworkSummary,
  EnrichedStudentData,
} from "@/types";

// ============================================================================
// GET /api/teacher/students - Get teacher's students across all classes
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user: currentUser } = auth;

    try {
      // Get teacher's classes using db.select()
      const teacherClassesData = await db
        .select()
        .from(classes)
        .where(eq(classes.teacherId, userId))
        .orderBy(desc(classes.createdAt));

      if (!teacherClassesData || teacherClassesData.length === 0) {
        return successResponse({ students: [], studentsByClass: [], totalStudents: 0 });
      }

      const classIds = teacherClassesData.map((c) => c.id);

      // Get all enrollments for teacher's classes
      const classEnrollmentsData = await db
        .select()
        .from(enrollments)
        .where(
          and(
            inArray(enrollments.classId, classIds),
            eq(enrollments.status, "active")
          )
        );

      // Get student data for all enrolled students
      const studentIds = classEnrollmentsData.map((e) => e.studentId).filter(Boolean);
      let studentsData: StudentWithParent[] = [];
      if (studentIds.length > 0) {
        const rawStudents = await db
          .select()
          .from(users)
          .where(inArray(users.id, studentIds));
        studentsData = rawStudents as StudentWithParent[];
      }

      // Create a map for quick lookup
      const studentMap = new Map(studentsData.map((s) => [s.id, s]));

      // OPTIMIZATION: Batch fetch all data instead of N queries per student
      const uniqueParentIds = [...new Set(studentsData
        .map((s) => s.parentId)
        .filter(Boolean))] as string[];

      // Batch 1: Fetch all attendance for these students
      const allAttendance = await db
        .select({ studentId: attendance.studentId, classId: attendance.classId, status: attendance.status })
        .from(attendance)
        .where(
          and(
            sql`${attendance.studentId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`,
            sql`${attendance.classId} IN ${sql.raw(`('${classIds.join("','")}')`)}`
          )
        );

      // Create attendance map: studentId-classId -> { present, absent, total }
      const attendanceMap = new Map<string, { present: number; absent: number; total: number }>();
      for (const a of allAttendance) {
        const key = `${a.studentId}-${a.classId}`;
        const entry = attendanceMap.get(key) || { present: 0, absent: 0, total: 0 };
        entry.total++;
        if (a.status === "present") entry.present++;
        else if (a.status === "absent") entry.absent++;
        attendanceMap.set(key, entry);
      }

      // Batch 2: Fetch all homework submissions
      const allHwSubmissions = await db
        .select({ studentId: homeworkSubmissions.studentId, status: homeworkSubmissions.status })
        .from(homeworkSubmissions)
        .where(sql`${homeworkSubmissions.studentId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`);

      // Create homework map: studentId -> { submitted, graded, pending, total }
      const hwMap = new Map<string, { submitted: number; graded: number; pending: number; total: number }>();
      for (const h of allHwSubmissions) {
        const entry = hwMap.get(h.studentId) || { submitted: 0, graded: 0, pending: 0, total: 0 };
        entry.total++;
        if (h.status === "submitted") entry.submitted++;
        else if (h.status === "graded") entry.graded++;
        else if (h.status === "draft") entry.pending++;
        hwMap.set(h.studentId, entry);
      }

      // Batch 3: Fetch all parents
      const parentMap = new Map<string, ParentGuardianInfo>();
      if (uniqueParentIds.length > 0) {
        const parentsData = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            phone: users.phone,
          })
          .from(users)
          .where(sql`${users.id} IN ${sql.raw(`('${uniqueParentIds.join("','")}')`)}`);

        for (const p of parentsData) {
          parentMap.set(p.id, {
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.email,
            phone: p.phone,
          });
        }
      }

      // Now enrich students with batched data (no more queries!)
      const enrichedStudents = classEnrollmentsData.map((enrollmentItem) => {
        const studentData = studentMap.get(enrollmentItem.studentId);
        if (!studentData) return null;

        // Find the class for this enrollment
        const cls = teacherClassesData.find((c) => c.id === enrollmentItem.classId);
        if (!cls) return null;

        // Get attendance from map
        const attendKey = `${studentData.id}-${cls.id}`;
        const attendEntry = attendanceMap.get(attendKey) || { present: 0, absent: 0, total: 0 };
        const attendancePercentage = attendEntry.total > 0
          ? Math.round((attendEntry.present / attendEntry.total) * 100)
          : null;

        // Get homework from map
        const hwEntry = hwMap.get(studentData.id) || { submitted: 0, graded: 0, pending: 0, total: 0 };

        // Get parent/guardian information
        let parentGuardianName: string | null = null;
        let parentGuardianPhone: string | null = null;
        let parentGuardianEmail: string | null = null;

        if (studentData.parentContact) {
          parentGuardianName = studentData.parentContact;
        }
        if (studentData.parentPhone) {
          parentGuardianPhone = studentData.parentPhone;
        }
        if (studentData.emergencyContact) {
          parentGuardianPhone = parentGuardianPhone || studentData.emergencyContact;
        }

        // Get parent from map
        if (studentData.parentId) {
          const parentUser = parentMap.get(studentData.parentId);
          if (parentUser) {
            parentGuardianName = parentGuardianName || `${parentUser.firstName || ""} ${parentUser.lastName || ""}`.trim() || null;
            parentGuardianEmail = parentUser.email;
            if (!parentGuardianPhone && parentUser.phone) {
              parentGuardianPhone = parentUser.phone;
            }
          }
        }

        const result: EnrichedStudentData = {
          id: studentData.id,
          name: `${studentData.firstName || ""} ${studentData.lastName || ""}`.trim(),
          firstName: studentData.firstName || "",
          lastName: studentData.lastName || "",
          email: studentData.email || null,
          profilePicture: studentData.profilePicture || null,
          classGrade: cls.grade,
          section: cls.section,
          className: cls.name,
          classId: cls.id,
          rollNumber: enrollmentItem.rollNumber,
          attendanceSummary: {
            present: attendEntry.present,
            absent: attendEntry.absent,
            percentage: attendancePercentage,
            totalRecorded: attendEntry.total,
          },
          homeworkSummary: {
            submitted: hwEntry.submitted,
            graded: hwEntry.graded,
            pending: hwEntry.pending,
            total: hwEntry.total,
          },
          enrolledAt: enrollmentItem.enrollmentDate,
          parentGuardianName,
          parentGuardianPhone,
          parentGuardianEmail,
        };

        return result;
      });

      // Filter out nulls and group by class
      const validStudents = enrichedStudents.filter((s) => s !== null);

      // Group students by class
      const studentsByClass = teacherClassesData.map((cls) => ({
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        section: cls.section,
        students: validStudents.filter((s) => s.classId === cls.id),
      }));

      return successResponse({
        students: validStudents,
        studentsByClass,
        totalStudents: validStudents.length,
      });
    } catch (error) {
      logger.error("Teacher students fetch error:", error);
      return errorResponse("Failed to fetch students", 500);
    }
  },
  ['teacher', 'admin']
);
