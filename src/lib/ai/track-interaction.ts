/**
 * AI INTERACTION TRACKING
 *
 * Provides a helper function to track AI feature interactions for analytics
 * and personalization. This data helps understand user engagement with AI features.
 */

import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { aiInteractions } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

export interface TrackInteractionOptions {
  userId: string;
  featureId: string;
  interactionData: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface TrackInteractionResult {
  success: boolean;
  interactionId?: string;
  error?: string;
}

/**
 * Track an AI interaction in the database.
 *
 * This function is designed to never fail the calling operation - it always
 * returns success/failure status but won't throw errors that would break
 * the AI feature itself.
 *
 * @param options - The tracking options
 * @returns Result with success status and interaction ID or error
 *
 * @example
 * ```ts
 * const result = await trackAIInteraction({
 *   userId: "user_123",
 *   featureId: "ai-career-coach",
 *   interactionData: {
 *     message: "What careers are good for me?",
 *     responseLength: 450,
 *     interests: ["technology", "design"]
 *   },
 *   metadata: {
 *     userAgent: "Mozilla/5.0...",
 *     timestamp: Date.now()
 *   }
 * });
 *
 * if (result.success) {
 *   logger.debug("Tracked interaction:", result.interactionId);
 * }
 * ```
 */
export async function trackAIInteraction(
  options: TrackInteractionOptions
): Promise<TrackInteractionResult> {
  const { userId, featureId, interactionData, metadata = {} } = options;

  // Validate required fields
  if (!userId) {
    logger.warn("[AI Tracking] Missing userId", { featureId });
    return { success: false, error: "Missing userId" };
  }

  if (!featureId) {
    logger.warn("[AI Tracking] Missing featureId", { userId });
    return { success: false, error: "Missing featureId" };
  }

  const interactionId = `ai-interaction-${nanoid(12)}`;

  try {
    await db.insert(aiInteractions).values({
      id: interactionId,
      userId,
      featureId,
      interactionData,
      metadata: {
        ...metadata,
        trackedAt: new Date().toISOString(),
      },
    });

    logger.debug("[AI Tracking] Interaction recorded", {
      interactionId,
      userId,
      featureId,
    });

    return { success: true, interactionId };
  } catch (error) {
    // Log error but don't throw - tracking failures should not break AI features
    logger.error(error, {
      context: "[AI Tracking] Failed to record interaction",
      userId,
      featureId,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Safely track an AI interaction without awaiting.
 *
 * Use this when you want to track asynchronously without blocking
 * the main response. Errors are silently logged.
 *
 * @param options - The tracking options
 *
 * @example
 * ```ts
 * // Fire and forget - won't block the response
 * safeTrackAIInteraction({
 *   userId: "user_123",
 *   featureId: "ai-career-coach",
 *   interactionData: { message: "Hello" }
 * });
 *
 * // Continue with main logic immediately
 * return NextResponse.json({ response: "Hi there!" });
 * ```
 */
export function safeTrackAIInteraction(options: TrackInteractionOptions): void {
  // Execute tracking asynchronously without awaiting
  trackAIInteraction(options).catch((error) => {
    // This should never happen since trackAIInteraction catches errors internally,
    // but just in case, we have this safety net
    logger.error(error, {
      context: "[AI Tracking] Unexpected error in safeTrackAIInteraction",
    });
  });
}

// List of supported AI feature IDs for type safety
export const AI_FEATURE_IDS = {
  CAREER_COACH: "ai-career-coach",
  CAREER_PREDICTOR: "ai-career-predictor",
  SKILL_GAP_ANALYZER: "ai-skill-gap-analyzer",
  SCHOLARSHIP_MATCHER: "ai-scholarship-matcher",
  ESSAY_REVIEWER: "ai-essay-reviewer",
  INTERVIEW_COACH: "ai-interview-coach",
  STUDY_PLANNER: "ai-study-planner",
  MOOD_TRACKER: "ai-mood-tracker",
  RUB_PREDICTOR: "ai-rub-predictor",
  INSIGHTS: "ai-insights",
} as const;

export type AIFeatureId = (typeof AI_FEATURE_IDS)[keyof typeof AI_FEATURE_IDS];
