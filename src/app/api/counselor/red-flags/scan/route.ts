import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RED_FLAG_ANALYZER_SYSTEM } from "@/lib/ai/prompts";
import { db } from "@/lib/db";
import { redFlags, users, schools, counselorAssignments, students, studentInterventions, attendance, examResultsEnhanced } from "@/lib/db/schema";
import { teacherBehaviorLogs } from "@/lib/db/teacher-logs-schema";
import { eq, and, gt, gte, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Red Flag thresholds
const THRESHOLDS = {
  attendanceRate: 75, // Flag if below 75%
  lateCount: 3, // Flag if 3+ lates in past week
  avgMarks: 60, // Flag if average below 60%
  highSeverityBehavior: 2, // Flag if 2+ high-severity demerits
  daysToScan: 30, // Scan past 30 days
};

/**
 * POST /api/counselor/red-flags/scan
 *
 * Automated scanner that detects at-risk students using AI pattern analysis
 * Scans behavior logs, attendance, and academic performance
 */
export const POST = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;
    const body = await req.json();
    const { schoolId, forceRescan = false } = body;

    // Get counselor's assigned schools if no school specified
    let schoolsToScan = schoolId ? [schoolId] : [];
    if (!schoolId) {
      // For counselors, get their assigned schools
      const assignments = await db
        .select({ schoolId: counselorAssignments.schoolId })
        .from(counselorAssignments)
        .where(eq(counselorAssignments.counselorId, userId));
      schoolsToScan = assignments.map((a) => a.schoolId);
    }

    if (schoolsToScan.length === 0) {
      return { error: "No schools assigned to scan", status: 400 } satisfies ApiErrorResponse;
    }

    // Scan for red flags
    const results = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - THRESHOLDS.daysToScan);

    for (const scanSchoolId of schoolsToScan) {
      // Get students from this school
      const schoolStudents = await db
        .select({ userId: students.userId })
        .from(students)
        .where(eq(students.schoolId, scanSchoolId));

      const studentIds = schoolStudents.map((s) => s.userId);

      if (studentIds.length === 0) continue;

      // Check each student for red flags
      for (const studentId of studentIds) {
        // Skip if recently flagged (unless forceRescan)
        if (!forceRescan) {
          const existingFlag = await db
            .select()
            .from(redFlags)
            .where(and(
              eq(redFlags.studentId, studentId),
              eq(redFlags.status, "flagged"),
              gte(redFlags.createdAt, cutoffDate)
            ))
            .limit(1)
            .then(rows => rows[0] || null);
          if (existingFlag) continue;
        }

        // Collect student data
        const studentData = await collectStudentData(studentId, scanSchoolId, cutoffDate);

        // Check if student meets any red flag thresholds
        const hasRedFlag = checkRedFlagThresholds(studentData);

        if (!hasRedFlag) continue;

        // Use AI to analyze pattern and determine severity
        // Skip if student not found or no data to analyze
        if (!studentData.student) continue;

        const aiAnalysis = await analyzeWithAI(studentData);

        if (!aiAnalysis) continue;

        // Create red flag record
        const flagId = `redflag-${nanoid()}`;
        await db.insert(redFlags).values({
          id: flagId,
          studentId: studentData.student.id,
          counselorId: userId,
          schoolId: scanSchoolId,
          severity: aiAnalysis.severity,
          flagType: aiAnalysis.flagType,
          patternDetected: aiAnalysis.patternDetected,
          aiRecommendation: aiAnalysis.aiRecommendation,
          gnhPrinciple: aiAnalysis.gnhPrinciple,
          behaviorLogIds: studentData.behaviorLogIds,
          attendanceData: studentData.attendanceData || undefined,
          academicData: studentData.academicData || undefined,
          status: "flagged",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as typeof redFlags.$inferInsert);

        // Get student and school info for response
        const student = await db
          .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(eq(users.id, studentData.student.id))
          .limit(1)
          .then(rows => rows[0] || null);

        const school = await db
          .select({ id: schools.id, name: schools.name })
          .from(schools)
          .where(eq(schools.id, scanSchoolId))
          .limit(1)
          .then(rows => rows[0] || null);

        results.push({
          flagId,
          student: student ? `${student.firstName} ${student.lastName}`.trim() : "Unknown",
          studentId: studentData.student.id,
          school: school?.name || "Unknown",
          severity: aiAnalysis.severity,
          flagType: aiAnalysis.flagType,
          pattern: aiAnalysis.patternDetected.description,
        });
      }
    }

    logger.info("Red flag scan completed", {
      counselorId: userId,
      schoolsScanned: schoolsToScan.length,
      flagsFound: results.length,
    });

    return {
      data: {
        scanned: schoolsToScan.length,
        flagsFound: results.length,
        flags: results,
      },
    } satisfies ApiSuccess<{
      scanned: number;
      flagsFound: number;
      flags: unknown[];
    }>;
  },
  ["counselor", "admin"]
);

/**
 * Collect all relevant data for a student
 */
async function collectStudentData(studentId: string, schoolId: string, cutoffDate: Date): Promise<{
  student: { id: string; firstName?: string; lastName?: string; classGrade?: number } | null;
  behaviorLogIds: string[];
  behaviorLogs: {
    total: number;
    highSeverity: number;
    recent?: Array<{ category: string; severity: string; description: string }>;
  };
  attendanceData: {
    rate: number;
    lates: number;
    absences: number;
    period: string;
  } | null;
  academicData: {
    avgMarks: number;
    failingSubjects: string[];
    trend: "declining" | "stable" | "improving";
  } | null;
}> {
  // Get student info
  const student = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, classGrade: users.classGrade })
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1)
    .then(rows => rows[0] || null);

  if (!student) {
    return {
      student: null,
      behaviorLogIds: [],
      behaviorLogs: { total: 0, highSeverity: 0, recent: [] },
      attendanceData: null,
      academicData: null
    };
  }

  // Get behavior logs from teacher_behavior_logs
  const behaviorLogs = await db.execute(sql`
    SELECT id, type, severity, category, description, created_at
    FROM teacher_behavior_logs
    WHERE student_id = ${studentId}
      AND created_at >= ${cutoffDate}
    ORDER BY created_at DESC
  `);

  const highSeverityLogs = behaviorLogs.rows.filter((log: { severity: string }) => log.severity === "high");
  const behaviorLogIds = behaviorLogs.rows.map((log: { id: string }) => log.id);

  // Get attendance data
  const attendanceResult = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'present') as present,
      COUNT(*) FILTER (WHERE status = 'late') as late,
      COUNT(*) FILTER (WHERE status = 'absent') as absent,
      COUNT(*) as total
    FROM attendance
    WHERE student_id = ${studentId}
      AND date >= ${cutoffDate.toISOString().split('T')[0]}
  `);

  const attendanceRow = (attendanceResult.rows[0] || { present: "0", late: "0", absent: "0", total: "0" }) as {
    present: string;
    late: string;
    absent: string;
    total: string;
  };
  const totalPresent = parseInt(attendanceRow.present) || 0;
  const totalSessions = parseInt(attendanceRow.total) || 0;
  const attendanceRate = totalSessions > 0
    ? Math.round((totalPresent / totalSessions) * 100)
    : 0;

  const attendanceData = {
    rate: attendanceRate,
    lates: parseInt(attendanceRow.late) || 0,
    absences: parseInt(attendanceRow.absent) || 0,
    period: `${THRESHOLDS.daysToScan} days`,
  };

  // Get academic data
  const gradesResult = await db.execute(sql`
    SELECT AVG(marks) as avg_marks, subject
    FROM exam_results_enhanced
    WHERE user_id = ${studentId}
    GROUP BY subject
  `);

  const grades = gradesResult.rows as Array<{ avg_marks: string | null; subject: string | null }>;
  const validGrades = grades.filter(g => g.avg_marks !== null && g.avg_marks !== undefined);
  const avgMarks = validGrades.length > 0
    ? Math.round(validGrades.reduce((sum, g) => sum + parseFloat(g.avg_marks!), 0) / validGrades.length)
    : 0;

  const failingSubjects = grades
    .filter((g) => g.avg_marks !== null && g.avg_marks !== undefined && parseFloat(g.avg_marks) < THRESHOLDS.avgMarks)
    .map((g) => g.subject)
    .filter((subject): subject is string => subject !== null && subject !== undefined);

  const academicData = {
    avgMarks,
    failingSubjects,
    trend: "stable" as const, // Could be calculated from historical data
  };

  return {
    student,
    behaviorLogIds,
    behaviorLogs: {
      total: behaviorLogs.rows.length,
      highSeverity: highSeverityLogs.length,
      recent: behaviorLogs.rows.slice(0, 5).map((log: {
        category: string;
        severity: string;
        description: string;
      }) => ({
        category: log.category,
        severity: log.severity,
        description: log.description,
      })),
    },
    attendanceData,
    academicData,
  };
}

/**
 * Check if student meets red flag thresholds
 */
function checkRedFlagThresholds(data: {
  attendanceData?: { rate: number; lates: number };
  academicData?: { avgMarks: number };
  behaviorLogs?: { highSeverity: number };
}): boolean {
  // Check attendance
  if (data.attendanceData && data.attendanceData.rate < THRESHOLDS.attendanceRate) {
    return true;
  }
  if (data.attendanceData && data.attendanceData.lates >= THRESHOLDS.lateCount) {
    return true;
  }

  // Check academics
  if (data.academicData && data.academicData.avgMarks < THRESHOLDS.avgMarks) {
    return true;
  }

  // Check behavior
  if (data.behaviorLogs && data.behaviorLogs.highSeverity >= THRESHOLDS.highSeverityBehavior) {
    return true;
  }

  return false;
}

/**
 * Analyze student data with AI to determine severity and recommendations
 */
async function analyzeWithAI(studentData: {
  student: { id: string; firstName?: string; lastName?: string; classGrade?: number };
  behaviorLogs: {
    total: number;
    highSeverity: number;
    recent?: Array<{ category: string; severity: string; description: string }>;
  };
  attendanceData?: { rate: number; lates: number; absences: number } | null;
  academicData?: { avgMarks: number; failingSubjects?: string[] } | null;
}) {
  if (!GEMINI_API_KEY) {
    // Fallback: Simple rule-based analysis
    return fallbackAnalysis(studentData);
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this student's data and identify red flags:

STUDENT: ${studentData.student.firstName} ${studentData.student.lastName}
CLASS: ${studentData.student.classGrade || "Unknown"}

BEHAVIOR INCIDENTS (past ${THRESHOLDS.daysToScan} days):
- Total incidents: ${studentData.behaviorLogs.total}
- High-severity incidents: ${studentData.behaviorLogs.highSeverity}
- Recent: ${JSON.stringify(studentData.behaviorLogs.recent)}

ATTENDANCE:
- Rate: ${studentData.attendanceData?.rate || "N/A"}%
- Lates: ${studentData.attendanceData?.lates || 0}
- Absences: ${studentData.attendanceData?.absences || 0}

ACADEMICS:
- Average marks: ${studentData.academicData?.avgMarks || "N/A"}
- Failing subjects: ${studentData.academicData?.failingSubjects?.join(", ") || "None"}

${RED_FLAG_ANALYZER_SYSTEM}

Respond with ONLY a JSON object (no markdown, no extra text):`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse AI response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        severity: parsed.severity || "medium",
        flagType: parsed.flagType || "combined",
        patternDetected: parsed.patternDetected || {
          categories: [],
          description: "Multiple concerns detected",
          confidence: 70,
        },
        aiRecommendation: parsed.aiRecommendation || "Schedule counseling session",
        gnhPrinciple: parsed.gnhPrinciple || "psychological wellbeing",
      };
    }
  } catch (error) {
    logger.error("AI analysis failed, using fallback", { error });
  }

  return fallbackAnalysis(studentData);
}

/**
 * Fallback rule-based analysis when AI is unavailable
 */
function fallbackAnalysis(data: {
  attendanceData?: { rate: number; lates: number };
  academicData?: { avgMarks: number };
  behaviorLogs?: { highSeverity: number };
}) {
  let severity = "low";
  let flagType = "wellness";
  const categories = [];

  // Determine severity based on data
  const highRiskFactors = [];
  const mediumRiskFactors = [];

  if (data.attendanceData) {
    if (data.attendanceData.rate < 50) {
      highRiskFactors.push("Critical attendance");
      categories.push("attendance");
    } else if (data.attendanceData.rate < THRESHOLDS.attendanceRate) {
      mediumRiskFactors.push("Low attendance");
      categories.push("attendance");
    }
    if (data.attendanceData.lates >= THRESHOLDS.lateCount) {
      mediumRiskFactors.push("Frequent lateness");
      categories.push("attendance");
    }
  }

  if (data.behaviorLogs) {
    if (data.behaviorLogs.highSeverity >= 3) {
      highRiskFactors.push("Multiple high-severity incidents");
      categories.push("behavior");
    } else if (data.behaviorLogs.highSeverity >= THRESHOLDS.highSeverityBehavior) {
      mediumRiskFactors.push("Behavior concerns");
      categories.push("behavior");
    }
  }

  if (data.academicData) {
    if (data.academicData.avgMarks < 40) {
      highRiskFactors.push("Critical academic performance");
      categories.push("academic");
    } else if (data.academicData.avgMarks < THRESHOLDS.avgMarks) {
      mediumRiskFactors.push("Below average marks");
      categories.push("academic");
    }
  }

  // Set severity
  if (highRiskFactors.length >= 2) {
    severity = "critical";
  } else if (highRiskFactors.length === 1 || mediumRiskFactors.length >= 2) {
    severity = "high";
  } else if (mediumRiskFactors.length === 1) {
    severity = "medium";
  }

  // Set flag type
  if (categories.length === 1) {
    flagType = categories[0];
  } else if (categories.length > 1) {
    flagType = "combined";
  }

  return {
    severity,
    flagType,
    patternDetected: {
      categories,
      description: `Concerns detected: ${[...highRiskFactors, ...mediumRiskFactors].join(", ")}`,
      confidence: 70,
    },
    aiRecommendation: "Schedule counseling session to discuss concerns",
    gnhPrinciple: "psychological wellbeing",
  };
}

/**
 * GET /api/counselor/red-flags/scan
 *
 * Get scan status and recent results
 */
export const GET = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");

    // Get recent red flags for this counselor's schools
    let counselorSchools: string[] = [];
    if (schoolId) {
      counselorSchools = [schoolId];
    } else {
      const assignments = await db
        .select({ schoolId: counselorAssignments.schoolId })
        .from(counselorAssignments)
        .where(eq(counselorAssignments.counselorId, userId));
      counselorSchools = assignments.map((a) => a.schoolId);
    }

    const flags = await db
      .select({
        id: redFlags.id,
        severity: redFlags.severity,
        flagType: redFlags.flagType,
        status: redFlags.status,
        patternDetected: redFlags.patternDetected,
        aiRecommendation: redFlags.aiRecommendation,
        gnhPrinciple: redFlags.gnhPrinciple,
        createdAt: redFlags.createdAt,
        studentId: redFlags.studentId,
        schoolId: redFlags.schoolId,
        studentName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        schoolName: schools.name,
      })
      .from(redFlags)
      .innerJoin(users, eq(redFlags.studentId, users.id))
      .innerJoin(schools, eq(redFlags.schoolId, schools.id))
      .where(
        counselorSchools.length > 0
          ? sql`${redFlags.schoolId} = ANY(${counselorSchools})`
          : sql`1=1`
      )
      .orderBy(desc(redFlags.createdAt))
      .limit(50);

    return {
      data: {
        flags,
        count: flags.length,
      },
    } satisfies ApiSuccess<{
      flags: unknown[];
      count: number;
    }>;
  },
  ["counselor", "admin"]
);
