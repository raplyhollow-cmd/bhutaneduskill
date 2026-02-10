/**
 * AI CAREER COACH API
 *
 * POST /api/ai/career-coach - Chat with AI Career Coach
 *
 * This is the core AI feature that makes the platform tempting to use.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/db/tenant";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, riasecResults, mbtiResults, careerMatches, assessments, careerPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  generateCareerCoachResponse,
  extractCareerInterests,
  extractConcerns,
} from "@/lib/ai-features";

// ============================================================================
// INTERACTION TRACKING
// ============================================================================

async function trackInteraction(userId: string, featureId: string, interactionData: any) {
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

    // Generate response using the AI features module
    const aiResponse = await generateCoachResponse({
      message,
      userName: userProfile?.name || "Student",
      userProfile,
      riasecResult,
      mbtiResult,
      careerMatches: matches,
      careerPlan,
      completedAssessments: completedAssessments.length,
      conversationHistory,
    });

    // Track interaction for data insights
    await trackInteraction(user.id, "ai-career-coach", {
      message,
      responseLength: aiResponse.message.length,
      hasSuggestions: aiResponse.suggestions?.length > 0,
      interests: aiResponse.dataCaptured?.interests || [],
      concerns: aiResponse.dataCaptured?.concerns || [],
    });

    return NextResponse.json(aiResponse);

  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("AI Career Coach error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}

// ============================================================================
// RESPONSE GENERATOR
// ============================================================================

interface CoachContext {
  message: string;
  userName: string;
  userProfile: any;
  riasecResult: any;
  mbtiResult: any;
  careerMatches: any[];
  careerPlan: any;
  completedAssessments: number;
  conversationHistory: any[];
}

async function generateCoachResponse(context: CoachContext) {
  const {
    message,
    userName,
    riasecResult,
    mbtiResult,
    careerMatches,
    careerPlan,
    completedAssessments,
  } = context;

  const lowerMessage = message.toLowerCase();

  // Personalized greeting
  const firstName = userName.split(" ")[0];

  // ========================================
  // CAREER INTEREST QUERIES
  // ========================================

  if (lowerMessage.includes("career") &&
      (lowerMessage.includes("good for me") ||
       lowerMessage.includes("should i") ||
       lowerMessage.includes("what career") ||
       lowerMessage.includes("suggest"))) {

    const topCareer = careerMatches[0];
    const hollandCode = riasecResult?.hollandCode;

    if (topCareer) {
      return {
        message: `Great question ${firstName}! Based on your personality assessment, **${topCareer.career?.name}** is your top match with a ${topCareer.matchScore}% compatibility score.\n\nYour Holland Code is ${hollandCode || "not yet assessed"}, which means you have strengths that align well with careers involving ${getHollandDescription(hollandCode)}.\n\nWould you like me to explain why this career matches you, or would you like to see other options?`,
        suggestions: [
          "Tell me more about this career",
          "Show me other career options",
          "What skills do I need?",
        ],
        resources: [
          {
            type: "career",
            title: `Explore ${topCareer.career?.name}`,
            url: "/student/careers",
          },
          ...(completedAssessments < 2 ? [{
            type: "assessment",
            title: "Take more assessments for better matches",
            url: "/student/assessments",
          }] : []),
        ],
        dataCaptured: {
          interests: extractCareerInterests(message),
          concerns: [],
          mentionedCareers: extractCareerNames(message),
        },
      };
    }

    return {
      message: `I'd love to help you find the right career ${firstName}! To give you the best recommendations, I need to understand your personality better.\n\nYou've completed ${completedAssessments} assessment${completedAssessments !== 1 ? "s" : ""}. Completing more assessments will help me find careers that truly fit you!`,
      suggestions: [
        "Take RIASEC Assessment",
        "Take MBTI Assessment",
        "Take DISC Assessment",
      ],
      resources: [
        {
          type: "assessment",
          title: "Browse All Assessments",
          url: "/student/assessments",
        },
      ],
      dataCaptured: {
        interests: ["career exploration"],
        concerns: [],
        mentionedCareers: [],
      },
    };
  }

  // ========================================
  // SKILL & LEARNING QUERIES
  // ========================================

  if (lowerMessage.includes("skill") ||
      lowerMessage.includes("learn") ||
      lowerMessage.includes("study") ||
      lowerMessage.includes("improve")) {

    return {
      message: `That's a great mindset ${firstName}! 🌟\n\nBuilding the right skills is crucial for career success. Based on your interest, I can help you:\n\n1. **Identify skill gaps** - See what skills you need for your dream career\n2. **Create a study plan** - Personalized learning schedule\n3. **Find learning resources** - Curated content for your goals\n\nWhich would you like to start with?`,
      suggestions: [
        "Check my skill gaps",
        "Create a study plan",
        "Find learning resources",
      ],
      resources: [
        {
          type: "article",
          title: "Skill Development Guide",
          url: "/student/plan",
        },
      ],
      dataCaptured: {
        interests: ["skill development", "learning"],
        concerns: extractConcerns(message),
        mentionedCareers: [],
      },
    };
  }

  // ========================================
  // COLLEGE/RUB QUERIES
  // ========================================

  if (lowerMessage.includes("college") ||
      lowerMessage.includes("rub") ||
      lowerMessage.includes("university") ||
      lowerMessage.includes("admission")) {

    return {
      message: `Royal University of Bhutan has excellent opportunities ${firstName}! 🎓\n\nI can help you:\n\n• **Find programs** that match your career goals\n• **Check eligibility** based on your marks\n• **Predict admission chances** for different colleges\n• **Understand requirements** for each program\n\nWhat field are you most interested in?`,
      suggestions: [
        "Show me RUB programs",
        "Check my admission chances",
        "What are the requirements?",
      ],
      resources: [
        {
          type: "career",
          title: "Explore RUB Programs",
          url: "/student/rub",
        },
      ],
      dataCaptured: {
        interests: ["higher education", "rub"],
        concerns: extractConcerns(message),
        mentionedCareers: [],
      },
    };
  }

  // ========================================
  // CONFUSION/UNCERTAINTY QUERIES
  // ========================================

  if (lowerMessage.includes("confused") ||
      lowerMessage.includes("don't know") ||
      lowerMessage.includes("unsure") ||
      lowerMessage.includes("no idea") ||
      lowerMessage.includes("help me")) {

    return {
      message: `It's completely okay to feel uncertain ${firstName}! You're not alone in this. 💚\n\nLet me help you find some clarity. The best way to discover your path is by understanding yourself better:\n\n1. **Your personality** - What comes naturally to you?\n2. **Your interests** - What do you enjoy doing?\n3. **Your strengths** - What are you good at?\n\nI recommend starting with our fun personality assessments. They'll help us discover careers that fit YOU!`,
      suggestions: [
        "Start with a fun assessment",
        "Tell me my options",
        "How do I discover my interests?",
      ],
      resources: [
        {
          type: "assessment",
          title: "Take RIASEC Assessment (Fun!)",
          url: "/student/assessments/riasec",
        },
      ],
      dataCaptured: {
        interests: [],
        concerns: ["uncertain about career path"],
        mentionedCareers: [],
      },
    };
  }

  // ========================================
  // DEFAULT RESPONSE
  // ========================================

  return {
    message: `Hi ${firstName}! 👋 I'm your AI Career Coach and I'm here to help you with anything related to your career and education journey.\n\n**Here's what I can help you with:**\n\n• 🎯 Find careers that match your personality\n• 📚 Plan what to study after Class 10/12\n• 🎓 Explore RUB colleges and programs\n• 💪 Discover and build your skills\n• 📝 Get help with applications and essays\n• 💬 Just chat about your future!\n\nWhat would you like to explore?`,
    suggestions: [
      "What careers suit me?",
      "Help me choose my subjects",
      "Tell me about RUB programs",
      "I'm confused about my future",
    ],
    resources: [],
    dataCaptured: {
      interests: [],
      concerns: [],
      mentionedCareers: [],
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getHollandDescription(code: string | null): string {
  if (!code) return "your unique personality";

  const descriptions: Record<string, string> = {
    "R": "hands-on work and practical problem-solving",
    "I": "scientific inquiry, research, and analysis",
    "A": "creative expression and artistic endeavors",
    "S": "helping others and social interactions",
    "E": "leadership and business initiatives",
    "C": "organization, data, and structured tasks",
    "RI": "technical and scientific investigation",
    "RA": "practical creativity and craftsmanship",
    "RS": "helping others through practical means",
    "IR": "scientific and technical problem-solving",
    "IA": "scientific creativity and innovation",
    "AR": "artistic craftsmanship",
    "AI": "artistic and scientific creativity",
    "AS": "artistic expression for social causes",
    "SA": "helping through artistic expression",
    "SE": "helping through leadership and guidance",
    "ES": "leadership in social and community contexts",
    "EC": "managing organizations and business operations",
    "CE": "organized business leadership",
    "CR": "practical management and organization",
    "CS": "organized service to others",
  };

  return descriptions[code] || "your unique combination of traits";
}

function extractCareerNames(message: string): string[] {
  const careers: string[] = [];
  const careerList = [
    "software engineer", "doctor", "teacher", "engineer", "nurse", "accountant",
    "designer", "scientist", "lawyer", "architect", "pharmacist", "dentist",
    "police", "army", "civil servant", "entrepreneur", "artist", "writer",
  ];

  careerList.forEach((career) => {
    if (message.toLowerCase().includes(career)) {
      careers.push(career);
    }
  });

  return careers;
}
