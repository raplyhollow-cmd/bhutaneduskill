/**
 * STUDENT SNAPSHOT REPORT GENERATOR
 *
 * Aggregates student data from multiple sources:
 * - Academic: grades, exam results, assessment results
 * - Attendance: presence records
 * - Behavior: merit/demerit points from teacher logs
 * - Homework: submission status and scores
 *
 * Returns a comprehensive snapshot for term-end reporting
 */

import { db } from "@/lib/db";
import { users, classes, enrollments, attendance, homeworkSubmissions, homework } from "@/lib/db/schema";
import { examResultsEnhanced, assessmentResults } from "@/lib/db/schema";
import { teacherBehaviorLogs } from "@/lib/db/teacher-logs-schema";
import { eq, and, inArray, gte, count, sql, desc, asc } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

export interface StudentSnapshot {
  student: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    grade: number;
    section: string;
    className: string;
    rollNumber?: string;
    photo?: string;
  };
  academic: {
    averageScore: number;
    subjects: SubjectScore[];
    totalAssessments: number;
    rank?: number;
    grade: string; // Overall letter grade
  };
  attendance: {
    percentage: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    totalDays: number;
    status: "excellent" | "good" | "concern" | "critical";
  };
  behavior: {
    meritPoints: number;
    demeritPoints: number;
    netScore: number;
    totalIncidents: number;
    status: "excellent" | "good" | "review_required" | "concern";
    recentLogs: BehaviorLogSummary[];
  };
  homework: {
    totalAssigned: number;
    submittedOnTime: number;
    submittedLate: number;
    missing: number;
    averageScore: number;
    completionRate: number;
  };
  summary: {
    overallStatus: "excellent" | "good" | "satisfactory" | "needs_attention";
    strengths: string[];
    concerns: string[];
    recommendations: string[];
  };
  aiComment?: string;
  generatedAt: string;
}

export interface SubjectScore {
  subject: string;
  score: number;
  grade: string;
  maxScore: number;
}

export interface BehaviorLogSummary {
  date: string;
  type: "merit" | "demerit";
  category: string;
  description: string;
  points: number;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generate a comprehensive student snapshot report
 * @param studentId - The student's database ID
 * @param options - Optional configuration
 * @returns Complete student snapshot
 */
export async function generateStudentSnapshot(
  studentId: string,
  options: {
    includeAiComment?: boolean;
    termStartDate?: string; // ISO date string
    termEndDate?: string; // ISO date string
  } = {}
): Promise<StudentSnapshot | null> {
  try {
    // Get student basic info
    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student || student.type !== 'student') {
      return null;
    }

    // Get student's enrollment for class info
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.status, 'active')
      ))
      .limit(1);

    let className = 'Not Assigned';
    let rollNumber: string | undefined;
    if (enrollment) {
      const [cls] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, enrollment.classId))
        .limit(1);
      if (cls) {
        className = cls.name;
        rollNumber = enrollment.rollNumber;
      }
    }

    // Fetch all data in parallel for performance
    const [
      academicData,
      attendanceData,
      behaviorData,
      homeworkData,
    ] = await Promise.all([
      fetchAcademicData(studentId),
      fetchAttendanceData(studentId, options.termStartDate, options.termEndDate),
      fetchBehaviorData(studentId, options.termStartDate, options.termEndDate),
      fetchHomeworkData(studentId, options.termStartDate, options.termEndDate),
    ]);

    // Calculate overall status and recommendations
    const summary = calculateSummary(academicData, attendanceData, behaviorData, homeworkData);

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName || ''}`.trim(),
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        email: student.email,
        grade: student.classGrade || 0,
        section: student.section || '',
        className,
        rollNumber,
        photo: student.profileImage || undefined,
      },
      academic: academicData,
      attendance: attendanceData,
      behavior: behaviorData,
      homework: homeworkData,
      summary,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error generating student snapshot:', error);
    return null;
  }
}

// ============================================================================
// DATA FETCHING FUNCTIONS
// ============================================================================

async function fetchAcademicData(studentId: string) {
  // Get exam results
  const examResults = await db
    .select()
    .from(examResultsEnhanced)
    .where(eq(examResultsEnhanced.userId, studentId))
    .orderBy(desc(examResultsEnhanced.examYear))
    .limit(10);

  // Get assessment results
  const assessmentResultsData = await db
    .select()
    .from(assessmentResults)
    .where(eq(assessmentResults.studentId, studentId))
    .limit(20);

  // Combine and calculate averages
  const allScores: number[] = [];
  const subjectScores: SubjectScore[] = [];

  // Process exam results
  for (const exam of examResults) {
    if (exam.overallPercentage) {
      allScores.push(exam.overallPercentage);
    }

    // Process subject-wise scores
    if (exam.subjects && typeof exam.subjects === 'string') {
      try {
        const subjects = JSON.parse(exam.subjects);
        for (const subject of subjects) {
          subjectScores.push({
            subject: subject.subject || 'Unknown',
            score: subject.marksObtained || 0,
            grade: subject.grade || 'N/A',
            maxScore: subject.maxMarks || 100,
          });
          allScores.push(subject.marksObtained || 0);
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }
  }

  // Process assessment results
  for (const assessment of assessmentResultsData) {
    if (assessment.score) {
      allScores.push(assessment.score);
    }
  }

  const averageScore = allScores.length > 0
    ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length)
    : 0;

  const totalAssessments = examResults.length + assessmentResultsData.length;

  // Determine overall letter grade
  let grade = 'N/A';
  if (averageScore >= 90) grade = 'A+';
  else if (averageScore >= 80) grade = 'A';
  else if (averageScore >= 70) grade = 'B';
  else if (averageScore >= 60) grade = 'C';
  else if (averageScore >= 50) grade = 'D';
  else if (averageScore > 0) grade = 'F';

  return {
    averageScore,
    subjects: subjectScores,
    totalAssessments,
    grade,
  };
}

async function fetchAttendanceData(
  studentId: string,
  startDate?: string,
  endDate?: string
) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDateStr = startDate || thirtyDaysAgo.toISOString().split('T')[0];

  const attendanceRecords = await db
    .select()
    .from(attendance)
    .where(and(
      eq(attendance.studentId, studentId),
      gte(attendance.date, startDateStr)
    ));

  const presentDays = attendanceRecords.filter((a) => a.status === 'present').length;
  const absentDays = attendanceRecords.filter((a) => a.status === 'absent').length;
  const lateDays = attendanceRecords.filter((a) => a.status === 'late').length;
  const totalDays = attendanceRecords.length;

  const percentage = totalDays > 0
    ? Math.round(((presentDays + lateDays) / totalDays) * 100)
    : 100;

  let status: "excellent" | "good" | "concern" | "critical" = "excellent";
  if (percentage < 60) status = "critical";
  else if (percentage < 75) status = "concern";
  else if (percentage < 85) status = "good";

  return {
    percentage,
    presentDays,
    absentDays,
    lateDays,
    totalDays,
    status,
  };
}

async function fetchBehaviorData(
  studentId: string,
  startDate?: string,
  endDate?: string
) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90); // Last 3 months for behavior

  const logs = await db
    .select()
    .from(teacherBehaviorLogs)
    .where(eq(teacherBehaviorLogs.studentId, studentId))
    .orderBy(desc(teacherBehaviorLogs.createdAt))
    .limit(50);

  const meritPoints = logs
    .filter((log) => log.type === 'merit')
    .reduce((sum, log) => sum + (log.points || 0), 0);

  const demeritPoints = logs
    .filter((log) => log.type === 'demerit')
    .reduce((sum, log) => sum + Math.abs(log.points || 0), 0);

  const netScore = meritPoints - demeritPoints;
  const totalIncidents = logs.length;

  let status: "excellent" | "good" | "review_required" | "concern" = "excellent";
  if (demeritPoints >= 10) status = "concern";
  else if (demeritPoints >= 5) status = "review_required";
  else if (netScore < 0) status = "good";
  else if (meritPoints >= 5) status = "excellent";

  // Recent logs for display (last 5)
  const recentLogs: BehaviorLogSummary[] = logs.slice(0, 5).map((log) => ({
    date: new Date(log.createdAt).toLocaleDateString(),
    type: log.type as "merit" | "demerit",
    category: log.category,
    description: log.description,
    points: log.points,
  }));

  return {
    meritPoints,
    demeritPoints,
    netScore,
    totalIncidents,
    status,
    recentLogs,
  };
}

async function fetchHomeworkData(
  studentId: string,
  startDate?: string,
  endDate?: string
) {
  // Get all homework submissions for student
  const submissions = await db
    .select()
    .from(homeworkSubmissions)
    .where(eq(homeworkSubmissions.studentId, studentId));

  const totalAssigned = submissions.length;
  const submittedOnTime = submissions.filter((s) => s.status === 'submitted' && !s.isLate).length;
  const submittedLate = submissions.filter((s) => s.isLate).length;
  const missing = submissions.filter((s) => s.status === 'draft' || s.status === 'pending').length;

  // Calculate average score for graded submissions
  const gradedSubmissions = submissions.filter((s) => s.status === 'graded' && s.score);
  const averageScore = gradedSubmissions.length > 0
    ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length)
    : 0;

  const completionRate = totalAssigned > 0
    ? Math.round(((submittedOnTime + submittedLate) / totalAssigned) * 100)
    : 100;

  return {
    totalAssigned,
    submittedOnTime,
    submittedLate,
    missing,
    averageScore,
    completionRate,
  };
}

// ============================================================================
// SUMMARY CALCULATION
// ============================================================================

function calculateSummary(
  academic: ReturnType<typeof fetchAcademicData> extends Promise<infer T> ? T : never,
  attendance: ReturnType<typeof fetchAttendanceData> extends Promise<infer T> ? T : never,
  behavior: ReturnType<typeof fetchBehaviorData> extends Promise<infer T> ? T : never,
  homework: ReturnType<typeof fetchHomeworkData> extends Promise<infer T> ? T : never
) {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: string[] = [];

  // Academic strengths/concerns
  if (academic.averageScore >= 80) {
    strengths.push("Strong academic performance with consistent high scores");
  } else if (academic.averageScore < 50) {
    concerns.push("Academic performance needs significant improvement");
    recommendations.push("Consider additional tutoring support");
  } else if (academic.averageScore < 65) {
    concerns.push("Academic performance is below average");
    recommendations.push("Focus on weaker subject areas");
  }

  // Attendance
  if (attendance.percentage >= 90) {
    strengths.push("Excellent attendance record");
  } else if (attendance.percentage < 70) {
    concerns.push(`Poor attendance (${attendance.percentage}%)`);
    recommendations.push("Address attendance issues immediately");
  } else if (attendance.percentage < 85) {
    concerns.push(`Attendance could be improved (${attendance.percentage}%)`);
  }

  // Behavior
  if (behavior.netScore >= 5) {
    strengths.push("Positive behavior with multiple merit points");
  } else if (behavior.demeritPoints >= 5) {
    concerns.push("Multiple disciplinary incidents recorded");
    recommendations.push("Parent-teacher conference recommended");
  }

  // Homework
  if (homework.completionRate >= 90) {
    strengths.push("Consistent homework submission");
  } else if (homework.completionRate < 70) {
    concerns.push("Homework completion rate is low");
    recommendations.push("Establish homework routine");
  }

  // Overall status
  let overallStatus: "excellent" | "good" | "satisfactory" | "needs_attention" = "excellent";

  const concernCount = concerns.length;
  const strengthCount = strengths.length;

  if (concernCount >= 3 || attendance.status === "critical" || behavior.status === "concern") {
    overallStatus = "needs_attention";
  } else if (concernCount >= 2 || attendance.status === "concern") {
    overallStatus = "satisfactory";
  } else if (concernCount === 1 || academic.averageScore < 70) {
    overallStatus = "good";
  }

  return {
    overallStatus,
    strengths,
    concerns,
    recommendations,
  };
}

// ============================================================================
// BATCH FUNCTIONS
// ============================================================================

/**
 * Generate snapshots for multiple students (e.g., entire class)
 */
export async function generateBatchSnapshots(
  studentIds: string[],
  options?: { includeAiComment?: boolean }
): Promise<StudentSnapshot[]> {
  const snapshots = await Promise.all(
    studentIds.map((id) => generateStudentSnapshot(id, options))
  );

  return snapshots.filter((s): s is StudentSnapshot => s !== null);
}
