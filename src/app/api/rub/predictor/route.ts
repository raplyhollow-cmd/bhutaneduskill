/**
 * RUB Admission Predictor API
 * Predict admission chances for RUB colleges based on BCSE results
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { bcseResults, rubPrograms, rubColleges, users } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";

interface AdmissionPrediction {
  collegeId: string;
  collegeName: string;
  collegeLocation: string;
  programId: string;
  programName: string;
  programLevel: string;
  programField: string;
  minPercentage: number;
  admissionProbability: number; // 0-100
  category: "high" | "medium" | "low";
  reasons: string[];
  suggestions: string[];
}

/**
 * POST /api/rub/predictor
 * Predict admission chances based on BCSE results
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["student", "parent", "counselor", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body = await req.json();
    const { studentId, programIds, examType } = body;

    // Determine which student to analyze
    let targetStudentId = userId;

    if (user?.type === "counselor" && studentId) {
      targetStudentId = studentId;
    } else if (studentId && ["admin", "school_admin"].includes(user?.type || "")) {
      targetStudentId = studentId;
    }

    // Get BCSE result
    const conditions = [eq(bcseResults.studentId, targetStudentId)];

    if (examType) {
      conditions.push(eq(bcseResults.examType, examType));
    }

    const [result] = await db
      .select()
      .from(bcseResults)
      .where(and(...conditions))
      .orderBy(sql`${bcseResults.examYear} DESC`)
      .limit(1);

    if (!result || !result.passed) {
      return NextResponse.json({
        error: "No passing BCSE results found for this student",
      }, { status: 404 });
    }

    const studentPercentage = result.percentage / 100; // Convert from hundredths
    const studentDivision = result.division;
    const subjectResults = result.subjectResults || [];

    // Build subject strength map
    const subjectStrengths: Record<string, number> = {};
    for (const s of subjectResults) {
      const percentage = (s.marksObtained / s.totalMarks) * 100;
      subjectStrengths[s.subjectName.toLowerCase()] = percentage;
    }

    // Get programs to predict for
    let targetPrograms: any[] = [];

    if (Array.isArray(programIds) && programIds.length > 0) {
      // Specific programs requested
      targetPrograms = await db
        .select()
        .from(rubPrograms)
        .where(sql`${rubPrograms.id} = ANY(${programIds})`);
    } else {
      // Get all active programs
      targetPrograms = await db
        .select()
        .from(rubPrograms)
        .where(eq(rubPrograms.isActive, true))
        .limit(50);
    }

    // Get colleges for these programs
    const collegeIds = [...new Set(targetPrograms.map((p) => p.collegeId))];
    const colleges = await db
      .select()
      .from(rubColleges)
      .where(sql`${rubColleges.id} = ANY(${collegeIds})`);

    const collegeMap = new Map(colleges.map((c) => [c.id, c]));

    // Calculate predictions
    const predictions: AdmissionPrediction[] = [];

    for (const program of targetPrograms) {
      const college = collegeMap.get(program.collegeId);

      if (!college || !program.minPercentage) {
        continue;
      }

      const prediction = calculateAdmissionProbability(
        studentPercentage,
        studentDivision,
        subjectStrengths,
        program,
        college
      );

      predictions.push(prediction);
    }

    // Sort by admission probability (highest first)
    predictions.sort((a, b) => b.admissionProbability - a.admissionProbability);

    // Get student info
    const [student] = await db
      .select({ name: users.name, cidNumber: users.cidNumber })
      .from(users)
      .where(eq(users.id, targetStudentId))
      .limit(1);

    logger.info("RUB admission prediction calculated", {
      userId,
      targetStudentId,
      predictionsCount: predictions.length,
      highProbabilityCount: predictions.filter((p) => p.category === "high").length,
    });

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: targetStudentId,
          name: student?.name,
          cidNumber: student?.cidNumber,
        },
        academicProfile: {
          percentage: studentPercentage,
          division: studentDivision,
          examType: result.examType,
          examYear: result.examYear,
        },
        predictions: predictions.slice(0, 20), // Top 20
        summary: {
          highProbability: predictions.filter((p) => p.category === "high").length,
          mediumProbability: predictions.filter((p) => p.category === "medium").length,
          lowProbability: predictions.filter((p) => p.category === "low").length,
        },
      },
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/rub/predictor", method: "POST" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to generate predictions",
    }, { status: 500 });
  }
}

/**
 * Calculate admission probability for a single program
 */
function calculateAdmissionProbability(
  studentPercentage: number,
  studentDivision: string,
  subjectStrengths: Record<string, number>,
  program: any,
  college: any
): AdmissionPrediction {
  let probability = 0;
  const reasons: string[] = [];
  const suggestions: string[] = [];

  // Base probability from percentage above minimum
  const percentageAboveMin = studentPercentage - program.minPercentage;

  if (percentageAboveMin >= 15) {
    probability = 85;
    reasons.push(`Your percentage (${studentPercentage.toFixed(1)}%) is well above the minimum (${program.minPercentage}%)`);
  } else if (percentageAboveMin >= 5) {
    probability = 65;
    reasons.push(`Your percentage (${studentPercentage.toFixed(1)}%) is above the minimum (${program.minPercentage}%)`);
  } else if (percentageAboveMin >= 0) {
    probability = 45;
    reasons.push(`Your percentage (${studentPercentage.toFixed(1)}%) meets the minimum (${program.minPercentage}%)`);
  } else {
    probability = 20;
    reasons.push(`Your percentage (${studentPercentage.toFixed(1)}%) is below the minimum (${program.minPercentage}%)`);
    suggestions.push(`Consider improving your academic performance to meet the ${program.minPercentage}% minimum requirement`);
  }

  // Division bonus
  if (studentDivision.toLowerCase().includes("first")) {
    probability += 10;
    reasons.push("First Division strengthens your application");
  } else if (studentDivision.toLowerCase().includes("second")) {
    probability += 5;
  }

  // Program-specific subject requirements
  if (program.requiredSubjects && Array.isArray(program.requiredSubjects)) {
    const relevantSubjects = program.requiredSubjects.filter((s: string) =>
      Object.keys(subjectStrengths).some((key) => key.includes(s.toLowerCase()))
    );

    if (relevantSubjects.length > 0) {
      const avgSubjectScore = relevantSubjects.reduce((sum: number, subject: string) => {
        const score = Object.entries(subjectStrengths).find(([key]) =>
          key.includes(subject.toLowerCase())
        )?.[1];
        return sum + (score || 0);
      }, 0) / relevantSubjects.length;

      if (avgSubjectScore >= 75) {
        probability += 10;
        reasons.push("Strong performance in relevant subjects");
      } else if (avgSubjectScore >= 60) {
        probability += 5;
        reasons.push("Good performance in relevant subjects");
      }
    }
  }

  // Cap probability at 95 (never 100% guaranteed)
  probability = Math.min(95, Math.max(5, probability));

  // Determine category
  const category = probability >= 70 ? "high" : probability >= 45 ? "medium" : "low";

  // Add suggestions
  if (probability < 50) {
    suggestions.push("Consider applying to multiple colleges to improve chances");
    suggestions.push("Include some programs with lower cut-off percentages");
  }

  if (studentPercentage < 75 && program.level === "bachelor") {
    suggestions.push("Consider diploma programs as an alternative pathway");
  }

  return {
    collegeId: college.id,
    collegeName: college.name,
    collegeLocation: college.location,
    programId: program.id,
    programName: program.name,
    programLevel: program.level,
    programField: program.field,
    minPercentage: program.minPercentage,
    admissionProbability: probability,
    category,
    reasons,
    suggestions,
  };
}

/**
 * GET /api/rub/predictor
 * Get general information about RUB admission requirements
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Get aggregate statistics about programs
    const [stats] = await db
      .select({
        totalPrograms: sql<number>`count(*)`,
        avgMinPercentage: sql<number>`avg(min_percentage)`,
        minMinPercentage: sql<number>`min(min_percentage)`,
        maxMinPercentage: sql<number>`max(min_percentage)`,
      })
      .from(rubPrograms)
      .where(eq(rubPrograms.isActive, true));

    // Get programs by field
    const programsByField = await db
      .select({
        field: rubPrograms.field,
        count: sql<number>`count(*)`,
        avgMinPercentage: sql<number>`avg(min_percentage)`,
      })
      .from(rubPrograms)
      .where(eq(rubPrograms.isActive, true))
      .groupBy(rubPrograms.field);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        programsByField,
        fields: [
          { value: "engineering", label: "Engineering & Technology" },
          { value: "science", label: "Pure Sciences" },
          { value: "arts", label: "Arts & Humanities" },
          { value: "business", label: "Business & Commerce" },
          { value: "education", label: "Education" },
          { value: "medicine", label: "Health Sciences" },
        ],
        levels: [
          { value: "certificate", label: "Certificate", duration: "1 year" },
          { value: "diploma", label: "Diploma", duration: "2-3 years" },
          { value: "bachelor", label: "Bachelor's Degree", duration: "4 years" },
          { value: "master", label: "Master's Degree", duration: "2 years" },
        ],
      },
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/rub/predictor", method: "GET" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to fetch predictor info",
    }, { status: 500 });
  }
}
