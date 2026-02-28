import { logger } from "@/lib/logger";
/**
 * COMPREHENSIVE REPORT SYSTEM API
 *
 * POST /api/reports - Generate a report
 * GET /api/reports - List available reports
 * GET /api/reports/[id] - Get a specific report
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, assessments, riasecResults, mbtiResults, discResults, careerMatches, careerPlans, examResults, classes, careers } from "@/lib/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, forbiddenResponse, notFoundResponse } from "@/lib/api/response-helpers";

// ============================================================================
// REPORT DEFINITIONS
// ============================================================================

export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  allowedRoles: string[];
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface StudentProfileData {
  student: {
    id: string;
    name: string | null;
    email: string | null;
    type: string;
    grade: string | null;
    schoolId: string | null;
    createdAt: Date | null;
  };
  summary: {
    totalAssessments: number;
    completedAssessments: number;
    topCareerMatches: Array<{ career: string | null; matchScore: number }>;
    currentCareerPlan: string | null;
  };
  personalityProfile: {
    riasec: {
      hollandCode: string | null;
      traits: Record<string, number> | null;
    } | null;
    mbti: {
      type: string | null;
      traits: Record<string, number> | null;
    } | null;
    disc: {
      type: string | null;
      traits: Record<string, number> | null;
    } | null;
  };
  careerMatches: Array<{
    career: string | null;
    riasecCode: string | null;
    matchScore: number;
    matchReason: string | null;
  }>;
  careerPlan: {
    targetCareer: string | null;
    currentPhase: string | null;
    shortTermGoals: string[] | null;
    longTermGoals: string[] | null;
    milestones: Array<{ completed: boolean }> | null;
    status: string | null;
  } | null;
  academicPerformance: Array<{
    examType: string | null;
    examYear: number | null;
    totalPercentage: number | null;
    division: string | null;
  }>;
}

interface ClassSummaryData {
  class: {
    id: string;
    name: string | null;
    grade: string | number | null;
    section: string | null;
    teacherId: string | null;
  };
  summary: {
    totalStudents: number;
    studentsWithAssessments: number;
    studentsWithoutAssessments: number;
  };
  students: Array<{
    id: string;
    name: string | null;
    grade: string | number | null;
    assessmentsCompleted: number;
    totalAssessments: number;
    hollandCode: string | null;
    latestExamResult: {
      examType: string | null;
      examYear: number | null;
    } | null;
  }>;
}

interface AssessmentAnalyticsData {
  assessmentTypeId: string;
  period: { from: string | undefined; to: string | undefined };
  totalResults: number;
  hollandCodeDistribution: Record<string, number>;
  traitAverages: {
    realistic: number;
    investigative: number;
    artistic: number;
    social: number;
    enterprising: number;
    conventional: number;
  };
  topHollandCodes: Array<{ code: string; count: number }>;
}

interface CareerOutcomesData {
  period: string | undefined;
  totalCareerMatches: number;
  activeCareerPlans: number;
  topCareers: Array<{ career: string; count: number }>;
  phaseDistribution: {
    self_assessment: number;
    career_exploration: number;
    goal_setting: number;
    planning: number;
    implementation: number;
    review: number;
  };
}

interface SchoolPerformanceData {
  schools: Array<{
    schoolId: string;
    totalStudents: number;
    assessmentCompletions: number;
    completionRate: number;
  }>;
}

interface MyProgressData {
  user: {
    name: string | null;
    grade: string | null;
  };
  assessments: {
    completed: number;
    inProgress: number;
    total: number;
  };
  personalityProfile: {
    hollandCode: string | null;
    traits: Record<string, number> | null;
  };
  topCareerMatches: Array<{ career: string | null; matchScore: number }>;
  careerPlan: {
    targetCareer: string | null;
    currentPhase: string | null;
    milestonesCompleted: number;
    totalMilestones: number;
  } | null;
  academicResults: Array<{
    examType: string | null;
    year: number | null;
    percentage: number | null;
    division: string | null;
  }>;
}

type ReportData = StudentProfileData | ClassSummaryData | AssessmentAnalyticsData | CareerOutcomesData | SchoolPerformanceData | MyProgressData;

interface RiasecResult {
  id?: string;
  userId?: string;
  hollandCode: string | null;
  realistic?: number;
  investigative?: number;
  artistic?: number;
  social?: number;
  enterprising?: number;
  conventional?: number;
  traits?: Record<string, number> | string[];
  scores?: Record<string, number>;
  primaryHollandCode?: string;
  secondaryHollandCode?: string;
  createdAt?: Date;
  completedAt?: Date;
}

interface MbtiResult {
  personalityType: string | null;
  traits?: Record<string, number>;
}

interface DiscResult {
  discType?: string;
  traits?: Record<string, number>;
}

interface ExamResult {
  examType: string | null;
  examYear: number | null;
  totalPercentage?: number;
  percentage?: number;
  division?: string;
}

interface CareerPlanData {
  targetCareer: string | null;
  currentPhase?: string;
  shortTermGoals: string[] | null;
  longTermGoals: string[] | null;
  milestones: Array<{ completed: boolean }> | null;
  status: string | null;
}

interface ClassData {
  name?: string;
  grade: string | number | null;
  section: string | null;
  teacherId?: string | null;
}

const availableReports: ReportConfig[] = [
  {
    id: "student-profile",
    name: "Student Profile Report",
    description: "Complete student profile with assessments, career matches, and academic results",
    category: "student",
    allowedRoles: ["counselor", "teacher", "admin", "parent"],
  },
  {
    id: "class-summary",
    name: "Class Summary Report",
    description: "Overview of all students in a class with their assessment status",
    category: "school",
    allowedRoles: ["counselor", "teacher", "admin"],
  },
  {
    id: "assessment-analytics",
    name: "Assessment Analytics Report",
    description: "Statistical analysis of assessment results across students",
    category: "assessment",
    allowedRoles: ["counselor", "admin"],
  },
  {
    id: "career-outcomes",
    name: "Career Outcomes Report",
    description: "Track career matches and planned pathways",
    category: "career",
    allowedRoles: ["counselor", "admin"],
  },
  {
    id: "school-performance",
    name: "School Performance Report",
    description: "Compare performance across schools/grades",
    category: "school",
    allowedRoles: ["counselor", "admin"],
  },
  {
    id: "my-progress",
    name: "My Progress Report",
    description: "Personal progress report for students",
    category: "student",
    allowedRoles: ["student"],
  },
];

// ============================================================================
// GET - List available reports or get specific report
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    try {
      const { userId, user } = auth;

      // Check RBAC permission for viewing reports
      const permCheck = await requirePermission(userId, "reports.view");
      if (permCheck) return permCheck;

      const { searchParams } = new URL(request.url);
      const reportId = searchParams.get("id");

      // Return specific report if ID provided
      if (reportId) {
        const report = availableReports.find((r) => r.id === reportId);
        if (!report) {
          return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }
        const userType = (user as { type: string }).type;
        if (!report.allowedRoles.includes(userType)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json({ report });
      }

      // Return all available reports for user's role
      const userType = (user as { type: string }).type;
      const userReports = availableReports.filter((r) => r.allowedRoles.includes(userType));
      return successResponse({ reports: userReports });
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      logger.error("Reports GET error:", error);
      return errorResponse("Failed to fetch reports", 500);
    }
  },
  ["counselor", "teacher", "admin", "parent"]
);

// ============================================================================
// POST - Generate a report
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    try {
      const { userId, user } = auth;

      // Check RBAC permission for generating reports
      const permCheck = await requirePermission(userId, "reports.generate");
      if (permCheck) return permCheck;

      const body = await request.json();
      const { reportId, format = "json", parameters = {} } = body;

      // Verify report exists and user has access
      const report = availableReports.find((r) => r.id === reportId);
      if (!report) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }
      const userType = (user as { type: string }).type;
      if (!report.allowedRoles.includes(userType)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Generate the report based on type
      let reportData: ReportData;

      switch (reportId) {
        case "student-profile":
          reportData = await generateStudentProfileReport(parameters.userId, user);
          break;

        case "class-summary":
          reportData = await generateClassSummaryReport(parameters.classId, user);
          break;

        case "assessment-analytics":
          reportData = await generateAssessmentAnalyticsReport(parameters, user);
          break;

        case "career-outcomes":
          reportData = await generateCareerOutcomesReport(parameters, user);
          break;

        case "school-performance":
          reportData = await generateSchoolPerformanceReport(parameters, user);
          break;

        case "my-progress":
          reportData = await generateMyProgressReport({
            id: userId,
            name: user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.firstName || null,
            grade: null, // grade is not in AuthContext user, needs to be fetched separately if needed
          });
          break;

        default:
          return NextResponse.json({ error: "Report generation not implemented" }, { status: 501 });
      }

      // Format response
      const timestamp = new Date().toISOString();
      const filename = `${reportId}_${timestamp.split("T")[0]}.${format}`;

      if (format === "json") {
        return NextResponse.json({
          report: {
            id: reportId,
            name: report.name,
            generatedAt: timestamp,
            generatedBy: user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.firstName || null,
            data: reportData,
          },
        });
      }

      // For other formats, return as download
      let content: string;
      let contentType: string;

      switch (format) {
        case "csv":
          content = jsonToCSV(reportData);
          contentType = "text/csv";
          break;
        case "xml":
          content = jsonToXML(reportData, reportId);
          contentType = "application/xml";
          break;
        default:
          content = JSON.stringify(reportData, null, 2);
          contentType = "application/json";
      }

      return new NextResponse(content, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      logger.error("Report generation error:", error);
      return errorResponse("Failed to generate report", 500);
    }
  },
  ["counselor", "teacher", "admin"]
);

// ============================================================================
// REPORT GENERATORS
// ============================================================================

async function generateStudentProfileReport(userId: string, currentUser: { type: string; schoolId?: string | null }): Promise<StudentProfileData> {
  const userRecords = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = userRecords[0];

  if (!user) {
    throw new Error("Student not found");
  }

  // Get assessment results
  const allAssessments = await db
    .select()
    .from(assessments)
    .where(eq(assessments.userId, userId))
    .orderBy(desc(assessments.completedAt));

  const riasecRecords = await db
    .select()
    .from(riasecResults)
    .where(eq(riasecResults.userId, userId))
    .orderBy(desc(riasecResults.createdAt))
    .limit(1);

  const riasecResult = (riasecRecords[0] || null) as RiasecResult | null;

  const mbtiRecords = await db
    .select()
    .from(mbtiResults)
    .where(eq(mbtiResults.userId, userId))
    .orderBy(desc(mbtiResults.createdAt))
    .limit(1);

  const mbtiResult = (mbtiRecords[0] || null) as MbtiResult | null;

  const discRecords = await db
    .select()
    .from(discResults)
    .where(eq(discResults.userId, userId))
    .orderBy(desc(discResults.createdAt))
    .limit(1);

  const discResult = (discRecords[0] || null) as DiscResult | null;

  // Get career matches (need to join through assessments since careerMatches doesn't have userId)
  const careerMatchesData = await db
    .select({
      id: careerMatches.id,
      assessmentId: careerMatches.assessmentId,
      careerId: careerMatches.careerId,
      matchScore: careerMatches.matchScore,
      recommendationText: careerMatches.recommendationText,
      isTopMatch: careerMatches.isTopMatch,
      createdAt: careerMatches.createdAt,
      career: {
        id: careers.id,
        name: careers.name,
        riasecCode: careers.riasecCode,
      },
    })
    .from(careerMatches)
    .innerJoin(assessments, eq(careerMatches.assessmentId, assessments.id))
    .innerJoin(careers, eq(careerMatches.careerId, careers.id))
    .where(eq(assessments.userId, userId))
    .orderBy(desc(careerMatches.matchScore))
    .limit(10);

  // Get career plan
  const careerPlanRecords = await db
    .select()
    .from(careerPlans)
    .where(eq(careerPlans.userId, userId))
    .limit(1);

  const careerPlanData = careerPlanRecords[0] || null;

  // Get exam results
  const examResultsData = await db
    .select()
    .from(examResults)
    .where(eq(examResults.userId, userId))
    .orderBy(desc(examResults.examYear));

  return {
    student: {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      grade: user.grade,
      schoolId: user.schoolId,
      createdAt: user.createdAt,
    },
    summary: {
      totalAssessments: allAssessments.length,
      completedAssessments: allAssessments.filter((a) => a.status === "completed").length,
      topCareerMatches: careerMatchesData.slice(0, 5).map((m) => ({
        career: m.career?.name,
        matchScore: m.matchScore,
      })),
      currentCareerPlan: careerPlanData?.targetCareer || "Not set",
    },
    personalityProfile: {
      riasec: riasecResult ? {
        hollandCode: riasecResult.hollandCode,
        traits: Array.isArray(riasecResult.traits) ? undefined : riasecResult.traits || undefined,
      } : null,
      mbti: mbtiResult ? {
        type: mbtiResult.personalityType,
        traits: (mbtiResult as MbtiResult).traits || null,
      } : null,
      disc: discResult ? {
        type: (discResult as DiscResult).discType || null,
        traits: (discResult as DiscResult).traits || null,
      } : null,
    },
    careerMatches: careerMatchesData.map((m) => ({
      career: m.career?.name,
      riasecCode: m.career?.riasecCode,
      matchScore: m.matchScore,
      matchReason: m.recommendationText,
    })),
    careerPlan: careerPlanData ? {
      targetCareer: careerPlanData.targetCareer,
      currentPhase: (careerPlanData as CareerPlanData).currentPhase || null,
      shortTermGoals: careerPlanData.shortTermGoals,
      longTermGoals: careerPlanData.longTermGoals,
      milestones: careerPlanData.milestones,
      status: careerPlanData.status,
    } : null,
    academicPerformance: examResultsData.map((r) => ({
      examType: r.examType,
      examYear: r.examYear,
      totalPercentage: (r as ExamResult).totalPercentage || r.percentage || null,
      division: (r as ExamResult).division || null,
    })),
  };
}

async function generateClassSummaryReport(classId: string, currentUser: { type: string; schoolId?: string | null }): Promise<ClassSummaryData> {
  const classRecords = await db
    .select()
    .from(classes)
    .where(eq(classes.id, classId))
    .limit(1);

  if (!classRecords || classRecords.length === 0) {
    throw new Error("Class not found");
  }

  const classData = classRecords[0];

  // Get student enrollments for this class
  const { enrollments } = await import("@/lib/db/schema");
  const enrollmentRecords = await db
    .select({ studentId: enrollments.studentId })
    .from(enrollments)
    .where(eq(enrollments.classId, classId));

  const studentIds = enrollmentRecords.map(e => e.studentId);

  // Get all students in class
  type ClassStudent = typeof users.$inferSelect;
  let classStudents: ClassStudent[] = [];
  if (studentIds.length > 0) {
    classStudents = await db
      .select()
      .from(users)
      .where(sql`id = ANY(${studentIds})`);
  }

  // Get assessment completion for each student
  const studentSummaries = await Promise.all(
    classStudents.map(async (student) => {
      const studentAssessments = await db
        .select()
        .from(assessments)
        .where(eq(assessments.userId, student.id));

      const riasecRecords = await db
        .select()
        .from(riasecResults)
        .where(eq(riasecResults.userId, student.id))
        .limit(1);

      const riasecResult = (riasecRecords[0] || null) as RiasecResult | null;

      const studentExamResults = await db
        .select()
        .from(examResults)
        .where(eq(examResults.userId, student.id));

      return {
        id: student.id,
        name: student.name,
        grade: student.grade,
        assessmentsCompleted: studentAssessments.filter((a) => a.status === "completed").length,
        totalAssessments: studentAssessments.length,
        hollandCode: riasecResult?.hollandCode || null,
        latestExamResult: studentExamResults[0] || null,
      };
    })
  );

  return {
    class: {
      id: classData.id,
      name: (classData as ClassData).name || null,
      grade: classData.grade,
      section: classData.section,
      teacherId: (classData as ClassData).teacherId || null,
    },
    summary: {
      totalStudents: studentSummaries.length,
      studentsWithAssessments: studentSummaries.filter((s) => s.assessmentsCompleted > 0).length,
      studentsWithoutAssessments: studentSummaries.filter((s) => s.assessmentsCompleted === 0).length,
    },
    students: studentSummaries,
  };
}

async function generateAssessmentAnalyticsReport(parameters: { assessmentType?: string; dateFrom?: string; dateTo?: string; groupBy?: string }, currentUser: { type: string }): Promise<AssessmentAnalyticsData> {
  const { assessmentType, dateFrom, dateTo, groupBy } = parameters;

  let baseQuery = db.select().from(riasecResults);

  // Filter by date range if provided
  if (dateFrom) {
    // Add date filter
  }

  const results = await baseQuery as RiasecResult[];

  // Calculate statistics
  const hollandCodes: Record<string, number> = {};
  const traitAverages: Record<string, number[]> = {
    realistic: [],
    investigative: [],
    artistic: [],
    social: [],
    enterprising: [],
    conventional: [],
  };

  results.forEach((result) => {
    if (result.hollandCode) {
      hollandCodes[result.hollandCode] = (hollandCodes[result.hollandCode] || 0) + 1;
    }
    Object.keys(traitAverages).forEach((trait) => {
      if (result[trait] !== undefined) {
        traitAverages[trait].push(result[trait]);
      }
    });
  });

  const calculateAverage = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  return {
    assessmentTypeId: assessmentType || "riasec",
    period: { from: dateFrom, to: dateTo },
    totalResults: results.length,
    hollandCodeDistribution: hollandCodes,
    traitAverages: {
      realistic: calculateAverage(traitAverages.realistic),
      investigative: calculateAverage(traitAverages.investigative),
      artistic: calculateAverage(traitAverages.artistic),
      social: calculateAverage(traitAverages.social),
      enterprising: calculateAverage(traitAverages.enterprising),
      conventional: calculateAverage(traitAverages.conventional),
    },
    topHollandCodes: Object.entries(hollandCodes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([code, count]) => ({ code, count })),
  };
}

async function generateCareerOutcomesReport(parameters: { schoolId?: string; grade?: string; year?: string }, currentUser: { type: string; schoolId?: string | null }): Promise<CareerOutcomesData> {
  const { schoolId, grade } = parameters;

  let matchesQuery = db.select().from(careerMatches);
  let plansQuery = db.select().from(careerPlans);

  // Apply filters if provided
  if (schoolId || currentUser.schoolId) {
    const targetSchool = schoolId || currentUser.schoolId;
    const schoolUsers = await db.select().from(users).where(eq(users.schoolId, targetSchool));
    const userIds = schoolUsers.map((u) => u.id);
    // Would apply user filter here
  }

  const matches = await matchesQuery as Array<{ careerId: string }>;
  const plans = await plansQuery as Array<{ status: string; currentPhase?: string }>;

  // Aggregate by career
  const careerCounts: Record<string, number> = {};
  matches.forEach((m) => {
    const careerName = m.careerId || "unknown";
    careerCounts[careerName] = (careerCounts[careerName] || 0) + 1;
  });

  return {
    period: parameters.year || "all",
    totalCareerMatches: matches.length,
    activeCareerPlans: plans.filter((p) => p.status === "active").length,
    topCareers: Object.entries(careerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([career, count]) => ({ career, count })),
    phaseDistribution: {
      self_assessment: plans.filter((p) => p.currentPhase === "self_assessment").length,
      career_exploration: plans.filter((p) => p.currentPhase === "career_exploration").length,
      goal_setting: plans.filter((p) => p.currentPhase === "goal_setting").length,
      planning: plans.filter((p) => p.currentPhase === "planning").length,
      implementation: plans.filter((p) => p.currentPhase === "implementation").length,
      review: plans.filter((p) => p.currentPhase === "review").length,
    },
  };
}

async function generateSchoolPerformanceReport(parameters: Record<string, unknown>, currentUser: { type: string }): Promise<SchoolPerformanceData> {
  const schools = await db
    .select()
    .from(users)
    .where(sql`${users.schoolId} IS NOT NULL`);

  const schoolStats: Record<string, {
    schoolId: string;
    totalStudents: number;
    assessmentCompletions: number;
  }> = {};

  for (const user of schools) {
    const schoolId = user.schoolId;
    if (!schoolId) continue;

    if (!schoolStats[schoolId]) {
      schoolStats[schoolId] = {
        schoolId,
        totalStudents: 0,
        assessmentCompletions: 0,
      };
    }

    schoolStats[schoolId].totalStudents++;

    const userAssessments = await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, user.id));

    schoolStats[schoolId].assessmentCompletions += userAssessments.filter(
      (a) => a.status === "completed"
    ).length;
  }

  return {
    schools: Object.values(schoolStats).map((s) => ({
      ...s,
      completionRate: s.totalStudents > 0
        ? Math.round((s.assessmentCompletions / s.totalStudents) * 100)
        : 0,
    })),
  };
}

async function generateMyProgressReport(user: { id: string; name: string | null; grade: string | number | null }): Promise<MyProgressData> {
  const allAssessments = await db
    .select()
    .from(assessments)
    .where(eq(assessments.userId, user.id));

  const riasecRecords = await db
    .select()
    .from(riasecResults)
    .where(eq(riasecResults.userId, user.id))
    .limit(1);

  const riasecResult = (riasecRecords[0] || null) as RiasecResult | null;

  // Get career matches through join (careerMatches doesn't have userId)
  const careerMatchesData = await db
    .select({
      id: careerMatches.id,
      matchScore: careerMatches.matchScore,
      recommendationText: careerMatches.recommendationText,
      career: {
        id: careers.id,
        name: careers.name,
      },
    })
    .from(careerMatches)
    .innerJoin(assessments, eq(careerMatches.assessmentId, assessments.id))
    .innerJoin(careers, eq(careerMatches.careerId, careers.id))
    .where(eq(assessments.userId, user.id))
    .orderBy(desc(careerMatches.matchScore))
    .limit(5);

  const careerPlanRecords = await db
    .select()
    .from(careerPlans)
    .where(eq(careerPlans.userId, user.id))
    .limit(1);

  const careerPlan = careerPlanRecords[0] || null;

  const examResultsData = await db
    .select()
    .from(examResults)
    .where(eq(examResults.userId, user.id));

  return {
    user: {
      name: user.name,
      grade: user.grade ? String(user.grade) : null,
    },
    assessments: {
      completed: allAssessments.filter((a) => a.status === "completed").length,
      inProgress: allAssessments.filter((a) => a.status === "in_progress").length,
      total: allAssessments.length,
    },
    personalityProfile: {
      hollandCode: riasecResult?.hollandCode,
      traits: Array.isArray(riasecResult?.traits) ? undefined : riasecResult?.traits,
    },
    topCareerMatches: careerMatchesData.map((m) => ({
      career: m.career?.name,
      matchScore: m.matchScore,
    })),
    careerPlan: careerPlan ? {
      targetCareer: careerPlan.targetCareer,
      currentPhase: (careerPlan as CareerPlanData).currentPhase || null,
      milestonesCompleted: Array.isArray(careerPlan.milestones) ? careerPlan.milestones.filter((m: { completed: boolean }) => m.completed).length : 0,
      totalMilestones: Array.isArray(careerPlan.milestones) ? careerPlan.milestones.length : 0,
    } : null,
    academicResults: examResultsData.map((r) => ({
      examType: r.examType,
      year: r.examYear,
      percentage: (r as ExamResult).totalPercentage || r.percentage || null,
      division: (r as ExamResult).division || null,
    })),
  };
}

// ============================================================================
// FORMAT HELPERS
// ============================================================================

function jsonToCSV(data: ReportData): string {
  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0]);
    const rows = data.map((obj) =>
      headers.map((h) => JSON.stringify(obj[h] ?? "")).join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }
  return JSON.stringify(data);
}

function jsonToXML(data: ReportData, rootName: string): string {
  const objToXML = (obj: unknown, indent = 0): string => {
    const spaces = "  ".repeat(indent);
    if (Array.isArray(obj)) {
      return obj.map((item) => objToXML(item, indent)).join("\n");
    }
    if (typeof obj === "object" && obj !== null) {
      return Object.entries(obj)
        .map(([k, v]) => `${spaces}<${k}>${objToXML(v, indent + 1)}</${k}>`)
        .join("\n");
    }
    return String(obj);
  };
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${objToXML(data, 1)}\n</${rootName}>`;
}
