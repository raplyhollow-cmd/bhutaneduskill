/**
 * AI INTERVIEW COACH API
 *
 * POST /api/ai/interview-coach - Conduct mock interviews for college and job interviews
 *
 * Uses AI to simulate interview sessions, ask relevant questions,
 * provide feedback on answers, and build student confidence.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { chatWithGeminiWithHistory, type ChatMessage } from "@/lib/ai/gemini-server";
import { INTERVIEW_COACH_SYSTEM } from "@/lib/ai/prompts";
import { safeTrackAIInteraction, AI_FEATURE_IDS } from "@/lib/ai/track-interaction";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

export type InterviewType = "college" | "job" | "scholarship";

export interface InterviewCoachRequest {
  interviewType: InterviewType;
  targetInstitution?: string;
  fieldOfStudy?: string;
  position?: string;
  currentQuestionNumber?: number;
  conversationHistory?: InterviewMessage[];
  userAnswer?: string;
  isStart?: boolean;
  isEnd?: boolean;
}

export interface InterviewMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export type QuestionCategory =
  | "introduction"
  | "strengths"
  | "weaknesses"
  | "motivation"
  | "goals"
  | "scenario"
  | "experience"
  | "closing";

export interface InterviewQuestion {
  question: string;
  category: QuestionCategory;
  questionNumber: number;
  tips?: string[];
}

export interface AnswerFeedback {
  whatWentWell: string[];
  howToImprove: string[];
  betterAnswer: string;
  score: number;
}

export interface InterviewSession {
  isComplete: boolean;
  currentQuestion?: InterviewQuestion;
  feedback?: AnswerFeedback;
  summary?: InterviewSummary;
  conversationHistory: InterviewMessage[];
  totalQuestions: number;
}

export interface InterviewSummary {
  overallPerformance: string;
  strengths: string[];
  areasToImprove: string[];
  finalTips: string[];
  recommendedPractice: string[];
}

// ============================================================================
// POST - Conduct Interview Session
// ============================================================================

export async function POST(request: NextRequest) {
  let requestData: Partial<InterviewCoachRequest> = {};
  let userId = "";

  try {
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    userId = authResult.userId;

    const body = await request.json();
    requestData = body as InterviewCoachRequest;

    const {
      interviewType = "college",
      targetInstitution = "",
      fieldOfStudy = "",
      position = "",
      currentQuestionNumber = 0,
      conversationHistory = [],
      userAnswer = "",
      isStart = false,
      isEnd = false,
    } = requestData;

    // Build context for the AI
    const context = buildInterviewContext({
      interviewType,
      targetInstitution,
      fieldOfStudy,
      position,
    });

    // Handle different interview stages
    let session: InterviewSession;

    if (isStart) {
      // Start new interview session
      session = await startInterview(context, conversationHistory);
    } else if (isEnd) {
      // End interview and provide summary
      session = await endInterview(context, conversationHistory);
    } else if (userAnswer) {
      // Process user's answer and provide feedback + next question
      session = await processAnswer(context, userAnswer, currentQuestionNumber, conversationHistory);
    } else {
      // Get next question
      session = await getNextQuestion(context, currentQuestionNumber, conversationHistory);
    }

    logger.info("Interview coach session completed", {
      route: "/api/ai/interview-coach",
      method: "POST",
      userId,
      interviewType,
      questionNumber: currentQuestionNumber,
      isComplete: session.isComplete,
    });

    // Track AI interaction (non-blocking)
    safeTrackAIInteraction({
      userId,
      featureId: AI_FEATURE_IDS.INTERVIEW_COACH,
      interactionData: {
        interviewType: (interviewType as string) ?? "college",
        hasTargetInstitution: !!targetInstitution,
        hasFieldOfStudy: !!fieldOfStudy,
        hasPosition: !!position,
        currentQuestionNumber: (currentQuestionNumber as number) ?? 0,
        isStart: (isStart as boolean) ?? false,
        isEnd: (isEnd as boolean) ?? false,
        isComplete: session.isComplete,
        conversationLength: conversationHistory?.length ?? 0,
      },
      metadata: {
        usedFallback: false,
        responseTimestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      data: session,
      status: 200,
      message: "Interview session processed successfully",
    } satisfies ApiSuccess<InterviewSession>);

  } catch (error: any) {
    logger.apiError(error, {
      route: "/api/ai/interview-coach",
      method: "POST",
    });

    // Check if it's an API key error
    if (error?.message === "Gemini API key not configured") {
      const fallback = generateFallbackSession({
        interviewType: requestData.interviewType || "college",
        targetInstitution: requestData.targetInstitution || "",
        fieldOfStudy: requestData.fieldOfStudy || "",
        position: requestData.position || "",
        currentQuestionNumber: requestData.currentQuestionNumber || 0,
        conversationHistory: requestData.conversationHistory || [],
        userAnswer: requestData.userAnswer || "",
        isStart: requestData.isStart || false,
        isEnd: requestData.isEnd || false,
      });

      // Track fallback usage (non-blocking)
      safeTrackAIInteraction({
        userId,
        featureId: AI_FEATURE_IDS.INTERVIEW_COACH,
        interactionData: {
          interviewType: requestData.interviewType || "college",
          currentQuestionNumber: requestData.currentQuestionNumber || 0,
          fallbackIsComplete: fallback.isComplete,
        },
        metadata: {
          usedFallback: true,
          errorReason: "API key not configured",
          responseTimestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        data: fallback,
        status: 200,
        message: "Using offline interview coach",
      } satisfies ApiSuccess<InterviewSession>);
    }

    return NextResponse.json(
      {
        error: "Failed to process interview session",
        status: 500,
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// INTERVIEW STAGE HANDLERS
// ============================================================================

async function startInterview(
  context: string,
  conversationHistory: InterviewMessage[]
): Promise<InterviewSession> {
  const prompt = `${context}

Start the interview session with a warm welcome and brief explanation of what to expect.
Then ask the first question.

Your response should follow this structure:
1. WELCOME MESSAGE - A friendly greeting and overview
2. FIRST QUESTION - The opening interview question with category

Format your response as:
WELCOME: [Your welcome message]
QUESTION: [First question]
CATEGORY: [question category: introduction/strengths/motivation/goals/scenario/experience/closing]
TIPS: [1-2 brief tips for answering this question]`;

  const response = await chatWithGeminiWithHistory(
    prompt,
    conversationHistory as ChatMessage[],
    INTERVIEW_COACH_SYSTEM
  );

  return parseStartResponse(response, conversationHistory);
}

async function processAnswer(
  context: string,
  userAnswer: string,
  questionNumber: number,
  conversationHistory: InterviewMessage[]
): Promise<InterviewSession> {
  const prompt = `${context}

The student just answered question ${questionNumber}. Their answer was:
"${userAnswer}"

Please:
1. Provide feedback on their answer (what went well, how to improve, better answer suggestion)
2. Give a score (1-10)
3. Ask the next question (unless this was question 5, then provide closing summary)

Format your response as:
FEEDBACK_SCORE: [1-10]
WHAT_WENT_WELL: [2-3 points about what they did well]
HOW_TO_IMPROVE: [2-3 specific suggestions]
BETTER_ANSWER: [A better version of their answer]
NEXT_QUESTION: [Next question] or "END" if this was question 5
CATEGORY: [question category]
TIPS: [1-2 brief tips]

If this was question 5, instead of NEXT_QUESTION, provide:
SUMMARY_OVERALL: [Overall performance assessment]
SUMMARY_STRENGTHS: [2-3 key strengths]
SUMMARY_IMPROVEMENTS: [2-3 areas to improve]
FINAL_TIPS: [2-3 tips for future interviews]
RECOMMENDED_PRACTICE: [What they should practice]`;

  const updatedHistory: ChatMessage[] = [
    ...conversationHistory as ChatMessage[],
    { role: "user", content: userAnswer },
  ];

  const response = await chatWithGeminiWithHistory(
    prompt,
    updatedHistory,
    INTERVIEW_COACH_SYSTEM
  );

  return parseAnswerResponse(response, updatedHistory);
}

async function getNextQuestion(
  context: string,
  questionNumber: number,
  conversationHistory: InterviewMessage[]
): Promise<InterviewSession> {
  const prompt = `${context}

Please provide question ${questionNumber + 1} for this interview.

Format your response as:
QUESTION: [The question]
CATEGORY: [question category]
TIPS: [1-2 brief tips]`;

  const response = await chatWithGeminiWithHistory(
    prompt,
    conversationHistory as ChatMessage[],
    INTERVIEW_COACH_SYSTEM
  );

  return parseQuestionResponse(response, conversationHistory);
}

async function endInterview(
  context: string,
  conversationHistory: InterviewMessage[]
): Promise<InterviewSession> {
  const prompt = `${context}

The interview session is complete. Please provide a final summary of the student's performance
based on our conversation.

Format your response as:
SUMMARY_OVERALL: [Overall performance assessment]
SUMMARY_STRENGTHS: [2-3 key strengths demonstrated]
SUMMARY_IMPROVEMENTS: [2-3 areas that need work]
FINAL_TIPS: [2-3 tips for their actual interview]
RECOMMENDED_PRACTICE: [What they should practice before the real interview]`;

  const response = await chatWithGeminiWithHistory(
    prompt,
    conversationHistory as ChatMessage[],
    INTERVIEW_COACH_SYSTEM
  );

  return parseSummaryResponse(response, conversationHistory);
}

// ============================================================================
// RESPONSE PARSERS
// ============================================================================

function parseStartResponse(
  aiResponse: string,
  conversationHistory: InterviewMessage[]
): InterviewSession {
  const welcomeMatch = aiResponse.match(/WELCOME[:：]\s*([\s\S]*?)(?:\nQUESTION|\nCATEGORY|$)/i);
  const questionMatch = aiResponse.match(/QUESTION[:：]\s*([\s\S]*?)(?:\nCATEGORY|\nTIPS|$)/i);
  const categoryMatch = aiResponse.match(/CATEGORY[:：]\s*([a-z]+)/i);
  const tipsMatch = aiResponse.match(/TIPS[:：]\s*([\s\S]*?)(?:$)/i);

  const question = questionMatch?.[1]?.trim() || getDefaultQuestion(1);
  const categoryStr = categoryMatch?.[1]?.trim() || "introduction";

  // Add welcome message to conversation history
  const welcomeMessage = welcomeMatch?.[1]?.trim() ||
    "Welcome to your interview practice session! I'll ask you a few questions and provide feedback to help you improve. Let's get started!";

  return {
    isComplete: false,
    currentQuestion: {
      question,
      category: categoryStr as QuestionCategory,
      questionNumber: 1,
      tips: parseTips(tipsMatch?.[1]),
    },
    conversationHistory: [
      ...conversationHistory,
      {
        role: "assistant",
        content: `${welcomeMessage}\n\n${question}`,
        timestamp: new Date().toISOString(),
      },
    ],
    totalQuestions: 5,
  };
}

function parseAnswerResponse(
  aiResponse: string,
  conversationHistory: ChatMessage[]
): InterviewSession {
  const scoreMatch = aiResponse.match(/FEEDBACK_SCORE[:：]\s*(\d+)/i);
  const wentWellMatch = aiResponse.match(/WHAT_WENT_WELL[:：]\s*([\s\S]*?)(?:\nHOW_TO_IMPROVE|\nBETTER_ANSWER|$)/i);
  const improveMatch = aiResponse.match(/HOW_TO_IMPROVE[:：]\s*([\s\S]*?)(?:\nBETTER_ANSWER|\nNEXT_QUESTION|$)/i);
  const betterAnswerMatch = aiResponse.match(/BETTER_ANSWER[:：]\s*([\s\S]*?)(?:\nNEXT_QUESTION|\nSUMMARY_OVERALL|$)/i);
  const nextQuestionMatch = aiResponse.match(/NEXT_QUESTION[:：]\s*([\s\S]*?)(?:\nCATEGORY|\nTIPS|\nSUMMARY_OVERALL|$)/i);
  const categoryMatch = aiResponse.match(/CATEGORY[:：]\s*([a-z]+)/i);
  const tipsMatch = aiResponse.match(/TIPS[:：]\s*([\s\S]*?)(?:$|SUMMARY_OVERALL)/i);

  // Check if interview is ending
  const isEnd = aiResponse.includes("SUMMARY_OVERALL") || nextQuestionMatch?.[1]?.trim().toUpperCase() === "END";

  if (isEnd) {
    // Parse summary instead
    return parseSummaryFromResponse(aiResponse, conversationHistory);
  }

  const feedback: AnswerFeedback = {
    whatWentWell: parseBulletPoints(wentWellMatch?.[1] || ""),
    howToImprove: parseBulletPoints(improveMatch?.[1] || ""),
    betterAnswer: betterAnswerMatch?.[1]?.trim() || "Good answer! Try to be more specific with examples.",
    score: parseInt(scoreMatch?.[1] || "7", 10),
  };

  const nextQuestion = nextQuestionMatch?.[1]?.trim() || getDefaultQuestion(conversationHistory.length);
  const categoryStr = categoryMatch?.[1]?.trim() || "goals";

  return {
    isComplete: false,
    currentQuestion: {
      question: nextQuestion,
      category: categoryStr as QuestionCategory,
      questionNumber: Math.ceil(conversationHistory.length / 2) + 1,
      tips: parseTips(tipsMatch?.[1]),
    },
    feedback,
    conversationHistory: conversationHistory.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    totalQuestions: 5,
  };
}

function parseQuestionResponse(
  aiResponse: string,
  conversationHistory: InterviewMessage[]
): InterviewSession {
  const questionMatch = aiResponse.match(/QUESTION[:：]\s*([\s\S]*?)(?:\nCATEGORY|\nTIPS|$)/i);
  const categoryMatch = aiResponse.match(/CATEGORY[:：]\s*([a-z]+)/i);
  const tipsMatch = aiResponse.match(/TIPS[:：]\s*([\s\S]*?)(?:$)/i);

  const question = questionMatch?.[1]?.trim() || getDefaultQuestion(conversationHistory.length + 1);
  const categoryStr = categoryMatch?.[1]?.trim() || "strengths";

  return {
    isComplete: false,
    currentQuestion: {
      question,
      category: categoryStr as QuestionCategory,
      questionNumber: Math.ceil(conversationHistory.length / 2) + 1,
      tips: parseTips(tipsMatch?.[1]),
    },
    conversationHistory,
    totalQuestions: 5,
  };
}

function parseSummaryResponse(
  aiResponse: string,
  conversationHistory: InterviewMessage[]
): InterviewSession {
  return parseSummaryFromResponse(aiResponse, conversationHistory);
}

function parseSummaryFromResponse(
  aiResponse: string,
  conversationHistory: ChatMessage[]
): InterviewSession {
  const overallMatch = aiResponse.match(/SUMMARY_OVERALL[:：]\s*([\s\S]*?)(?:\nSUMMARY_STRENGTHS|\nSUMMARY_IMPROVEMENTS|$)/i);
  const strengthsMatch = aiResponse.match(/SUMMARY_STRENGTHS[:：]\s*([\s\S]*?)(?:\nSUMMARY_IMPROVEMENTS|\nFINAL_TIPS|$)/i);
  const improvementsMatch = aiResponse.match(/SUMMARY_IMPROVEMENTS[:：]\s*([\s\S]*?)(?:\nFINAL_TIPS|\nRECOMMENDED_PRACTICE|$)/i);
  const tipsMatch = aiResponse.match(/FINAL_TIPS[:：]\s*([\s\S]*?)(?:\nRECOMMENDED_PRACTICE|$)/i);
  const practiceMatch = aiResponse.match(/RECOMMENDED_PRACTICE[:：]\s*([\s\S]*?)(?:$)/i);

  const summary: InterviewSummary = {
    overallPerformance: overallMatch?.[1]?.trim() || "You did a great job practicing today!",
    strengths: parseBulletPoints(strengthsMatch?.[1] || ""),
    areasToImprove: parseBulletPoints(improvementsMatch?.[1] || ""),
    finalTips: parseBulletPoints(tipsMatch?.[1] || ""),
    recommendedPractice: parseBulletPoints(practiceMatch?.[1] || ""),
  };

  return {
    isComplete: true,
    summary,
    conversationHistory: conversationHistory.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    totalQuestions: 5,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildInterviewContext(data: {
  interviewType: InterviewType;
  targetInstitution: string;
  fieldOfStudy: string;
  position: string;
}): string {
  const parts: string[] = [];

  parts.push(`**Interview Type:** ${data.interviewType}`);

  if (data.interviewType === "college" && data.targetInstitution) {
    parts.push(`**Target College:** ${data.targetInstitution}`);
    if (data.fieldOfStudy) {
      parts.push(`**Field of Study:** ${data.fieldOfStudy}`);
    }
  }

  if (data.interviewType === "job" && data.position) {
    parts.push(`**Target Position:** ${data.position}`);
    if (data.targetInstitution) {
      parts.push(`**Company:** ${data.targetInstitution}`);
    }
  }

  if (data.interviewType === "scholarship" && data.targetInstitution) {
    parts.push(`**Scholarship:** ${data.targetInstitution}`);
    if (data.fieldOfStudy) {
      parts.push(`**Field of Study:** ${data.fieldOfStudy}`);
    }
  }

  parts.push("\nThis is a practice interview session for a Bhutanese student.");
  parts.push("Ask 5 questions total, providing feedback after each answer.");
  parts.push("Be encouraging and constructive in your feedback.");

  return parts.join("\n");
}

function parseBulletPoints(text: string): string[] {
  if (!text) return [];

  return text
    .split(/[\n\u2022\u25E6\u25CB\-\*]/)
    .map(s => s.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter(s => s.length > 0 && s.length < 200)
    .slice(0, 5);
}

function parseTips(text: string | undefined): string[] | undefined {
  if (!text) return undefined;
  const tips = parseBulletPoints(text);
  return tips.length > 0 ? tips : undefined;
}

function getDefaultQuestion(questionNumber: number): string {
  const questions = [
    "Tell me about yourself and why you're interested in this opportunity.",
    "What do you consider to be your greatest strengths?",
    "What is a challenge you've faced, and how did you overcome it?",
    "Where do you see yourself in 5 years?",
    "Do you have any questions for us?",
  ];

  return questions[Math.min(questionNumber - 1, questions.length - 1)];
}

// ============================================================================
// FALLBACK SESSION (when AI is unavailable)
// ============================================================================

function generateFallbackSession(data: InterviewCoachRequest): InterviewSession {
  const { isStart = false, currentQuestionNumber = 1, conversationHistory = [] } = data;

  if (isStart) {
    return {
      isComplete: false,
      currentQuestion: {
        question: "Tell me about yourself and why you're interested in this opportunity.",
        category: "introduction",
        questionNumber: 1,
        tips: ["Be concise and relevant", "Connect your background to this opportunity"],
      },
      conversationHistory: [
        {
          role: "assistant",
          content: "Welcome to your interview practice! I'll ask you 5 questions and provide feedback after each answer. Let's begin!",
          timestamp: new Date().toISOString(),
        },
      ],
      totalQuestions: 5,
    };
  }

  if (currentQuestionNumber >= 5) {
    return {
      isComplete: true,
      summary: {
        overallPerformance: "Great job completing this practice session! You've taken an important step in preparing for your interview.",
        strengths: [
          "You completed all 5 practice questions",
          "You're taking initiative to prepare",
          "Practice is the best way to improve",
        ],
        areasToImprove: [
          "Try to be more specific with examples",
          "Use the STAR method (Situation, Task, Action, Result)",
          "Research more about the institution/company",
        ],
        finalTips: [
          "Practice aloud, not just in your head",
          "Record yourself to identify nervous habits",
          "Prepare questions to ask the interviewer",
        ],
        recommendedPractice: [
          "Do at least 3 practice sessions before your actual interview",
          "Research common interview questions for your field",
          "Practice with a friend or mentor",
        ],
      },
      conversationHistory,
      totalQuestions: 5,
    };
  }

  const questions: Record<number, { question: string; category: QuestionCategory }> = {
    1: { question: "Tell me about yourself.", category: "introduction" },
    2: { question: "What are your greatest strengths?", category: "strengths" },
    3: { question: "Describe a challenge you've overcome.", category: "scenario" },
    4: { question: "What are your career goals?", category: "goals" },
    5: { question: "Why should we select you?", category: "closing" },
  };

  const q = questions[currentQuestionNumber] || questions[1];

  return {
    isComplete: false,
    currentQuestion: {
      question: q.question,
      category: q.category,
      questionNumber: currentQuestionNumber,
      tips: ["Be honest and specific", "Use examples from your experience"],
    },
    conversationHistory,
    totalQuestions: 5,
  };
}

// ============================================================================
// GET - Check availability
// ============================================================================

export async function GET() {
  return NextResponse.json({
    available: true,
    feature: "AI Interview Coach",
    description: "Practice mock interviews for college admissions, job interviews, and scholarship applications",
    requiresAuth: true,
    interviewTypes: ["college", "job", "scholarship"],
    sessionLength: 5,
  });
}
