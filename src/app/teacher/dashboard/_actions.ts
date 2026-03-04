"use server";

import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, classes, enrollments, homework, homeworkSubmissions, attendance, assessments, subjects } from "@/lib/db/schema";
import { teacherBehaviorLogs } from "@/lib/db/teacher-logs-schema";
import { eq, and, desc, count, sql, gte, lte, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

// ============================================================================
// TYPES
// ============================================================================

export interface TeacherStats {
  totalStudents: number;
  averageAttendance: number;
  activeClasses: number;
  pendingHomework: number;
  assessmentCompletion: number;
  atRiskStudents: number;
  averageScore: number;
}

export interface TeacherClassData {
  id: string;
  name: string;
  grade: number;
  section: string;
  studentCount: number;
  completionRate: number;
  nextClass?: string;
}

export interface PendingGradingItem {
  id: string;
  homeworkId: string;
  homeworkTitle: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  isLate: boolean;
}

export interface StudentNeedingAttention {
  id: string;
  name: string;
  className: string;
  reason: string;
  severity: "high" | "medium" | "low";
}

export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface RecentBehaviorLog {
  id: string;
  studentName: string;
  type: "merit" | "demerit";
  category: string;
  description: string;
  points: number;
  createdAt: string;
}

export interface TeacherDashboardData {
  stats: TeacherStats;
  classes: TeacherClassData[];
  upcomingHomework: PendingGradingItem[];
  recentActivity: RecentActivity[];
  needsAttention: StudentNeedingAttention[];
  recentBehaviorLogs: RecentBehaviorLog[];
}

// ============================================================================
// SERVER ACTION
// ============================================================================

export async function getTeacherDashboardData(): Promise<TeacherDashboardData | null> {
  try {
    const authResult = await requireAuth(["teacher"]);
    if ("error" in authResult) {
      return null;
    }

    const { userId, user } = authResult;

    // Get teacher's classes using db.select() - neon-http doesn't support query API
    const teacherClasses = await db
      .select()
      .from(classes)
      .where(eq(classes.classTeacherId, userId))
      .orderBy(desc(classes.createdAt));

    const classIds = teacherClasses.map((c) => c.id);

    // Get all students (from enrollments)
    let totalStudents = 0;
    const enrollmentMap = new Map<string, string[]>(); // classId -> studentIds

    if (classIds.length > 0) {
      const enrollmentsData = await db
        .select()
        .from(enrollments)
        .where(
          and(
            inArray(enrollments.classId, classIds),
            eq(enrollments.status, "active")
          )
        );

      totalStudents = enrollmentsData.length;

      // Group enrollments by class
      for (const enrollment of enrollmentsData) {
        if (!enrollmentMap.has(enrollment.classId)) {
          enrollmentMap.set(enrollment.classId, []);
        }
        enrollmentMap.get(enrollment.classId)!.push(enrollment.studentId);
      }
    }

    // Get attendance data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    let attendanceSum = 0;
    let attendanceCount = 0;

    if (classIds.length > 0) {
      const attendanceRecords = await db
        .select()
        .from(attendance)
        .where(
          and(
            inArray(attendance.classId, classIds),
            gte(attendance.date, thirtyDaysAgoStr)
          )
        );

      const presentCount = attendanceRecords.filter(
        (a) => a.status === "present" || a.status === "late"
      ).length;

      attendanceSum = presentCount;
      attendanceCount = attendanceRecords.length;
    }

    const averageAttendance = attendanceCount > 0
      ? Math.round((attendanceSum / attendanceCount) * 100)
      : 0;

    // Get pending homework grading
    let pendingHomework = 0;
    const pendingGradingItems: PendingGradingItem[] = [];

    if (classIds.length > 0) {
      // Get homework for teacher's classes
      const classHomework = await db
        .select()
        .from(homework)
        .where(inArray(homework.classId, classIds));

      const homeworkIds = classHomework.map((h) => h.id);

      if (homeworkIds.length > 0) {
        // Get submitted but not graded submissions
        const submittedNotGraded = await db
          .select()
          .from(homeworkSubmissions)
          .where(
            and(
              inArray(homeworkSubmissions.homeworkId, homeworkIds),
              sql`${homeworkSubmissions.status} = 'submitted'`
            )
          )
          .orderBy(desc(homeworkSubmissions.submittedAt))
          .limit(20);

        pendingHomework = submittedNotGraded.length;

        // Build pending grading items
        for (const submission of submittedNotGraded) {
          const hw = classHomework.find((h) => h.id === submission.homeworkId);
          if (!hw) continue;

          const studentData = await db
            .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
            })
            .from(users)
            .where(eq(users.id, submission.studentId))
            .limit(1);

          if (studentData.length > 0) {
            const student = studentData[0];
            pendingGradingItems.push({
              id: submission.id,
              homeworkId: hw.id,
              homeworkTitle: hw.title,
              studentId: student.id,
              studentName: `${student.firstName} ${student.lastName || ""}`.trim(),
              submittedAt: submission.submittedAt
                ? new Date(submission.submittedAt).toLocaleDateString()
                : "Unknown",
              isLate: submission.isLate || false,
            });
          }
        }
      }
    }

    // Build class data with completion rates
    const classesData: TeacherClassData[] = [];

    for (const cls of teacherClasses) {
      const studentIds = enrollmentMap.get(cls.id) || [];
      const studentCount = studentIds.length;

      // Calculate completion rate based on homework submissions
      let completionRate = 0;
      if (studentCount > 0) {
        const classHomework = await db
          .select()
          .from(homework)
          .where(eq(homework.classId, cls.id));

        if (classHomework.length > 0) {
          const homeworkIds = classHomework.map((h) => h.id);
          const submissions = await db
            .select()
            .from(homeworkSubmissions)
            .where(inArray(homeworkSubmissions.homeworkId, homeworkIds));

          const uniqueSubmissions = new Set(submissions.map((s) => s.studentId));
          completionRate = Math.round(
            (uniqueSubmissions.size / studentCount) * 100
          );
        }
      }

      classesData.push({
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        section: cls.section,
        studentCount,
        completionRate,
      });
    }

    // Find students needing attention (low attendance or missing homework)
    const needsAttention: StudentNeedingAttention[] = [];

    if (classIds.length > 0) {
      // Get students with low attendance
      const studentAttendanceMap = new Map<string, { present: number; total: number }>();

      const allAttendance = await db
        .select()
        .from(attendance)
        .where(
          and(
            inArray(attendance.classId, classIds),
            gte(attendance.date, thirtyDaysAgoStr)
          )
        );

      for (const record of allAttendance) {
        if (!studentAttendanceMap.has(record.studentId)) {
          studentAttendanceMap.set(record.studentId, { present: 0, total: 0 });
        }
        const stats = studentAttendanceMap.get(record.studentId)!;
        stats.total++;
        if (record.status === "present" || record.status === "late") {
          stats.present++;
        }
      }

      // Identify students with attendance < 70%
      for (const [studentId, stats] of studentAttendanceMap.entries()) {
        if (stats.total >= 5) { // Only if they have at least 5 records
          const rate = (stats.present / stats.total) * 100;
          if (rate < 70) {
            const studentData = await db
              .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                classGrade: users.classGrade,
                section: users.section,
              })
              .from(users)
              .where(eq(users.id, studentId))
              .limit(1);

            if (studentData.length > 0) {
              const student = studentData[0];
              needsAttention.push({
                id: student.id,
                name: `${student.firstName} ${student.lastName || ""}`.trim(),
                className: `Grade ${student.classGrade}${student.section ? " " + student.section : ""}`,
                reason: `Low attendance (${Math.round(rate)}%)`,
                severity: rate < 50 ? "high" : "medium",
              });
            }
          }
        }
      }

      // Limit to top 5
      needsAttention.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
    }

    // Calculate average score from graded homework
    let averageScore = 0;
    let scoreCount = 0;

    if (classIds.length > 0) {
      const classHomework = await db
        .select()
        .from(homework)
        .where(inArray(homework.classId, classIds));

      const homeworkIds = classHomework.map((h) => h.id);

      if (homeworkIds.length > 0) {
        const gradedSubmissions = await db
          .select()
          .from(homeworkSubmissions)
          .where(
            and(
              inArray(homeworkSubmissions.homeworkId, homeworkIds),
              sql`${homeworkSubmissions.status} = 'graded'`
            )
          );

        if (gradedSubmissions.length > 0) {
          const totalScore = gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
          averageScore = Math.round(totalScore / gradedSubmissions.length);
          scoreCount = gradedSubmissions.length;
        }
      }
    }

    // Build stats
    const stats: TeacherStats = {
      totalStudents,
      averageAttendance,
      activeClasses: teacherClasses.length,
      pendingHomework,
      assessmentCompletion: classesData.length > 0
        ? Math.round(classesData.reduce((sum, c) => sum + c.completionRate, 0) / classesData.length)
        : 0,
      atRiskStudents: needsAttention.filter((n) => n.severity === "high").length,
      averageScore,
    };

    // Recent activity (could be enhanced with activity log)
    const recentActivity: RecentActivity[] = [];

    // Fetch recent behavior logs for teacher's students
    let recentBehaviorLogs: RecentBehaviorLog[] = [];
    if (classIds.length > 0) {
      const behaviorLogsData = await db
        .select()
        .from(teacherBehaviorLogs)
        .where(inArray(teacherBehaviorLogs.classId, classIds))
        .orderBy(desc(teacherBehaviorLogs.createdAt))
        .limit(5);

      // Get unique student IDs
      const studentIds = [...new Set(behaviorLogsData.map((log) => log.studentId))];

      // Fetch student data for all students
      let studentsMap = new Map<string, { firstName: string | null; lastName: string | null }>();
      if (studentIds.length > 0) {
        const studentsData = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(inArray(users.id, studentIds));

        studentsMap = new Map(
          studentsData.map((s) => [s.id, { firstName: s.firstName, lastName: s.lastName }])
        );
      }

      recentBehaviorLogs = behaviorLogsData.map((log) => {
        const student = studentsMap.get(log.studentId);
        return {
          id: log.id,
          studentName: student
            ? `${student.firstName} ${student.lastName || ""}`.trim()
            : "Unknown",
          type: log.type as "merit" | "demerit",
          category: log.category,
          description: log.description,
          points: log.points,
          createdAt: log.createdAt.toISOString(),
        };
      });
    }

    return {
      stats,
      classes: classesData,
      upcomingHomework: pendingGradingItems,
      recentActivity,
      needsAttention: needsAttention.slice(0, 5),
      recentBehaviorLogs,
    };
  } catch (error) {
    logger.error("Failed to fetch teacher dashboard data:", error);
    return null;
  }
}
