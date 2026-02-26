/**
 * AI CAREER COACH API
 *
 * POST /api/student/career-coach - Chat with AI Career Coach
 * GET /api/student/career-coach - Get conversation history
 *
 * Uses Google Gemini API to provide personalized career guidance
 * for Bhutanese students based on their assessment results.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, riasecResults, mbtiResults, workValuesResults, assessmentSubmissions } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {
  chatWithCareerCoachFromServer,
  type ChatMessage,
  type AIContext,
} from "@/lib/ai/gemini-server";

// ============================================================================
// TYPES
// ============================================================================

interface CareerCoachRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  saveConversation?: boolean;
}

interface CareerCoachResponse {
  success: boolean;
  data?: {
    message: string;
    suggestions?: string[];
    resources?: Array<{
      type: "article" | "video" | "assessment" | "career";
      title: string;
      url: string;
    }>;
    conversationId?: string;
  };
  error?: string;
  fallback?: boolean;
}

// ============================================================================
// GET /api/student/career-coach - Get conversation history and context
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["student"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    const { userId } = authResult;

    // Get user profile
    const userProfiles = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        classGrade: users.classGrade,
        settings: users.settings,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userProfiles.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userProfiles[0];
    const settings = (user.settings as any) || {};
    const careerConversations = settings.careerConversations || [];

    // Get latest assessment results for context
    const [riasecResult, mbtiResult, workValuesResult] = await Promise.all([
      db
        .select()
        .from(riasecResults)
        .where(eq(riasecResults.userId, userId))
        .orderBy(desc(riasecResults.createdAt))
        .limit(1),
      db
        .select()
        .from(mbtiResults)
        .where(eq(mbtiResults.userId, userId))
        .orderBy(desc(mbtiResults.createdAt))
        .limit(1),
      db
        .select()
        .from(workValuesResults)
        .where(eq(workValuesResults.userId, userId))
        .orderBy(desc(workValuesResults.createdAt))
        .limit(1),
    ]);

    // Get completed assessment count
    const completedAssessments = await db
      .select({ id: assessmentSubmissions.id })
      .from(assessmentSubmissions)
      .where(
        and(eq(assessmentSubmissions.userId, userId), eq(assessmentSubmissions.status, "completed"))
      );

    return NextResponse.json({
      success: true,
      data: {
        conversationHistory: careerConversations,
        context: {
          userName: `${user.firstName} ${user.lastName}`.trim(),
          userRole: "student",
          classGrade: user.classGrade,
          hollandCode: riasecResult[0]?.hollandCode || null,
          mbtiType: mbtiResult[0]?.personalityType || null,
          completedAssessments: completedAssessments.length,
        },
      },
    });
  } catch (error) {
    logger.error(error, { route: "/api/student/career-coach", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch career coach data" }, { status: 500 });
  }
}

// ============================================================================
// POST /api/student/career-coach - Send message to AI Career Coach
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["student"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    const { userId } = authResult;

    const body: CareerCoachRequest = await req.json();
    const { message, conversationHistory = [], saveConversation = true } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Rate limiting check (max 20 messages per hour)
    const userProfiles = await db
      .select({
        settings: users.settings,
        firstName: users.firstName,
        classGrade: users.classGrade,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userProfiles.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userProfiles[0];
    const settings = (user.settings as any) || {};
    const careerCoachData = settings.careerCoach || {};
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    // Clean old message counts
    const recentMessages = (careerCoachData.messageTimestamps || []).filter(
      (ts: number) => ts > hourAgo
    );

    if (recentMessages.length >= 20) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before sending more messages.",
          retryAfter: Math.ceil((recentMessages[0] - hourAgo) / 1000),
        },
        { status: 429 }
      );
    }

    // Get latest assessment results for AI context
    const [riasecResult, mbtiResult, workValuesResult, assessmentCount] = await Promise.all([
      db
        .select()
        .from(riasecResults)
        .where(eq(riasecResults.userId, userId))
        .orderBy(desc(riasecResults.createdAt))
        .limit(1),
      db
        .select()
        .from(mbtiResults)
        .where(eq(mbtiResults.userId, userId))
        .orderBy(desc(mbtiResults.createdAt))
        .limit(1),
      db
        .select()
        .from(workValuesResults)
        .where(eq(workValuesResults.userId, userId))
        .orderBy(desc(workValuesResults.createdAt))
        .limit(1),
      db
        .select({ id: assessmentSubmissions.id })
        .from(assessmentSubmissions)
        .where(
          and(eq(assessmentSubmissions.userId, userId), eq(assessmentSubmissions.status, "completed"))
        ),
    ]);

    // Get top career match if available
    const topCareer = settings.topCareer?.title || null;
    const topCareerScore = settings.topCareer?.score || null;

    // Build AI context
    const aiContext: AIContext = {
      userName: user.firstName,
      userRole: "student",
      hollandCode: riasecResult[0]?.hollandCode || null,
      mbtiType: mbtiResult[0]?.personalityType || null,
      topCareer,
      careerMatchScore: topCareerScore,
      completedAssessments: assessmentCount.length,
    };

    // Call Gemini AI
    logger.info("Calling AI Career Coach", { userId, messageLength: message.length });

    const aiResponse = await chatWithCareerCoachFromServer(message, aiContext, conversationHistory);

    // Update message timestamp for rate limiting
    recentMessages.push(now);
    const updatedSettings = {
      ...settings,
      careerCoach: {
        ...careerCoachData,
        messageTimestamps: recentMessages,
      },
    };

    // Save conversation if requested
    let updatedConversationHistory = conversationHistory;
    if (saveConversation) {
      const newHistory: ChatMessage[] = [
        ...conversationHistory,
        { role: "user", content: message },
        { role: "assistant", content: aiResponse.message },
      ];

      // Keep only last 20 messages
      updatedConversationHistory = newHistory.slice(-20);

      updatedSettings.careerConversations = updatedConversationHistory;
    }

    // Save updated settings
    await db
      .update(users)
      .set({
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    const response: CareerCoachResponse = {
      success: true,
      data: {
        message: aiResponse.message,
        suggestions: aiResponse.suggestions,
        resources: aiResponse.resources,
      },
      fallback: aiResponse.fallback,
    };

    logger.info("AI Career Coach response sent", {
      userId,
      responseLength: aiResponse.message.length,
      isFallback: aiResponse.fallback,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error(error, { route: "/api/student/career-coach", method: "POST" });
    return NextResponse.json(
      { error: "Failed to get career coach response. Please try again." },
      { status: 500 }
    );
  }
}
