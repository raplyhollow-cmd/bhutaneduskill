/**
 * AI CAREER COACH API
 *
 * POST /api/ai/career-coach - Chat with AI Career Coach
 *
 * This is the core AI feature that makes the platform tempting to use.
 * Now integrated with Google Gemini API for intelligent responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/db/tenant";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, riasecResults, mbtiResults, careerMatches, assessments, careerPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { chatWithCareerCoach, type ChatMessage } from "@/lib/ai/gemini";
import {
  extractCareerInterests,
  extractConcerns,
} from "@/lib/ai-features";

// ============================================================================
// INTERACTION TRACKING
// ============================================================================

async function trackInteraction(userId: string, featureId: string, interactionData: unknown) {
  // Store interaction for analytics and data insights
  // In production, this would save to an interactions table
  console.log(`[AI Interaction] User: ${userId}, Feature: ${featureId}`, interactionData);
}

// ============================================================================
// POST - Chat with AI Career Coach
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get user profile for personalization
    const userProfile = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    // Get assessment results for context
    const riasecResult = await db.query.riasecResults.findFirst({
      where: eq(riasecResults.userId, user.id),
      orderBy: desc(riasecResults.createdAt),
    });

    const mbtiResult = await db.query.mbtiResults.findFirst({
      where: eq(mbtiResults.userId, user.id),
      orderBy: desc(mbtiResults.createdAt),
    });

    // Get career matches (via assessments)
    const userAssessments = await db.query.assessments.findMany({
      where: eq(assessments.userId, user.id),
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
      where: eq(careerPlans.userId, user.id),
    });

    // Get completed assessments count
    const allAssessments = await db.query.assessments.findMany({
      where: eq(assessments.userId, user.id),
    });
    const completedAssessments = allAssessments.filter((a) => a.status === "completed");

    // Build context for AI
    const aiContext = {
      userName: userProfile?.name || "Student",
      userRole: userProfile?.role || "student",
      hollandCode: riasecResult?.hollandCode || null,
      mbtiType: mbtiResult?.mbtiType || null,
      topCareer: matches[0]?.career?.name || null,
      careerMatchScore: matches[0]?.matchScore || null,
      completedAssessments: completedAssessments.length,
    };

    // Convert conversation history format
    const chatHistory: ChatMessage[] = conversationHistory.map((msg: any) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Call Gemini AI for intelligent response
    const aiResponse = await chatWithCareerCoach(
      message,
      aiContext,
      chatHistory
    );

    // Extract data insights from the message
    const interests = extractCareerInterests(message);
    const concerns = extractConcerns(message);
    const mentionedCareers = extractCareerNames(message);

    // Track interaction for data insights
    await trackInteraction(user.id, "ai-career-coach", {
      message,
      responseLength: aiResponse.message.length,
      hasSuggestions: aiResponse.suggestions?.length > 0,
      hasResources: aiResponse.resources?.length > 0,
      usedFallback: aiResponse.fallback || false,
      interests,
      concerns,
      mentionedCareers,
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
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("AI Career Coach error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
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
