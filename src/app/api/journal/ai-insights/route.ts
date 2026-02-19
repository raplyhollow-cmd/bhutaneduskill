import { logger } from "@/lib/logger";
/**
 * AI JOURNAL INSIGHTS API
 *
 * Provides AI-powered features for student journal:
 * - Personalized writing prompts
 * - Auto-tagging suggestions
 * - Writing improvement suggestions
 * - Post-save encouragement
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, riasecResults, mbtiResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  generatePersonalizedPrompt,
  suggestTags,
  getWritingSuggestions,
  generateEntryFeedback,
} from "@/lib/ai/journal-helpers";

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

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["student"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    // Safely parse request body
    let body: AIRequest;
    try {
      body = await request.json() as AIRequest;
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { action, entry, context } = body;

    // Fetch user context for personalization
    const userProfile = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        name: true,
        interests: true,
        settings: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get assessment results for context
    const riasecResult = await db.query.riasecResults.findFirst({
      where: eq(riasecResults.userId, userId),
      orderBy: (riasecResults, { desc }) => [desc(riasecResults.createdAt)],
    });

    const mbtiResult = await db.query.mbtiResults.findFirst({
      where: eq(mbtiResults.userId, userId),
      orderBy: (mbtiResults, { desc }) => [desc(mbtiResults.createdAt)],
    });

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
          return NextResponse.json(
            { error: "Entry content is required for tag suggestions" },
            { status: 400 }
          );
        }
        response.tags = await suggestTags(entry.content);
        break;

      case "suggest":
      case "suggestions":
        if (!entry?.content) {
          return NextResponse.json(
            { error: "Entry content is required for writing suggestions" },
            { status: 400 }
          );
        }
        response.suggestions = await getWritingSuggestions(entry.content);
        break;

      case "feedback":
        if (!entry) {
          return NextResponse.json(
            { error: "Entry data is required for feedback" },
            { status: 400 }
          );
        }
        response.feedback = await generateEntryFeedback(entry);
        break;

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }

    logger.info("AI journal insights generated", {
      userId,
      action,
      hasFallback: Object.values(response).some(v =>
        typeof v === "string" && v.includes("fallback")
      ),
    });

    return NextResponse.json(response);

  } catch (error: any) {
    logger.apiError(error, {
      route: "/api/journal/ai-insights",
      method: "POST",
    });

    return NextResponse.json(
      { error: "Failed to generate AI insights" },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Check AI availability
// ============================================================================

export async function GET() {
  return NextResponse.json({
    available: true,
    feature: "AI Journal Assistant",
    actions: ["prompt", "suggest", "feedback", "tags", "suggestions"],
    description: "AI-powered journaling assistance",
    requiresAuth: true,
  });
}
