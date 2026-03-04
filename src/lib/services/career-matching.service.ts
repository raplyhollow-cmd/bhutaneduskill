/**
 * CAREER MATCHING SERVICE
 *
 * Service layer for connecting assessment results to career recommendations.
 * Uses RIASEC, MBTI, DISC, and Work Values assessment data to calculate
 * career compatibility scores.
 *
 * @module services/career-matching
 */

import { db } from "@/lib/db";
import { careers, careerMatches, riasecResults, mbtiResults, discResults, workValuesResults } from "@/lib/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { RIASECScores, MBTIScores, DISCScores } from "./assessment.service";

// ============================================================================
// TYPES
// ============================================================================

export type AssessmentType = "riasec" | "mbti" | "disc" | "work_values";

export interface CareerMatch {
  id: string;
  studentId: string;
  careerId: string;
  careerTitle: string;
  matchScore: number;
  matchReason: string;
  recommendationText: string | null;
  isTopMatch: boolean;
  assessmentType: AssessmentType;
  assessmentId: string | null;
  createdAt: Date;
}

export interface CareerMatchWithDetails extends CareerMatch {
  career: {
    id: string;
    title: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    industry: string;
    riasecCode: string | null;
    hollandCodes: string[] | null;
    educationLevel: string;
    typicalSalary: string | null;
    growthOutlook: string | null;
    skills: string[] | null;
    subjects: string[] | null;
    workEnvironment: string;
    bhutanSpecific: boolean;
    bhutanDemand: string | null;
  };
}

export interface ExtractedTraits {
  primaryTraits: string[];
  secondaryTraits: string[];
  scores?: Record<string, number>;
}

export interface MatchedCareer {
  careerId: string;
  careerTitle: string;
  matchScore: number;
  matchReason: string;
  recommendationText: string;
  isTopMatch: boolean;
}

// ============================================================================
// CAREER MATCHING - MAIN FUNCTION
// ============================================================================

/**
 * Calculate career matches based on assessment results
 *
 * This is the main entry point for career matching. It:
 * 1. Fetches the latest assessment result for the user
 * 2. Extracts traits from the assessment
 * 3. Ranks all careers by compatibility
 * 4. Saves the matches to the database
 *
 * @param userId - The database user ID
 * @param assessmentType - Type of assessment to use for matching
 * @param options - Optional configuration
 * @returns Array of matched careers with details
 */
export async function calculateCareerMatches(
  userId: string,
  assessmentType: AssessmentType,
  options?: {
    limit?: number;
    minScore?: number;
    saveToDatabase?: boolean;
  }
): Promise<CareerMatchWithDetails[]> {
  try {
    const { limit = 10, minScore = 30, saveToDatabase = true } = options || {};

    // Step 1: Get the latest assessment result
    const assessmentResult = await getLatestAssessmentResult(userId, assessmentType);

    if (!assessmentResult) {
      logger.warn("No assessment result found", { userId, assessmentType });
      return [];
    }

    // Step 2: Extract traits from the assessment
    const traits = extractTraits(assessmentResult, assessmentType);

    // Step 3: Fetch all active careers
    const allCareers = await db
      .select()
      .from(careers)
      .where(eq(careers.isActive, true));

    if (allCareers.length === 0) {
      logger.warn("No active careers found in database");
      return [];
    }

    // Step 4: Rank careers by compatibility
    const rankedCareers = rankByCompatibility(traits, allCareers, assessmentType);

    // Step 5: Filter by minimum score and limit
    const filteredMatches = rankedCareers
      .filter((match) => match.matchScore >= minScore)
      .slice(0, limit);

    // Mark top matches
    const matchesWithTopFlag = filteredMatches.map((match, index) => ({
      ...match,
      isTopMatch: index < 3,
    }));

    // Step 6: Save to database if requested
    let savedMatches: CareerMatch[] = [];
    if (saveToDatabase) {
      savedMatches = await saveCareerMatches(userId, matchesWithTopFlag, assessmentType, assessmentResult.assessmentId);
    }

    // Step 7: Format response with career details
    const matchesWithDetails: CareerMatchWithDetails[] = matchesWithTopFlag.map((match, index) => {
      const career = allCareers.find((c) => c.id === match.careerId);
      if (!career) return null;

      return {
        id: savedMatches[index]?.id || `temp_${Date.now()}_${index}`,
        studentId: userId,
        careerId: match.careerId,
        careerTitle: match.careerTitle,
        matchScore: match.matchScore,
        matchReason: match.matchReason,
        recommendationText: match.recommendationText,
        isTopMatch: match.isTopMatch,
        assessmentType,
        assessmentId: assessmentResult.assessmentId,
        createdAt: savedMatches[index]?.createdAt || new Date(),
        career: {
          id: career.id,
          title: career.title,
          name: career.name,
          slug: career.slug,
          description: career.description,
          category: career.category,
          industry: career.industry,
          riasecCode: career.riasecCode,
          hollandCodes: career.hollandCodes,
          educationLevel: career.educationLevel,
          typicalSalary: career.typicalSalary,
          growthOutlook: career.growthOutlook,
          skills: career.skills,
          subjects: career.subjects,
          workEnvironment: career.workEnvironment,
          bhutanSpecific: career.bhutanSpecific,
          bhutanDemand: career.bhutanDemand,
        },
      };
    }).filter((match): match is CareerMatchWithDetails => match !== null);

    logger.info("Career matches calculated", {
      userId,
      assessmentType,
      matchCount: matchesWithDetails.length,
      topMatches: matchesWithDetails.filter((m) => m.isTopMatch).length,
    });

    return matchesWithDetails;
  } catch (error) {
    logger.error(error, { userId, assessmentType });
    throw new Error("Failed to calculate career matches");
  }
}

/**
 * Get existing career matches for a user
 *
 * @param userId - The database user ID
 * @param assessmentType - Optional filter by assessment type
 * @returns Array of existing career matches
 */
export async function getCareerMatches(
  userId: string,
  assessmentType?: AssessmentType
): Promise<CareerMatchWithDetails[]> {
  try {
    let whereCondition = eq(careerMatches.studentId, userId);

    if (assessmentType) {
      whereCondition = and(
        whereCondition,
        eq(careerMatches.assessmentType, assessmentType)
      );
    }

    const matches = await db
      .select()
      .from(careerMatches)
      .where(whereCondition)
      .orderBy(desc(careerMatches.matchScore));

    if (matches.length === 0) {
      return [];
    }

    // Fetch career details
    const careerIds = matches.map((m) => m.careerId);
    const careersData = await db
      .select()
      .from(careers)
      .where(inArray(careers.id, careerIds));

    // Combine matches with career details
    const matchesWithDetails: CareerMatchWithDetails[] = matches.map((match) => {
      const career = careersData.find((c) => c.id === match.careerId);
      if (!career) return null;

      return {
        ...match,
        career: {
          id: career.id,
          title: career.title,
          name: career.name,
          slug: career.slug,
          description: career.description,
          category: career.category,
          industry: career.industry,
          riasecCode: career.riasecCode,
          hollandCodes: career.hollandCodes,
          educationLevel: career.educationLevel,
          typicalSalary: career.typicalSalary,
          growthOutlook: career.growthOutlook,
          skills: career.skills,
          subjects: career.subjects,
          workEnvironment: career.workEnvironment,
          bhutanSpecific: career.bhutanSpecific,
          bhutanDemand: career.bhutanDemand,
        },
      };
    }).filter((match): match is CareerMatchWithDetails => match !== null);

    return matchesWithDetails;
  } catch (error) {
    logger.error(error, { userId, assessmentType });
    throw new Error("Failed to fetch career matches");
  }
}

// ============================================================================
// ASSESSMENT RESULT FETCHING
// ============================================================================

/**
 * Get the latest assessment result for a user
 *
 * @param userId - The database user ID
 * @param assessmentType - Type of assessment
 * @returns Assessment result with scores
 */
async function getLatestAssessmentResult(
  userId: string,
  assessmentType: AssessmentType
): Promise<{ scores: Record<string, number>; assessmentId: string } | null> {
  try {
    switch (assessmentType) {
      case "riasec": {
        const result = await db
          .select()
          .from(riasecResults)
          .where(eq(riasecResults.userId, userId))
          .orderBy(desc(riasecResults.completedAt))
          .limit(1);

        if (result.length === 0) return null;

        return {
          scores: result[0].scores,
          assessmentId: result[0].id,
        };
      }

      case "mbti": {
        const result = await db
          .select()
          .from(mbtiResults)
          .where(eq(mbtiResults.userId, userId))
          .orderBy(desc(mbtiResults.completedAt))
          .limit(1);

        if (result.length === 0) return null;

        return {
          scores: result[0].scores,
          assessmentId: result[0].id,
        };
      }

      case "disc": {
        const result = await db
          .select()
          .from(discResults)
          .where(eq(discResults.userId, userId))
          .orderBy(desc(discResults.completedAt))
          .limit(1);

        if (result.length === 0) return null;

        return {
          scores: result[0].scores,
          assessmentId: result[0].id,
        };
      }

      case "work_values": {
        const result = await db
          .select()
          .from(workValuesResults)
          .where(eq(workValuesResults.userId, userId))
          .orderBy(desc(workValuesResults.completedAt))
          .limit(1);

        if (result.length === 0) return null;

        // Convert topValues array to scores object
        const scores = result[0].topValues.reduce((acc: Record<string, number>, val: { value: string; score?: number }) => {
          acc[val.value] = val.score || 0;
          return acc;
        }, {});

        return {
          scores,
          assessmentId: result[0].id,
        };
      }

      default:
        return null;
    }
  } catch (error) {
    logger.error(error, { userId, assessmentType });
    throw new Error("Failed to fetch assessment result");
  }
}

// ============================================================================
// TRAIT EXTRACTION
// ============================================================================

/**
 * Extract traits from assessment result
 *
 * @param assessmentResult - The assessment result with scores
 * @param assessmentType - Type of assessment
 * @returns Extracted traits for matching
 */
export function extractTraits(
  assessmentResult: { scores: Record<string, number> },
  assessmentType: AssessmentType
): ExtractedTraits {
  try {
    const scores = assessmentResult.scores;

    switch (assessmentType) {
      case "riasec": {
        const riasecScores = scores as unknown as RIASECScores;
        const sorted = Object.entries(riasecScores as unknown as Record<string, number>)
          .sort(([, a], [, b]) => b - a);

        return {
          primaryTraits: [sorted[0]?.[0] || "R"],
          secondaryTraits: sorted.slice(1, 3).map(([trait]) => trait),
          scores: riasecScores as unknown as Record<string, number>,
        };
      }

      case "mbti": {
        const mbtiScores = scores as unknown as MBTIScores;
        const type = [
          mbtiScores.e >= mbtiScores.i ? "E" : "I",
          mbtiScores.s >= mbtiScores.n ? "S" : "N",
          mbtiScores.t >= mbtiScores.f ? "T" : "F",
          mbtiScores.j >= mbtiScores.p ? "J" : "P",
        ].join("");

        return {
          primaryTraits: [type],
          secondaryTraits: [],
          scores: mbtiScores as unknown as Record<string, number>,
        };
      }

      case "disc": {
        const discScores = scores as unknown as DISCScores;
        const sorted = Object.entries(discScores as unknown as Record<string, number>)
          .sort(([, a], [, b]) => b - a);

        return {
          primaryTraits: [sorted[0]?.[0]?.toUpperCase() || "D"],
          secondaryTraits: sorted.slice(1, 3).map(([trait]) => trait?.toUpperCase() || ""),
          scores: discScores as unknown as Record<string, number>,
        };
      }

      case "work_values": {
        const sorted = Object.entries(scores)
          .sort(([, a], [, b]) => b - a);

        return {
          primaryTraits: [sorted[0]?.[0] || "achievement"],
          secondaryTraits: sorted.slice(1, 3).map(([trait]) => trait),
          scores,
        };
      }

      default:
        return {
          primaryTraits: [],
          secondaryTraits: [],
          scores,
        };
    }
  } catch (error) {
    logger.error(error, { assessmentType });
    throw new Error("Failed to extract traits");
  }
}

// ============================================================================
// COMPATIBILITY RANKING
// ============================================================================

/**
 * Rank careers by compatibility with user traits
 *
 * @param traits - Extracted user traits
 * @param careers - Array of all careers to rank
 * @param assessmentType - Type of assessment used
 * @returns Ranked array of careers with match scores
 */
export function rankByCompatibility(
  traits: ExtractedTraits,
  careers: Array<{
    id: string;
    title: string;
    name: string;
    riasecCode: string | null;
    hollandCodes: string[] | null;
    skills: string[] | null;
    industry: string;
    category: string;
    workEnvironment: string;
  }>,
  assessmentType: AssessmentType
): MatchedCareer[] {
  try {
    const matchedCareers: MatchedCareer[] = careers.map((career) => {
      let matchScore = 0;
      let matchReasons: string[] = [];

      switch (assessmentType) {
        case "riasec":
          matchScore = calculateRIASECMatch(traits, career);
          matchReasons = getRIASECMatchReason(traits, career, matchScore);
          break;

        case "mbti":
          matchScore = calculateMBTIMatch(traits, career);
          matchReasons = getMBTIMatchReason(traits, career, matchScore);
          break;

        case "disc":
          matchScore = calculateDISCMatch(traits, career);
          matchReasons = getDISCMatchReason(traits, career, matchScore);
          break;

        case "work_values":
          matchScore = calculateWorkValuesMatch(traits, career);
          matchReasons = getWorkValuesMatchReason(traits, career, matchScore);
          break;
      }

      return {
        careerId: career.id,
        careerTitle: career.title || career.name,
        matchScore: Math.round(Math.min(matchScore, 100)),
        matchReason: matchReasons.join("; "),
        recommendationText: generateRecommendation(career, matchScore),
        isTopMatch: false,
      };
    });

    // Sort by match score descending
    return matchedCareers.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    logger.error(error, { assessmentType });
    throw new Error("Failed to rank careers by compatibility");
  }
}

/**
 * Calculate RIASEC match score for a career
 */
function calculateRIASECMatch(
  traits: ExtractedTraits,
  career: { riasecCode: string | null; hollandCodes: string[] | null }
): number {
  let score = 0;
  const primaryTrait = traits.primaryTraits[0]?.toLowerCase() || "";
  const secondaryTraits = traits.secondaryTraits.map((t) => t.toLowerCase());
  const riasecScores = traits.scores as unknown as RIASECScores | undefined;

  // Check primary trait match (50% weight)
  if (career.riasecCode?.toLowerCase().includes(primaryTrait)) {
    score += 50;
  } else if (career.hollandCodes?.some((code) => code.toLowerCase().includes(primaryTrait))) {
    score += 40;
  }

  // Check secondary traits (25% weight each)
  for (const secondaryTrait of secondaryTraits) {
    if (career.riasecCode?.toLowerCase().includes(secondaryTrait)) {
      score += 25;
    } else if (career.hollandCodes?.some((code) => code.toLowerCase().includes(secondaryTrait))) {
      score += 15;
    }
  }

  // Bonus for high scores in career's RIASEC areas
  if (riasecScores && career.riasecCode) {
    for (const [trait, value] of Object.entries(riasecScores as unknown as Record<string, number>)) {
      if (career.riasecCode.toLowerCase().includes(trait[0])) {
        score += (value / 100) * 10;
      }
    }
  }

  return Math.min(score, 100);
}

/**
 * Calculate MBTI match score for a career
 */
function calculateMBTIMatch(
  traits: ExtractedTraits,
  career: { industry: string; skills: string[] | null; workEnvironment: string }
): number {
  const mbtiType = traits.primaryTraits[0] || "";
  const mbtiScores = (traits.scores as unknown as MBTIScores | undefined);
  let score = 30; // Base score

  // Industry-specific MBTI preferences
  const industryPreferences: Record<string, string[]> = {
    technology: ["INTJ", "INTP", "ENTJ", "ENTP"],
    healthcare: ["ISFJ", "ESFJ", "INFJ", "ENFJ"],
    education: ["INFJ", "ENFJ", "ISFJ", "ESFJ"],
    business: ["ENTJ", "ESTJ", "ENTP", "ESTP"],
    creative: ["ISFP", "ESFP", "ENFP", "INFP"],
    science: ["INTJ", "INTP", "ISTJ", "ISTP"],
  };

  const preferredTypes = industryPreferences[career.industry.toLowerCase()] || [];
  if (preferredTypes.includes(mbtiType)) {
    score += 40;
  }

  // Work environment match
  const workEnv = career.workEnvironment.toLowerCase();
  const mbtiScoresTyped = mbtiScores || { e: 50, i: 50, s: 50, n: 50, t: 50, f: 50, j: 50, p: 50 };

  if (workEnv.includes("office") || workEnv.includes("team")) {
    score += (mbtiScoresTyped.e / 100) * 15;
  }
  if (workEnv.includes("remote") || workEnv.includes("independent")) {
    score += (mbtiScoresTyped.i / 100) * 15;
  }
  if (workEnv.includes("structured") || workEnv.includes("routine")) {
    score += (mbtiScoresTyped.j / 100) * 10;
  }

  return Math.min(score, 100);
}

/**
 * Calculate DISC match score for a career
 */
function calculateDISCMatch(
  traits: ExtractedTraits,
  career: { industry: string; category: string }
): number {
  const dominantStyle = traits.primaryTraits[0]?.toLowerCase() || "d";
  const discScores = (traits.scores as unknown as DISCScores | undefined);
  let score = 30; // Base score

  // Career-DISC mapping
  const careerDiscMapping: Record<string, Record<string, number>> = {
    D: {
      leadership: 30,
      management: 30,
      sales: 25,
      entrepreneurship: 30,
    },
    I: {
      marketing: 30,
      communications: 30,
      sales: 25,
      entertainment: 30,
    },
    S: {
      education: 25,
      healthcare: 30,
      "customer service": 25,
      administration: 25,
    },
    C: {
      technology: 30,
      finance: 30,
      science: 30,
      engineering: 30,
    },
  };

  const styleMapping = careerDiscMapping[dominantStyle] || {};
  const industryKey = career.industry.toLowerCase();
  const categoryKey = career.category.toLowerCase();

  for (const [key, value] of Object.entries(styleMapping)) {
    if (industryKey.includes(key) || categoryKey.includes(key)) {
      score += value;
    }
  }

  // Bonus for strong dominant style
  if (discScores) {
    score += (discScores[dominantStyle as keyof DISCScores] / 100) * 20;
  }

  return Math.min(score, 100);
}

/**
 * Calculate Work Values match score for a career
 */
function calculateWorkValuesMatch(
  traits: ExtractedTraits,
  career: { industry: string; workEnvironment: string; category: string }
): number {
  const topValue = traits.primaryTraits[0]?.toLowerCase() || "achievement";
  let score = 30; // Base score

  // Career-Value mapping
  const valueCareerMapping: Record<string, string[]> = {
    achievement: ["technology", "business", "entrepreneurship", "sales"],
    independence: ["freelance", "consulting", "entrepreneurship", "creative"],
    recognition: ["leadership", "management", "politics", "entertainment"],
    relationships: ["healthcare", "education", "social work", "counseling"],
    support: ["administration", "customer service", "support", "operations"],
    workingconditions: ["government", "education", "healthcare", "remote"],
  };

  const matchingCareers = valueCareerMapping[topValue] || [];
  const careerText = `${career.industry} ${career.workEnvironment} ${career.category}`.toLowerCase();

  for (const matchCareer of matchingCareers) {
    if (careerText.includes(matchCareer)) {
      score += 20;
    }
  }

  return Math.min(score, 100);
}

// ============================================================================
// MATCH REASONS & RECOMMENDATIONS
// ============================================================================

/**
 * Get RIASEC match reason text
 */
function getRIASECMatchReason(traits: ExtractedTraits, career: { riasecCode: string | null }, score: number): string[] {
  const reasons: string[] = [];
  const primaryTrait = traits.primaryTraits[0]?.toUpperCase() || "";

  if (career.riasecCode?.toUpperCase().includes(primaryTrait)) {
    reasons.push(`Matches your ${primaryTrait} (RIASEC) personality type`);
  }

  if (score >= 70) {
    reasons.push("Strong alignment with your interests and abilities");
  } else if (score >= 50) {
    reasons.push("Good fit based on your personality profile");
  }

  return reasons;
}

/**
 * Get MBTI match reason text
 */
function getMBTIMatchReason(traits: ExtractedTraits, career: { industry: string }, score: number): string[] {
  const reasons: string[] = [];
  const mbtiType = traits.primaryTraits[0] || "";

  reasons.push(`${mbtiType} personality type well-suited for ${career.industry}`);

  if (score >= 70) {
    reasons.push("Work environment matches your preferences");
  }

  return reasons;
}

/**
 * Get DISC match reason text
 */
function getDISCMatchReason(traits: ExtractedTraits, career: { industry: string }, score: number): string[] {
  const reasons: string[] = [];
  const style = traits.primaryTraits[0]?.toUpperCase() || "";

  const styleNames: Record<string, string> = {
    D: "Dominance",
    I: "Influence",
    S: "Steadiness",
    C: "Conscientiousness",
  };

  reasons.push(`${styleNames[style] || style} style fits ${career.industry}`);

  return reasons;
}

/**
 * Get Work Values match reason text
 */
function getWorkValuesMatchReason(traits: ExtractedTraits, career: { industry: string }, score: number): string[] {
  const reasons: string[] = [];
  const topValue = traits.primaryTraits[0] || "";

  reasons.push(`${career.industry} aligns with your value of ${topValue}`);

  return reasons;
}

/**
 * Generate recommendation text based on match score
 */
function generateRecommendation(
  career: { title: string; name: string; industry: string; bhutanSpecific?: boolean },
  matchScore: number
): string {
  const careerTitle = career.title || career.name;

  if (matchScore >= 80) {
    return `Excellent match! Your profile strongly aligns with ${careerTitle}. This career in ${career.industry} would allow you to use your natural strengths and interests.${career.bhutanSpecific ? " This role is particularly relevant in Bhutan's job market." : ""}`;
  }

  if (matchScore >= 60) {
    return `Good fit! ${careerTitle} could be a rewarding career path for you in ${career.industry}. Consider exploring this option further.`;
  }

  if (matchScore >= 40) {
    return `Potential match. ${careerTitle} may suit some of your interests, though you might want to explore careers with higher compatibility scores first.`;
  }

  return `${careerTitle} may not be the ideal fit based on your current assessment results, but don't hesitate to explore if it genuinely interests you.`;
}

// ============================================================================
// SAVE CAREER MATCHES
// ============================================================================

/**
 * Save career matches to database
 *
 * @param userId - The database user ID
 * @param matches - Array of career matches to save
 * @param assessmentType - Type of assessment used
 * @param assessmentId - ID of the assessment result
 * @returns Array of saved career matches
 */
export async function saveCareerMatches(
  userId: string,
  matches: MatchedCareer[],
  assessmentType: AssessmentType,
  assessmentId?: string
): Promise<CareerMatch[]> {
  try {
    // Delete existing matches for this assessment type
    await db
      .delete(careerMatches)
      .where(
        and(
          eq(careerMatches.studentId, userId),
          eq(careerMatches.assessmentType, assessmentType)
        )
      );

    // Insert new matches
    const savedMatches: CareerMatch[] = [];

    for (const match of matches) {
      const matchId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      const [saved] = await db
        .insert(careerMatches)
        .values({
          id: matchId,
          studentId: userId,
          careerId: match.careerId,
          careerTitle: match.careerTitle,
          matchScore: match.matchScore,
          matchReason: match.matchReason,
          recommendationText: match.recommendationText,
          isTopMatch: match.isTopMatch,
          assessmentType,
          assessmentId: assessmentId || null,
          createdAt: new Date(),
        })
        .returning();

      savedMatches.push(saved as CareerMatch);
    }

    logger.info("Saved career matches", { userId, assessmentType, count: savedMatches.length });

    return savedMatches;
  } catch (error) {
    logger.error(error, { userId, assessmentType });
    throw new Error("Failed to save career matches");
  }
}

/**
 * Delete career matches for a user
 *
 * @param userId - The database user ID
 * @param assessmentType - Optional filter by assessment type
 */
export async function deleteCareerMatches(
  userId: string,
  assessmentType?: AssessmentType
): Promise<void> {
  try {
    let whereCondition = eq(careerMatches.studentId, userId);

    if (assessmentType) {
      whereCondition = and(
        whereCondition,
        eq(careerMatches.assessmentType, assessmentType)
      );
    }

    await db.delete(careerMatches).where(whereCondition);

    logger.info("Deleted career matches", { userId, assessmentType });
  } catch (error) {
    logger.error(error, { userId, assessmentType });
    throw new Error("Failed to delete career matches");
  }
}

// ============================================================================
// SKILLS GAP ANALYSIS
// ============================================================================

/**
 * Calculate skills gap between student's skills and career requirements
 *
 * @param userId - The database user ID
 * @param careerId - Optional specific career to analyze
 * @returns Skills gap analysis for matched careers
 */
export async function calculateSkillsGap(
  userId: string,
  careerId?: string
): Promise<Array<{
  careerId: string;
  careerTitle: string;
  requiredSkills: string[];
  studentSkills: string[];
  matchingSkills: string[];
  missingSkills: string[];
  readiness: number;
  gap: number;
}>> {
  try {
    // Import student skills table
    const { studentSkills: studentSkillsTable } = await import("@/lib/db/schema");

    // Get student's approved skills
    const studentSkillsData = await db
      .select({ skillName: studentSkillsTable.skillName })
      .from(studentSkillsTable)
      .where(
        and(
          eq(studentSkillsTable.userId, userId),
          eq(studentSkillsTable.status, "approved")
        )
      );

    const studentSkillNames = studentSkillsData.map(s => s.skillName.toLowerCase());

    // Get career matches for this student
    const matches = await db
      .select()
      .from(careerMatches)
      .where(eq(careerMatches.studentId, userId))
      .orderBy(desc(careerMatches.matchScore))
      .limit(careerId ? 1 : 5);

    // Get career details with skills
    const careerIds = matches.map(m => m.careerId);
    const careersData = await db
      .select({ id: careers.id, title: careers.title, skills: careers.skills })
      .from(careers)
      .where(
        careerId
          ? eq(careers.id, careerId)
          : careerIds.length > 0
            ? sql`${careers.id} = ANY(${careerIds})`
            : sql`FALSE`
      );

    // Calculate gaps
    const gaps = careersData.map((career) => {
      const careerSkills = (career.skills as string[]) || [];
      const careerSkillsLower = careerSkills.map(s => s.toLowerCase());

      // Find matching skills
      const matchingSkills = careerSkills.filter(requiredSkill =>
        studentSkillNames.some(studentSkill =>
          studentSkill.includes(requiredSkill.toLowerCase()) ||
          requiredSkill.toLowerCase().includes(studentSkill)
        )
      );

      // Find missing skills
      const missingSkills = careerSkills.filter(requiredSkill =>
        !studentSkillNames.some(studentSkill =>
          studentSkill.includes(requiredSkill.toLowerCase()) ||
          requiredSkill.toLowerCase().includes(studentSkill)
        )
      );

      const readiness = careerSkills.length > 0
        ? Math.round((matchingSkills.length / careerSkills.length) * 100)
        : 0;

      const gap = careerSkills.length - matchingSkills.length;

      return {
        careerId: career.id,
        careerTitle: career.title,
        requiredSkills: careerSkills,
        studentSkills: studentSkillNames,
        matchingSkills,
        missingSkills,
        readiness,
        gap,
      };
    });

    return gaps;
  } catch (error) {
    logger.error("Failed to calculate skills gap", { userId, careerId, error });
    throw new Error("Failed to calculate skills gap");
  }
}

/**
 * Get learning path recommendations based on skills gap
 *
 * @param userId - The database user ID
 * @returns Learning resources recommendations
 */
export async function getLearningPathRecommendations(
  userId: string
): Promise<Array<{
  skill: string;
  career: string;
  priority: "high" | "medium" | "low";
  resources: Array<{
    title: string;
    url: string;
    type: string;
    description: string;
  }>;
}>> {
  try {
    const gaps = await calculateSkillsGap(userId);

    // Learning resources map
    const resourcesMap: Record<string, Array<{
      title: string;
      url: string;
      type: string;
      description: string;
    }>> = {
      mathematics: [
        { title: "Khan Academy Math", url: "https://khanacademy.org/math", type: "free", description: "Complete math curriculum" },
        { title: "Brilliant", url: "https://brilliant.org", type: "freemium", description: "Interactive math lessons" },
      ],
      programming: [
        { title: "FreeCodeCamp", url: "https://freecodecamp.org", type: "free", description: "Learn to code for free" },
        { title: "Codecademy", url: "https://codecademy.com", type: "freemium", description: "Interactive coding lessons" },
      ],
      painting: [
        { title: "YouTube - Painting Tutorials", url: "https://youtube.com", type: "free", description: "Video tutorials" },
        { title: "Coursera Art & Design", url: "https://coursera.org", type: "freemium", description: "Professional courses" },
      ],
      carpentry: [
        { title: "TTI Thimphu", url: "https://tti.gov.bt", type: "in-person", description: "Vocational training" },
        { title: "YouTube - Woodworking", url: "https://youtube.com", type: "free", description: "Video tutorials" },
      ],
      communication: [
        { title: "TED-Ed", url: "https://ed.ted.com", type: "free", description: "Educational videos" },
        { title: "Toastmasters", url: "https://toastmasters.org", type: "free", description: "Public speaking practice" },
      ],
      leadership: [
        { title: "Student Leadership Programs", url: "https://trustarts.org", type: "free", description: "Build leadership skills" },
      ],
      writing: [
        { title: "Duolingo", url: "https://duolingo.com", type: "freemium", description: "Language learning" },
        { title: "Coursera Writing", url: "https://coursera.org", type: "freemium", description: "Writing courses" },
      ],
      default: [
        { title: "Khan Academy", url: "https://khanacademy.org", type: "free", description: "Various subjects" },
        { title: "Coursera", url: "https://coursera.org", type: "freemium", description: "Professional courses" },
      ],
    };

    // Build recommendations array
    const recommendations: Array<{
      skill: string;
      career: string;
      priority: "low" | "medium" | "high";
      resources: Array<{ title: string; url: string; type: string; description: string }>;
    }> = [];

    for (const gap of gaps) {
      const priority = gap.readiness < 30 ? "high" : gap.readiness < 60 ? "medium" : "low";

      for (const missingSkill of gap.missingSkills) {
        const key = missingSkill.toLowerCase();
        const resources = resourcesMap[key as keyof typeof resourcesMap] || resourcesMap.default;

        recommendations.push({
          skill: missingSkill,
          career: gap.careerTitle,
          priority,
          resources,
        });
      }
    }

    // Sort by priority and deduplicate
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .filter((rec, index, self) =>
        index === self.findIndex(r => r.skill === rec.skill && r.career === rec.career)
      );
  } catch (error) {
    logger.error("Failed to get learning path recommendations", { userId, error });
    throw new Error("Failed to get learning path recommendations");
  }
}
