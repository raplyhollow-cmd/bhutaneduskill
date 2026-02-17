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
import { desc } from "drizzle-orm";
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

    // Get user profile for personalization
    const userProfile = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    // Get assessment results for context
    const riasecResult = await db.query.riasecResults.findFirst({
      where: eq(riasecResults.userId, userId),
      orderBy: desc(riasecResults.createdAt),
    });

    const mbtiResult = await db.query.mbtiResults.findFirst({
      where: eq(mbtiResults.userId, userId),
      orderBy: desc(mbtiResults.createdAt),
    });

    // Get career matches (via assessments)
    const userAssessments = await db.query.assessments.findMany({
      where: eq(assessments.userId, userId),
    });
    const assessmentIds = userAssessments.map(a => a.id);

    const matches = assessmentIds.length > 0
      ? await db.query.careerMatches.findMany({
          where: eq(careerMatches.assessmentId, assessmentIds[0]),
          with: { career: true },
          orderBy: desc(careerMatches.matchScore),
          limit: 5,
        })
      : [];

    // Get career plan if exists
    const careerPlan = await db.query.careerPlans.findFirst({
      where: eq(careerPlans.userId, userId),
    });

    // Get completed assessments count
    const allAssessments = await db.query.assessments.findMany({
      where: eq(assessments.userId, userId),
    });
    const completedAssessments = allAssessments.filter((a) => a.status === "completed");

    // Build context for AI
    const aiContext: AIContext = {
      userName: userProfile?.name || "Student",
      userRole: userProfile?.role || "student",
      hollandCode: riasecResult?.hollandCode || null,
      mbtiType: (mbtiResult as any)?.personalityType || null,
      topCareer: (matches[0] as any)?.career?.name || null,
      careerMatchScore: matches[0]?.matchScore || null,
      completedAssessments: completedAssessments.length,
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
    console.error("AI Career Coach error:", error);

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
