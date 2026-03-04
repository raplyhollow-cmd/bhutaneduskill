/**
 * Student Assessments API
 *
 * GET /api/student/assessments - Fetch student's assessments
 * POST /api/student/assessments - Save assessment results
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 *
 * Handles:
 * - Fetching all assessments for the current student
 * - Saving new assessment results and creating career matches
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  users,
  assessments,
  careerMatches,
  riasecResults,
  mbtiResults,
  workValuesResults,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Supported assessment types
 */
type AssessmentType = "riasec" | "mbti" | "disc" | "work_values" | "aptitude";

/**
 * Assessment status
 */
type AssessmentStatus = "draft" | "in_progress" | "completed" | "abandoned";

/**
 * Request body for saving assessment results
 */
interface SaveAssessmentRequest {
  type: AssessmentType;
  answers: Record<string, number | string | string[]>;
  results?: {
    scores?: Record<string, number>;
    hollandCode?: string;
    personalityType?: string;
    workValues?: Record<string, number>;
    [key: string]: unknown;
  };
  timeSpent?: number;
  completedAt?: string;
}

/**
 * Career match data for generation
 */
interface CareerMatchData {
  careerId: string;
  careerTitle: string;
  matchScore: number;
  matchReason: string;
  recommendationText?: string;
  isTopMatch: boolean;
}

// ============================================================================
// CAREER MATCH GENERATION
// ============================================================================

/**
 * Generates career matches based on RIASEC assessment results
 */
async function generateRIASECCareerMatches(
  userId: string,
  assessmentId: string,
  hollandCode: string,
  scores: Record<string, number>
): Promise<CareerMatchData[]> {
  // RIASEC career database mapping
  const careerDatabase: Array<{
    id: string;
    title: string;
    riasecCodes: string[];
    skills: string[];
    educationLevel: string;
  }> = [
    // Realistic careers
    {
      id: "software-engineer",
      title: "Software Engineer",
      riasecCodes: ["RI", "R", "IR"],
      skills: ["Programming", "Problem Solving", "Mathematics"],
      educationLevel: "bachelor",
    },
    {
      id: "civil-engineer",
      title: "Civil Engineer",
      riasecCodes: ["R", "RI", "RC"],
      skills: ["Design", "Construction", "Mathematics"],
      educationLevel: "bachelor",
    },
    {
      id: "mechanic",
      title: "Automotive Mechanic",
      riasecCodes: ["R", "RI"],
      skills: ["Repair", "Machinery", "Technical Skills"],
      educationLevel: "diploma",
    },
    {
      id: "electrician",
      title: "Electrician",
      riasecCodes: ["R", "RI"],
      skills: ["Electrical Systems", "Wiring", "Safety"],
      educationLevel: "certificate",
    },
    // Investigative careers
    {
      id: "data-scientist",
      title: "Data Scientist",
      riasecCodes: ["IR", "I", "IA"],
      skills: ["Statistics", "Programming", "Machine Learning"],
      educationLevel: "master",
    },
    {
      id: "biologist",
      title: "Biologist",
      riasecCodes: ["I", "IR", "IA"],
      skills: ["Research", "Laboratory", "Analysis"],
      educationLevel: "bachelor",
    },
    {
      id: "psychologist",
      title: "Psychologist",
      riasecCodes: ["I", "IS", "IA"],
      skills: ["Analysis", "Research", "Counseling"],
      educationLevel: "master",
    },
    // Artistic careers
    {
      id: "graphic-designer",
      title: "Graphic Designer",
      riasecCodes: ["A", "AR", "AI"],
      skills: ["Design", "Creativity", "Software"],
      educationLevel: "bachelor",
    },
    {
      id: "writer",
      title: "Writer / Author",
      riasecCodes: ["A", "AI", "AS"],
      skills: ["Writing", "Creativity", "Editing"],
      educationLevel: "bachelor",
    },
    {
      id: "musician",
      title: "Musician",
      riasecCodes: ["A", "AE"],
      skills: ["Music", "Performance", "Creativity"],
      educationLevel: "diploma",
    },
    // Social careers
    {
      id: "teacher",
      title: "Teacher",
      riasecCodes: ["S", "SA", "SI"],
      skills: ["Teaching", "Communication", "Patience"],
      educationLevel: "bachelor",
    },
    {
      id: "social-worker",
      title: "Social Worker",
      riasecCodes: ["S", "SI", "SE"],
      skills: ["Counseling", "Communication", "Empathy"],
      educationLevel: "bachelor",
    },
    {
      id: "nurse",
      title: "Nurse",
      riasecCodes: ["S", "SI", "SR"],
      skills: ["Healthcare", "Patient Care", "Medical Knowledge"],
      educationLevel: "bachelor",
    },
    // Enterprising careers
    {
      id: "business-manager",
      title: "Business Manager",
      riasecCodes: ["E", "ES", "EC"],
      skills: ["Leadership", "Management", "Communication"],
      educationLevel: "bachelor",
    },
    {
      id: "marketing-manager",
      title: "Marketing Manager",
      riasecCodes: ["E", "EA", "ES"],
      skills: ["Marketing", "Communication", "Strategy"],
      educationLevel: "bachelor",
    },
    {
      id: "entrepreneur",
      title: "Entrepreneur",
      riasecCodes: ["E", "ER", "EC"],
      skills: ["Business", "Risk Taking", "Leadership"],
      educationLevel: "varies",
    },
    // Conventional careers
    {
      id: "accountant",
      title: "Accountant",
      riasecCodes: ["C", "CE", "CI"],
      skills: ["Accounting", "Mathematics", "Organization"],
      educationLevel: "bachelor",
    },
    {
      id: "bank-teller",
      title: "Bank Teller",
      riasecCodes: ["C", "CE"],
      skills: ["Customer Service", "Cash Handling", "Organization"],
      educationLevel: "diploma",
    },
    {
      id: "data-entry-clerk",
      title: "Data Entry Clerk",
      riasecCodes: ["C", "CI"],
      skills: ["Typing", "Organization", "Attention to Detail"],
      educationLevel: "diploma",
    },
  ];

  // Calculate match scores based on Holland code and scores
  const matches: CareerMatchData[] = [];
  const userCodes = hollandCode.split("");

  for (const career of careerDatabase) {
    let matchScore = 0;
    const matchingTraits: string[] = [];

    for (const careerCode of career.riasecCodes) {
      for (const userCode of userCodes) {
        if (careerCode.includes(userCode)) {
          const positionScore = 3 - career.riasecCodes.indexOf(careerCode);
          matchScore += positionScore * 10;
          matchingTraits.push(userCode);
        }
      }
    }

    // Add score bonus for matching dominant trait
    const dominantCode = userCodes[0];
    if (career.riasecCodes.some((code) => code.startsWith(dominantCode))) {
      matchScore += 20;
    }

    // Normalize score to 0-100
    matchScore = Math.min(100, Math.round((matchScore / 60) * 100));

    if (matchScore >= 40) {
      matches.push({
        careerId: career.id,
        careerTitle: career.title,
        matchScore,
        matchReason: `Based on your ${hollandCode} code, this career aligns with your ${matchingTraits.join(", ")} traits.`,
        recommendationText: `Consider focusing on ${career.skills.slice(0, 2).join(" and ")} skills for this career path.`,
        isTopMatch: matchScore >= 75,
      });
    }
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 15);
}

/**
 * Generates career matches based on MBTI results
 */
async function generateMBTICareerMatches(
  userId: string,
  assessmentId: string,
  personalityType: string
): Promise<CareerMatchData[]> {
  const mbtiCareerMap: Record<string, string[]> = {
    ISTJ: ["accountant", "data-entry-clerk", "civil-engineer"],
    ISFJ: ["nurse", "social-worker", "teacher"],
    INFJ: ["psychologist", "writer", "counselor"],
    INTJ: ["data-scientist", "software-engineer", "business-manager"],
    ISTP: ["mechanic", "electrician", "civil-engineer"],
    ISFP: ["graphic-designer", "musician", "artist"],
    INFP: ["writer", "psychologist", "social-worker"],
    INTP: ["data-scientist", "software-engineer", "biologist"],
    ESTP: ["entrepreneur", "mechanic", "electrician"],
    ESFP: ["musician", "teacher", "marketing-manager"],
    ENFP: ["marketing-manager", "writer", "social-worker"],
    ENTP: ["entrepreneur", "business-manager", "marketing-manager"],
    ESTJ: ["business-manager", "accountant", "civil-engineer"],
    ESFJ: ["teacher", "nurse", "social-worker"],
    ENFJ: ["teacher", "social-worker", "marketing-manager"],
    ENTJ: ["business-manager", "entrepreneur", "marketing-manager"],
  };

  const careerIds = mbtiCareerMap[personalityType] || [];
  const matches: CareerMatchData[] = [];

  for (const [index, careerId] of careerIds.entries()) {
    const matchScore = 90 - index * 5;
    matches.push({
      careerId,
      careerTitle: careerId
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      matchScore,
      matchReason: `Your ${personalityType} personality type indicates you would thrive in this career.`,
      recommendationText: `This career aligns with your natural preferences and strengths.`,
      isTopMatch: index < 3,
    });
  }

  return matches;
}

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * GET /api/student/assessments
 *
 * Fetches all assessments for the current student
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    // Auth is provided by createApiRoute wrapper
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as AssessmentType | null;
    const status = searchParams.get("status") as AssessmentStatus | null;

    try {
      // Build query conditions
      const conditions = [eq(assessments.userId, userId)];

      if (type) {
        conditions.push(eq(assessments.type, type));
      }

      if (status) {
        conditions.push(eq(assessments.status, status));
      }

      // Query assessments using db.select()
      const userAssessments = await db
        .select()
        .from(assessments)
        .where(and(...conditions))
        .orderBy(desc(assessments.createdAt));

      // Transform results for frontend
      const transformedAssessments = userAssessments.map((assessment) => ({
        id: assessment.id,
        type: assessment.type,
        title: assessment.title,
        description: assessment.description,
        status: assessment.status,
        startedAt: assessment.startedAt,
        completedAt: assessment.completedAt,
        timeSpent: assessment.completedAt && assessment.startedAt
          ? Math.floor(
              (new Date(assessment.completedAt).getTime() -
                new Date(assessment.startedAt).getTime()) /
                1000
            )
          : null,
        results: assessment.results
          ? {
              scores: (assessment.results as { scores?: unknown })?.scores,
              hollandCode: (assessment.results as { hollandCode?: string })?.hollandCode,
              personalityType: (assessment.results as { personalityType?: string })?.personalityType,
            }
          : null,
        createdAt: assessment.createdAt,
      }));

      // Get assessment statistics
      const stats = {
        total: userAssessments.length,
        completed: userAssessments.filter((a) => a.status === "completed").length,
        inProgress: userAssessments.filter((a) => a.status === "in_progress").length,
        draft: userAssessments.filter((a) => a.status === "draft").length,
      };

      logger.info("Student assessments fetched", {
        userId,
        total: stats.total,
        completed: stats.completed,
      });

      return successResponse({
        assessments: transformedAssessments,
        stats,
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/student/assessments", method: "GET" });
      return errorResponse("Failed to fetch assessments", 500);
    }
  },
  ['student']
);

/**
 * POST /api/student/assessments
 *
 * Saves a new assessment or updates an existing one.
 * For completed assessments, generates career matches.
 */
export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    // Auth is provided by createApiRoute wrapper
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    // Declare variables outside try block for error handling
    let assessmentType: AssessmentType | undefined;
    let isComplete = false;
    let hasResults = false;

    try {
      const body = (await request.json()) as SaveAssessmentRequest;

      const { type, answers, results, timeSpent, completedAt } = body;

      // Store for error handling
      assessmentType = type;
      isComplete = !!completedAt || !!results;
      hasResults = !!results;

      // Validate request
      if (!type) {
        return badRequestResponse("Assessment type is required");
      }

      if (!answers || Object.keys(answers).length === 0) {
        return badRequestResponse("Assessment answers are required");
      }

      // Generate assessment ID
      const assessmentId = `assessment_${nanoid(12)}`;
      const now = new Date();

      // Create assessment title based on type
      const titles: Record<AssessmentType, string> = {
        riasec: "RIASEC Career Interest Assessment",
        mbti: "MBTI Personality Type Assessment",
        disc: "DISC Personality Assessment",
        work_values: "Work Values Inventory",
        aptitude: "General Aptitude Test",
      };

      // Create the assessment record with detailed error handling
      let newAssessment;
      try {
        // Insert without .returning() for neon-http compatibility
        await db
          .insert(assessments)
          .values({
            id: assessmentId,
            userId,
            type,
            title: titles[type] || `${type.toUpperCase()} Assessment`,
            description: `Assessment completed on ${now.toLocaleDateString()}`,
            dueDate: now.toISOString(),
            totalPoints: 100,
            passingScore: 60,
            status: isComplete ? "completed" : "in_progress",
            startedAt: now,
            completedAt: completedAt ? new Date(completedAt) : isComplete ? now : null,
            results: isComplete ? [] : null,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });

        // Fetch the created assessment using select (more reliable than .returning() with neon-http)
        const [createdAssessment] = await db
          .select()
          .from(assessments)
          .where(eq(assessments.id, assessmentId))
          .limit(1);

        if (!createdAssessment) {
          throw new Error("Failed to create assessment record");
        }

        newAssessment = createdAssessment;
      } catch (dbError: unknown) {
        const errorDetails = {
          operation: "insert_assessment",
          assessmentId,
          userId,
          type,
          errorMessage: dbError instanceof Error ? dbError.message : String(dbError),
          errorName: dbError instanceof Error ? dbError.name : "Unknown",
        };
        logger.error("Failed to insert assessment record", errorDetails);
        console.error("[Assessment Insert Error]", JSON.stringify(errorDetails, null, 2));
        throw new Error(`Failed to insert assessment: ${errorDetails.errorMessage}`);
      }

      // If assessment is complete, save type-specific results and generate career matches
      let careerMatchesData: CareerMatchData[] = [];

      if (isComplete && results) {
        switch (type) {
          case "riasec": {
            if (results.hollandCode && results.scores) {
              const riasecId = `riasec_${nanoid(10)}`;
              const hollandCode = results.hollandCode as string;
              const scores = results.scores as Record<string, number>;

              const riasecScores = {
                realistic: scores.realistic || scores.R || 0,
                investigative: scores.investigative || scores.I || 0,
                artistic: scores.artistic || scores.A || 0,
                social: scores.social || scores.S || 0,
                enterprising: scores.enterprising || scores.E || 0,
                conventional: scores.conventional || scores.C || 0,
              };

              try {
                await db.insert(riasecResults).values({
                  id: riasecId,
                  userId,
                  assessmentId,
                  hollandCode,
                  scores: riasecScores,
                  primaryHollandCode: hollandCode[0] || "R",
                  secondaryHollandCode: hollandCode[1] || "I",
                  recommendedCareers: [],
                  completedAt: now,
                  createdAt: now,
                });
              } catch (dbError: unknown) {
                const errorDetails = {
                  operation: "insert_riasec_results",
                  riasecId,
                  userId,
                  assessmentId,
                  errorMessage: dbError instanceof Error ? dbError.message : String(dbError),
                  errorName: dbError instanceof Error ? dbError.name : "Unknown",
                };
                logger.error("Failed to insert RIASEC results", errorDetails);
                console.error("[RIASEC Insert Error]", JSON.stringify(errorDetails, null, 2));
                throw new Error(`Failed to insert RIASEC results: ${errorDetails.errorMessage}`);
              }

              careerMatchesData = await generateRIASECCareerMatches(
                userId,
                assessmentId,
                hollandCode,
                riasecScores
              );
            }
            break;
          }

          case "mbti": {
            if (results.personalityType) {
              const mbtiId = `mbti_${nanoid(10)}`;
              const personalityType = results.personalityType as string;
              const scores = (results.scores as Record<string, number>) || {};

              const mbtiScores = {
                e: scores.e || scores.E || 50,
                i: scores.i || scores.I || 50,
                s: scores.s || scores.S || 50,
                n: scores.n || scores.N || 50,
                t: scores.t || scores.T || 50,
                f: scores.f || scores.F || 50,
                j: scores.j || scores.J || 50,
                p: scores.p || scores.P || 50,
              };

              const strengths = (results.strengths as string[]) || [
                "Analytical thinking",
                "Problem solving",
                "Attention to detail",
              ];

              await db.insert(mbtiResults).values({
                id: mbtiId,
                userId,
                assessmentId,
                personalityType,
                scores: mbtiScores,
                description: `Your MBTI personality type is ${personalityType}.`,
                strengths,
                weaknesses: (results.weaknesses as string[]) || [
                  "May overlook emotional aspects",
                  "Can be overly critical",
                ],
                recommendedCareers: [],
                completedAt: now,
                createdAt: now,
              });

              careerMatchesData = await generateMBTICareerMatches(
                userId,
                assessmentId,
                personalityType
              );
            }
            break;
          }

          case "work_values": {
            if (results.workValues) {
              const workValuesId = `wv_${nanoid(10)}`;
              const workValues = results.workValues as Record<string, number>;

              const topValues = Object.entries(workValues)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([key, score]) => ({ value: key, score }));

              await db.insert(workValuesResults).values({
                id: workValuesId,
                userId,
                assessmentId,
                topValues,
                description: "Your work values assessment identifies what matters most to you in a career.",
                recommendedCareers: [],
                completedAt: now,
                createdAt: now,
              });
            }
            break;
          }
        }

        // Save career matches to database
        if (careerMatchesData.length > 0) {
          const careerMatchRecords = careerMatchesData.map((match) => ({
            id: `cm_${nanoid(10)}`,
            studentId: userId,
            careerId: match.careerId,
            careerTitle: match.careerTitle,
            matchScore: match.matchScore,
            matchReason: match.matchReason,
            recommendationText: match.recommendationText || null,
            isTopMatch: match.isTopMatch,
            assessmentType: type,
            assessmentId,
            createdAt: now,
          }));

          try {
            await db.insert(careerMatches).values(careerMatchRecords);
          } catch (dbError: unknown) {
            const errorDetails = {
              operation: "insert_career_matches",
              count: careerMatchRecords.length,
              userId,
              assessmentId,
              errorMessage: dbError instanceof Error ? dbError.message : String(dbError),
              errorName: dbError instanceof Error ? dbError.name : "Unknown",
            };
            logger.error("Failed to insert career matches", errorDetails);
            console.error("[Career Matches Insert Error]", JSON.stringify(errorDetails, null, 2));
            // Don't throw - career matches are optional
          }
        }
      }

      logger.info("Student assessment saved", {
        userId,
        assessmentId,
        type,
        status: isComplete ? "completed" : "in_progress",
        careerMatchesGenerated: careerMatchesData.length,
      });

      return successResponse({
        assessment: {
          id: newAssessment.id,
          type: newAssessment.type,
          title: newAssessment.title,
          status: newAssessment.status,
          completedAt: newAssessment.completedAt,
        },
        results: isComplete ? results : null,
        careerMatches: careerMatchesData,
      });
    } catch (error) {
      // Enhanced error logging with actual error details
      const errorDetails = {
        route: "/api/student/assessments",
        method: "POST",
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : "Unknown",
        errorStack: error instanceof Error ? error.stack : undefined,
        requestBody: { type: assessmentType, isComplete, hasResults },
      };
      logger.apiError(error, errorDetails);

      // Log more details for debugging
      console.error("[Assessment Save Error Details]", JSON.stringify(errorDetails, null, 2));

      return errorResponse("Failed to save assessment", 500);
    }
  },
  ['student']
);
