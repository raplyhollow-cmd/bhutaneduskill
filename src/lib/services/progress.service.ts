/**
 * PROGRESS SERVICE
 *
 * Service layer for calculating and tracking student academic progress.
 * Integrates homework submissions, grades, and performance metrics.
 *
 * @module services/progress
 */

import { db } from "@/lib/db";
import {
  users,
  homework,
  homeworkSubmissions,
  assessments,
  assessmentResults,
  attendance,
  subjects,
  examResultsEnhanced,
} from "@/lib/db/schema";
import { eq, and, desc, gte, sql, count } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface StudentProgressMetrics {
  userId: string;
  overallCompletionRate: number;
  overallGradeAverage: number;
  onTimeSubmissionRate: number;
  lateSubmissionRate: number;
  totalAssignments: number;
  completedAssignments: number;
  gradedAssignments: number;
  pendingAssignments: number;
  averageScore: number;
  period: "week" | "month" | "term" | "all";
}

export interface SubjectPerformance {
  subjectId: string | null;
  subjectName: string;
  averageScore: number;
  completionRate: number;
  totalAssignments: number;
  completedAssignments: number;
  onTimeSubmissions: number;
  lateSubmissions: number;
  trend: "up" | "down" | "stable";
  recentGrades: Array<{
    homeworkId: string;
    title: string;
    score: number;
    gradedAt: Date;
  }>;
}

export interface LearningTrend {
  period: string;
  periodStart: Date;
  periodEnd: Date;
  averageScore: number;
  assignmentsCompleted: number;
  onTimeRate: number;
  attendanceRate: number;
}

export interface HomeworkSubmissionStats {
  totalSubmissions: number;
  onTimeSubmissions: number;
  lateSubmissions: number;
  gradedSubmissions: number;
  pendingGrading: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  recentSubmissions: Array<{
    id: string;
    homeworkId: string;
    homeworkTitle: string;
    subjectId: string | null;
    submittedAt: Date;
    isLate: boolean;
    score: number | null;
    status: string;
  }>;
}

export interface ProgressReport {
  student: {
    id: string;
    name: string;
    classGrade: number | null;
    section: string | null;
  };
  metrics: StudentProgressMetrics;
  bySubject: SubjectPerformance[];
  trends: LearningTrend[];
  homeworkStats: HomeworkSubmissionStats;
  recommendations: string[];
  generatedAt: Date;
}

// ============================================================================
// PROGRESS CALCULATION
// ============================================================================

/**
 * Calculate comprehensive progress metrics for a student
 *
 * @param userId - The database user ID
 * @param period - Time period for calculation
 * @returns Student progress metrics
 */
export async function calculateStudentProgress(
  userId: string,
  period: "week" | "month" | "term" | "all" = "all"
): Promise<StudentProgressMetrics> {
  try {
    const now = new Date();
    let periodStart: Date | null = null;

    // Calculate period start date
    switch (period) {
      case "week":
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - 7);
        break;
      case "month":
        periodStart = new Date(now);
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case "term":
        // Assuming 3-month term
        periodStart = new Date(now);
        periodStart.setMonth(now.getMonth() - 3);
        break;
      case "all":
        periodStart = null;
        break;
    }

    // Get all homework submissions for the student
    const submissions = await db
      .select()
      .from(homeworkSubmissions)
      .where(eq(homeworkSubmissions.studentId, userId));

    // Get homework details for submission filtering
    const homeworkIds = submissions.map((s) => s.homeworkId);
    const homeworkItems = homeworkIds.length > 0
      ? await db
          .select()
          .from(homework)
          .where(sql`${homework.id} = ANY(${homeworkIds})`)
      : [];

    const homeworkMap = new Map(homeworkItems.map((hw) => [hw.id, hw]));

    // Filter submissions by period
    let filteredSubmissions = submissions;
    if (periodStart) {
      filteredSubmissions = submissions.filter((s) => {
        const submittedDate = s.submittedAt instanceof Date
          ? s.submittedAt
          : new Date(s.submittedAt);
        return submittedDate >= periodStart!;
      });
    }

    // Calculate metrics
    const totalAssignments = filteredSubmissions.length;
    const completedAssignments = filteredSubmissions.filter(
      (s) => s.status !== "pending"
    ).length;
    const gradedAssignments = filteredSubmissions.filter(
      (s) => s.status === "graded" && s.gradedAt
    ).length;
    const pendingAssignments = totalAssignments - completedAssignments;

    // On-time vs late
    const onTimeSubmissions = filteredSubmissions.filter(
      (s) => !s.isLate
    ).length;
    const lateSubmissions = filteredSubmissions.filter(
      (s) => s.isLate
    ).length;

    const onTimeSubmissionRate = completedAssignments > 0
      ? Math.round((onTimeSubmissions / completedAssignments) * 100)
      : 0;
    const lateSubmissionRate = completedAssignments > 0
      ? Math.round((lateSubmissions / completedAssignments) * 100)
      : 0;

    // Calculate average score from graded submissions
    const gradedSubmissions = filteredSubmissions.filter(
      (s) => s.score !== null && s.score !== undefined
    );

    const averageScore = gradedSubmissions.length > 0
      ? Math.round(
          gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) /
            gradedSubmissions.length
        )
      : 0;

    // Overall completion rate
    const overallCompletionRate = totalAssignments > 0
      ? Math.round((completedAssignments / totalAssignments) * 100)
      : 0;

    // Overall grade average (from exam results)
    const examResults = await db
      .select()
      .from(examResultsEnhanced)
      .where(eq(examResultsEnhanced.studentId, userId))
      .orderBy(desc(examResultsEnhanced.examYear))
      .limit(10);

    const overallGradeAverage = examResults.length > 0
      ? Math.round(
          examResults.reduce((sum, r) => {
            const overallPercentage =
              ("overallPercentage" in r && typeof r.overallPercentage === "number") ? r.overallPercentage :
              ("percentage" in r && typeof r.percentage === "number") ? r.percentage :
              ("totalPercentage" in r && typeof r.totalPercentage === "number") ? r.totalPercentage :
              0;
            return sum + overallPercentage;
          }, 0) / examResults.length
        )
      : 0;

    logger.info("Calculated student progress", {
      userId,
      period,
      completionRate: overallCompletionRate,
      averageScore,
    });

    return {
      userId,
      overallCompletionRate,
      overallGradeAverage,
      onTimeSubmissionRate,
      lateSubmissionRate,
      totalAssignments,
      completedAssignments,
      gradedAssignments,
      pendingAssignments,
      averageScore,
      period,
    };
  } catch (error) {
    logger.error(error, { userId, period });
    throw new Error("Failed to calculate student progress");
  }
}

/**
 * Get performance breakdown by subject
 *
 * @param userId - The database user ID
 * @returns Array of subject performance data
 */
export async function getSubjectPerformance(
  userId: string
): Promise<SubjectPerformance[]> {
  try {
    // Get all homework submissions with homework details
    const submissions = await db
      .select({
        submissionId: homeworkSubmissions.id,
        homeworkId: homeworkSubmissions.homeworkId,
        subjectId: homework.subjectId,
        title: homework.title,
        score: homeworkSubmissions.score,
        submittedAt: homeworkSubmissions.submittedAt,
        gradedAt: homeworkSubmissions.gradedAt,
        isLate: homeworkSubmissions.isLate,
        status: homeworkSubmissions.status,
        dueDate: homework.dueDate,
      })
      .from(homeworkSubmissions)
      .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
      .where(eq(homeworkSubmissions.studentId, userId));

    // Group by subject
    const subjectMap = new Map<
      string | null,
      {
        subjectName: string;
        scores: number[];
        onTime: number;
        late: number;
        total: number;
        completed: number;
        recent: Array<{
          homeworkId: string;
          title: string;
          score: number;
          gradedAt: Date;
        }>;
      }
    >();

    for (const sub of submissions) {
      const subjectId = sub.subjectId || "General";
      const subjectName = sub.subjectId || "General";

      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subjectName,
          scores: [],
          onTime: 0,
          late: 0,
          total: 0,
          completed: 0,
          recent: [],
        });
      }

      const data = subjectMap.get(subjectId)!;
      data.total++;

      if (sub.status !== "pending") {
        data.completed++;
        if (!sub.isLate) {
          data.onTime++;
        } else {
          data.late++;
        }
      }

      if (sub.score !== null && sub.score !== undefined) {
        data.scores.push(sub.score);

        // Add to recent submissions
        if (sub.gradedAt) {
          data.recent.push({
            homeworkId: sub.homeworkId,
            title: sub.title,
            score: sub.score,
            gradedAt:
              sub.gradedAt instanceof Date
                ? sub.gradedAt
                : new Date(sub.gradedAt),
          });
        }
      }
    }

    // Calculate trends (compare recent vs older scores)
    const results: SubjectPerformance[] = [];

    for (const [subjectId, data] of subjectMap.entries()) {
      const sortedScores = [...data.scores].sort(
        (a, b) => b - a
      );

      const averageScore =
        sortedScores.length > 0
          ? Math.round(
              sortedScores.reduce((sum, s) => sum + s, 0) / sortedScores.length
            )
          : 0;

      // Determine trend based on recent vs older scores
      let trend: "up" | "down" | "stable" = "stable";
      if (data.scores.length >= 4) {
        const recentAvg =
          data.scores.slice(0, Math.floor(data.scores.length / 2)).reduce(
            (sum, s) => sum + s,
            0
          ) / Math.floor(data.scores.length / 2);
        const olderAvg =
          data.scores
            .slice(Math.floor(data.scores.length / 2))
            .reduce((sum, s) => sum + s, 0) /
          (data.scores.length - Math.floor(data.scores.length / 2));

        if (recentAvg > olderAvg + 5) {
          trend = "up";
        } else if (recentAvg < olderAvg - 5) {
          trend = "down";
        }
      }

      const completionRate =
        data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

      results.push({
        subjectId,
        subjectName: data.subjectName,
        averageScore,
        completionRate,
        totalAssignments: data.total,
        completedAssignments: data.completed,
        onTimeSubmissions: data.onTime,
        lateSubmissions: data.late,
        trend,
        recentGrades: data.recent
          .sort(
            (a, b) =>
              b.gradedAt.getTime() - a.gradedAt.getTime()
          )
          .slice(0, 5),
      });
    }

    // Sort by average score descending
    results.sort((a, b) => b.averageScore - a.averageScore);

    logger.info("Fetched subject performance", {
      userId,
      subjectCount: results.length,
    });

    return results;
  } catch (error) {
    logger.error(error, { userId });
    throw new Error("Failed to fetch subject performance");
  }
}

/**
 * Get learning trends over time
 *
 * @param userId - The database user ID
 * @param periods - Number of periods to analyze
 * @returns Array of learning trend data
 */
export async function getLearningTrends(
  userId: string,
  periods: number = 6
): Promise<LearningTrend[]> {
  try {
    const trends: LearningTrend[] = [];
    const now = new Date();

    for (let i = 0; i < periods; i++) {
      const periodEnd = new Date(now);
      periodEnd.setDate(now.getDate() - i * 7); // Weekly periods

      const periodStart = new Date(periodEnd);
      periodStart.setDate(periodEnd.getDate() - 7);

      const periodLabel = `${Math.floor(i * 7)} days ago`;

      // Get submissions in this period
      const periodSubmissions = await db
        .select()
        .from(homeworkSubmissions)
        .where(
          and(
            eq(homeworkSubmissions.studentId, userId),
            gte(homeworkSubmissions.submittedAt, periodStart)
          )
        );

      const completedCount = periodSubmissions.filter(
        (s) => s.status !== "pending"
      ).length;

      const gradedSubmissions = periodSubmissions.filter(
        (s) => s.score !== null && s.score !== undefined
      );

      const averageScore =
        gradedSubmissions.length > 0
          ? Math.round(
              gradedSubmissions.reduce(
                (sum, s) => sum + (s.score || 0),
                0
              ) / gradedSubmissions.length
            )
          : 0;

      const onTimeCount = periodSubmissions.filter(
        (s) => !s.isLate && s.status !== "pending"
      ).length;

      const onTimeRate =
        completedCount > 0
          ? Math.round((onTimeCount / completedCount) * 100)
          : 0;

      // Get attendance for this period
      const attendanceRecords = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.studentId, userId),
            gte(attendance.date, periodStart.toISOString().split("T")[0]!)
          )
        );

      const presentCount =
        attendanceRecords.filter(
          (a) => a.status === "present" || a.status === "late"
        ).length;
      const attendanceRate =
        attendanceRecords.length > 0
          ? Math.round((presentCount / attendanceRecords.length) * 100)
          : 0;

      trends.push({
        period: periodLabel,
        periodStart,
        periodEnd,
        averageScore,
        assignmentsCompleted: completedCount,
        onTimeRate,
        attendanceRate,
      });
    }

    // Reverse to show most recent first
    trends.reverse();

    logger.info("Fetched learning trends", { userId, periods });

    return trends;
  } catch (error) {
    logger.error(error, { userId, periods });
    throw new Error("Failed to fetch learning trends");
  }
}

/**
 * Get homework submission statistics for a student
 *
 * @param userId - The database user ID
 * @returns Homework submission statistics
 */
export async function getHomeworkSubmissionStats(
  userId: string
): Promise<HomeworkSubmissionStats> {
  try {
    const submissions = await db
      .select()
      .from(homeworkSubmissions)
      .where(eq(homeworkSubmissions.studentId, userId))
      .orderBy(desc(homeworkSubmissions.submittedAt));

    const totalSubmissions = submissions.length;
    const onTimeSubmissions = submissions.filter((s) => !s.isLate).length;
    const lateSubmissions = submissions.filter((s) => s.isLate).length;
    const gradedSubmissions = submissions.filter(
      (s) => s.gradedAt !== null
    ).length;
    const pendingGrading = submissions.filter(
      (s) => s.gradedAt === null && s.status === "submitted"
    ).length;

    const gradedWithScore = submissions.filter(
      (s) => s.score !== null && s.score !== undefined
    );

    const scores = gradedWithScore.map((s) => s.score || 0);
    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Get homework details for recent submissions
    const homeworkIds = submissions.slice(0, 10).map((s) => s.homeworkId);
    const homeworkItems =
      homeworkIds.length > 0
        ? await db
            .select()
            .from(homework)
            .where(sql`${homework.id} = ANY(${homeworkIds})`)
        : [];

    const homeworkMap = new Map(homeworkItems.map((hw) => [hw.id, hw]));

    const recentSubmissions = submissions.slice(0, 10).map((s) => ({
      id: s.id,
      homeworkId: s.homeworkId,
      homeworkTitle: homeworkMap.get(s.homeworkId)?.title || "Unknown",
      subjectId: homeworkMap.get(s.homeworkId)?.subjectId || null,
      submittedAt:
        s.submittedAt instanceof Date
          ? s.submittedAt
          : new Date(s.submittedAt),
      isLate: s.isLate,
      score: s.score,
      status: s.status,
    }));

    return {
      totalSubmissions,
      onTimeSubmissions,
      lateSubmissions,
      gradedSubmissions,
      pendingGrading,
      averageScore,
      highestScore,
      lowestScore,
      recentSubmissions,
    };
  } catch (error) {
    logger.error(error, { userId });
    throw new Error("Failed to fetch homework submission stats");
  }
}

/**
 * Generate a comprehensive progress report for a student
 *
 * @param userId - The database user ID
 * @param period - Time period for the report
 * @returns Complete progress report
 */
export async function generateProgressReport(
  userId: string,
  period: "week" | "month" | "term" | "all" = "term"
): Promise<ProgressReport> {
  try {
    // Get student info
    const student = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        classGrade: users.classGrade,
        section: users.section,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!student) {
      throw new Error("Student not found");
    }

    // Calculate all metrics
    const [metrics, bySubject, trends, homeworkStats] = await Promise.all([
      calculateStudentProgress(userId, period),
      getSubjectPerformance(userId),
      getLearningTrends(userId, 6),
      getHomeworkSubmissionStats(userId),
    ]);

    // Generate recommendations
    const recommendations: string[] = [];

    if (metrics.averageScore < 60) {
      recommendations.push(
        "Focus on completing homework on time to improve your understanding of the material."
      );
    }

    if (metrics.onTimeSubmissionRate < 70) {
      recommendations.push(
        "Work on time management to submit more assignments before the deadline."
      );
    }

    if (metrics.overallGradeAverage < 50) {
      recommendations.push(
        "Consider seeking extra help from teachers or forming study groups."
      );
    }

    const weakSubjects = bySubject.filter((s) => s.averageScore < 50);
    if (weakSubjects.length > 0) {
      recommendations.push(
        `Pay extra attention to: ${weakSubjects.map((s) => s.subjectName).join(", ")}`
      );
    }

    if (metrics.overallGradeAverage >= 80 && metrics.onTimeSubmissionRate >= 90) {
      recommendations.push(
        "Excellent work! Consider taking on more challenging assignments or helping classmates."
      );
    }

    const report: ProgressReport = {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName || ""}`.trim(),
        classGrade: student.classGrade,
        section: student.section,
      },
      metrics,
      bySubject,
      trends,
      homeworkStats,
      recommendations,
      generatedAt: new Date(),
    };

    logger.info("Generated progress report", { userId, period });

    return report;
  } catch (error) {
    logger.error(error, { userId, period });
    throw new Error("Failed to generate progress report");
  }
}
