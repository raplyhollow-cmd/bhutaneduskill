/**
 * TEACHER DATA FETCHING UTILITIES
 *
 * Server-side data fetching functions for teacher portal.
 * All functions filter by teacherId for proper isolation.
 */

import { db } from "@/lib/db";
import { users, tutors, tutorEarnings, tuitionCourses, tuitionEnrollments, tutorReviews, liveSessions } from "@/lib/db/schema";
import { eq, and, count, desc, sql, gte, lte, sum } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { cache } from "react";

// Get current teacher ID from auth session
export async function getCurrentTeacherId() {
  const authResult = await requireAuth(['teacher']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;  // Database userId

  // Get tutor record for this teacher
  const tutor = await db.query.tutors.findFirst({
    where: eq(tutors.userId, userId),
    columns: { id: true },
  });

  return tutor?.id || null;
}

/**
 * TEACHER EARNINGS DATA
 */
export interface EarningsData {
  totalEarnings: number;
  currentMonthEarnings: number;
  pendingEarnings: number;
  lastPayout: number;
  lastPayoutDate: string | null;
  nextPayoutDate: string;
  currency: string;
}

export interface TransactionData {
  id: string;
  type: "course_sale" | "live_session" | "payout";
  title: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: "completed" | "pending" | "processing";
  date: string;
  student?: string;
  enrollmentCount?: number;
  method?: string;
}

export interface CourseStatsData {
  id: string;
  title: string;
  type: string;
  enrollments: number;
  totalRevenue: number;
  avgRating: number;
  price: number;
  completionRate?: number;
  sessionsCompleted?: number;
}

export async function getTeacherEarnings(tutorId: string | null) {
  if (!tutorId) {
    return {
      earningsData: {
        totalEarnings: 0,
        currentMonthEarnings: 0,
        pendingEarnings: 0,
        lastPayout: 0,
        lastPayoutDate: null,
        nextPayoutDate: "",
        currency: "Nu.",
      },
      transactions: [] as TransactionData[],
      courseStats: [] as CourseStatsData[],
    };
  }

  // Get current date for filtering
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Format next payout date
  const nextPayoutDate = nextMonthEnd.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Get all earnings for this tutor
  const allEarnings = await db.query.tutorEarnings.findMany({
    where: eq(tutorEarnings.tutorId, tutorId),
    orderBy: [desc(tutorEarnings.earnedAt)],
  });

  // Calculate totals
  const totalEarnings = allEarnings.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Current month earnings
  const currentMonthEarnings = allEarnings
    .filter((e) => e.earnedAt && new Date(e.earnedAt) >= new Date(currentMonthStart))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Pending earnings (status = 'pending')
  const pendingEarnings = allEarnings
    .filter((e) => e.payoutStatus === "pending")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Last payout (most recent 'paid' status)
  const paidEarnings = allEarnings
    .filter((e) => e.payoutStatus === "paid" && e.withdrawnAt)
    .sort((a, b) => new Date(b.withdrawnAt!).getTime() - new Date(a.withdrawnAt!).getTime());

  const lastPayout = paidEarnings.length > 0
    ? paidEarnings.reduce((sum, e) => sum + (e.amount || 0), 0)
    : 0;

  const lastPayoutDate = paidEarnings.length > 0 && paidEarnings[0].withdrawnAt
    ? new Date(paidEarnings[0].withdrawnAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const earningsData: EarningsData = {
    totalEarnings,
    currentMonthEarnings,
    pendingEarnings,
    lastPayout,
    lastPayoutDate,
    nextPayoutDate,
    currency: "Nu.",
  };

  // Build transactions list
  const transactions: TransactionData[] = await Promise.all(
    allEarnings.slice(0, 50).map(async (earning) => {
      let title = "";
      let studentName: string | undefined;
      let type: "course_sale" | "live_session" | "payout";

      if ((earning as any).sourceType === "course") {
        type = "course_sale";
        // Get course details
        const course = await db.query.tuitionCourses.findFirst({
          where: eq(tuitionCourses.id, (earning as any).sourceId),
          columns: { title: true },
        });
        title = course?.title || "Course Sale";

        // Get student info from enrollment
        if (earning.enrollmentId) {
          const enrollment = await db.query.tuitionEnrollments.findFirst({
            where: eq(tuitionEnrollments.id, earning.enrollmentId),
            with: {
              student: true,
            },
          });
          if (enrollment?.student) {
            studentName = `${(enrollment.student as any).firstName} ${(enrollment.student as any).lastName || ""}`.trim();
          }
        }
      } else if ((earning as any).sourceType === "live_session") {
        type = "live_session";
        // Get session details
        const session = await db.query.liveSessions.findFirst({
          where: eq(liveSessions.id, (earning as any).sourceId),
          columns: { title: true },
        });
        title = session?.title || `${(session as any)?.subject || ""} Live Session`;

        // For live sessions, student would be from the session
        if ((earning as any).sourceId) {
          const session = await db.query.liveSessions.findFirst({
            where: eq(liveSessions.id, (earning as any).sourceId),
            with: {
              student: true,
            },
          });
          if (session?.student) {
            studentName = `${(session.student as any).firstName} ${(session.student as any).lastName || ""}`.trim();
          }
        }
      } else {
        type = "payout";
        title = `Payout - ${new Date(earning.earnedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
      }

      const status = earning.payoutStatus === "paid"
        ? "completed"
        : earning.payoutStatus === "processing"
        ? "processing"
        : "pending";

      return {
        id: earning.id,
        type,
        title,
        amount: (earning as any).grossAmount || 0,
        fee: (earning as any).platformFee || 0,
        netAmount: earning.amount || 0,
        status,
        date: earning.earnedAt ? new Date(earning.earnedAt).toISOString().split("T")[0] : "",
        student: studentName,
        method: (earning as any).payoutMethod || undefined,
      };
    })
  );

  // Get course statistics
  const courses = await db.query.tuitionCourses.findMany({
    where: eq(tuitionCourses.tutorId, tutorId),
    orderBy: [desc(tuitionCourses.createdAt)],
  });

  const courseStats: CourseStatsData[] = await Promise.all(
    courses.map(async (course) => {
      // Get enrollment count
      const [enrollmentResult] = await db
        .select({ count: count(), totalRevenue: sum(tuitionEnrollments.tutorEarnings) })
        .from(tuitionEnrollments)
        .where(eq(tuitionEnrollments.courseId, course.id));

      // Get average rating from reviews
      const reviews = await db.query.tutorReviews.findMany({
        where: eq(tutorReviews.tutorId, tutorId),
      });

      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

      // Calculate completion rate (students who completed the course)
      const completedEnrollments = await db.query.tuitionEnrollments.findMany({
        where: and(
          eq(tuitionEnrollments.courseId, course.id),
          sql`${tuitionEnrollments.completedAt} IS NOT NULL`
        ),
      });

      const completionRate = enrollmentResult.count > 0
        ? Math.round((completedEnrollments.length / enrollmentResult.count) * 100)
        : 0;

      // For live sessions, get sessions completed
      let sessionsCompleted = 0;
      if ((course as any).type === "online_live") {
        const sessions = await db.query.liveSessions.findMany({
          where: and(
            eq(liveSessions.courseId, course.id),
            eq(liveSessions.status, "completed")
          ),
        });
        sessionsCompleted = sessions.length;
      }

      return {
        id: course.id,
        title: course.title,
        type: (course as any).type === "online_recorded"
          ? "Recorded Course"
          : (course as any).type === "online_live"
          ? "Live Sessions"
          : "Physical Tuition",
        enrollments: enrollmentResult.count || 0,
        totalRevenue: Number(enrollmentResult.totalRevenue || 0),
        avgRating: Math.round(avgRating * 10) / 10,
        price: (course as any).price || 0,
        completionRate: (course as any).type === "online_recorded" ? completionRate : undefined,
        sessionsCompleted: (course as any).type === "online_live" ? sessionsCompleted : undefined,
      };
    })
  );

  // Sort course stats by revenue
  courseStats.sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    earningsData,
    transactions,
    courseStats,
  };
}

/**
 * Filter transactions by time period and status
 */
export function filterTransactions(
  transactions: TransactionData[],
  timePeriod: "all" | "month" | "quarter" | "year",
  status: "all" | "completed" | "pending" | "processing"
): TransactionData[] {
  const now = new Date();
  let startDate: Date | null = null;

  switch (timePeriod) {
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter":
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "all":
    default:
      startDate = null;
  }

  return transactions.filter((txn) => {
    const matchesStatus = status === "all" || txn.status === status;
    const matchesTime = !startDate || new Date(txn.date) >= startDate;
    return matchesStatus && matchesTime;
  });
}
