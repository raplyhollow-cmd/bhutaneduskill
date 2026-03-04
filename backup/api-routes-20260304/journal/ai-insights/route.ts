/**
 * AI JOURNAL INSIGHTS API
 *
 * Provides AI-powered features for student journal:
 * - Personalized writing prompts
 * - Auto-tagging suggestions
 * - Writing improvement suggestions
 * - Post-save encouragement
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, riasecResults, mbtiResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  generatePersonalizedPrompt,
  suggestTags,
  getWritingSuggestions,
  generateEntryFeedback,
} from "@/lib/ai/journal-helpers";
import { createApiRoute } from "@/lib/api/route-handler";

type AIAction = "prompt" | "suggest" | "feedback" | "tags" | "suggestions";

interface AIRequest {
  action: AIAction;
  entry?: {
    title: string;
    content: string;
    mood: string;
  };
  context?: {
    pastTopics?: string[];
    interests?: string[];
    recentMood?: string;
  };
}

// ============================================================================
// POST - Generate AI Insights
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    // Safely parse request body
    let body: AIRequest;
    try {
      body = await req.json() as AIRequest;
    } catch {
      return { error: "Invalid request body", status: 400 };
    }

    const { action, entry, context } = body;

    // Fetch user context for personalization
    const [userProfile] = await db
      .select({
        id: users.id,
        name: users.name,
        interests: users.interests,
        settings: users.settings,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userProfile) {
      return { error: "User not found", status: 404 };
    }

    // Get assessment results for context
    const [riasecResult] = await db
      .select()
      .from(riasecResults)
      .where(eq(riasecResults.userId, userId))
      .orderBy(desc(riasecResults.createdAt))
      .limit(1);

    const [mbtiResult] = await db
      .select()
      .from(mbtiResults)
      .where(eq(mbtiResults.userId, userId))
      .orderBy(desc(mbtiResults.createdAt))
      .limit(1);

    // Build context for AI
    const aiContext = {
      userName: userProfile.name,
      interests: userProfile.interests as string[] || [],
      recentMood: context?.recentMood,
      pastTopics: context?.pastTopics,
      careerMatches: riasecResult?.recommendedCareers
        ? riasecResult.recommendedCareers.slice(0, 3)
        : [],
      completedAssessments: (riasecResult ? 1 : 0) + (mbtiResult ? 1 : 0),
    };

    let response: { [key: string]: string | string[] } = {};

    switch (action) {
      case "prompt":
        response.prompt = await generatePersonalizedPrompt(aiContext);
        break;

      case "tags":
        if (!entry?.content) {
          return { error: "Entry content is required for tag suggestions", status: 400 };
        }
        response.tags = await suggestTags(entry.content);
        break;

      case "suggest":
      case "suggestions":
        if (!entry?.content) {
          return { error: "Entry content is required for writing suggestions", status: 400 };
        }
        response.suggestions = await getWritingSuggestions(entry.content);
        break;

      case "feedback":
        if (!entry) {
          return { error: "Entry data is required for feedback", status: 400 };
        }
        response.feedback = await generateEntryFeedback(entry);
        break;

      default:
        return { error: `Invalid action: ${action}`, status: 400 };
    }

    logger.info("AI journal insights generated", {
      userId,
      action,
      hasFallback: Object.values(response).some(v =>
        typeof v === "string" && v.includes("fallback")
      ),
    });

    return response;
  },
  ['student']
);

// ============================================================================
// GET - Check AI availability
// ============================================================================

export const GET = createApiRoute(
  async () => {
    return {
      available: true,
      feature: "AI Journal Assistant",
      actions: ["prompt", "suggest", "feedback", "tags", "suggestions"],
      description: "AI-powered journaling assistance",
      requiresAuth: true,
    };
  },
  ['student']
);
