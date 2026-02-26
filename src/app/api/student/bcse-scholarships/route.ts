/**
 * BCSE Scholarship Eligibility API
 * Calculate student eligibility for government scholarships
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import {
  calculateScholarshipEligibility,
  getRecommendedColleges,
  getCareerSuggestions,
  predictRUBAdmission,
  getStudentAcademicProfile,
} from "@/lib/bcse/scholarship-eligibility";

/**
 * GET /api/student/bcse-scholarships
 * Get scholarship eligibility for a student
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["student", "parent", "counselor", "admin", "school_admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(req.url);
    const examType = searchParams.get("examType") as "BCSE_10" | "BCSE_12" | null;
    const targetStudentId = searchParams.get("studentId");
    const includePredictions = searchParams.get("includePredictions") === "true";
    const includeColleges = searchParams.get("includeColleges") === "true";
    const includeCareers = searchParams.get("includeCareers") === "true";
    const annualIncome = searchParams.get("annualIncome")
      ? parseInt(searchParams.get("annualIncome")!, 10)
      : undefined;

    // Determine which student to analyze
    let studentId = userId;

    if (user?.type === "parent" && targetStudentId) {
      // Parent viewing child's eligibility
      studentId = targetStudentId;
    } else if (["counselor", "admin", "school_admin"].includes(user?.type || "") && targetStudentId) {
      // Staff viewing student's eligibility
      studentId = targetStudentId;
    }

    // Calculate scholarship eligibility
    const scholarships = await calculateScholarshipEligibility(
      studentId,
      examType || undefined,
      annualIncome
    );

    // Get academic profile
    const profile = await getStudentAcademicProfile(studentId, examType || undefined);

    if (!profile) {
      return NextResponse.json({
        error: "No BCSE results found for this student",
      }, { status: 404 });
    }

    const response: {
      success: boolean;
      data: {
        studentId: string;
        academicProfile: unknown;
        scholarshipEligibility: unknown[];
        admissionPredictions?: unknown;
        recommendedColleges?: unknown;
        careerSuggestions?: unknown;
      };
    } = {
      success: true,
      data: {
        studentId,
        academicProfile: profile,
        scholarshipEligibility: scholarships,
      },
    };

    // Add RUB admission predictions if requested
    if (includePredictions) {
      response.data.admissionPredictions = predictRUBAdmission(profile);
    }

    // Add recommended colleges if requested
    if (includeColleges) {
      response.data.recommendedColleges = getRecommendedColleges(profile);
    }

    // Add career suggestions if requested
    if (includeCareers) {
      response.data.careerSuggestions = getCareerSuggestions(profile);
    }

    logger.info("Scholarship eligibility calculated", {
      userId,
      studentId,
      examType,
      eligibleCount: scholarships.filter((s) => s.eligible).length,
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.apiError(error, { route: "/api/student/bcse-scholarships", method: "GET" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to calculate scholarship eligibility",
    }, { status: 500 });
  }
}
