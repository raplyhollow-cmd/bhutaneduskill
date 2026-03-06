/**
 * AI INTERVIEW COACH API
 *
 * Features:
 * - RUB-specific interview questions
 * - Mock interview practice
 * - Feedback on responses
 * - Common questions by program
 *
 * Last Updated: March 5, 2026
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";

async function callGemini(prompt: string, context?: Record<string, any>) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const systemPrompt = `You are an Interview Coach for Bhutanese students applying to RUB colleges, scholarships, and jobs. Provide constructive, specific feedback.`;

  const enhancedPrompt = context
    ? `${systemPrompt}\n\nCONTEXT:\n${JSON.stringify(context)}\n\nQUERY:\n${prompt}`
    : `${systemPrompt}\n\nQUERY:\n${prompt}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: enhancedPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
    }),
  });

  if (!response.ok) throw new Error(`Gemini API error: ${await response.text()}`);

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ============================================================================
// RUB-SPECIFIC QUESTIONS DATABASE
// ============================================================================

const rubQuestionsByField: Record<string, any[]> = {
  "engineering": [
    { id: "eng-1", question: "Why do you want to study engineering?", category: "introduction", tips: ["Be specific about branch choice"] },
    { id: "eng-2", question: "Describe a challenging problem you solved.", category: "technical", tips: ["Use STAR method"] },
  ],
  "computer-science": [
    { id: "cs-1", question: "Tell me about a programming project.", category: "technical", tips: ["Show your learning process"] },
  ],
  "business": [
    { id: "biz-1", question: "Why business studies?", category: "introduction", tips: ["Connect to Bhutan's economy"] },
  ],
  "general": [
    { id: "gen-1", question: "Tell me about yourself.", category: "introduction", tips: ["Keep it relevant"] },
    { id: "gen-2", question: "What are your strengths and weaknesses?", category: "behavioral", tips: ["Be honest"] },
  ],
};

const activeSessions = new Map<string, any>();

// ============================================================================
// API HANDLERS
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, ...params } = body;

    let result;

    switch (action) {
      case "start-mock": {
        const sessionId = `${userId}-${Date.now()}`;
        const field = params.targetProgram?.field || "general";
        const questions = [...(rubQuestionsByField[field.toLowerCase()] || []), ...rubQuestionsByField["general"]].slice(0, 5);
        
        activeSessions.set(sessionId, { sessionId, questions, answers: [], currentIndex: 0, context: params });
        
        result = { sessionId, firstQuestion: questions[0], totalQuestions: questions.length };
        break;
      }

      case "submit-answer": {
        const session = activeSessions.get(params.sessionId);
        if (!session) throw new Error("Session not found");
        
        const feedbackPrompt = `Evaluate this answer. Question: ${session.questions[session.currentIndex].question}\nAnswer: "${params.answer}"\nProvide: Strengths, Improvements, Rating (1-5), Suggested revision`;
        const aiFeedback = await callGemini(feedbackPrompt, session.context);
        
        session.answers.push({ questionId: params.questionId, answer: params.answer, feedback: aiFeedback });
        session.currentIndex++;
        
        const interviewComplete = session.currentIndex >= session.questions.length;
        const nextQuestion = interviewComplete ? null : session.questions[session.currentIndex];
        
        if (interviewComplete) session.status = "completed";
        activeSessions.set(params.sessionId, session);
        
        result = { feedback: aiFeedback, nextQuestion, interviewComplete };
        break;
      }

      case "get-questions": {
        const field = params.field?.toLowerCase() || "general";
        result = { questions: rubQuestionsByField[field] || rubQuestionsByField["general"] };
        break;
      }

      case "feedback": {
        const feedbackPrompt = `Evaluate: ${params.question}\nAnswer: "${params.answer}"\nProvide feedback and rating (1-5)`;
        result = { feedback: await callGemini(feedbackPrompt) };
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, action, result });
  } catch (error) {
    console.error("Interview Coach error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const field = searchParams.get("field") || "general";
    
    return NextResponse.json({
      success: true,
      questions: rubQuestionsByField[field.toLowerCase()] || rubQuestionsByField["general"],
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get questions" }, { status: 500 });
  }
}
