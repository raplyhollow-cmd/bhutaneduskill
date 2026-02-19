import { logger } from "@/lib/logger";
/**
 * AI CAREER COACH API
 *
 * POST /api/ai/career-coach - Chat with AI Career Coach
 *
 * This is the core AI feature that makes the platform tempting to use.
 * Now integrated with Google Gemini API for intelligent responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, riasecResults, mbtiResults, careerMatches, assessments, careerPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { chatWithCareerCoachFromServer, type ChatMessage, type AIContext } from "@/lib/ai/gemini-server";
import { trackAIInteraction, AI_FEATURE_IDS } from "@/lib/ai/track-interaction";
import {
  extractCareerInterests,
  extractConcerns,
} from "@/lib/ai-features";

// ============================================================================
// SAFE QUERY HELPER
// ============================================================================

/**
 * Safely execute a database query with error handling.
 * Returns default value if query fails, preventing the entire request from failing.
 */
async function safeQuery<T>(
  queryFn: () => Promise<T>,
  defaultValue: T,
  queryName: string
): Promise<T> {
  try {
    const result = await queryFn();
    logger.debug(`[Career Coach] ${queryName} query succeeded`);
    return result;
  } catch (error) {
    logger.warn(`[Career Coach] ${queryName} query failed, using default value`, {
      error: error instanceof Error ? error.message : String(error),
      queryName
    });
    return defaultValue;
  }
}

// ============================================================================
// POST - Chat with AI Career Coach
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Query 1: Get user profile for personalization
    const userProfile = await safeQuery(
      () => db.query.users.findFirst({
        where: eq(users.id, userId),
      }),
      null,
      "user profile"
    );

    // Query 2: Get RIASEC assessment results
    const riasecResult = await safeQuery(
      () => db.query.riasecResults.findFirst({
        where: eq(riasecResults.userId, userId),
        orderBy: desc(riasecResults.createdAt),
      }),
      null,
      "RIASEC results"
    );

    // Query 3: Get MBTI assessment results
    const mbtiResult = await safeQuery(
      () => db.query.mbtiResults.findFirst({
        where: eq(mbtiResults.userId, userId),
        orderBy: desc(mbtiResults.createdAt),
      }),
      null,
      "MBTI results"
    );

    // Query 4: Get user assessments
    const userAssessments = await safeQuery(
      () => db.query.assessments.findMany({
        where: eq(assessments.userId, userId),
      }),
      [],
      "user assessments"
    );

    // Query 5: Get career matches
    // FIXED: Now gets matches from ALL assessments, not just the first one
    const assessmentIds = userAssessments.map(a => a.id);
    let matches: typeof careerMatches.$inferSelect[] = [];
    if (assessmentIds.length > 0) {
      matches = await safeQuery(
        () => db.query.careerMatches.findMany({
            where: inArray(careerMatches.assessmentId, assessmentIds),
            orderBy: desc(careerMatches.matchScore),
            limit: 10, // Increased limit to get more career options
          }),
        [],
        "career matches"
      );
    }

    // Query 6: Get career plan
    const careerPlan = await safeQuery(
      () => db.query.careerPlans.findFirst({
        where: eq(careerPlans.userId, userId),
      }),
      null,
      "career plan"
    );

    // Query 7: Get recent journal entries for AI context
    // Journal entries are stored in users.settings.journalEntries
    const journalEntries = await safeQuery(
      () => {
        const settings = (userProfile?.settings as any) || {};
        return settings.journalEntries || [];
      },
      [],
      "journal entries"
    );

    // Get recent journal entries (last 7 days, max 5)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentJournals = journalEntries
      .filter((e: any) => {
        const entryDate = new Date(e.date);
        return entryDate >= weekAgo;
      })
      .slice(-5);

    // Calculate completed assessments count
    const completedAssessments = userAssessments.filter((a) => a.status === "completed");

    // Build context for AI - now includes journal data
    const aiContext: AIContext = {
      userName: userProfile?.name || "Student",
      userRole: userProfile?.role || "student",
      hollandCode: riasecResult?.hollandCode || null,
      mbtiType: (mbtiResult as any)?.personalityType || null,
      topCareer: matches[0]?.careerTitle || null,
      careerMatchScore: matches[0]?.matchScore || null,
      completedAssessments: completedAssessments.length,
      // Add journal context for AI
      recentJournalTopics: recentJournals.map((j: any) => j.title).join(", "),
      journalEntryCount: journalEntries.length,
      recentMoods: recentJournals.map((j: any) => j.mood).filter(Boolean).join(", "),
    };

    // Convert conversation history format
    const chatHistory: ChatMessage[] = conversationHistory.map((msg: any) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Call Gemini AI for intelligent response (server-side)
    const aiResponse = await chatWithCareerCoachFromServer(
      message,
      aiContext,
      chatHistory
    );

    // Extract data insights from the message
    const interests = extractCareerInterests(message);
    const concerns = extractConcerns(message);
    const mentionedCareers = extractCareerNames(message);

    // Track interaction for data insights and analytics
    await trackAIInteraction({
      userId,
      featureId: AI_FEATURE_IDS.CAREER_COACH,
      interactionData: {
        message,
        responseLength: aiResponse.message.length,
        hasSuggestions: aiResponse.suggestions?.length > 0,
        hasResources: aiResponse.resources?.length > 0,
        usedFallback: aiResponse.fallback || false,
        interests,
        concerns,
        mentionedCareers,
        conversationTurn: conversationHistory.length + 1,
      },
      metadata: {
        hasContext: !!userProfile,
        hasAssessments: completedAssessments.length > 0,
        hasCareerPlan: !!careerPlan,
      },
    });

    // Add data capture info to response
    const responseWithData = {
      ...aiResponse,
      dataCaptured: {
        interests,
        concerns,
        mentionedCareers,
      },
    };

    return NextResponse.json(responseWithData);

  } catch (error: any) {
    logger.apiError(error, { route: "/", method: "GET" });

    // Check for specific error types
    if (error?.message === "Unauthorized" || error?.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to generate response", message: "The AI service is temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractCareerNames(message: string): string[] {
  const careers: string[] = [];
  const careerList = [
    "software engineer", "doctor", "teacher", "engineer", "nurse", "accountant",
    "designer", "scientist", "lawyer", "architect", "pharmacist", "dentist",
    "police", "army", "civil servant", "entrepreneur", "artist", "writer",
    "programmer", "developer", "accountant", "business", "agriculture",
  ];

  const lowerMessage = message.toLowerCase();

  careerList.forEach((career) => {
    if (lowerMessage.includes(career)) {
      careers.push(career);
    }
  });

  return careers;
}

// ============================================================================
// GET - Check AI availability
// ============================================================================

export async function GET() {
  return NextResponse.json({
    available: true,
    feature: "AI Career Coach",
    description: "24/7 personalized career guidance chatbot",
    requiresAuth: true,
  });
}
