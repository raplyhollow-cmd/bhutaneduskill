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

// ============================================================================
// TYPES
// ============================================================================

interface TutorEarningWithExtras {
  id: string;
  tutorId: string;
  amount: number | null;
  sourceType?: string | null;
  sourceId?: string | null;
  grossAmount?: number | null;
  platformFee?: number | null;
  payoutStatus: string | null;
  earnedAt: string | null;
  withdrawnAt: string | null;
  payoutMethod?: string | null;
  enrollmentId?: string | null;
}

interface TuitionEnrollmentWithStudent {
  id: string;
  courseId: string;
  studentId: string;
  student?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface LiveSessionWithStudent {
  id: string;
  title?: string | null;
  subject?: string | null;
  studentId?: string | null;
  student?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface TuitionCourseWithExtras {
  id: string;
  title: string;
  type?: string | null;
  price?: number | null;
  tutorId: string;
}

interface TutorWithUser {
  id: string;
  averageRating?: number | null;
}

// Get current teacher ID from auth session
export async function getCurrentTeacherId() {
  const authResult = await requireAuth(['teacher']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;  // Database userId

  // Get tutor record for this teacher
  const tutor = await db
    .select({ id: tutors.id })
    .from(tutors)
    .where(eq(tutors.userId, userId))
    .limit(1)
    .then(rows => rows[0] || null);

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
  const allEarnings = await db
    .select()
    .from(tutorEarnings)
    .where(eq(tutorEarnings.tutorId, tutorId))
    .orderBy(desc(tutorEarnings.earnedAt));

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
      // Access properties directly - Drizzle relations
      const earningData = earning as {
        sourceType?: string | null;
        sourceId?: string | null;
        grossAmount?: number | null;
        platformFee?: number | null;
        payoutMethod?: string | null;
        enrollmentId?: string | null;
      };
      let title = "";
      let studentName: string | undefined;
      let type: "course_sale" | "live_session" | "payout";

      if (earningData.sourceType === "course") {
        type = "course_sale";
        // Get course details
        const course = await db
          .select({ title: tuitionCourses.title })
          .from(tuitionCourses)
          .where(eq(tuitionCourses.id, earningData.sourceId || ""))
          .limit(1)
          .then(rows => rows[0] || null);
        title = course?.title || "Course Sale";

        // Get student info from enrollment
        if (earningData.enrollmentId) {
          // Use direct select to get enrollment data without relations
          const enrollment = await db
            .select({
              studentId: tuitionEnrollments.studentId,
            })
            .from(tuitionEnrollments)
            .where(eq(tuitionEnrollments.id, earningData.enrollmentId))
            .limit(1)
            .then(rows => rows[0] || null);

          if (enrollment?.studentId) {
            // Get student details
            const student = await db
              .select({
                firstName: users.firstName,
                lastName: users.lastName,
              })
              .from(users)
              .where(eq(users.id, enrollment.studentId))
              .limit(1)
              .then(rows => rows[0] || null);
            if (student) {
              studentName = `${student.firstName} ${student.lastName || ""}`.trim();
            }
          }
        }
      } else if (earningData.sourceType === "live_session") {
        type = "live_session";
        // Get session details
        const session = await db
          .select({
            title: liveSessions.title,
            subject: liveSessions.subject,
          })
          .from(liveSessions)
          .where(eq(liveSessions.id, earningData.sourceId || ""))
          .limit(1)
          .then(rows => rows[0] || null);
        title = session?.title || `${session?.subject || ""} Live Session`;
        // Live sessions don't have direct student reference - earning is from course enrollments
        studentName = "Course Students";
      } else {
        type = "payout";
        title = `Payout - ${new Date(earning.earnedAt || new Date()).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
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
        amount: earningData.grossAmount || 0,
        fee: earningData.platformFee || 0,
        netAmount: earning.amount || 0,
        status,
        date: earning.earnedAt ? new Date(earning.earnedAt).toISOString().split("T")[0] : "",
        student: studentName,
        method: earningData.payoutMethod || undefined,
      };
    })
  );

  // Get course statistics
  const courses = await db
    .select()
    .from(tuitionCourses)
    .where(eq(tuitionCourses.tutorId, tutorId))
    .orderBy(desc(tuitionCourses.createdAt));

  const courseStats: CourseStatsData[] = await Promise.all(
    courses.map(async (course) => {
      const courseData = course as { type?: string | null; price?: number | null };
      // Get enrollment count
      const [enrollmentResult] = await db
        .select({ count: count(), totalRevenue: sum(tuitionEnrollments.tutorEarnings) })
        .from(tuitionEnrollments)
        .where(eq(tuitionEnrollments.courseId, course.id));

      // Get average rating from reviews
      const reviews = await db
        .select()
        .from(tutorReviews)
        .where(eq(tutorReviews.tutorId, tutorId));

      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

      // Calculate completion rate (students who completed the course)
      const completedEnrollments = await db
        .select()
        .from(tuitionEnrollments)
        .where(and(
          eq(tuitionEnrollments.courseId, course.id),
          sql`${tuitionEnrollments.completedAt} IS NOT NULL`
        ));

      const completionRate = enrollmentResult.count > 0
        ? Math.round((completedEnrollments.length / enrollmentResult.count) * 100)
        : 0;

      // For live sessions, get sessions completed
      let sessionsCompleted = 0;
      if (courseData.type === "online_live") {
        const sessions = await db
          .select()
          .from(liveSessions)
          .where(and(
            eq(liveSessions.courseId, course.id),
            eq(liveSessions.status, "completed")
          ));
        sessionsCompleted = sessions.length;
      }

      return {
        id: course.id,
        title: course.title,
        type: courseData.type === "online_recorded"
          ? "Recorded Course"
          : courseData.type === "online_live"
          ? "Live Sessions"
          : "Physical Tuition",
        enrollments: enrollmentResult.count || 0,
        totalRevenue: Number(enrollmentResult.totalRevenue || 0),
        avgRating: Math.round(avgRating * 10) / 10,
        price: courseData.price || 0,
        completionRate: courseData.type === "online_recorded" ? completionRate : undefined,
        sessionsCompleted: courseData.type === "online_live" ? sessionsCompleted : undefined,
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
