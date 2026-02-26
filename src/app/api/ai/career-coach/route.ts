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
import { createApiRoute } from "@/lib/api/route-handler";
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
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
      queryName
    });
    return defaultValue;
  }
}

// ============================================================================
// POST - Chat with AI Career Coach
// ============================================================================

export const POST = createApiRoute(
  async (request, { userId }) => {
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
    interface UserSettings {
      journalEntries?: Array<{ date: string; title?: string; mood?: string; entry: string }>;
    }
    const journalEntries = await safeQuery(
      () => {
        const settings = (userProfile?.settings as UserSettings | null) || {};
        return settings.journalEntries || [];
      },
      [],
      "journal entries"
    );

    // Get recent journal entries (last 7 days, max 5)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    interface JournalEntry {
      date: string;
      title?: string;
      mood?: string;
      entry?: string;
    }
    const recentJournals = journalEntries
      .filter((e: JournalEntry) => {
        const entryDate = new Date(e.date);
        return entryDate >= weekAgo;
      })
      .slice(-5);

    // Calculate completed assessments count
    const completedAssessments = userAssessments.filter((a) => a.status === "completed");

    // Extract Holland Code from multiple sources (in priority order)
    let hollandCode = riasecResult?.hollandCode || null;

    // Fallback 1: Try assessments.results JSON
    if (!hollandCode) {
      const riasecAssessment = userAssessments.find((a) => a.type === "riasec" && a.status === "completed");
      if (riasecAssessment && riasecAssessment.results) {
        const results = riasecAssessment.results as Record<string, unknown> | null;
        hollandCode = (results?.hollandCode as string) || (results?.results as Record<string, unknown>)?.hollandCode?.[0] as string || null;
      }
    }

    // Fallback 2: Extract from career_matches.matchReason (for demo data)
    if (!hollandCode && matches.length > 0) {
      const matchReason = matches[0].matchReason || "";
      // Look for Holland Code patterns like "Investigative" or "I-A-S"
      const hollandPatterns = [
        { code: "R", names: ["realistic", "practical", "hands-on"] },
        { code: "I", names: ["investigative", "analytical", "research"] },
        { code: "A", names: ["artistic", "creative", "creative expression"] },
        { code: "S", names: ["social", "helping", "teaching"] },
        { code: "E", names: ["enterprising", "leadership", "business"] },
        { code: "C", names: ["conventional", "organized", "detail"] }
      ];

      const found = hollandPatterns.filter(p =>
        matchReason.toLowerCase().includes(p.names[0])
      ).map(p => p.code);

      if (found.length > 0) {
        hollandCode = found.join("") || null;
      }
    }

    // Extract MBTI type from multiple sources (in priority order)
    let mbtiType = (mbtiResult as any)?.personalityType || null;

    // Fallback 1: Try assessments.results JSON
    if (!mbtiType) {
      const mbtiAssessment = userAssessments.find((a) => a.type === "mbti" && a.status === "completed");
      if (mbtiAssessment && mbtiAssessment.results) {
        const results = mbtiAssessment.results as Record<string, unknown> | null;
        mbtiType = (results?.personalityType as string) || (results?.mbtiType as string) || null;
      }
    }

    // Fallback 2: Extract from career_matches.matchReason (for demo data)
    if (!mbtiType && matches.length > 0) {
      const matchReason = matches[0].matchReason || "";
      // Look for MBTI patterns like "INTJ" or "introverted intuitive"
      const mbtiPattern = /\b([INTJ]|[INTJ]{4}|[A-Z]{4})\b/i;
      const mbtiMatch = matchReason.match(mbtiPattern);
      if (mbtiMatch) {
        mbtiType = mbtiMatch[1].toUpperCase();
      }
    }

    // Build context for AI - now includes journal data
    const aiContext: AIContext = {
      userName: userProfile?.name || "Student",
      userRole: userProfile?.role || "student",
      hollandCode,
      mbtiType,
      topCareer: matches[0]?.careerTitle || null,
      careerMatchScore: matches[0]?.matchScore || null,
      completedAssessments: completedAssessments.length,
      // Add journal context for AI
      recentJournalTopics: recentJournals.map((j) => j.title || "").filter(Boolean).join(", "),
      journalEntryCount: journalEntries.length,
      recentMoods: recentJournals.map((j) => j.mood || "").filter(Boolean).join(", "),
    };

    // Convert conversation history format
    interface ChatMessageInput {
      role: string;
      content: string;
    }
    const chatHistory: ChatMessage[] = conversationHistory.map((msg: ChatMessageInput) => ({
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
  },
  [] // No specific role requirement - any authenticated user
);

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
