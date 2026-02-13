/**
 * AI Career Predictor API
 * Predicts career success probability based on assessment results
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { chatWithCareerCoach, type AIContext } from "@/lib/ai/gemini";
import { db } from "@/lib/db";
import { users, assessments, careerMatches, careers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, firstName: true, type: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's assessment results
    const userAssessments = await db.query.assessments.findMany({
      where: eq(assessments.userId, currentUser.id),
      columns: { id: true, assessmentTypeId: true, completedAt: true },
    });

    // Get assessment IDs
    const assessmentIds = userAssessments.map((a) => a.id);

    // Get career matches through assessments
    const userCareers = await db.query.careerMatches.findMany({
      where: sql`${careerMatches.assessmentId} IN ${sql.placeholder("assessmentIds")}`,
      with: {
        career: true,
      },
      limit: 5,
    });

    // Build AI context
    const aiContext: AIContext = {
      userName: currentUser.firstName,
      userRole: currentUser.type ?? "student",
      topCareer: userCareers[0]?.careerTitle ?? undefined,
      careerMatchScore: userCareers[0]?.matchScore ?? undefined,
      completedAssessments: userAssessments.length,
    };

    // Parse assessment results for context
    const riasecResult = (userAssessments.find((a) => a.assessmentTypeId === "riasec") as any)?.results;
    const mbtiResult = (userAssessments.find((a) => a.assessmentTypeId === "mbti") as any)?.results;

    if (riasecResult) {
      try {
        const parsed = JSON.parse(riasecResult as string);
        aiContext.hollandCode = (parsed as { code?: string }).code;
      } catch {
        // Skip if parse fails
      }
    }

    if (mbtiResult) {
      try {
        const parsed = JSON.parse(mbtiResult as string);
        aiContext.mbtiType = (parsed as { type?: string }).type;
      } catch {
        // Skip if parse fails
      }
    }

    // Create prompt for career prediction
    const prompt = `Based on the following student profile, predict their top 3 career matches with success probability:

Student: ${currentUser.firstName}
- RIASEC Code: ${aiContext.hollandCode ?? "Not taken"}
- MBTI Type: ${aiContext.mbtiType ?? "Not taken"}
- Top Career Match: ${aiContext.topCareer ?? "None"}
- Match Score: ${aiContext.careerMatchScore ?? 0}%

For each career prediction, provide:
1. Career name
2. Success probability percentage
3. Why it fits (2-3 sentences)
4. Key skills needed

Format as JSON with this structure:
{
  "predictions": [
    {
      "career": "Software Engineer",
      "probability": 85,
      "reason": "Your analytical thinking...",
      "skills": ["Programming", "Problem Solving"]
    }
  ],
  "summary": "Brief summary paragraph"
}`;

    // Call Gemini with custom prompt
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3003"}/api/ai/career-coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: prompt,
        conversationHistory: [],
      }),
    });

    if (!response.ok) {
      throw new Error("AI service unavailable");
    }

    const data = await response.json();

    // Return formatted response
    return NextResponse.json({
      predictions: userCareers.slice(0, 3).map((c, index) => ({
        career: (c.career as any)?.title ?? "Career",
        probability: c.matchScore ?? 70 - index * 10,
        reason: `Based on your assessment results, this career aligns well with your personality traits.`,
        skills: ["Communication", "Problem Solving", "Analytical Thinking"],
      })),
      aiInsight: data.message ?? "",
      summary: `${currentUser.firstName}, based on your assessments, you have strong potential in ${(userCareers[0]?.career as any)?.title ?? "your chosen field"}.`,
    });

  } catch (error) {
    console.error("[CareerPredictor] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate career prediction",
        predictions: [],
        summary: "Unable to generate AI insights at this time.",
      },
      { status: 500 }
    );
  }
}
