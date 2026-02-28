"use server";

import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, attendance, homeworkSubmissions, examResultsEnhanced, studentFees, careerMatches, classes } from "@/lib/db/schema";
import { eq, and, desc, gte, sql, inArray, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

// ============================================================================
// TYPES
// ============================================================================

export interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
  classGrade: number | null;
  className: string | null;
  section: string | null;
  attendance: number;
  homeworkPending: number;
  recentGrades: Array<{
    id: string;
    subject: string;
    grade: string;
    date: string;
  }>;
  careerInterests: string[];
  feeStatus: {
    amountPaid: number;
    amountPending: number;
  };
}

export interface ParentStats {
  totalChildren: number;
  totalMessages: number;
  pendingFees: number;
  upcomingMeetings: number;
}

export interface ParentDashboardData {
  children: ChildData[];
  stats: ParentStats;
}

// ============================================================================
// SERVER ACTION
// ============================================================================

export async function getParentDashboardData(): Promise<ParentDashboardData | null> {
  try {
    const authResult = await requireAuth(["parent"]);
    if ("error" in authResult) {
      return null;
    }

    const { user: currentUser } = authResult;

    // Get children linked to this parent
    // Students have a parentId field that references their parent user
    const children = await db.select().from(users).where(eq(users.parentId, currentUser.id));

    if (children.length === 0) {
      return {
        children: [],
        stats: {
          totalChildren: 0,
          totalMessages: 0,
          pendingFees: 0,
          upcomingMeetings: 0,
        },
      };
    }

    const childIds = children.map((c) => c.id);

    // Get attendance data for all children (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const attendanceData = await db
      .select()
      .from(attendance)
      .where(and(
        sql`${attendance.studentId} IN ${sql.raw(`('${childIds.join("','")}'`)}`,
        gte(attendance.date, thirtyDaysAgoStr)
      ));

    // Group attendance by child
    const attendanceByChild = new Map<string, { present: number; total: number }>();
    for (const record of attendanceData) {
      if (!attendanceByChild.has(record.studentId)) {
        attendanceByChild.set(record.studentId, { present: 0, total: 0 });
      }
      const stats = attendanceByChild.get(record.studentId)!;
      stats.total++;
      if (record.status === "present") {
        stats.present++;
      }
    }

    // Get homework counts for all children (from homework submissions)
    const homeworkData = await db
      .select()
      .from(homeworkSubmissions)
      .where(sql`${homeworkSubmissions.studentId} IN ${sql.raw(`('${childIds.join("','")}'`)}`);

    // Group homework by child
    const homeworkByChild = new Map<string, number>();
    for (const hw of homeworkData) {
      if (hw.status !== "graded") {
        homeworkByChild.set(hw.studentId, (homeworkByChild.get(hw.studentId) || 0) + 1);
      }
    }

    // Get recent grades for all children
    const gradesData = await db
      .select()
      .from(examResultsEnhanced)
      .where(sql`${examResultsEnhanced.userId} IN ${sql.raw(`('${childIds.join("','")}'`)}`)
      .orderBy(desc(examResultsEnhanced.examDate))
      .limit(50);

    // Group grades by child
    const gradesByChild = new Map<string, typeof gradesData>();
    for (const grade of gradesData) {
      if (!gradesByChild.has(grade.userId)) {
        gradesByChild.set(grade.userId, []);
      }
      gradesByChild.get(grade.userId)!.push(grade);
    }

    // Get career interests for all children
    const careerMatchesData = await db
      .select()
      .from(careerMatches)
      .where(sql`${careerMatches.studentId} IN ${sql.raw(`('${childIds.join("','")}'`)}`)
      .orderBy(desc(careerMatches.matchScore));

    // Group career interests by child
    const careersByChild = new Map<string, string[]>();
    for (const match of careerMatchesData) {
      if (!careersByChild.has(match.studentId)) {
        careersByChild.set(match.studentId, []);
      }
      if (match.careerTitle && careersByChild.get(match.studentId)!.length < 3) {
        careersByChild.get(match.studentId)!.push(match.careerTitle);
      }
    }

    // Get fee data for all children
    const studentFeesData = await db
      .select()
      .from(studentFees)
      .where(sql`${studentFees.studentId} IN ${sql.raw(`('${childIds.join("','")}'`)}`);

    // Group fees by child
    const feesByChild = new Map<string, { amountPaid: number; amountPending: number }>();
    for (const fee of studentFeesData) {
      if (!feesByChild.has(fee.studentId)) {
        feesByChild.set(fee.studentId, { amountPaid: 0, amountPending: 0 });
      }
      const childFees = feesByChild.get(fee.studentId)!;
      if (fee.status === "paid") {
        childFees.amountPaid += fee.amount || 0;
      } else {
        childFees.amountPending += fee.amountPending || 0;
      }
    }

    // Enrich children with their data
    const enrichedChildren: ChildData[] = children.map((child) => {
      const attStats = attendanceByChild.get(child.id);
      const attendanceRate = attStats && attStats.total > 0
        ? Math.round((attStats.present / attStats.total) * 100)
        : 0;

      const recentGrades = gradesByChild.get(child.id) || [];

      return {
        id: child.id,
        firstName: child.firstName || "",
        lastName: child.lastName || "",
        classGrade: child.classGrade || null,
        className: child.section || null,
        section: child.section || null,
        attendance: attendanceRate,
        homeworkPending: homeworkByChild.get(child.id) || 0,
        recentGrades: recentGrades.map((g) => ({
          id: g.id,
          subject: typeof g.subjects === 'string' ? g.subjects : "Unknown",
          grade: g.grade || "N/A",
          date: g.examDate || "",
        })),
        careerInterests: careersByChild.get(child.id) || [],
        feeStatus: feesByChild.get(child.id) || { amountPaid: 0, amountPending: 0 },
      };
    });

    // Calculate stats
    const totalMessages = 0; // Would need to query from communication system
    const upcomingMeetings = 0; // Would need to query from meetings table

    const pendingFees = enrichedChildren.filter((c) => c.feeStatus.amountPending > 0).length;

    return {
      children: enrichedChildren,
      stats: {
        totalChildren: enrichedChildren.length,
        totalMessages,
        pendingFees,
        upcomingMeetings,
      },
    };
  } catch (error) {
    logger.error("Failed to fetch parent dashboard data:", error);
    return null;
  }
}
