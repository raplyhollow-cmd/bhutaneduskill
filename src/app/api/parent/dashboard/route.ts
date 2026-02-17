import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, attendance, homeworkSubmissions, assessments, examResultsEnhanced, feePayments, careerMatches, studentFees } from "@/lib/db/schema";
import { eq, and, desc, gte, count, sql } from "drizzle-orm";

/**
 * GET /api/parent/dashboard - Get parent's dashboard statistics
 *
 * Returns:
 * - Children list with their details
 * - Total messages count
 * - Upcoming meetings count
 * - Fee status per child
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['parent']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { user: currentUser } = authResult;

  try {
    // Get children linked to this parent
    // Students have a parentId field that references their parent user
    const children = await db.query.users.findMany({
      where: eq(users.parentId, currentUser.id),
    });

    const childIds = children.map((c) => c.id);

    if (childIds.length === 0) {
      return NextResponse.json({
        children: [],
        stats: {
          totalChildren: 0,
          totalMessages: 0,
          pendingFees: 0,
          upcomingMeetings: 0,
        },
      });
    }

    // Get attendance data for all children (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const attendanceData = await db.query.attendance.findMany({
      where: and(
        sql`${attendance.studentId} IN ${sql.raw(`('${childIds.join("','")}'`)}`,
        gte(attendance.date, thirtyDaysAgo.toISOString().split("T")[0])
      ),
    });

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
    const homeworkData = await db.query.homeworkSubmissions.findMany({
      where: sql`${homeworkSubmissions.studentId} IN ${sql.raw(`('${childIds.join("','")}'`)}`,
    });

    // Group homework by child
    const homeworkByChild = new Map<string, number>();
    for (const hw of homeworkData) {
      if (hw.status !== "graded") {
        homeworkByChild.set(hw.studentId, (homeworkByChild.get(hw.studentId) || 0) + 1);
      }
    }

    // Get recent grades for all children
    const gradesData = await db.query.examResultsEnhanced.findMany({
      where: sql`${examResultsEnhanced.userId} IN ${sql.raw(`('${childIds.join("','")}'`)}`,
      orderBy: [desc(examResultsEnhanced.examDate)],
      limit: 50,
    });

    // Group grades by child
    const gradesByChild = new Map<string, typeof gradesData>();
    for (const grade of gradesData) {
      if (!gradesByChild.has(grade.userId)) {
        gradesByChild.set(grade.userId, []);
      }
      gradesByChild.get(grade.userId)!.push(grade);
    }

    // Get career interests for all children
    const careerMatchesData = await db.query.careerMatches.findMany({
      where: sql`${careerMatches.studentId} IN ${sql.raw(`('${childIds.join("','")}'\)`)}`,
      orderBy: [desc(careerMatches.matchScore)],
    });

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
    // Use studentFees table which has studentId directly
    const studentFeesData = await db.query.studentFees.findMany({
      where: sql`${studentFees.studentId} IN ${sql.raw(`('${childIds.join("','")}'`)}`,
    });

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
    const enrichedChildren = children.map((child) => {
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
          subject: g.subjects || "Unknown",
          grade: g.grade || "N/A",
          date: g.examDate || "",
        })),
        careerInterests: careersByChild.get(child.id) || [],
        feeStatus: feesByChild.get(child.id) || { amountPaid: 0, amountPending: 0 },
      };
    });

    // Calculate stats
    // For now, we don't have a messages table - return 0
    // Would need to query from communication system when implemented
    const totalMessages = 0;

    // For upcoming meetings, return 0 for now
    // Would need to query from meetings/appointments table when implemented
    const upcomingMeetings = 0;

    const pendingFees = enrichedChildren.filter((c) => c.feeStatus.amountPending > 0).length;

    return NextResponse.json({
      children: enrichedChildren,
      stats: {
        totalChildren: enrichedChildren.length,
        totalMessages,
        pendingFees,
        upcomingMeetings,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      {
        error: "Failed to fetch parent dashboard data",
        children: [],
        stats: {
          totalChildren: 0,
          totalMessages: 0,
          pendingFees: 0,
          upcomingMeetings: 0,
        },
      },
      { status: 500 }
    );
  }
}
