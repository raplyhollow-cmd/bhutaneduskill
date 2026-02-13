/**
 * COMPREHENSIVE REPORT SYSTEM API
 *
 * POST /api/reports - Generate a report
 * GET /api/reports - List available reports
 * GET /api/reports/[id] - Get a specific report
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { users, assessments, riasecResults, mbtiResults, discResults, careerMatches, careerPlans, examResults, classes, careers } from "@/lib/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";

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

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id");

    // Return specific report if ID provided
    if (reportId) {
      const report = availableReports.find((r) => r.id === reportId);
      if (!report) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }
      if (!report.allowedRoles.includes(user.type)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json({ report });
    }

    // Return all available reports for user's role
    const userReports = availableReports.filter((r) => r.allowedRoles.includes(user.type));
    return NextResponse.json({ reports: userReports });

  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reports GET error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

// ============================================================================
// POST - Generate a report
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { reportId, format = "json", parameters = {} } = body;

    // Verify report exists and user has access
    const report = availableReports.find((r) => r.id === reportId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    if (!report.allowedRoles.includes(user.type)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate the report based on type
    let reportData: any;

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
        reportData = await generateMyProgressReport(user);
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
          generatedBy: user.name,
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

  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Failed to generate report", details: error.message }, { status: 500 });
  }
}

// ============================================================================
// REPORT GENERATORS
// ============================================================================

async function generateStudentProfileReport(userId: string, currentUser: any) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error("Student not found");
  }

  // Get assessment results
  const allAssessments = await db.query.assessments.findMany({
    where: eq(assessments.userId, userId),
    orderBy: desc(assessments.completedAt),
  });

  const riasecResult = await db.query.riasecResults.findFirst({
    where: eq(riasecResults.userId, userId),
    orderBy: desc(riasecResults.createdAt),
  });

  const mbtiResult = await db.query.mbtiResults.findFirst({
    where: eq(mbtiResults.userId, userId),
    orderBy: desc(mbtiResults.createdAt),
  });

  const discResult = await db.query.discResults.findFirst({
    where: eq(discResults.userId, userId),
    orderBy: desc(discResults.createdAt),
  });

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
  const careerPlanData = await db.query.careerPlans.findFirst({
    where: eq(careerPlans.userId, userId),
  });

  // Get exam results
  const examResultsData = await db.query.examResults.findMany({
    where: eq(examResults.userId, userId),
    orderBy: desc(examResults.examYear),
  });

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
        traits: (riasecResult as any).traits,
      } : null,
      mbti: mbtiResult ? {
        type: mbtiResult.personalityType,
        traits: (mbtiResult as any).traits,
      } : null,
      disc: discResult ? {
        type: (discResult as any).discType,
        traits: (discResult as any).traits,
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
      currentPhase: careerPlanData.currentPhase,
      shortTermGoals: careerPlanData.shortTermGoals,
      longTermGoals: careerPlanData.longTermGoals,
      milestones: careerPlanData.milestones,
      status: careerPlanData.status,
    } : null,
    academicPerformance: examResultsData.map((r) => ({
      examType: r.examType,
      examYear: r.examYear,
      totalPercentage: r.totalPercentage,
      division: (r as any).division,
    })),
  };
}

async function generateClassSummaryReport(classId: string, currentUser: any) {
  const classData = await db.query.classes.findFirst({
    where: eq(classes.id, classId),
  });

  if (!classData) {
    throw new Error("Class not found");
  }

  const studentIds = classData.students || [];

  // Get all students in class
  const classStudents = await db.query.users.findMany({
    where: (users, { inArray }) => inArray(users.id, studentIds),
  });

  // Get assessment completion for each student
  const studentSummaries = await Promise.all(
    classStudents.map(async (student) => {
      const studentAssessments = await db.query.assessments.findMany({
        where: eq(assessments.userId, student.id),
      });

      const riasecResult = await db.query.riasecResults.findFirst({
        where: eq(riasecResults.userId, student.id),
      });

      const studentExamResults = await db.query.examResults.findMany({
        where: eq(examResults.userId, student.id),
      });

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
      name: (classData as any).name,
      grade: classData.grade,
      section: classData.section,
      teacherId: (classData as any).teacherId,
    },
    summary: {
      totalStudents: studentSummaries.length,
      studentsWithAssessments: studentSummaries.filter((s) => s.assessmentsCompleted > 0).length,
      studentsWithoutAssessments: studentSummaries.filter((s) => s.assessmentsCompleted === 0).length,
    },
    students: studentSummaries,
  };
}

async function generateAssessmentAnalyticsReport(parameters: any, currentUser: any) {
  const { assessmentType, dateFrom, dateTo, groupBy } = parameters;

  let baseQuery = db.select().from(riasecResults);

  // Filter by date range if provided
  if (dateFrom) {
    // Add date filter
  }

  const results = await baseQuery as any[];

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

async function generateCareerOutcomesReport(parameters: any, currentUser: any) {
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

  const matches = await matchesQuery as any[];
  const plans = await plansQuery as any[];

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

async function generateSchoolPerformanceReport(parameters: any, currentUser: any) {
  const schools = await db.query.users.findMany({
    where: (users, { isNotNull }) => isNotNull(users.schoolId),
  });

  const schoolStats: Record<string, any> = {};

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

    const userAssessments = await db.query.assessments.findMany({
      where: eq(assessments.userId, user.id),
    });

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

async function generateMyProgressReport(user: any) {
  const allAssessments = await db.query.assessments.findMany({
    where: eq(assessments.userId, user.id),
  });

  const riasecResult = await db.query.riasecResults.findFirst({
    where: eq(riasecResults.userId, user.id),
  });

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

  const careerPlan = await db.query.careerPlans.findFirst({
    where: eq(careerPlans.userId, user.id),
  });

  const examResultsData = await db.query.examResults.findMany({
    where: eq(examResults.userId, user.id),
  });

  return {
    user: {
      name: user.name,
      grade: user.grade,
    },
    assessments: {
      completed: allAssessments.filter((a) => a.status === "completed").length,
      inProgress: allAssessments.filter((a) => a.status === "in_progress").length,
      total: allAssessments.length,
    },
    personalityProfile: {
      hollandCode: riasecResult?.hollandCode,
      traits: riasecResult?.traits,
    },
    topCareerMatches: careerMatchesData.map((m) => ({
      career: m.career?.name,
      matchScore: m.matchScore,
    })),
    careerPlan: careerPlan ? {
      targetCareer: careerPlan.targetCareer,
      currentPhase: (careerPlan as any).currentPhase,
      milestonesCompleted: Array.isArray(careerPlan.milestones) ? careerPlan.milestones.filter((m: any) => m.completed).length : 0,
      totalMilestones: Array.isArray(careerPlan.milestones) ? careerPlan.milestones.length : 0,
    } : null,
    academicResults: examResultsData.map((r) => ({
      examType: r.examType,
      year: r.examYear,
      percentage: r.totalPercentage,
      division: (r as any).division,
    })),
  };
}

// ============================================================================
// FORMAT HELPERS
// ============================================================================

function jsonToCSV(data: any): string {
  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0]);
    const rows = data.map((obj) =>
      headers.map((h) => JSON.stringify(obj[h] ?? "")).join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }
  return JSON.stringify(data);
}

function jsonToXML(data: any, rootName: string): string {
  const objToXML = (obj: any, indent = 0): string => {
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
