/**
 * STUDENT DATA FETCHING UTILITIES
 *
 * Server-side data fetching functions for student portal.
 * All functions filter by studentId from Clerk auth session.
 */

import { db } from "@/lib/db";
import { users, classes, homework, homeworkSubmissions, attendance, studentFees, enrollments, assessments, examResultsEnhanced, moduleProgress, learningModules, tuitionEnrollments, tuitionCourses, subjects, careerMatches, riasecResults } from "@/lib/db/schema";
import { eq, and, count, desc, sql, gte, lte, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { cache } from "react";

// Get current student ID from auth session
export async function getCurrentStudentId() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Get student record from Clerk user ID
  const student = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
    columns: { id: true, schoolId: true, classGrade: true, section: true },
  });

  if (!student || (student as any).type !== "student") {
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
  dateOfBirth: string | null;
  profilePicture: string | null;
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
  const studentRecord = await db.query.users.findFirst({
    where: eq(users.id, studentId),
  });

  if (!studentRecord) {
    throw new Error("Student not found");
  }

  const studentName = `${(studentRecord as any).firstName} ${(studentRecord as any).lastName || ""}`.trim();

  // Get student's class enrollment
  const enrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.studentId, studentId),
      eq(enrollments.status, "active")
    ),
    with: {
      class: true,
    },
  });

  const studentInfo: StudentInfo = {
    id: studentRecord.id,
    firstName: (studentRecord as any).firstName,
    lastName: (studentRecord as any).lastName,
    name: studentName,
    email: studentRecord.email,
    phone: studentRecord.phone,
    classGrade: studentRecord.classGrade,
    section: studentRecord.section,
    className: (enrollment?.class as any)?.name || null,
    classId: enrollment?.classId || null,
    schoolId: studentRecord.schoolId,
    dateOfBirth: studentRecord.dateOfBirth,
    profilePicture: studentRecord.profilePicture,
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
    const allHomework = await db.query.homework.findMany({
      where: and(
        inArray(homework.classId, studentClassIds),
        sql`${homework.isPublished} = true`
      ),
      orderBy: [desc(homework.dueDate)],
      limit: 50,
    });

    homeworkSummary.total = allHomework.length;

    for (const hw of allHomework) {
      const submission = await db.query.homeworkSubmissions.findFirst({
        where: eq(homeworkSubmissions.homeworkId, hw.id),
      });

      if (submission?.studentId === studentId) {
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
  const studentAssessments = await db.query.assessments.findMany({
    where: eq(assessments.userId, studentId),
    orderBy: [desc(assessments.createdAt)],
    limit: 20,
  });

  const completedAssessments = studentAssessments.filter(a => a.status === "completed");
  const latestAssessment = completedAssessments[0] || null;

  // Get RIASEC result for career matching
  let hollandCode: string | null = null;
  if (latestAssessment && (latestAssessment as any).type === "riasec") {
    const riasecResult = await db.query.riasecResults.findFirst({
      where: eq(riasecResults.userId, studentId),
      orderBy: [desc(riasecResults.createdAt)],
    });
    hollandCode = riasecResult?.hollandCode || null;
  }

  const assessmentSummary: AssessmentSummary = {
    completed: completedAssessments.length,
    total: studentAssessments.length,
    latestResult: latestAssessment ? {
      type: (latestAssessment as any).type,
      completedAt: latestAssessment.completedAt ? new Date(latestAssessment.completedAt).toISOString() : null,
    } : null,
  };

  // 4. Get attendance summary (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const attendanceRecords = await db.query.attendance.findMany({
    where: and(
      eq(attendance.studentId, studentId),
      gte(attendance.date, thirtyDaysAgoStr)
    ),
  });

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
    achievements.push({
      id: `assessment-${latestAssessment.id}`,
      type: "assessment",
      title: `Completed ${(latestAssessment as any).type.toUpperCase()} Assessment`,
      description: "Career assessment completed successfully",
      date: latestAssessment.completedAt ? new Date(latestAssessment.completedAt as string).toISOString() : latestAssessment.createdAt.toISOString(),
    });
  }

  // Add homework achievements
  const recentSubmissions = await db.query.homeworkSubmissions.findMany({
    where: eq(homeworkSubmissions.studentId, studentId),
    orderBy: [desc(homeworkSubmissions.submittedAt)],
    limit: 3,
  });

  for (const sub of recentSubmissions) {
    const hw = await db.query.homework.findFirst({
      where: eq(homework.id, sub.homeworkId),
    });

    if (hw) {
      achievements.push({
        id: `homework-${sub.id}`,
        type: "homework",
        title: `Submitted: ${hw.title}`,
        description: sub.gradedAt ? `Scored: ${(sub as any).percentage || 0}%` : "Awaiting grading",
        date: sub.submittedAt ? new Date(sub.submittedAt).toISOString() : sub.createdAt.toISOString(),
      });
    }
  }

  // Add module completion achievements
  const completedModules = await db.query.moduleProgress.findMany({
    where: and(
      eq(moduleProgress.studentId, studentId),
      sql`${moduleProgress.completedAt} IS NOT NULL`
    ),
    with: {
      module: true,
    },
    orderBy: [desc(moduleProgress.completedAt)],
    limit: 3,
  });

  for (const progress of completedModules) {
    achievements.push({
      id: `module-${progress.id}`,
      type: "module",
      title: `Completed: ${(progress.module as any)?.title || "Learning Module"}`,
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
    const upcomingHomework = await db.query.homework.findMany({
      where: and(
        inArray(homework.classId, studentClassIds),
        gte(homework.dueDate, today.toISOString().split("T")[0]),
        sql`${homework.isPublished} = true`
      ),
      orderBy: [homework.dueDate],
      limit: 5,
    });

    for (const hw of upcomingHomework) {
      const submission = await db.query.homeworkSubmissions.findFirst({
        where: and(
          eq(homeworkSubmissions.homeworkId, hw.id),
          eq(homeworkSubmissions.studentId, studentId)
        ),
      });

      // Only add if not submitted
      if (!submission) {
        const dueDate = new Date(hw.dueDate);
        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        deadlines.push({
          id: `homework-${hw.id}`,
          type: "homework",
          title: hw.title,
          description: `${(hw as any).type} - ${hw.subjectId || "Class"}`,
          dueDate: hw.dueDate,
          daysUntil,
          urgency: daysUntil <= 2 ? "high" : daysUntil <= 7 ? "medium" : "low",
          link: `/student/homework`,
        });
      }
    }
  }

  // Fee deadlines
  if (schoolId) {
    const feeData = await db.query.studentFees.findFirst({
      where: and(
        eq(studentFees.studentId, studentId),
        sql`${studentFees.amountPending} > 0`
      ),
    });

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
  const [careerMatchCount] = await db
    .select({ count: count() })
    .from(careerMatches)
    .where(eq(careerMatches.assessmentId, latestAssessment?.id || ""));

  const [topMatchCount] = await db
    .select({ count: count() })
    .from(careerMatches)
    .where(and(
      eq(careerMatches.assessmentId, latestAssessment?.id || ""),
eq(careerMatches.isTopMatch, true)
    ));

  const careerMatchSummary: CareerMatchSummary = {
    totalMatches: careerMatchCount?.count || 0,
    topMatches: topMatchCount?.count || 0,
    topCareer: null, // Would need to join with careers table
    hollandCode,
  };

  // 9. Get fee status
  let feeStatus: FeeStatus | null = null;

  if (schoolId) {
    const studentFee = await db.query.studentFees.findFirst({
      where: eq(studentFees.studentId, studentId),
    });

    if (studentFee) {
      feeStatus = {
        totalAmount: (studentFee as any).totalAmount || 0,
        amountPaid: (studentFee as any).amountPaid || 0,
        amountPending: studentFee.amountPending || 0,
        status: studentFee.status as "paid" | "partial" | "pending",
        dueDate: studentFee.dueDate,
      };
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
  const studentRecord = await db.query.users.findFirst({
    where: eq(users.id, studentId),
  });

  if (!studentRecord) {
    throw new Error("Student not found");
  }

  const studentName = `${(studentRecord as any).firstName} ${(studentRecord as any).lastName || ""}`.trim();

  // Get enrollment for class info
  const enrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.studentId, studentId),
      eq(enrollments.status, "active")
    ),
    with: {
      class: true,
    },
  });

  const studentInfo: StudentInfo = {
    id: studentRecord.id,
    firstName: (studentRecord as any).firstName,
    lastName: (studentRecord as any).lastName,
    name: studentName,
    email: studentRecord.email,
    phone: studentRecord.phone,
    classGrade: studentRecord.classGrade,
    section: studentRecord.section,
    className: (enrollment?.class as any)?.name || null,
    classId: enrollment?.classId || null,
    schoolId: studentRecord.schoolId,
    dateOfBirth: studentRecord.dateOfBirth,
    profilePicture: studentRecord.profilePicture,
  };

  // Get attendance records (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const attendanceRecords = await db.query.attendance.findMany({
    where: and(
      eq(attendance.studentId, studentId),
      gte(attendance.date, thirtyDaysAgoStr)
    ),
    with: {
      class: true,
    },
    orderBy: [desc(attendance.date)],
  });

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
      class: (r.class as any)?.name || "Unknown",
    })),
  };

  // Get exam results
  const examResultsData = await db.query.examResultsEnhanced.findMany({
    where: eq(examResultsEnhanced.studentId, studentId),
    orderBy: [desc(examResultsEnhanced.examYear)],
    limit: 10,
  });

  const examResults: ExamResult[] = examResultsData.map(result => ({
    id: result.id,
    examName: result.examName,
    examType: result.examType,
    examYear: result.examYear,
    overallPercentage: (result as any).overallPercentage || result.percentage.overallPercentage || 0,
    division: (result as any).division || null,
    subjectResults: (result as any).subjectResults || [],
  }));

  // Calculate grade average
  const gradeAverage = examResultsData.length > 0
    ? Math.round(examResultsData.reduce((sum, r) => sum + ((r as any)(r as any).overallPercentage || 0), 0) / examResultsData.length)
    : 0;

  // Get homework performance by subject
  const subjectsMap = new Map<string, SubjectPerformance>();

  if (enrollment?.classId) {
    const classHomework = await db.query.homework.findMany({
      where: eq(homework.classId, enrollment.classId),
    });

    for (const hw of classHomework) {
      const subjectName = hw.subjectId || "General";
      const submission = await db.query.homeworkSubmissions.findFirst({
        where: and(
          eq(homeworkSubmissions.homeworkId, hw.id),
          eq(homeworkSubmissions.studentId, studentId)
        ),
      });

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
        if ((submission as any).percentage) {
          subject.averageScore = Math.round(
            (subject.averageScore * (subject.completedAssignments - 1) + (submission as any).percentage) /
            subject.completedAssignments
          );
        }
      }
    }
  }

  const subjects = Array.from(subjectsMap.values());

  // Get learning progress
  const learningProgressData = await db.query.moduleProgress.findMany({
    where: eq(moduleProgress.studentId, studentId),
    with: {
      module: true,
    },
    orderBy: [desc(moduleProgress.lastAccessedAt)],
  });

  const learningProgress: LearningProgress[] = learningProgressData.map(p => ({
    moduleId: p.moduleId,
    moduleTitle: (p.module as any)?.title || "Unknown Module",
    subject: (p.module as any)?.subjectId || "General",
    progress: (p as any).progressPercentage || 0,
    isCompleted: p.completedAt !== null,
    completedAt: p.completedAt ? new Date(p.completedAt).toISOString() : null,
    certificateUrl: p.certificateUrl,
  }));

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
  const enrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.studentId, studentId),
      eq(enrollments.status, "active")
    ),
  });

  if (!enrollment) {
    return [];
  }

  // Get homework for student's class
  const homeworkList = await db.query.homework.findMany({
    where: and(
      eq(homework.classId, enrollment.classId),
      sql`${homework.isPublished} = true`
    ),
    with: {
      subject: true,
      teacher: true,
    },
    orderBy: [desc(homework.dueDate)],
    limit,
  });

  const result: StudentHomeworkItem[] = [];

  for (const hw of homeworkList) {
    const submission = await db.query.homeworkSubmissions.findFirst({
      where: and(
        eq(homeworkSubmissions.homeworkId, hw.id),
        eq(homeworkSubmissions.studentId, studentId)
      ),
    });

    let itemStatus: "pending" | "submitted" | "graded" = "pending";
    if (submission) {
      itemStatus = submission.gradedAt ? "graded" : "submitted";
    }

    // Filter by status if specified
    if (status !== "all" && itemStatus !== status) {
      continue;
    }

    const teacherName = hw.teacher
      ? `${(hw.teacher as any).firstName} ${(hw.teacher as any).lastName || ""}`.trim()
      : "Unknown";

    result.push({
      id: hw.id,
      title: hw.title,
      description: hw.description,
      subject: (hw.subject as any)?.name || null,
      type: (hw as any).type,
      dueDate: hw.dueDate,
      assignedDate: hw.assignedDate,
      maxPoints: (hw as any).maxPoints,
      status: itemStatus,
      submissionId: submission?.id || null,
      score: submission?.score || null,
      percentage: (submission as any)?.percentage || null,
      feedback: submission?.feedback || null,
      gradedAt: submission?.gradedAt ? new Date(submission.gradedAt).toISOString() : null,
      teacherName,
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

  const enrollments = await db.query.tuitionEnrollments.findMany({
    where: eq(tuitionEnrollments.studentId, studentId),
    with: {
      course: true,
      tutor: {
        with: {
          user: true,
        },
      },
    },
    orderBy: [desc(tuitionEnrollments.enrolledAt)],
  });

  return enrollments.map(e => {
    const tutorUser = (e.tutor as any)?.user;
    const tutorName = tutorUser
      ? `${tutorUser.firstName} ${tutorUser.lastName || ""}`.trim()
      : "Unknown";

    return {
      id: e.id,
      courseId: e.courseId,
      title: (e.course as any)?.title || "Unknown Course",
      type: (e.course as any)?.type as "online_recorded" | "online_live" | "physical",
      tutorName,
      tutorRating: (e.tutor as any)?.averageRating ? (e.tutor as any).averageRating / 10 : 0,
      progress: (e as any).progressPercentage || 0,
      isCompleted: e.completedAt !== null,
      enrolledAt: new Date(e.enrolledAt).toISOString(),
      expiresAt: (e as any).expiresAt ? new Date((e as any).expiresAt).toISOString() : null,
      certificateUrl: (e as any).certificateUrl,
      amountPaid: (e as any).amountPaid,
    };
  });
}
