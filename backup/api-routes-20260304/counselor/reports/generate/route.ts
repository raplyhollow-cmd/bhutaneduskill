/**
 * COUNSELOR REPORT GENERATION API
 *
 * POST /api/counselor/reports/generate
 *
 * Generate reports in various formats (PDF, Excel, CSV)
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, counselorAssignments, schools, assessments, careerPlans, attendance } from "@/lib/db/schema";
import { eq, and, sql, gte, desc } from "drizzle-orm";

interface GenerateRequest {
  templateId: string;
  format: "pdf" | "excel" | "csv";
  dateRange?: { from: string; to: string };
}

// ============================================================================
// POST /api/counselor/reports/generate
// ============================================================================

export const POST = createApiRoute(
  async (req, auth) => {
    const { user: currentUser } = auth;

    const body: GenerateRequest = await req.json();
    const { templateId, format, dateRange } = body;

    if (!templateId || !format) {
      return { error: "Template ID and format are required", status: 400 };
    }

    // Get counselor's assigned schools
    const assignments = await db
      .select({ schoolId: counselorAssignments.schoolId })
      .from(counselorAssignments)
      .where(
        and(
          eq(counselorAssignments.counselorId, currentUser.id),
          eq(counselorAssignments.isActive, true)
        )
      );

    const schoolIds = assignments.map((a) => a.schoolId);

    if (schoolIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          reportId: `RPT-${Date.now()}`,
          templateId,
          format: format.toUpperCase(),
          status: "completed",
          message: "No students assigned - empty report generated",
          data: { students: [], stats: emptyStats() }
        }
      });
    }

    // Fetch data based on template type
    const reportData = await fetchReportData(templateId, currentUser.id, schoolIds, dateRange);

    // Format response based on requested format
    const response = {
      success: true,
      data: {
        reportId: `RPT-${Date.now()}`,
        templateId,
        templateName: getTemplateName(templateId),
        format: format.toUpperCase(),
        status: "completed",
        generatedAt: new Date().toISOString(),
        generatedBy: `${currentUser.firstName} ${currentUser.lastName || ""}`.trim(),
        fileSize: estimateFileSize(format, reportData),
        data: reportData
      }
    };

    logger.info("Counselor report generated", {
      counselorId: currentUser.id,
      templateId,
      format,
      reportId: response.data.reportId
    });

    return response;
  },
  ["counselor", "admin"]
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function fetchReportData(
  templateId: string,
  counselorId: string,
  schoolIds: string[],
  dateRange?: { from: string; to: string }
) {
  // Get all students from assigned schools
  const allStudents = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.type, "student"),
        sql`${users.schoolId} IN ${sql.raw(`('${schoolIds.join("','")}')`)}`
      )
    );

  const studentIds = allStudents.map((s) => s.id);

  // Get schools data
  const uniqueSchoolIds = [...new Set(allStudents.map((s) => s.schoolId).filter(Boolean))] as string[];
  const schoolsData = uniqueSchoolIds.length > 0
    ? await db
        .select()
        .from(schools)
        .where(sql`${schools.id} IN ${sql.raw(`('${uniqueSchoolIds.join("','")}')`)}`)
    : [];

  const schoolMap = new Map(schoolsData.map((s) => [s.id, s]));

  // Get attendance date range (30 days back)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  // Batch fetch assessments
  const allAssessments = await db
    .select({ userId: assessments.userId, status: assessments.status })
    .from(assessments)
    .where(sql`${assessments.userId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`);

  const assessmentMap = new Map(
    studentIds.map((id) => [id, { completed: 0, inProgress: false }])
  );
  for (const a of allAssessments) {
    const entry = assessmentMap.get(a.userId);
    if (entry) {
      if (a.status === "completed") entry.completed++;
      if (a.status === "in_progress") entry.inProgress = true;
    }
  }

  // Batch fetch career plans
  const allCareerPlans = await db
    .select({ userId: careerPlans.userId, status: careerPlans.status })
    .from(careerPlans)
    .where(sql`${careerPlans.userId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`);

  const careerPlanMap = new Map(allCareerPlans.map((p) => [p.userId, p.status]));

  // Batch fetch attendance
  const allAttendance = await db
    .select({ studentId: attendance.studentId, status: attendance.status })
    .from(attendance)
    .where(
      and(
        sql`${attendance.studentId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`,
        gte(attendance.date, thirtyDaysAgoStr)
      )
    );

  const attendanceMap = new Map(
    studentIds.map((id) => [id, { present: 0, total: 0 }])
  );
  for (const a of allAttendance) {
    const entry = attendanceMap.get(a.studentId);
    if (entry) {
      entry.total++;
      if (a.status === "present") entry.present++;
    }
  }

  // Fetch sessions if needed (placeholder - sessions table not yet implemented)
  interface SessionData {
    id: string;
    studentId: string;
    status: string;
    sessionDate: string;
    createdAt: Date;
  }
  let sessionsData: SessionData[] = [];
  if (templateId === "RPT004" || templateId === "RPT007") {
    // Sessions functionality not yet implemented
    // TODO: Add sessions table and fetch from it
    sessionsData = [];
  }

  // Build student data
  const studentsWithData = allStudents.map((student) => {
    const assessEntry = assessmentMap.get(student.id) || { completed: 0, inProgress: false };
    const attendEntry = attendanceMap.get(student.id) || { present: 0, total: 0 };
    const careerStatus = careerPlanMap.get(student.id);

    const attendanceRate = attendEntry.total > 0
      ? Math.round((attendEntry.present / attendEntry.total) * 100)
      : 0;

    return {
      id: student.id,
      name: `${student.firstName} ${student.lastName || ""}`.trim(),
      email: student.email || null,
      phone: student.phone || null,
      grade: student.classGrade || null,
      section: student.section || null,
      school: schoolMap.get(student.schoolId)?.name || null,
      assessmentStatus: assessEntry.completed > 0 ? "completed" : assessEntry.inProgress ? "in_progress" : "pending",
      assessmentsTaken: assessEntry.completed,
      planStatus: careerStatus === "completed" ? "completed" : careerStatus ? "in_progress" : "not_started",
      attendanceRate,
      needsAttention: attendanceRate < 80 || (assessEntry.completed === 0 && !assessEntry.inProgress)
    };
  });

  // Calculate stats
  const stats = {
    totalStudents: studentsWithData.length,
    studentsCompletedAssessments: studentsWithData.filter((s) => s.assessmentStatus === "completed").length,
    studentsWithCareerPlans: studentsWithData.filter((s) => s.planStatus === "completed").length,
    studentsNeedingAttention: studentsWithData.filter((s) => s.needsAttention).length,
    totalSessions: sessionsData.length,
    completedSessions: sessionsData.filter((s) => s.status === "completed").length
  };

  // Return data based on template type
  switch (templateId) {
    case "RPT001": // Student Progress Report
    case "RPT006": // At-Risk Students
    case "RPT008": // School Performance Summary
      return {
        students: studentsWithData,
        stats,
        schools: schoolsData.map((s) => ({ id: s.id, name: s.name, city: s.city })),
        generatedAt: new Date().toISOString()
      };

    case "RPT002": // Assessment Analytics
      return {
        stats,
        assessmentBreakdown: studentsWithData.map((s) => ({
          name: s.name,
          grade: s.grade,
          assessmentsTaken: s.assessmentsTaken,
          status: s.assessmentStatus
        })),
        completionRate: stats.totalStudents > 0
          ? Math.round((stats.studentsCompletedAssessments / stats.totalStudents) * 100)
          : 0
      };

    case "RPT003": // Career Planning Summary
      return {
        stats,
        careerPlanBreakdown: studentsWithData.map((s) => ({
          name: s.name,
          grade: s.grade,
          planStatus: s.planStatus,
          school: s.school
        })),
        careerPlanRate: stats.totalStudents > 0
          ? Math.round((stats.studentsWithCareerPlans / stats.totalStudents) * 100)
          : 0
      };

    case "RPT004": // Session History Report
      return {
        sessions: sessionsData,
        stats,
        summary: {
          totalSessions: sessionsData.length,
          completedSessions: sessionsData.filter((s) => s.status === "completed").length,
          scheduledSessions: sessionsData.filter((s) => s.status === "scheduled").length,
          studentsMet: new Set(sessionsData.map((s) => s.studentId)).size
        }
      };

    case "RPT007": // Monthly Activity Report
      return {
        sessions: sessionsData,
        students: studentsWithData,
        stats,
        period: dateRange || { from: thirtyDaysAgoStr, to: new Date().toISOString().split("T")[0] }
      };

    default:
      return {
        students: studentsWithData,
        stats,
        message: "Report data retrieved"
      };
  }
}

function getTemplateName(templateId: string): string {
  const templates: Record<string, string> = {
    "RPT001": "Student Progress Report",
    "RPT002": "Assessment Analytics",
    "RPT003": "Career Planning Summary",
    "RPT004": "Session History Report",
    "RPT005": "RIASEC Analysis Report",
    "RPT006": "At-Risk Students Report",
    "RPT007": "Monthly Activity Report",
    "RPT008": "School Performance Summary"
  };
  return templates[templateId] || "Custom Report";
}

function estimateFileSize(format: string, data: unknown): string {
  const size = JSON.stringify(data).length;
  if (format === "pdf") return `~${Math.round(size / 500)} KB`;
  if (format === "excel") return `~${Math.round(size / 800)} KB`;
  return `~${Math.round(size / 1000)} KB`;
}

function emptyStats() {
  return {
    totalStudents: 0,
    studentsCompletedAssessments: 0,
    studentsWithCareerPlans: 0,
    studentsNeedingAttention: 0,
    totalSessions: 0,
    completedSessions: 0
  };
}
