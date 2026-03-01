/**
 * STUDENT DATA FETCHING UTILITIES
 *
 * Server-side data fetching functions for student portal.
 * All functions filter by studentId from Clerk auth session.
 */

import { db } from "@/lib/db";
import { users, classes, homework, homeworkSubmissions, attendance, studentFees, enrollments, assessments, examResultsEnhanced, moduleProgress, learningModules, tuitionEnrollments, tuitionCourses, subjects, careerMatches, riasecResults, schools } from "@/lib/db/schema";
import { eq, and, count, desc, sql, gte, lte, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { cache } from "react";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

interface UserRecord {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  classGrade: number | null;
  section: string | null;
  schoolId: string | null;
  dateOfBirth: string | null;
  profileImage: string | null;
  type: string;
  onboardingStatus?: string | null;
}

interface AssessmentWithExtras {
  id: string;
  userId: string;
  type: string;
  status: string;
  completedAt: Date | null;
  createdAt: Date;
}

interface HomeworkSubmissionWithExtras {
  id: string;
  homeworkId: string;
  studentId: string;
  score: number | null;
  percentage?: number | null;
  feedback: string | null;
  gradedAt: Date | null;
  submittedAt: Date | null;
  createdAt: Date;
}

interface HomeworkWithExtras {
  id: string;
  title: string;
  type?: string | null;
  subjectId: string | null;
  dueDate: string;
  assignedDate: string;
  maxPoints?: number | null;
  isPublished: boolean | null;
}

interface ExamResultWithExtras {
  id: string;
  studentId: string;
  examName: string | null;
  examType: string | null;
  examYear?: number | null;
  overallPercentage?: number | null;
  percentage?: number | null;
  totalPercentage?: number | null;
  division?: string | null;
}

interface StudentFeeWithExtras {
  id: string;
  studentId: string;
  totalAmount?: number | null;
  amountPaid?: number | null;
  amountPending?: number | null;
  status: string;
  dueDate?: string | null;
}

interface ModuleProgressWithExtras {
  id: string;
  studentId: string;
  moduleId: string;
  progressPercentage?: number | null;
  completedAt: Date | null;
  certificateUrl: string | null;
  createdAt: Date;
  lastAccessedAt: Date;
}

interface TuitionEnrollmentWithExtras {
  id: string;
  studentId: string;
  courseId: string;
  progressPercentage?: number | null;
  completedAt: Date | null;
  enrolledAt: Date | string;
  expiresAt?: Date | string | null;
  certificateUrl?: string | null;
  amountPaid?: number | null;
}

// Get current student ID from auth session
export async function getCurrentStudentId() {
  const authResult = await requireAuth(['student']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;  // Database userId

  // Get student record to return school info - use direct select instead of query API to avoid relation issues
  const studentRecords = await db
    .select({
      id: users.id,
      schoolId: users.schoolId,
      classGrade: users.classGrade,
      section: users.section,
      type: users.type,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const student = studentRecords[0];

  if (!student || student.type !== "student") {
    return null;
  }

  return {
    id: student.id,
    schoolId: student.schoolId,
    classGrade: student.classGrade,
    section: student.section,
  };
}

/**
 * STUDENT DASHBOARD DATA
 */
export interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  classGrade: number | null;
  section: string | null;
  className: string | null;
  classId: string | null;
  schoolId: string | null;
  schoolName: string | null;  // School name to confirm student's school
  classTeacherName: string | null;  // Class teacher name for current period
  dateOfBirth: string | null;
  profileImage: string | null;
}

export interface HomeworkSummary {
  pending: number;
  submitted: number;
  graded: number;
  total: number;
}

export interface AssessmentSummary {
  completed: number;
  total: number;
  latestResult: {
    type: string;
    completedAt: string | null;
    scores?: Record<string, number>;
  } | null;
}

export interface AttendanceSummary {
  rate: number;
  presentDays: number;
  totalDays: number;
  thisWeek: {
    present: number;
    total: number;
  };
}

export interface ClassSchedule {
  classId: string;
  className: string;
  subject: string;
  teacher: string;
  room: string;
  day: string;
  startTime: string;
  endTime: string;
}

export interface RecentAchievement {
  id: string;
  type: "assessment" | "homework" | "module" | "attendance";
  title: string;
  description: string;
  date: string;
  icon?: string;
}

export interface UpcomingDeadline {
  id: string;
  type: "homework" | "assessment" | "fee" | "class";
  title: string;
  description: string;
  dueDate: string;
  daysUntil: number;
  urgency: "high" | "medium" | "low";
  link: string;
}

export interface CareerMatchSummary {
  totalMatches: number;
  topMatches: number;
  topCareer: string | null;
  hollandCode: string | null;
}

export interface FeeStatus {
  totalAmount: number;
  amountPaid: number;
  amountPending: number;
  status: "paid" | "partial" | "pending";
  dueDate: string | null;
}

export interface StudentDashboardData {
  student: StudentInfo;
  onboardingStatus?: "pending_enrollment" | "complete" | "rejected";
  homework: HomeworkSummary;
  assessments: AssessmentSummary;
  attendance: AttendanceSummary;
  classes: ClassSchedule[];
  achievements: RecentAchievement[];
  deadlines: UpcomingDeadline[];
  careerMatches: CareerMatchSummary;
  fees: FeeStatus | null;
}

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const authData = await getCurrentStudentId();
  if (!authData) {
    throw new Error("Student not found");
  }

  const { id: studentId, schoolId } = authData;

  // 1. Get student info
  // IMPORTANT: Use db.select() to avoid loading relations (users has self-referential parent relation)
  const studentRecords = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      classGrade: users.classGrade,
      section: users.section,
      schoolId: users.schoolId,
      dateOfBirth: users.dateOfBirth,
      profileImage: users.profileImage,
      onboardingStatus: users.onboardingStatus,
    })
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);

  if (studentRecords.length === 0) {
    throw new Error("Student not found");
  }

  const userRecord = studentRecords[0] as UserRecord;
  const studentName = `${userRecord.firstName} ${userRecord.lastName || ""}`.trim();

  // CRITICAL: Check if student is still pending enrollment
  const isPendingEnrollment = userRecord.onboardingStatus === "pending_enrollment";

  // If student is pending enrollment, return limited data
  // They can access assessments, career exploration, journal, goals
  // But NOT classes, homework, attendance, results (school-specific data)
  if (isPendingEnrollment) {
    // Get assessments (available to all students)
    // Only count career assessments (5 types: riasec, mbti, disc, work_values, learning-styles)
    const CAREER_ASSESSMENT_TYPES = ["riasec", "mbti", "disc", "work_values", "learning-styles"] as const;

    const studentAssessments = await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, studentId))
      .orderBy(desc(assessments.createdAt))
      .limit(20);

    // Filter for career assessments only
    const careerAssessments = studentAssessments.filter(a =>
      CAREER_ASSESSMENT_TYPES.includes(a.type as typeof CAREER_ASSESSMENT_TYPES[number])
    );
    const completedAssessments = careerAssessments.filter((a) => a.status === "completed");
    const latestAssessment = completedAssessments[0] || null;

    // Get career matches
    let hollandCode: string | null = null;
    if (latestAssessment && (latestAssessment as AssessmentWithExtras).type === "riasec") {
      const riasecResult = await db
        .select()
        .from(riasecResults)
        .where(eq(riasecResults.userId, studentId))
        .orderBy(desc(riasecResults.createdAt))
        .limit(1)
        .then(rows => rows[0] || null);
      hollandCode = riasecResult?.hollandCode || null;
    }

    const [careerMatchCount] = await db
      .select({ count: count() })
      .from(careerMatches)
      .where(eq(careerMatches.studentId, studentId));

    const studentInfo: StudentInfo = {
      id: studentRecords[0].id,
      firstName: userRecord.firstName,
      lastName: userRecord.lastName,
      name: studentName,
      email: userRecord.email,
      phone: userRecord.phone,
      classGrade: userRecord.classGrade,
      section: userRecord.section,
      className: null,
      classId: null,
      schoolId: userRecord.schoolId,
      schoolName: null,
      classTeacherName: null,
      dateOfBirth: userRecord.dateOfBirth,
      profileImage: userRecord.profileImage,
    };

    return {
      student: studentInfo,
      onboardingStatus: "pending_enrollment",
      homework: { pending: 0, submitted: 0, graded: 0, total: 0 },
      assessments: {
        completed: completedAssessments.length,
        total: CAREER_ASSESSMENT_TYPES.length, // Always 5 for career assessments
        latestResult: latestAssessment ? {
          type: (latestAssessment as AssessmentWithExtras).type,
          completedAt: latestAssessment.completedAt ? new Date(latestAssessment.completedAt).toISOString() : null,
        } : null,
      },
      attendance: { rate: 0, presentDays: 0, totalDays: 0, thisWeek: { present: 0, total: 0 } },
      classes: [],
      achievements: [],
      deadlines: [],
      careerMatches: {
        totalMatches: careerMatchCount?.count || 0,
        topMatches: 0,
        topCareer: null,
        hollandCode,
      },
      fees: null,
    };
  }

  // Get student's class enrollment
  const enrollment = await db
    .select()
    .from(enrollments)
    .where(and(
      eq(enrollments.studentId, studentId),
      eq(enrollments.status, "active")
    ))
    .limit(1)
    .then(rows => rows[0] || null);

  // Fetch school name to confirm student's school
  let schoolName: string | null = null;
  if (userRecord.schoolId) {
    try {
      const [school] = await db
        .select({ name: schools.name })
        .from(schools)
        .where(eq(schools.id, userRecord.schoolId))
        .limit(1);
      schoolName = school?.name || null;
    } catch {
      // If school query fails, continue without school name
    }
  }

  // Fetch class teacher name for current period
  let classTeacherName: string | null = null;
  let className: string | null = null;
  if (enrollment?.classId) {
    try {
      const [classRecord] = await db
        .select({
          name: classes.name,
          classTeacherName: classes.classTeacherName,
        })
        .from(classes)
        .where(eq(classes.id, enrollment.classId))
        .limit(1);
      if (classRecord) {
        className = classRecord.name;
        classTeacherName = classRecord.classTeacherName;
      }
    } catch {
      // If class query fails, continue without class info
    }
  }

  const studentInfo: StudentInfo = {
    id: studentRecords[0].id,
    firstName: userRecord.firstName,
    lastName: userRecord.lastName,
    name: studentName,
    email: userRecord.email,
    phone: userRecord.phone,
    classGrade: userRecord.classGrade,
    section: userRecord.section,
    className,
    classId: enrollment?.classId || null,
    schoolId: userRecord.schoolId,
    schoolName,
    classTeacherName,
    dateOfBirth: userRecord.dateOfBirth,
    profileImage: userRecord.profileImage,
  };

  // 2. Get homework summary
  const studentClassIds = enrollment ? [enrollment.classId] : [];

  let homeworkSummary: HomeworkSummary = {
    pending: 0,
    submitted: 0,
    graded: 0,
    total: 0,
  };

  if (studentClassIds.length > 0) {
    // Get all homework for student's classes
    const allHomework = await db
      .select()
      .from(homework)
      .where(and(
        inArray(homework.classId, studentClassIds),
        sql`${homework.isPublished} = true`
      ))
      .orderBy(desc(homework.dueDate))
      .limit(50);

    homeworkSummary.total = allHomework.length;

    // OPTIMIZATION: Batch fetch all submissions for this student at once
    const homeworkIds = allHomework.map(hw => hw.id);
    let studentSubmissionsMap = new Map<string, { gradedAt: Date | null }>();

    if (homeworkIds.length > 0) {
      const studentSubmissions = await db
        .select({
          homeworkId: homeworkSubmissions.homeworkId,
          studentId: homeworkSubmissions.studentId,
          gradedAt: homeworkSubmissions.gradedAt,
        })
        .from(homeworkSubmissions)
        .where(
          and(
            inArray(homeworkSubmissions.homeworkId, homeworkIds),
            eq(homeworkSubmissions.studentId, studentId)
          )
        );

      // Create a map for O(1) lookup
      studentSubmissionsMap = new Map(
        studentSubmissions.map(s => [s.homeworkId, { gradedAt: s.gradedAt }])
      );
    }

    // Now iterate without additional queries
    for (const hw of allHomework) {
      const submission = studentSubmissionsMap.get(hw.id);

      if (submission) {
        if (submission.gradedAt) {
          homeworkSummary.graded++;
        }
        homeworkSummary.submitted++;
      } else {
        homeworkSummary.pending++;
      }
    }
  }

  // 3. Get assessment summary
  // Only count career assessments (5 types: riasec, mbti, disc, work_values, learning-styles)
  const CAREER_ASSESSMENT_TYPES = ["riasec", "mbti", "disc", "work_values", "learning-styles"] as const;

  const studentAssessments = await db
    .select()
    .from(assessments)
    .where(eq(assessments.userId, studentId))
    .orderBy(desc(assessments.createdAt))
    .limit(20);

  // Filter for career assessments only
  const careerAssessments = studentAssessments.filter(a =>
    CAREER_ASSESSMENT_TYPES.includes(a.type as typeof CAREER_ASSESSMENT_TYPES[number])
  );
  const completedAssessments = careerAssessments.filter(a => a.status === "completed");
  const latestAssessment = completedAssessments[0] || null;

  // Get RIASEC result for career matching
  let hollandCode: string | null = null;
  if (latestAssessment && (latestAssessment as AssessmentWithExtras).type === "riasec") {
    const riasecResult = await db
      .select()
      .from(riasecResults)
      .where(eq(riasecResults.userId, studentId))
      .orderBy(desc(riasecResults.createdAt))
      .limit(1)
      .then(rows => rows[0] || null);
    hollandCode = riasecResult?.hollandCode || null;
  }

  const assessmentWithExtras = latestAssessment as AssessmentWithExtras | null;
  const assessmentSummary: AssessmentSummary = {
    completed: completedAssessments.length,
    total: CAREER_ASSESSMENT_TYPES.length, // Always 5 for career assessments
    latestResult: latestAssessment ? {
      type: assessmentWithExtras!.type,
      completedAt: latestAssessment.completedAt ? new Date(latestAssessment.completedAt).toISOString() : null,
    } : null,
  };

  // 4. Get attendance summary (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const attendanceRecords = await db
    .select()
    .from(attendance)
    .where(and(
      eq(attendance.studentId, studentId),
      gte(attendance.date, thirtyDaysAgoStr)
    ));

  const presentDays = attendanceRecords.filter(a => a.status === "present" || a.status === "late").length;
  const totalDays = attendanceRecords.length;

  // Get this week's attendance
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  const thisWeekRecords = attendanceRecords.filter(a => a.date >= weekAgoStr);
  const thisWeekPresent = thisWeekRecords.filter(a => a.status === "present" || a.status === "late").length;

  const attendanceSummary: AttendanceSummary = {
    rate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
    presentDays,
    totalDays,
    thisWeek: {
      present: thisWeekPresent,
      total: thisWeekRecords.length,
    },
  };

  // 5. Get class schedule (placeholder - would need timetable table)
  const classSchedule: ClassSchedule[] = [];

  // 6. Get recent achievements
  const achievements: RecentAchievement[] = [];

  // Add completed assessment achievement
  if (latestAssessment && latestAssessment.status === "completed") {
    const assessmentWithExtras = latestAssessment as AssessmentWithExtras;
    achievements.push({
      id: `assessment-${latestAssessment.id}`,
      type: "assessment",
      title: `Completed ${assessmentWithExtras.type.toUpperCase()} Assessment`,
      description: "Career assessment completed successfully",
      date: (latestAssessment.completedAt || latestAssessment.createdAt) instanceof Date
        ? (latestAssessment.completedAt || latestAssessment.createdAt).toISOString()
        : new Date(latestAssessment.completedAt || latestAssessment.createdAt).toISOString(),
    });
  }

  // Add homework achievements
  const recentSubmissions = await db
    .select()
    .from(homeworkSubmissions)
    .where(eq(homeworkSubmissions.studentId, studentId))
    .orderBy(desc(homeworkSubmissions.submittedAt))
    .limit(3);

  // OPTIMIZATION: Batch fetch all homework details at once
  const homeworkIds = recentSubmissions.map(s => s.homeworkId);
  let homeworkMap = new Map<string, { title: string }>();

  if (homeworkIds.length > 0) {
    const homeworkDetails = await db
      .select({
        id: homework.id,
        title: homework.title,
      })
      .from(homework)
      .where(inArray(homework.id, homeworkIds));

    homeworkMap = new Map(homeworkDetails.map(hw => [hw.id, { title: hw.title }]));
  }

  for (const sub of recentSubmissions) {
    const hw = homeworkMap.get(sub.homeworkId);

    if (hw) {
      const subWithExtras = sub as HomeworkSubmissionWithExtras;
      achievements.push({
        id: `homework-${sub.id}`,
        type: "homework",
        title: `Submitted: ${hw.title}`,
        description: sub.gradedAt ? `Scored: ${subWithExtras.percentage || 0}%` : "Awaiting grading",
        date: sub.submittedAt ? new Date(sub.submittedAt).toISOString() : sub.createdAt.toISOString(),
      });
    }
  }

  // Add module completion achievements
  const completedModules = await db
    .select()
    .from(moduleProgress)
    .where(and(
      eq(moduleProgress.studentId, studentId),
      sql`${moduleProgress.completedAt} IS NOT NULL`
    ))
    .orderBy(desc(moduleProgress.completedAt))
    .limit(3);

  for (const progress of completedModules) {
    achievements.push({
      id: `module-${progress.id}`,
      type: "module",
      title: `Completed: Learning Module`, // Relation removed - would need separate query
      description: "Certificate available",
      date: progress.completedAt ? new Date(progress.completedAt).toISOString() : progress.createdAt.toISOString(),
    });
  }

  // Sort achievements by date
  achievements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 7. Get upcoming deadlines
  const deadlines: UpcomingDeadline[] = [];
  const today = new Date();

  // Homework deadlines
  if (studentClassIds.length > 0) {
    const upcomingHomework = await db
      .select()
      .from(homework)
      .where(and(
        inArray(homework.classId, studentClassIds),
        gte(homework.dueDate, today.toISOString().split("T")[0]),
        sql`${homework.isPublished} = true`
      ))
      .orderBy(homework.dueDate)
      .limit(5);

    // OPTIMIZATION: Batch fetch all submissions for this student
    const homeworkIds = upcomingHomework.map(hw => hw.id);
    let submittedHomeworkIds = new Set<string>();

    if (homeworkIds.length > 0) {
      const studentSubmissions = await db
        .select({ homeworkId: homeworkSubmissions.homeworkId })
        .from(homeworkSubmissions)
        .where(
          and(
            inArray(homeworkSubmissions.homeworkId, homeworkIds),
            eq(homeworkSubmissions.studentId, studentId)
          )
        );

      submittedHomeworkIds = new Set(studentSubmissions.map(s => s.homeworkId));
    }

    for (const hw of upcomingHomework) {
      // Only add if not submitted (check from our pre-fetched set)
      if (!submittedHomeworkIds.has(hw.id)) {
        const dueDate = new Date(hw.dueDate);
        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const hwWithExtras = hw as HomeworkWithExtras;

        deadlines.push({
          id: `homework-${hw.id}`,
          type: "homework",
          title: hw.title,
          description: `${hwWithExtras.type || "assignment"} - ${hw.subjectId || "Class"}`,
          dueDate: hw.dueDate,
          daysUntil,
          urgency: daysUntil <= 2 ? "high" : daysUntil <= 7 ? "medium" : "low",
          link: `/student/homework`,
        });
      }
    }
  }

  // Fee deadlines - wrap in try-catch to handle missing table or query errors
  if (schoolId) {
    try {
      const feeData = await db
        .select()
        .from(studentFees)
        .where(and(
          eq(studentFees.studentId, studentId),
          sql`${studentFees.amountPending} IS NOT NULL AND ${studentFees.amountPending} > 0`
        ))
        .limit(1)
        .then(rows => rows[0] || null);

      if (feeData?.dueDate) {
        const dueDate = new Date(feeData.dueDate);
        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil >= 0 && daysUntil <= 30) {
          deadlines.push({
            id: `fee-${feeData.id}`,
            type: "fee",
            title: "Fee Payment Due",
            description: `Nu. ${feeData.amountPending} pending`,
            dueDate: feeData.dueDate,
            daysUntil,
            urgency: daysUntil <= 7 ? "high" : "medium",
            link: `/student/fees`,
          });
        }
      }
    } catch (error) {
      // Silently ignore fee query errors (table may not exist, connection issue, etc.)
      logger.debug("Fee query failed - fee deadlines will not be shown", { error });
    }
  }

  // Sort deadlines by urgency and due date
  deadlines.sort((a, b) => {
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return a.daysUntil - b.daysUntil;
  });

  // 8. Get career match summary
  // CRITICAL FIX: Filter by BOTH assessmentId AND studentId to prevent data leakage
  const [careerMatchCount] = await db
    .select({ count: count() })
    .from(careerMatches)
    .where(and(
      eq(careerMatches.assessmentId, latestAssessment?.id || ""),
      eq(careerMatches.studentId, studentId) // CRITICAL: Prevents seeing other students' matches
    ));

  const [topMatchCount] = await db
    .select({ count: count() })
    .from(careerMatches)
    .where(and(
      eq(careerMatches.assessmentId, latestAssessment?.id || ""),
      eq(careerMatches.studentId, studentId), // CRITICAL: Prevents seeing other students' matches
      eq(careerMatches.isTopMatch, true)
    ));

  const careerMatchSummary: CareerMatchSummary = {
    totalMatches: careerMatchCount?.count || 0,
    topMatches: topMatchCount?.count || 0,
    topCareer: null, // Would need to join with careers table
    hollandCode,
  };

  // 9. Get fee status - wrap in try-catch to handle missing table or query errors
  let feeStatus: FeeStatus | null = null;

  if (schoolId) {
    try {
      const studentFee = await db
        .select()
        .from(studentFees)
        .where(eq(studentFees.studentId, studentId))
        .limit(1)
        .then(rows => rows[0] || null);

      if (studentFee) {
        const feeWithExtras = studentFee as StudentFeeWithExtras;
        feeStatus = {
          totalAmount: feeWithExtras.totalAmount || 0,
          amountPaid: feeWithExtras.amountPaid || 0,
          amountPending: studentFee.amountPending || 0,
          status: studentFee.status as "paid" | "partial" | "pending",
          dueDate: feeWithExtras.dueDate || null,
        };
      }
    } catch (error) {
      // Silently ignore fee query errors (table may not exist, connection issue, etc.)
      logger.debug("Fee status query failed - fees will not be shown", { error });
    }
  }

  return {
    student: studentInfo,
    homework: homeworkSummary,
    assessments: assessmentSummary,
    attendance: attendanceSummary,
    classes: classSchedule,
    achievements: achievements.slice(0, 5),
    deadlines: deadlines.slice(0, 5),
    careerMatches: careerMatchSummary,
    fees: feeStatus,
  };
}

/**
 * STUDENT ACADEMIC PROGRESS DATA
 */
export interface SubjectPerformance {
  subject: string;
  subjectId: string | null;
  averageScore: number;
  totalAssignments: number;
  completedAssignments: number;
  trend: "up" | "down" | "stable";
}

export interface AttendanceRecord {
  date: string;
  status: "present" | "absent" | "late" | "excused" | "sick_leave";
  class: string;
}

export interface ExamResult {
  id: string;
  examName: string;
  examType: string;
  examYear: number;
  overallPercentage: number;
  division: string | null;
  subjectResults: Array<{
    subject: string;
    marks: number;
    maxMarks: number;
    percentage: number;
    grade: string;
  }>;
}

export interface LearningProgress {
  moduleId: string;
  moduleTitle: string;
  subject: string;
  progress: number;
  isCompleted: boolean;
  completedAt: string | null;
  certificateUrl: string | null;
}

export interface StudentProgressData {
  student: StudentInfo;
  subjects: SubjectPerformance[];
  attendance: {
    rate: number;
    present: number;
    absent: number;
    late: number;
    records: AttendanceRecord[];
  };
  examResults: ExamResult[];
  learningProgress: LearningProgress[];
  classRank: number | null;
  gradeAverage: number;
}

export async function getStudentProgressData(): Promise<StudentProgressData> {
  const authData = await getCurrentStudentId();
  if (!authData) {
    throw new Error("Student not found");
  }

  const { id: studentId } = authData;

  // Get student info
  // IMPORTANT: Use db.select() to avoid loading relations (users has self-referential parent relation)
  const studentRecords = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      classGrade: users.classGrade,
      section: users.section,
      schoolId: users.schoolId,
      dateOfBirth: users.dateOfBirth,
      profileImage: users.profileImage,
    })
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);

  if (studentRecords.length === 0) {
    throw new Error("Student not found");
  }

  const userRecord = studentRecords[0] as UserRecord;
  const studentName = `${userRecord.firstName} ${userRecord.lastName || ""}`.trim();

  // Get enrollment for class info
  const enrollment = await db
    .select()
    .from(enrollments)
    .where(and(
      eq(enrollments.studentId, studentId),
      eq(enrollments.status, "active")
    ))
    .limit(1)
    .then(rows => rows[0] || null);

  // Fetch school name
  let schoolName: string | null = null;
  if (userRecord.schoolId) {
    try {
      const [school] = await db
        .select({ name: schools.name })
        .from(schools)
        .where(eq(schools.id, userRecord.schoolId))
        .limit(1);
      schoolName = school?.name || null;
    } catch {
      // If school query fails, continue without school name
    }
  }

  // Fetch class teacher name
  let classTeacherName: string | null = null;
  let className: string | null = null;
  if (enrollment?.classId) {
    try {
      const [classRecord] = await db
        .select({
          name: classes.name,
          classTeacherName: classes.classTeacherName,
        })
        .from(classes)
        .where(eq(classes.id, enrollment.classId))
        .limit(1);
      if (classRecord) {
        className = classRecord.name;
        classTeacherName = classRecord.classTeacherName;
      }
    } catch {
      // If class query fails, continue without class info
    }
  }

  const studentInfo: StudentInfo = {
    id: studentRecords[0].id,
    firstName: userRecord.firstName,
    lastName: userRecord.lastName,
    name: studentName,
    email: userRecord.email,
    phone: userRecord.phone,
    classGrade: userRecord.classGrade,
    section: userRecord.section,
    className,
    classId: enrollment?.classId || null,
    schoolId: userRecord.schoolId,
    schoolName,
    classTeacherName,
    dateOfBirth: userRecord.dateOfBirth,
    profileImage: userRecord.profileImage,
  };

  // Get attendance records (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const attendanceRecords = await db
    .select()
    .from(attendance)
    .where(and(
      eq(attendance.studentId, studentId),
      gte(attendance.date, thirtyDaysAgoStr)
    ))
    .orderBy(desc(attendance.date));

  const present = attendanceRecords.filter(a => a.status === "present").length;
  const absent = attendanceRecords.filter(a => a.status === "absent").length;
  const late = attendanceRecords.filter(a => a.status === "late").length;

  const attendanceSummary = {
    rate: attendanceRecords.length > 0
      ? Math.round(((present + late) / attendanceRecords.length) * 100)
      : 0,
    present,
    absent,
    late,
    records: attendanceRecords.map(r => ({
      date: r.date,
      status: r.status as "present" | "absent" | "late" | "excused" | "sick_leave",
      class: "Unknown", // Relation removed - would need separate query
    })),
  };

  // Get exam results
  const examResultsData = await db
    .select()
    .from(examResultsEnhanced)
    .where(eq(examResultsEnhanced.studentId, studentId))
    .orderBy(desc(examResultsEnhanced.examYear))
    .limit(10);

  const examResults: ExamResult[] = examResultsData.map(result => {
    const resultData = result as {
      examName?: string | null;
      examType?: string | null;
      examYear?: number | null;
      overallPercentage?: number | null;
      percentage?: number | null;
      totalPercentage?: number | null;
      division?: string | null;
    };
    return {
      id: result.id,
      examName: resultData.examName || "",
      examType: resultData.examType || "",
      examYear: resultData.examYear || new Date().getFullYear(),
      overallPercentage: resultData.overallPercentage ?? resultData.percentage ?? resultData.totalPercentage ?? 0,
      division: resultData.division || null,
      subjectResults: [],
    };
  });

  // Calculate grade average
  const gradeAverage = examResultsData.length > 0
    ? Math.round(examResultsData.reduce((sum, r) => {
        const rData = r as {
          overallPercentage?: number | null;
          percentage?: number | null;
          totalPercentage?: number | null;
        };
        return sum + (rData.overallPercentage ?? rData.percentage ?? rData.totalPercentage ?? 0);
      }, 0) / examResultsData.length)
    : 0;

  // Get homework performance by subject
  const subjectsMap = new Map<string, SubjectPerformance>();

  if (enrollment?.classId) {
    const classHomework = await db
      .select()
      .from(homework)
      .where(eq(homework.classId, enrollment.classId));

    // OPTIMIZATION: Batch fetch all submissions for this student and class homework
    const homeworkIds = classHomework.map(hw => hw.id);
    let submissionsMap = new Map<string, { score: number | null }>();

    if (homeworkIds.length > 0) {
      const studentSubmissions = await db
        .select({
          homeworkId: homeworkSubmissions.homeworkId,
          score: homeworkSubmissions.score,
        })
        .from(homeworkSubmissions)
        .where(
          and(
            inArray(homeworkSubmissions.homeworkId, homeworkIds),
            eq(homeworkSubmissions.studentId, studentId)
          )
        );

      submissionsMap = new Map(
        studentSubmissions.map(s => [s.homeworkId, { score: s.score }])
      );
    }

    for (const hw of classHomework) {
      const subjectName = hw.subjectId || "General";
      const submission = submissionsMap.get(hw.id);

      if (!subjectsMap.has(subjectName)) {
        subjectsMap.set(subjectName, {
          subject: subjectName,
          subjectId: hw.subjectId,
          averageScore: 0,
          totalAssignments: 0,
          completedAssignments: 0,
          trend: "stable",
        });
      }

      const subject = subjectsMap.get(subjectName)!;
      subject.totalAssignments++;

      if (submission) {
        subject.completedAssignments++;
        if (submission.score !== null) {
          subject.averageScore = Math.round(
            (subject.averageScore * (subject.completedAssignments - 1) + submission.score) /
            subject.completedAssignments
          );
        }
      }
    }
  }

  const subjects = Array.from(subjectsMap.values());

  // Get learning progress
  const learningProgressData = await db
    .select()
    .from(moduleProgress)
    .where(eq(moduleProgress.studentId, studentId))
    .orderBy(desc(moduleProgress.lastAccessedAt));

  const learningProgress: LearningProgress[] = learningProgressData.map(p => {
    const pWithExtras = p as ModuleProgressWithExtras;
    return {
      moduleId: p.moduleId,
      moduleTitle: "Unknown Module", // Relation removed - would need separate query
      subject: "General", // Relation removed - would need separate query
      progress: pWithExtras.progressPercentage || 0,
      isCompleted: p.completedAt !== null,
      completedAt: p.completedAt ? new Date(p.completedAt).toISOString() : null,
      certificateUrl: p.certificateUrl,
    };
  });

  return {
    student: studentInfo,
    subjects,
    attendance: attendanceSummary,
    examResults,
    learningProgress,
    classRank: null, // Would need additional query
    gradeAverage,
  };
}

/**
 * STUDENT HOMEWORK LIST
 */
export interface StudentHomeworkItem {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  type: string;
  dueDate: string;
  assignedDate: string;
  maxPoints: number | null;
  status: "pending" | "submitted" | "graded";
  submissionId: string | null;
  score: number | null;
  percentage: number | null;
  feedback: string | null;
  gradedAt: string | null;
  teacherName: string;
  classId: string;
}

export async function getStudentHomework(options: {
  status?: "all" | "pending" | "submitted" | "graded";
  limit?: number;
} = {}): Promise<StudentHomeworkItem[]> {
  const authData = await getCurrentStudentId();
  if (!authData) {
    throw new Error("Student not found");
  }

  const { id: studentId, schoolId } = authData;
  const { status = "all", limit = 50 } = options;

  // Get student's enrollment
  const enrollment = await db
    .select()
    .from(enrollments)
    .where(and(
      eq(enrollments.studentId, studentId),
      eq(enrollments.status, "active")
    ))
    .limit(1)
    .then(rows => rows[0] || null);

  if (!enrollment) {
    return [];
  }

  // Get homework for student's class
  const homeworkList = await db
    .select()
    .from(homework)
    .where(and(
      eq(homework.classId, enrollment.classId),
      sql`${homework.isPublished} = true`
    ))
    .orderBy(desc(homework.dueDate))
    .limit(limit);

  const result: StudentHomeworkItem[] = [];

  // OPTIMIZATION: Batch fetch all submissions for this student at once
  const homeworkIds = homeworkList.map(hw => hw.id);
  let submissionsMap = new Map<string, HomeworkSubmissionWithExtras>();

  if (homeworkIds.length > 0) {
    const studentSubmissions = await db
      .select()
      .from(homeworkSubmissions)
      .where(
        and(
          inArray(homeworkSubmissions.homeworkId, homeworkIds),
          eq(homeworkSubmissions.studentId, studentId)
        )
      );

    submissionsMap = new Map(
      studentSubmissions.map(s => [s.homeworkId, s as HomeworkSubmissionWithExtras])
    );
  }

  for (const hw of homeworkList) {
    const submission = submissionsMap.get(hw.id);

    let itemStatus: "pending" | "submitted" | "graded" = "pending";
    if (submission) {
      itemStatus = submission.gradedAt ? "graded" : "submitted";
    }

    // Filter by status if specified
    if (status !== "all" && itemStatus !== status) {
      continue;
    }

    result.push({
      id: hw.id,
      title: hw.title,
      description: hw.description,
      subject: hw.subjectId || null, // Relation removed - use subjectId directly
      type: (hw as HomeworkWithExtras).type || "assignment",
      dueDate: hw.dueDate,
      assignedDate: hw.assignedDate,
      maxPoints: (hw as HomeworkWithExtras).maxPoints || null,
      status: itemStatus,
      submissionId: submission?.id || null,
      score: submission?.score || null,
      percentage: submission?.percentage || null,
      feedback: submission?.feedback || null,
      gradedAt: submission?.gradedAt ? new Date(submission.gradedAt).toISOString() : null,
      teacherName: "Unknown", // Relation removed - would need separate query
      classId: hw.classId,
    });
  }

  return result;
}

/**
 * STUDENT TUITION ENROLLMENTS
 */
export interface StudentTuitionCourse {
  id: string;
  courseId: string;
  title: string;
  type: "online_recorded" | "online_live" | "physical";
  tutorName: string;
  tutorRating: number;
  progress: number;
  isCompleted: boolean;
  enrolledAt: string;
  expiresAt: string | null;
  certificateUrl: string | null;
  amountPaid: number;
}

export async function getStudentTuitionCourses(): Promise<StudentTuitionCourse[]> {
  const authData = await getCurrentStudentId();
  if (!authData) {
    throw new Error("Student not found");
  }

  const { id: studentId } = authData;

  const enrollments = await db
    .select()
    .from(tuitionEnrollments)
    .where(eq(tuitionEnrollments.studentId, studentId))
    .orderBy(desc(tuitionEnrollments.enrolledAt));

  return enrollments.map(e => {
    const eWithExtras = e as TuitionEnrollmentWithExtras;
    return {
      id: e.id,
      courseId: e.courseId,
      title: "Unknown Course", // Relation removed - would need separate query
      type: "online_recorded" as "online_recorded" | "online_live" | "physical", // Default type
      tutorName: "Unknown", // Relation removed - would need separate query
      tutorRating: 0, // Relation removed - would need separate query
      progress: eWithExtras.progressPercentage || 0,
      isCompleted: e.completedAt !== null,
      enrolledAt: new Date(e.enrolledAt).toISOString(),
      expiresAt: eWithExtras.expiresAt ? new Date(eWithExtras.expiresAt).toISOString() : null,
      certificateUrl: eWithExtras.certificateUrl || null,
      amountPaid: eWithExtras.amountPaid || 0,
    };
  });
}
