/**
 * STUDENT CAREER COACH API
 *
 * POST /api/student/career-coach - Chat with AI Career Coach
 *
 * This is the student-facing endpoint that routes to the AI career coach.
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { chatWithCareerCoachFromServer, type ChatMessage, type AIContext } from "@/lib/ai/gemini-server";
import { db } from "@/lib/db";
import { users, riasecResults, mbtiResults, careerMatches, assessments, careerPlans } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

// ============================================================================
// POST - Chat with AI Career Coach
// ============================================================================

export const POST = createApiRoute(
  async (request, { userId }) => {
    const body = await request.json();
    const { message, conversationHistory = [], saveConversation = false } = body;

    if (!message || typeof message !== "string") {
      return { error: "Message is required" };
    }

    // Get user profile
    const userProfile = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0] || null);

    // Get RIASEC result
    const riasecResult = await db
      .select()
      .from(riasecResults)
      .where(eq(riasecResults.userId, userId))
      .orderBy(desc(riasecResults.createdAt))
      .limit(1)
      .then(rows => rows[0] || null);

    // Get MBTI result
    const mbtiResult = await db
      .select()
      .from(mbtiResults)
      .where(eq(mbtiResults.userId, userId))
      .orderBy(desc(mbtiResults.createdAt))
      .limit(1)
      .then(rows => rows[0] || null);

    // Get assessments
    const userAssessments = await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, userId));

    // Get career matches
    const assessmentIds = userAssessments.map(a => a.id);
    let matches: typeof careerMatches.$inferSelect[] = [];
    if (assessmentIds.length > 0) {
      matches = await db
        .select()
        .from(careerMatches)
        .where(inArray(careerMatches.assessmentId, assessmentIds))
        .orderBy(desc(careerMatches.matchScore))
        .limit(10);
    }

    // Get career plan
    const careerPlan = await db
      .select()
      .from(careerPlans)
      .where(eq(careerPlans.userId, userId))
      .limit(1)
      .then(rows => rows[0] || null);

    // Get journal entries from user settings
    interface UserSettings {
      journalEntries?: Array<{ date: string; title?: string; mood?: string; entry: string }>;
    }
    const settings = (userProfile?.settings as UserSettings | null) || {};
    const journalEntries = settings.journalEntries || [];

    // Get recent journal entries (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentJournals = journalEntries
      .filter((e: { date: string }) => new Date(e.date) >= weekAgo)
      .slice(-5);

    const completedAssessments = userAssessments.filter((a) => a.status === "completed");

    // Build AI context
    const aiContext: AIContext = {
      userName: userProfile?.name || "Student",
      userRole: userProfile?.role || "student",
      hollandCode: riasecResult?.hollandCode || null,
      mbtiType: mbtiResult?.personalityType || null,
      topCareer: matches[0]?.careerTitle || null,
      careerMatchScore: matches[0]?.matchScore || null,
      completedAssessments: completedAssessments.length,
      recentJournalTopics: recentJournals.map((j) => j.title || "").filter(Boolean).join(", "),
      journalEntryCount: journalEntries.length,
      recentMoods: recentJournals.map((j) => j.mood || "").filter(Boolean).join(", "),
    };

    // Format conversation history
    const chatHistory: ChatMessage[] = conversationHistory.map((msg: any) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Call AI
    const aiResponse = await chatWithCareerCoachFromServer(
      message,
      aiContext,
      chatHistory
    );

    return {
      success: true,
      data: {
        ...aiResponse,
        context: aiContext,
        conversationHistory: saveConversation
          ? [...conversationHistory, { role: "user", content: message }, { role: "assistant", content: aiResponse.message }]
          : undefined,
      },
    };
  },
  ["student"]
);

// ============================================================================
// GET - Check availability and load context
// ============================================================================

export const GET = createApiRoute(
  async (_request, { userId }) => {
    // Get user profile for context
    const userProfile = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0] || null);

    // Get assessment counts
    const userAssessments = await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, userId));

    const riasecResult = await db
      .select()
      .from(riasecResults)
      .where(eq(riasecResults.userId, userId))
      .orderBy(desc(riasecResults.createdAt))
      .limit(1)
      .then(rows => rows[0] || null);

    const mbtiResult = await db
      .select()
      .from(mbtiResults)
      .where(eq(mbtiResults.userId, userId))
      .orderBy(desc(mbtiResults.createdAt))
      .limit(1)
      .then(rows => rows[0] || null);

    const completedAssessments = userAssessments.filter((a) => a.status === "completed");

    const context = {
      userName: userProfile?.name || "Student",
      userRole: userProfile?.role || "student",
      hollandCode: riasecResult?.hollandCode || null,
      mbtiType: mbtiResult?.personalityType || null,
      completedAssessments: completedAssessments.length,
    };

    return {
      success: true,
      data: {
        available: true,
        context,
        conversationHistory: [],
      },
    };
  },
  ["student"]
);
