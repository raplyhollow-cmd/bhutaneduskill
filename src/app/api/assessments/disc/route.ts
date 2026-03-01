import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, assessments, discResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { calculateCareerMatches } from "@/lib/services/career-matching.service";
import { createApiRoute } from "@/lib/api/route-handler";
import type { DISCResult, DISCType } from "@/lib/assessments/types";

// Type for DISC scores JSON field
type DiscScores = {
  d: number;
  i: number;
  s: number;
  c: number;
};

// Type for raw answers from frontend
type DiscRawAnswers = {
  [questionId: string]: {
    most: string; // "D", "I", "S", or "C"
    least: string; // "D", "I", "S", or "C"
  };
};

/**
 * DISC Assessment Scoring Algorithm
 *
 * DISC is a behavior assessment based on four personality traits:
 * - D (Dominance): Control, power, directness
 * - I (Influence): Social, communication, enthusiasm
 * - S (Steadiness): Patience, consistency, support
 * - C (Compliance): Rules, accuracy, detail
 *
 * Scoring Method:
 * 1. Each answer has a "most like me" and "least like me" selection
 * 2. "Most like me" adds +1 to that dimension's score
 * 3. "Least like me" subtracts -1 from that dimension's score
 * 4. Raw scores are normalized to a 0-100 scale
 * 5. Primary type is determined by highest score(s)
 */

function calculateDISCFromAnswers(answers: DiscRawAnswers): DISCResult {
  // Initialize raw scores for each dimension
  const rawScores = {
    D: 0,
    I: 0,
    S: 0,
    C: 0,
  };

  // Count of questions that contribute to each dimension
  const dimensionCounts = {
    D: 0,
    I: 0,
    S: 0,
    C: 0,
  };

  // Process each answer
  Object.entries(answers).forEach(([questionId, answer]) => {
    // Validate and normalize the dimension values
    const most = answer.most?.toUpperCase().trim();
    const least = answer.least?.toUpperCase().trim();
    const validDimensions = ["D", "I", "S", "C"];

    // Add score for "most like me" selection
    if (validDimensions.includes(most)) {
      rawScores[most as keyof typeof rawScores] += 1;
      dimensionCounts[most as keyof typeof dimensionCounts]++;
    }

    // Subtract score for "least like me" selection
    if (validDimensions.includes(least)) {
      rawScores[least as keyof typeof rawScores] -= 1;
      // Don't increment dimension count for "least" as it's a negative weight
    }
  });

  // Calculate the maximum possible raw score
  // Each question can contribute +1 (if selected as most) and -1 (if selected as least)
  // But for normalization, we use the total count of questions
  const totalQuestions = Object.keys(answers).length;
  const maxPossibleRawScore = totalQuestions; // All "most" answers for one dimension

  // Normalize scores to 0-100 scale
  // Formula: (rawScore - minScore) / (maxScore - minScore) * 100
  // Min possible score is when dimension is always selected as "least": -totalQuestions
  // Max possible score is when dimension is always selected as "most": +totalQuestions
  const minPossible = -totalQuestions;
  const maxPossible = totalQuestions;
  const range = maxPossible - minPossible;

  const normalizeScore = (rawScore: number): number => {
    if (range === 0) return 50; // Edge case: no answers
    const normalized = ((rawScore - minPossible) / range) * 100;
    return Math.max(0, Math.min(100, Math.round(normalized)));
  };

  const dominance = normalizeScore(rawScores.D);
  const influence = normalizeScore(rawScores.I);
  const steadiness = normalizeScore(rawScores.S);
  const conscientiousness = normalizeScore(rawScores.C);

  // Determine primary type
  const allScores = [
    { type: "D" as const, score: dominance },
    { type: "I" as const, score: influence },
    { type: "S" as const, score: steadiness },
    { type: "C" as const, score: conscientiousness },
  ].sort((a, b) => b.score - a.score);

  const primary = allScores[0].type;
  const secondary = allScores[1].score >= allScores[0].score * 0.8 ? allScores[1].type : undefined;
  const primaryType = secondary ? `${primary}${secondary}` : primary;

  return getDISCProfile(primaryType as DISCType, dominance, influence, steadiness, conscientiousness);
}

/**
 * Get detailed DISC profile based on primary type and scores
 */
function getDISCProfile(
  primaryType: DISCType,
  dominance: number,
  influence: number,
  steadiness: number,
  conscientiousness: number
): DISCResult {
  const profiles: Record<
    DISCType,
    Omit<DISCResult, "dominance" | "influence" | "steadiness" | "conscientiousness">
  > = {
    D: {
      primaryType: "D",
      traits: ["Direct", "Decisive", "Problem-solver", "Risk-taker"],
      description: "Dominant types are direct, forceful, and results-oriented. They prefer to lead and be in control.",
      strengths: ["Natural leader", "Quick decision maker", "Goal-oriented", "Confident"],
      weaknesses: ["Can be impatient", "May overlook details", "Can seem aggressive", "Dislikes routine"],
      careerSuggestions: [
        "CEO",
        "Entrepreneur",
        "Sales Director",
        "Military Officer",
        "Surgeon",
        "Lawyer",
        "Police Officer",
        "Project Manager",
      ],
    },
    I: {
      primaryType: "I",
      traits: ["Outgoing", "Enthusiastic", "Persuasive", "Spontaneous"],
      description: "Influential types are people-oriented, outgoing, and enthusiastic. They love to socialize and inspire others.",
      strengths: ["Charismatic", "Optimistic", "Great communicator", "Persuasive"],
      weaknesses: ["Can be impulsive", "May lack focus", "Dislikes details", "Can be disorganized"],
      careerSuggestions: [
        "Sales Representative",
        "Marketing Manager",
        "Public Relations",
        "Event Planner",
        "TV/Radio Host",
        "Journalist",
        "Social Media Manager",
        "Teacher",
      ],
    },
    S: {
      primaryType: "S",
      traits: ["Patient", "Reliable", "Supportive", "Steady"],
      description: "Steady types are calm, reliable, and supportive. They value stability and enjoy helping others.",
      strengths: ["Dependable", "Good listener", "Patient", "Team player"],
      weaknesses: ["Resists change", "Avoids conflict", "Can be indecisive", "May be passive"],
      careerSuggestions: [
        "Counselor",
        "Social Worker",
        "Nurse",
        "Teacher",
        "HR Specialist",
        "Customer Service",
        "Administrator",
        "Therapist",
      ],
    },
    C: {
      primaryType: "C",
      traits: ["Analytical", "Precise", "Private", "Logical"],
      description: "Conscientious types are analytical, detail-oriented, and systematic. They value accuracy and quality.",
      strengths: ["Analytical", "Detail-oriented", "Quality-focused", "Systematic"],
      weaknesses: ["Can be perfectionist", "May overanalyze", "Dislikes criticism", "Can seem detached"],
      careerSuggestions: [
        "Accountant",
        "Data Analyst",
        "Software Engineer",
        "Scientist",
        "Quality Assurance",
        "Researcher",
        "Financial Analyst",
        "Editor",
      ],
    },
    DI: {
      primaryType: "DI",
      traits: ["Active", "Fast-paced", "Persuasive", "Confident"],
      description: "DI types combine the drive of Dominance with the enthusiasm of Influence. They're dynamic leaders who inspire others.",
      strengths: ["Visionary", "Charismatic", "Action-oriented", "Inspiring"],
      weaknesses: ["Can be overwhelming", "Impatient", "May overlook details", "Can be manipulative"],
      careerSuggestions: [
        "Entrepreneur",
        "Sales Director",
        "Marketing VP",
        "Politician",
        "Startup Founder",
        "Business Consultant",
      ],
    },
    DS: {
      primaryType: "DS",
      traits: ["Active", "Direct", "Supportive", "Steady"],
      description: "DS types combine leadership with reliability. They're determined but also care about their team.",
      strengths: ["Decisive yet supportive", "Goal-oriented", "Patient leader", "Reliable"],
      weaknesses: ["Can be contradictory", "May internalize stress", "Struggles with delegation", "Perfectionist"],
      careerSuggestions: [
        "Manager",
        "Team Lead",
        "Principal",
        "Doctor",
        "Military Officer",
        "Operations Manager",
      ],
    },
    DC: {
      primaryType: "DC",
      traits: ["Active", "Strategic", "Analytical", "Precise"],
      description: "DC types combine drive with analysis. They're results-oriented but also detail-focused.",
      strengths: ["Strategic thinker", "Quality-focused", "Efficient", "Results-driven"],
      weaknesses: ["Can be critical", "May be stubborn", "Overworks", "Can seem cold"],
      careerSuggestions: [
        "CEO",
        "Consultant",
        "Engineer",
        "Lawyer",
        "Surgeon",
        "Investment Banker",
        "Scientist",
      ],
    },
    IS: {
      primaryType: "IS",
      traits: ["Inspiring", "Friendly", "Supportive", "Patient"],
      description: "IS types are people-oriented and steady. They're great team players who bring out the best in others.",
      strengths: ["Warm", "Trusting", "Patient", "Good mediator"],
      weaknesses: ["Avoids conflict", "Can be too trusting", "Procrastinates", "Overly sensitive"],
      careerSuggestions: [
        "Teacher",
        "Counselor",
        "Social Worker",
        "HR Manager",
        "Trainer",
        "Team Coordinator",
      ],
    },
    IC: {
      primaryType: "IC",
      traits: ["Outgoing", "Precise", "Creative", "Analytical"],
      description: "IC types combine enthusiasm with precision. They're creative thinkers who also value accuracy.",
      strengths: ["Creative", "Articulate", "Detail-oriented", "Persuasive"],
      weaknesses: ["Can be perfectionist", "May overthink", "Sensitive to criticism", "Can be inconsistent"],
      careerSuggestions: [
        "Marketing Analyst",
        "Creative Director",
        "Researcher",
        "Journalist",
        "Designer",
        "Communications Director",
      ],
    },
    SC: {
      primaryType: "SC",
      traits: ["Steady", "Precise", "Logical", "Supportive"],
      description: "SC types combine stability with analysis. They're careful thinkers who value quality and consistency.",
      strengths: ["Reliable", "Accurate", "Patient", "Quality-focused"],
      weaknesses: ["Slow to decide", "Fearful of change", "Overcautious", "Can be passive"],
      careerSuggestions: [
        "Accountant",
        "Data Analyst",
        "Quality Assurance",
        "Researcher",
        "Administrator",
        "Financial Planner",
      ],
    },
  };

  const profile = profiles[primaryType] || profiles.D;

  return {
    primaryType,
    dominance,
    influence,
    steadiness,
    conscientiousness,
    ...profile,
  };
}

/**
 * GET /api/assessments/disc - Get DISC assessment results
 *
 * Query params:
 * - userId: Filter by user ID (for parents viewing children's results)
 * - limit: Maximum results to return (default: 10)
 */
export const GET = createApiRoute(
  async (request, auth) => {
    if (!auth) {
      return { error: "Unauthorized", results: [], status: 401 };
    }

    const { userId, user } = auth;
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Parents can view their children's results
    // Students can only view their own results
    let targetUserId = userIdParam;

    if (user.type === "student") {
      // Students can only see their own results
      targetUserId = userId;
    } else if (user.type === "parent" && !userIdParam) {
      // Parent must specify which child
      return {
        error: "userId parameter is required for parents",
        results: [],
        status: 400
      };
    }

    // Build query conditions
    const whereClause = targetUserId ? eq(discResults.userId, targetUserId) : undefined;

    const results = await db
      .select()
      .from(discResults)
      .where(whereClause)
      .orderBy(desc(discResults.createdAt))
      .limit(limit);

    // Format results to match expected schema
    const formattedResults = results.map((result) => {
      // Reconstruct the full profile based on stored scores
      const scores = result.scores || { d: 0, i: 0, s: 0, c: 0 };
      const dominance = scores.d ?? 0;
      const influence = scores.i ?? 0;
      const steadiness = scores.s ?? 0;
      const conscientiousness = scores.c ?? 0;
      const primaryType = (result.dominantStyle || "D") as DISCType;

      // Get the full profile for traits, description, etc.
      const profile = getDISCProfile(primaryType, dominance, influence, steadiness, conscientiousness);

      return {
        id: result.id,
        assessmentId: result.assessmentId,
        userId: result.userId,
        primaryType: profile.primaryType,
        dominance: profile.dominance,
        influence: profile.influence,
        steadiness: profile.steadiness,
        conscientiousness: profile.conscientiousness,
        traits: profile.traits,
        description: profile.description,
        strengths: profile.strengths,
        weaknesses: profile.weaknesses,
        careerSuggestions: profile.careerSuggestions,
        completedAt: result.completedAt,
        createdAt: result.createdAt,
      };
    });

    return { results: formattedResults };
  },
  ['parent', 'student', 'teacher', 'admin', 'school-admin', 'counselor']
);

export const POST = createApiRoute(
  async (request, auth) => {
    if (!auth) {
      return { error: "Unauthorized", status: 401 };
    }

    const { userId, user } = auth;

    // Check RBAC permission for creating assessments
    // Students can create assessments for themselves without special permission
    if (user.type !== "student") {
      const permCheck = await requirePermission(userId, "assessments.create");
      if (permCheck) return permCheck;
    }

    const body = await request.json();
    const { answers, results: clientResults } = body;

    // Calculate DISC scores server-side from raw answers
    // This ensures consistent scoring regardless of client implementation
    let calculatedResult: DISCResult;

    if (clientResults && clientResults.primaryType) {
      // Legacy support: if client sends pre-calculated results, validate and use them
      // But re-calculate to ensure data integrity
      logger.info("Legacy DISC submission received, recalculating server-side");
      calculatedResult = calculateDISCFromAnswers(answers as DiscRawAnswers);
    } else {
      // New format: calculate scores from raw answers
      calculatedResult = calculateDISCFromAnswers(answers as DiscRawAnswers);
    }

    logger.info("DISC assessment calculated", {
      userId,
      primaryType: calculatedResult.primaryType,
      scores: {
        D: calculatedResult.dominance,
        I: calculatedResult.influence,
        S: calculatedResult.steadiness,
        C: calculatedResult.conscientiousness,
      },
    });

    // Create assessment record
    // Note: assessments table has required fields for academic assessments,
    // but personality assessments use dedicated result tables.
    // We provide minimal values for required fields.
    const assessmentId = `disc_${Date.now()}`;
    const [assessment] = await db
      .insert(assessments)
      .values({
        id: assessmentId,
        title: "DISC Personality Assessment",
        description: calculatedResult.primaryType
          ? `DISC Type: ${calculatedResult.primaryType}`
          : "DISC personality assessment",
        dueDate: new Date().toISOString(), // Current date since it's already completed
        totalPoints: 100,
        passingScore: 0,
        userId: userId,
        type: "disc",
        status: "completed",
        // Store answers and results in the results JSON field
        results: {
          answers,
          calculatedResult,
        } as unknown as typeof assessments.$inferInsert.results,
        startedAt: new Date(),
        completedAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await db.insert(discResults).values({
      id: `disc_res_${Date.now()}`,
      assessmentId: assessmentId,
      userId: userId,
      dominantStyle: calculatedResult.primaryType || "D",
      scores: {
        d: calculatedResult.dominance || 0,
        i: calculatedResult.influence || 0,
        s: calculatedResult.steadiness || 0,
        c: calculatedResult.conscientiousness || 0,
      } as DiscScores, // scores is json field
      description: calculatedResult.description || "DISC personality assessment result",
      strengths: calculatedResult.strengths || [],
      weaknesses: calculatedResult.weaknesses || [],
      recommendedCareers: calculatedResult.careerSuggestions || [],
      completedAt: new Date(),
      createdAt: new Date(),
    });

    // Trigger career matching
    try {
      await calculateCareerMatches(userId, "disc", { saveToDatabase: true });
    } catch (error) {
      logger.error("Career matching failed", { userId, assessmentId, error });
      // Don't fail the assessment
    }

    return {
      success: true,
      assessmentId: assessment.id,
      result: calculatedResult,
    };
  },
  ["student", "parent", "teacher", "admin", "school-admin", "counselor"]
);
