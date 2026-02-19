/**
 * ASSESSMENT SERVICE
 *
 * Service layer for assessment operations including:
 * - Fetching assessment results
 * - Saving assessment results
 * - Calculating scores from responses
 *
 * @module services/assessment
 */

import { db } from "@/lib/db";
import { assessments, assessmentResults, riasecResults, mbtiResults, discResults, workValuesResults, learningStylesResults } from "@/lib/db/schema";
import { eq, and, desc, gt } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { Assessment, AssessmentResult } from "@/lib/db/schema";

// ============================================================================
// TYPES
// ============================================================================

export interface AssessmentResponse {
  questionId: string;
  answer: string | string[];
  score?: number;
  correct?: boolean;
}

export interface SaveAssessmentInput {
  userId: string;
  assessmentId?: string;
  type: "riasec" | "mbti" | "disc" | "work_values" | "learning_styles" | "aptitude";
  responses: AssessmentResponse[];
  startedAt?: Date;
  completedAt?: Date;
}

export interface ScoredAssessmentResult {
  id: string;
  assessmentId: string;
  userId: string;
  type: string;
  status: string;
  responses: AssessmentResponse[];
  scores?: Record<string, number> | RIASECScores | MBTIScores | DISCScores;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
}

export interface RIASECScores {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
}

export interface MBTIScores {
  e: number;
  i: number;
  s: number;
  n: number;
  t: number;
  f: number;
  j: number;
  p: number;
}

export interface DISCScores {
  d: number;
  i: number;
  s: number;
  c: number;
}

export interface WorkValuesScores {
  achievement: number;
  independence: number;
  recognition: number;
  relationships: number;
  support: number;
  workingConditions: number;
}

export interface AssessmentResultWithDetails {
  id: string;
  assessmentId: string;
  studentId: string;
  questionId: string;
  selectedOptionId: string | null;
  selectedOptionText: string;
  answer: string;
  score: number;
  points: number;
  isPassed: boolean;
  completedAt: Date;
  startedAt: Date;
  timeSpent: number;
  feedback: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// ASSESSMENT RESULT FETCHING
// ============================================================================

/**
 * Get all assessment results for a user
 *
 * @param userId - The database user ID
 * @param options - Optional filters (type, limit)
 * @returns Array of assessment results with details
 */
export async function getAssessmentResults(
  userId: string,
  options?: {
    type?: string;
    limit?: number;
  }
): Promise<AssessmentResultWithDetails[]> {
  try {
    const { type, limit } = options || {};

    let query = db
      .select()
      .from(assessmentResults)
      .where(eq(assessmentResults.studentId, userId));

    if (type) {
      // Need to join with assessments to filter by type
      const assessmentResultsWithType = await db
        .select({
          id: assessmentResults.id,
          assessmentId: assessmentResults.assessmentId,
          studentId: assessmentResults.studentId,
          questionId: assessmentResults.questionId,
          selectedOptionId: assessmentResults.selectedOptionId,
          selectedOptionText: assessmentResults.selectedOptionText,
          answer: assessmentResults.answer,
          score: assessmentResults.score,
          points: assessmentResults.points,
          isPassed: assessmentResults.isPassed,
          completedAt: assessmentResults.completedAt,
          startedAt: assessmentResults.startedAt,
          timeSpent: assessmentResults.timeSpent,
          feedback: assessmentResults.feedback,
          createdAt: assessmentResults.createdAt,
          updatedAt: assessmentResults.updatedAt,
        })
        .from(assessmentResults)
        .innerJoin(assessments, eq(assessmentResults.assessmentId, assessments.id))
        .where(
          and(
            eq(assessmentResults.studentId, userId),
            eq(assessments.type, type)
          )
        )
        .orderBy(desc(assessmentResults.completedAt))
        .limit(limit || 50);

      return assessmentResultsWithType;
    }

    const results = await query.orderBy(desc(assessmentResults.completedAt)).limit(limit || 50);

    logger.info("Fetched assessment results", { userId, count: results.length, type });

    return results as AssessmentResultWithDetails[];
  } catch (error) {
    logger.error(error, { userId, type: options?.type });
    throw new Error("Failed to fetch assessment results");
  }
}

/**
 * Get the latest assessment result by type
 *
 * @param userId - The database user ID
 * @param type - Assessment type (riasec, mbti, disc, work_values, learning_styles)
 * @returns The latest assessment result or null
 */
export async function getLatestAssessment(
  userId: string,
  type: "riasec" | "mbti" | "disc" | "work_values" | "learning_styles"
): Promise<
  | { id: string; scores: RIASECScores; completedAt: Date; hollandCode?: string; primaryHollandCode?: string }
  | { id: string; scores: MBTIScores; completedAt: Date; personalityType?: string }
  | { id: string; scores: DISCScores; completedAt: Date; dominantStyle?: string }
  | { id: string; scores: WorkValuesScores; completedAt: Date; topValues?: Array<{ value: string; score: number }> }
  | { id: string; scores: Record<string, number>; completedAt: Date }
  | null
> {
  try {
    let result = null;

    switch (type) {
      case "riasec": {
        const riasecData = await db
          .select()
          .from(riasecResults)
          .where(eq(riasecResults.userId, userId))
          .orderBy(desc(riasecResults.completedAt))
          .limit(1);

        if (riasecData.length > 0) {
          result = {
            id: riasecData[0].id,
            scores: riasecData[0].scores,
            completedAt: riasecData[0].completedAt,
            hollandCode: riasecData[0].hollandCode,
            primaryHollandCode: riasecData[0].primaryHollandCode,
          };
        }
        break;
      }

      case "mbti": {
        const mbtiData = await db
          .select()
          .from(mbtiResults)
          .where(eq(mbtiResults.userId, userId))
          .orderBy(desc(mbtiResults.completedAt))
          .limit(1);

        if (mbtiData.length > 0) {
          result = {
            id: mbtiData[0].id,
            scores: mbtiData[0].scores,
            completedAt: mbtiData[0].completedAt,
            personalityType: mbtiData[0].personalityType,
          };
        }
        break;
      }

      case "disc": {
        const discData = await db
          .select()
          .from(discResults)
          .where(eq(discResults.userId, userId))
          .orderBy(desc(discResults.completedAt))
          .limit(1);

        if (discData.length > 0) {
          result = {
            id: discData[0].id,
            scores: discData[0].scores,
            completedAt: discData[0].completedAt,
            dominantStyle: discData[0].dominantStyle,
          };
        }
        break;
      }

      case "work_values": {
        const workValuesData = await db
          .select()
          .from(workValuesResults)
          .where(eq(workValuesResults.userId, userId))
          .orderBy(desc(workValuesResults.completedAt))
          .limit(1);

        if (workValuesData.length > 0) {
          result = {
            id: workValuesData[0].id,
            scores: workValuesData[0].topValues.reduce((acc: Record<string, number>, val: { value: string; score?: number }) => {
              acc[val.value] = val.score || 0;
              return acc;
            }, {}),
            completedAt: workValuesData[0].completedAt,
            topValues: workValuesData[0].topValues,
          };
        }
        break;
      }

      case "learning_styles": {
        const learningStylesData = await db
          .select()
          .from(learningStylesResults)
          .where(eq(learningStylesResults.userId, userId))
          .orderBy(desc(learningStylesResults.completedAt))
          .limit(1);

        if (learningStylesData.length > 0) {
          result = {
            id: learningStylesData[0].id,
            scores: {
              visual: learningStylesData[0].visualScore,
              auditory: learningStylesData[0].auditoryScore,
              kinesthetic: learningStylesData[0].kinestheticScore,
            },
            completedAt: learningStylesData[0].completedAt,
          };
        }
        break;
      }
    }

    logger.debug("Fetched latest assessment", { userId, type, found: !!result });

    return result;
  } catch (error) {
    logger.error(error, { userId, type });
    throw new Error(`Failed to fetch latest ${type} assessment`);
  }
}

/**
 * Get completed assessments for a user
 *
 * @param userId - The database user ID
 * @returns Array of completed assessments
 */
export async function getCompletedAssessments(
  userId: string
): Promise<Pick<Assessment, "id" | "type" | "completedAt" | "createdAt">[]> {
  try {
    const completedAssessments = await db
      .select({
        id: assessments.id,
        type: assessments.type,
        completedAt: assessments.completedAt,
        createdAt: assessments.createdAt,
      })
      .from(assessments)
      .where(
        and(
          eq(assessments.userId, userId),
          gt(assessments.completedAt, new Date(0))
        )
      )
      .orderBy(desc(assessments.completedAt));

    logger.info("Fetched completed assessments", { userId, count: completedAssessments.length });

    return completedAssessments;
  } catch (error) {
    logger.error(error, { userId });
    throw new Error("Failed to fetch completed assessments");
  }
}

// ============================================================================
// ASSESSMENT SAVING
// ============================================================================

/**
 * Save a new assessment result
 *
 * @param data - Assessment data including responses
 * @returns The saved assessment result
 */
export async function saveAssessmentResult(
  data: SaveAssessmentInput
): Promise<{ assessmentId: string; resultId: string }> {
  const { userId, type } = data;

  try {
    const { assessmentId, responses, startedAt, completedAt } = data;

    // Create or update assessment record
    let finalAssessmentId = assessmentId;

    if (!finalAssessmentId) {
      const newAssessmentId = `assessment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      await db.insert(assessments).values({
        id: newAssessmentId,
        userId,
        type,
        title: `${type.toUpperCase()} Assessment`,
        description: `${type.toUpperCase()} personality/career assessment`,
        dueDate: new Date().toISOString(),
        totalPoints: responses.length,
        passingScore: Math.round(responses.length * 0.6),
        startedAt: startedAt || new Date(),
        completedAt: completedAt || new Date(),
        results: responses as unknown as Array<{
          questionId: string;
          answer: string | string[];
          score: number;
          correct: boolean;
        }>,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      finalAssessmentId = newAssessmentId;
    } else {
      // Update existing assessment
      await db
        .update(assessments)
        .set({
          results: responses as unknown as Array<{
            questionId: string;
            answer: string | string[];
            score: number;
            correct: boolean;
          }>,
          completedAt: completedAt || new Date(),
          updatedAt: new Date(),
        })
        .where(eq(assessments.id, finalAssessmentId));
    }

    // Save individual results
    for (const response of responses) {
      const resultId = `result_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      await db.insert(assessmentResults).values({
        id: resultId,
        assessmentId: finalAssessmentId,
        studentId: userId,
        questionId: response.questionId,
        selectedOptionId: typeof response.answer === "string" ? response.answer : null,
        selectedOptionText: typeof response.answer === "string" ? response.answer : JSON.stringify(response.answer),
        answer: typeof response.answer === "string" ? response.answer : JSON.stringify(response.answer),
        score: response.score || 0,
        points: response.score || 0,
        isPassed: (response.score || 0) >= 1,
        completedAt: completedAt || new Date(),
        startedAt: startedAt || new Date(),
        timeSpent: completedAt && startedAt ? Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000) : 0,
        feedback: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    logger.info("Saved assessment result", { userId, assessmentId: finalAssessmentId, type, responseCount: responses.length });

    return {
      assessmentId: finalAssessmentId,
      resultId: finalAssessmentId,
    };
  } catch (error) {
    logger.error(error, { userId, type });
    throw new Error("Failed to save assessment result");
  }
}

// ============================================================================
// SCORE CALCULATION
// ============================================================================

/**
 * Calculate scores from raw assessment responses
 *
 * @param responses - Raw assessment responses
 * @param type - Assessment type
 * @param questions - Optional question metadata for categorization
 * @returns Calculated scores based on assessment type
 */
export function calculateScores(
  responses: AssessmentResponse[],
  type: string,
  questions?: Array<{ id: string; category?: string; dimension?: string }>
): RIASECScores | MBTIScores | DISCScores | WorkValuesScores | Record<string, number> {
  try {
    switch (type) {
      case "riasec":
        return calculateRIASECScores(responses, questions || []);

      case "mbti":
        return calculateMBTIScores(responses, questions || []);

      case "disc":
        return calculateDISCScores(responses, questions || []);

      case "work_values":
        return calculateWorkValuesScores(responses, questions || []);

      case "learning_styles":
        return calculateLearningStylesScores(responses);

      default:
        // Generic score calculation
        return responses.reduce((acc, response) => {
          acc[response.questionId] = response.score || 0;
          return acc;
        }, {} as Record<string, number>);
    }
  } catch (error) {
    logger.error(error, { type });
    throw new Error(`Failed to calculate ${type} scores`);
  }
}

/**
 * Calculate RIASEC scores from responses
 */
function calculateRIASECScores(
  responses: AssessmentResponse[],
  questions: Array<{ id: string; category?: string }>
): RIASECScores {
  const scores: RIASECScores = {
    realistic: 0,
    investigative: 0,
    artistic: 0,
    social: 0,
    enterprising: 0,
    conventional: 0,
  };

  const categoryCounts: Record<string, number> = {
    realistic: 0,
    investigative: 0,
    artistic: 0,
    social: 0,
    enterprising: 0,
    conventional: 0,
  };

  for (const response of responses) {
    const question = questions.find((q) => q.id === response.questionId);
    const category = question?.category?.toLowerCase() || "";

    if (category in scores) {
      const score = typeof response.answer === "number" ? response.answer : response.score || 0;
      scores[category as keyof RIASECScores] += score;
      categoryCounts[category]++;
    }
  }

  // Normalize to 0-100 scale
  for (const key in scores) {
    const count = categoryCounts[key] || 1;
    const maxPossible = count * 5;
    scores[key as keyof RIASECScores] = Math.round((scores[key as keyof RIASECScores] / maxPossible) * 100);
  }

  return scores;
}

/**
 * Calculate MBTI scores from responses
 */
function calculateMBTIScores(
  responses: AssessmentResponse[],
  questions: Array<{ id: string; dimension?: string }>
): MBTIScores {
  const scores: MBTIScores = {
    e: 0,
    i: 0,
    s: 0,
    n: 0,
    t: 0,
    f: 0,
    j: 0,
    p: 0,
  };

  for (const response of responses) {
    const question = questions.find((q) => q.id === response.questionId);
    const dimension = question?.dimension?.toUpperCase();

    if (dimension) {
      const answerValue = typeof response.answer === "number" ? response.answer : 3;
      const adjustedScore = answerValue - 3; // Convert to -2 to +2 range

      if (dimension === "EI") {
        scores.e += Math.max(0, adjustedScore);
        scores.i += Math.max(0, -adjustedScore);
      } else if (dimension === "SN") {
        scores.s += Math.max(0, adjustedScore);
        scores.n += Math.max(0, -adjustedScore);
      } else if (dimension === "TF") {
        scores.t += Math.max(0, adjustedScore);
        scores.f += Math.max(0, -adjustedScore);
      } else if (dimension === "JP") {
        scores.j += Math.max(0, adjustedScore);
        scores.p += Math.max(0, -adjustedScore);
      }
    }
  }

  return scores;
}

/**
 * Calculate DISC scores from responses
 */
function calculateDISCScores(
  responses: AssessmentResponse[],
  questions: Array<{ id: string; category?: string }>
): DISCScores {
  const scores: DISCScores = {
    d: 0,
    i: 0,
    s: 0,
    c: 0,
  };

  for (const response of responses) {
    const question = questions.find((q) => q.id === response.questionId);
    const category = question?.category?.toLowerCase();

    if (category && category in scores) {
      const score = typeof response.answer === "number" ? response.answer : response.score || 0;
      scores[category as keyof DISCScores] += score;
    }
  }

  // Normalize to 0-100 scale
  const maxPerCategory = responses.length / 4 * 5;
  for (const key in scores) {
    scores[key as keyof DISCScores] = Math.round((scores[key as keyof DISCScores] / (maxPerCategory || 1)) * 100);
  }

  return scores;
}

/**
 * Calculate Work Values scores from responses
 */
function calculateWorkValuesScores(
  responses: AssessmentResponse[],
  questions: Array<{ id: string; category?: string }>
): WorkValuesScores {
  const scores: WorkValuesScores = {
    achievement: 0,
    independence: 0,
    recognition: 0,
    relationships: 0,
    support: 0,
    workingConditions: 0,
  };

  const categoryCounts: Record<string, number> = {
    achievement: 0,
    independence: 0,
    recognition: 0,
    relationships: 0,
    support: 0,
    workingConditions: 0,
  };

  for (const response of responses) {
    const question = questions.find((q) => q.id === response.questionId);
    const category = question?.category?.toLowerCase().replace(/[^a-z]/g, "");

    // Map common variations to our categories
    let mappedCategory = category;
    if (category?.includes("achievement")) mappedCategory = "achievement";
    else if (category?.includes("independent")) mappedCategory = "independence";
    else if (category?.includes("recogni")) mappedCategory = "recognition";
    else if (category?.includes("relation")) mappedCategory = "relationships";
    else if (category?.includes("support")) mappedCategory = "support";
    else if (category?.includes("working") || category?.includes("condition")) mappedCategory = "workingConditions";

    if (mappedCategory in scores) {
      const score = typeof response.answer === "number" ? response.answer : response.score || 0;
      scores[mappedCategory as keyof WorkValuesScores] += score;
      categoryCounts[mappedCategory]++;
    }
  }

  // Normalize to 0-100 scale
  for (const key in scores) {
    const count = categoryCounts[key] || 1;
    const maxPossible = count * 5;
    scores[key as keyof WorkValuesScores] = Math.round((scores[key as keyof WorkValuesScores] / maxPossible) * 100);
  }

  return scores;
}

/**
 * Calculate Learning Styles scores from responses
 */
function calculateLearningStylesScores(responses: AssessmentResponse[]): Record<string, number> {
  const scores = {
    visual: 0,
    auditory: 0,
    kinesthetic: 0,
  };

  // Simple pattern matching for learning style responses
  for (const response of responses) {
    const answer = typeof response.answer === "string" ? response.answer.toLowerCase() : "";
    const score = response.score || 1;

    if (answer.includes("visual") || answer.includes("see") || answer.includes("watch") || answer.includes("diagram")) {
      scores.visual += score;
    }
    if (answer.includes("auditory") || answer.includes("hear") || answer.includes("listen") || answer.includes("discuss")) {
      scores.auditory += score;
    }
    if (answer.includes("kinesthetic") || answer.includes("do") || answer.includes("touch") || answer.includes("hands")) {
      scores.kinesthetic += score;
    }
  }

  // Normalize to 0-100
  const total = scores.visual + scores.auditory + scores.kinesthetic;
  if (total > 0) {
    scores.visual = Math.round((scores.visual / total) * 100);
    scores.auditory = Math.round((scores.auditory / total) * 100);
    scores.kinesthetic = Math.round((scores.kinesthetic / total) * 100);
  }

  return scores;
}
