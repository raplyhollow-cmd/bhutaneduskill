/**
 * AI ESSAY REVIEWER API
 *
 * POST /api/ai/essay-reviewer - Review college application essays
 *
 * Uses AI to analyze personal statements and essays, providing
 * constructive feedback on content, grammar, and style.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { chatWithGemini } from "@/lib/ai/gemini-server";
import { ESSAY_REVIEWER_SYSTEM } from "@/lib/ai/prompts";
import { safeTrackAIInteraction, AI_FEATURE_IDS } from "@/lib/ai/track-interaction";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

export type PromptType =
  | "personal-statement"
  | "specific-question"
  | "supplemental-essay"
  | "scholarship-essay"
  | "common-app"
  | "general";

export interface EssayReviewerRequest {
  essayText: string;
  promptType?: PromptType;
  wordLimit?: number;
  targetCollege?: string;
  targetMajor?: string;
}

export interface GrammarCorrection {
  original: string;
  correction: string;
  explanation: string;
  type: "grammar" | "spelling" | "style" | "clarity";
}

export interface RecommendedChange {
  section: string;
  currentText: string;
  suggestion: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface EssayReviewResponse {
  overallRating: number;
  ratingExplanation: string;
  strengths: string[];
  areasForImprovement: string[];
  grammarAndStyle: GrammarCorrection[];
  recommendedChanges: RecommendedChange[];
  wordCount: number;
  feedback: string;
}

// ============================================================================
// POST - Review Essay
// ============================================================================

export async function POST(request: NextRequest) {
  let requestData: EssayReviewerRequest = {} as EssayReviewerRequest;
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
    requestData = body as EssayReviewerRequest;

    const {
      essayText,
      promptType = "general",
      wordLimit,
      targetCollege,
      targetMajor,
    } = requestData;

    // Validate essay text
    if (!essayText || essayText.trim().length < 50) {
      return NextResponse.json(
        {
          error: "Essay text is too short. Please provide at least 50 characters.",
          status: 400,
        } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    if (essayText.length > 15000) {
      return NextResponse.json(
        {
          error: "Essay text is too long. Maximum 15,000 characters allowed.",
          status: 400,
        } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Build the prompt for AI
    const prompt = buildReviewerPrompt({
      essayText,
      promptType,
      wordLimit,
      targetCollege,
      targetMajor,
    });

    // Call Gemini AI for review
    const aiResponse = await chatWithGemini(prompt, ESSAY_REVIEWER_SYSTEM);

    // Parse AI response into structured format
    const review = parseReviewResponse(aiResponse, essayText);

    logger.info("Essay review generated", {
      route: "/api/ai/essay-reviewer",
      method: "POST",
      userId,
      promptType,
      wordCount: review.wordCount,
      rating: review.overallRating,
    });

    // Track AI interaction (non-blocking)
    safeTrackAIInteraction({
      userId,
      featureId: AI_FEATURE_IDS.ESSAY_REVIEWER,
      interactionData: {
        promptType,
        wordCount: review.wordCount,
        overallRating: review.overallRating,
        strengthsCount: review.strengths.length,
        improvementsCount: review.areasForImprovement.length,
        grammarCorrectionsCount: review.grammarAndStyle.length,
        hasTargetCollege: !!targetCollege,
        hasTargetMajor: !!targetMajor,
        hasWordLimit: !!wordLimit,
      },
      metadata: {
        usedFallback: false,
        responseTimestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      data: review,
      status: 200,
      message: "Essay review completed successfully",
    } satisfies ApiSuccess<EssayReviewResponse>);

  } catch (error: unknown) {
    logger.apiError(error, {
      route: "/api/ai/essay-reviewer",
      method: "POST",
    });

    // Check if it's an API key error
    if (error instanceof Error && error.message === "Gemini API key not configured") {
      const fallback = generateFallbackReview(requestData);

      // Track fallback usage (non-blocking)
      safeTrackAIInteraction({
        userId,
        featureId: AI_FEATURE_IDS.ESSAY_REVIEWER,
        interactionData: {
          promptType: requestData.promptType || "general",
          wordCount: requestData.essayText?.split(/\s+/).length || 0,
          fallbackRating: fallback.overallRating,
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
        message: "Using offline review mode",
      } satisfies ApiSuccess<EssayReviewResponse>);
    }

    return NextResponse.json(
      {
        error: "Failed to review essay",
        status: 500,
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : undefined) : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildReviewerPrompt(data: EssayReviewerRequest): string {
  const parts: string[] = [];

  const wordCount = data.essayText.split(/\s+/).length;

  parts.push("Please review the following college application essay:\n");
  parts.push(`**Essay Type:** ${getPromptTypeLabel(data.promptType || "general")}`);

  if (data.targetCollege) {
    parts.push(`**Target College:** ${data.targetCollege}`);
  }

  if (data.targetMajor) {
    parts.push(`**Target Major:** ${data.targetMajor}`);
  }

  if (data.wordLimit) {
    parts.push(`**Word Limit:** ${data.wordLimit} words`);
  }
  parts.push(`**Current Word Count:** ${wordCount} words`);

  if (data.wordLimit && wordCount > data.wordLimit) {
    parts.push(`⚠️ This essay is ${wordCount - data.wordLimit} words over the limit.`);
  } else if (data.wordLimit && wordCount < data.wordLimit * 0.8) {
    parts.push(`⚠️ This essay is ${data.wordLimit - wordCount} words under the limit. Consider expanding.`);
  }

  parts.push("\n**ESSAY TEXT:**");
  parts.push('"' + data.essayText + '"');

  parts.push("\n\nPlease provide your review in this EXACT format:");
  parts.push("1. **Overall Rating** - A score from 1-10 with a brief explanation");
  parts.push("2. **Strengths** - 2-3 bullet points of what works well");
  parts.push("3. **Areas for Improvement** - 3-4 specific suggestions for improvement");
  parts.push("4. **Grammar & Style** - 3-5 specific corrections with format:");
  parts.push("   - Original: [incorrect text]");
  parts.push("   - Correction: [corrected text]");
  parts.push("   - Explanation: [why the change is needed]");
  parts.push("5. **Recommended Changes** - 2-3 specific edits with:");
  parts.push("   - Section or context");
  parts.push("   - Current text");
  parts.push("   - Suggested revision");
  parts.push("   - Reason for the change");
  parts.push("6. **Final Feedback** - A brief encouraging summary");

  parts.push("\nBe encouraging but honest. Help the student tell their story authentically.");

  return parts.join("\n");
}

function getPromptTypeLabel(type: PromptType): string {
  const labels: Record<PromptType, string> = {
    "personal-statement": "Personal Statement",
    "specific-question": "Response to Specific Question",
    "supplemental-essay": "Supplemental Essay",
    "scholarship-essay": "Scholarship Essay",
    "common-app": "Common Application Essay",
    "general": "General Essay",
  };
  return labels[type] || "General Essay";
}

// ============================================================================
// RESPONSE PARSER
// ============================================================================

function parseReviewResponse(
  aiResponse: string,
  originalEssay: string
): EssayReviewResponse {
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const grammarAndStyle: GrammarCorrection[] = [];
  const recommendedChanges: RecommendedChange[] = [];

  let overallRating = 7;
  let ratingExplanation = "";
  let feedback = "";

  // Extract overall rating
  const ratingPatterns = [
    /(?:overall rating|rating|score)[:：]?\s*(\d+)\/?\s*10?/i,
    /(?:rating|score)[:：]\s*(\d+)/i,
    /(\d+)\/\s*10/i,
  ];

  for (const pattern of ratingPatterns) {
    const match = aiResponse.match(pattern);
    if (match) {
      overallRating = Math.min(Math.max(parseInt(match[1], 10), 1), 10);
      break;
    }
  }

  // Extract rating explanation
  const ratingExplanationPattern =
    /(?:overall rating|rating)[:：]?\s*(?:\d+\/?\s*10?)\s*[-\u2014\s]*(.+?)(?:\n\n|\n\s*\n|\*+|$)/i;
  const ratingExplanationMatch = aiResponse.match(ratingExplanationPattern);
  if (ratingExplanationMatch) {
    ratingExplanation = ratingExplanationMatch[1].trim();
  }

  // Extract strengths
  const strengthsPattern =
    /(?:strengths|what works well|what's good)[:：]?\s*([\s\S]*?)(?:\n\s*\n|\n\s*(?:areas for improvement|weaknesses|improvement)|\*+|$)/i;
  const strengthsMatch = aiResponse.match(strengthsPattern);
  if (strengthsMatch) {
    const strengthItems = strengthsMatch[1]
      .split(/[\n\u2022\u25E6\u25CB\-\*]\s*/)
      .map((s) => s.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((s) => s.length > 10);
    strengths.push(...strengthItems.slice(0, 3));
  }

  // Extract areas for improvement
  const improvementPattern =
    /(?:areas for improvement|improvement|weaknesses|what to improve)[:：]?\s*([\s\S]*?)(?:\n\s*\n|\n\s*(?:grammar|recommended|final)|\*+|$)/i;
  const improvementMatch = aiResponse.match(improvementPattern);
  if (improvementMatch) {
    const improvementItems = improvementMatch[1]
      .split(/[\n\u2022\u25E6\u25CB\-\*]\s*/)
      .map((s) => s.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((s) => s.length > 10);
    areasForImprovement.push(...improvementItems.slice(0, 4));
  }

  // Extract grammar and style corrections
  const grammarPattern =
    /(?:grammar & style|grammar and style|grammar|corrections)[:：]?\s*([\s\S]*?)(?:\n\s*\n|\n\s*(?:recommended|final)|\*+|$)/i;
  const grammarMatch = aiResponse.match(grammarPattern);
  if (grammarMatch) {
    parseGrammarCorrections(grammarMatch[1], grammarAndStyle);
  }

  // Extract recommended changes
  const changesPattern =
    /(?:recommended changes|suggested changes|revisions)[:：]?\s*([\s\S]*?)(?:\n\s*\n|\n\s*(?:final|summary)|\*+|$)/i;
  const changesMatch = aiResponse.match(changesPattern);
  if (changesMatch) {
    parseRecommendedChanges(changesMatch[1], recommendedChanges);
  }

  // Extract final feedback
  const feedbackPattern =
    /(?:final feedback|feedback|summary|conclusion)[:：]?\s*([\s\S]*?)$/i;
  const feedbackMatch = aiResponse.match(feedbackPattern);
  if (feedbackMatch) {
    feedback = feedbackMatch[1].trim();
  }

  // Ensure minimum items
  if (strengths.length === 0) {
    strengths.push("Good effort in expressing your ideas", "Shows personal voice and perspective");
  }

  if (areasForImprovement.length === 0) {
    areasForImprovement.push(
      "Consider adding more specific examples",
      "Work on varying sentence structure",
      "Strengthen your opening to grab attention"
    );
  }

  if (grammarAndStyle.length === 0) {
    grammarAndStyle.push({
      original: "Review your essay for minor grammatical issues",
      correction: "Ensure proper punctuation throughout",
      explanation: "Careful proofreading improves readability",
      type: "grammar",
    });
  }

  if (recommendedChanges.length === 0) {
    recommendedChanges.push({
      section: "Introduction",
      currentText: "Consider revising your opening",
      suggestion: "Start with a compelling hook that draws the reader in",
      reason: "A strong opening sets the tone for your entire essay",
      priority: "high",
    });
  }

  if (!ratingExplanation) {
    ratingExplanation = `Your essay shows promise with room for growth. Focus on the recommended areas to strengthen your application.`;
  }

  if (!feedback) {
    feedback = "Keep working on your essay! The best college essays go through multiple revisions. Consider sharing your essay with a teacher or counselor for additional feedback.";
  }

  return {
    overallRating,
    ratingExplanation,
    strengths,
    areasForImprovement,
    grammarAndStyle: grammarAndStyle.slice(0, 5),
    recommendedChanges: recommendedChanges.slice(0, 3),
    wordCount: originalEssay.split(/\s+/).filter((w) => w.length > 0).length,
    feedback,
  };
}

function parseGrammarCorrections(
  text: string,
  corrections: GrammarCorrection[]
): void {
  // Try to find structured corrections
  const correctionBlocks = text.split(/\n\s*\n/);

  for (const block of correctionBlocks) {
    const originalMatch = block.match(/(?:original|current)[:：]?\s*["']?(.+?)["']?[\n\r]/i);
    const correctionMatch = block.match(/(?:correction|corrected)[:：]?\s*["']?(.+?)["']?[\n\r]/i);
    const explanationMatch = block.match(/(?:explanation|reason|why)[:：]?\s*["']?(.+?)["']?[\n\r]?$/i);

    if (originalMatch && correctionMatch) {
      corrections.push({
        original: originalMatch[1].trim(),
        correction: correctionMatch[1].trim(),
        explanation: explanationMatch ? explanationMatch[1].trim() : "Improves clarity and correctness",
        type: block.toLowerCase().includes("style") ? "style" : "grammar",
      });
    }
  }

  // If no structured corrections found, look for bullet points
  if (corrections.length === 0) {
    const bulletItems = text.split(/[\n\u2022\u25E6\u25CB\-\*]\s*/);
    for (const item of bulletItems) {
      if (item.length > 20 && item.length < 200) {
        corrections.push({
          original: "See text",
          correction: item.trim(),
          explanation: "Review for correctness",
          type: "grammar",
        });
      }
    }
  }
}

function parseRecommendedChanges(text: string, changes: RecommendedChange[]): void {
  const changeBlocks = text.split(/\n\s*\n/);

  for (const block of changeBlocks) {
    const sectionMatch = block.match(/(?:section|context|part)[:：]?\s*["']?(.+?)["']?[\n\r]/i);
    const currentMatch = block.match(/(?:current|original)[:：]?\s*["']?(.+?)["']?[\n\r]/i);
    const suggestionMatch = block.match(/(?:suggestion|suggested|revision)[:：]?\s*["']?(.+?)["']?[\n\r]/i);
    const reasonMatch = block.match(/(?:reason|why|because)[:：]?\s*["']?(.+?)["']?[\n\r]?$/i);

    if (suggestionMatch) {
      changes.push({
        section: sectionMatch ? sectionMatch[1].trim() : "General",
        currentText: currentMatch ? currentMatch[1].trim() : "See essay",
        suggestion: suggestionMatch[1].trim(),
        reason: reasonMatch ? reasonMatch[1].trim() : "Improves overall quality",
        priority: "medium",
      });
    }
  }
}

// ============================================================================
// FALLBACK REVIEW (when AI is unavailable)
// ============================================================================

function generateFallbackReview(data: EssayReviewerRequest): EssayReviewResponse {
  const wordCount = data.essayText.split(/\s+/).filter((w) => w.length > 0).length;

  return {
    overallRating: 7,
    ratingExplanation: "Your essay shows potential. With focused revision, it can become even stronger.",
    strengths: [
      "You've shared personal experiences that help readers understand you better",
      "Your essay has a clear voice and perspective",
      "Good effort in expressing your ideas",
    ],
    areasForImprovement: [
      "Consider adding more specific details and examples to make your points more vivid",
      "Work on varying your sentence structure for better flow",
      "Strengthen your opening to immediately engage the reader",
      "Ensure each paragraph has a clear purpose and connects to your main theme",
    ],
    grammarAndStyle: [
      {
        original: "Review for run-on sentences",
        correction: "Break long sentences into shorter, clearer ones",
        explanation: "Improves readability and flow",
        type: "style",
      },
      {
        original: "Check for consistent verb tense",
        correction: "Use past tense for past events, present for current thoughts",
        explanation: "Consistent tense usage improves clarity",
        type: "grammar",
      },
      {
        original: "Look for unnecessary words",
        correction: "Remove filler words like 'very', 'really', 'things'",
        explanation: "Makes your writing more concise and powerful",
        type: "clarity",
      },
    ],
    recommendedChanges: [
      {
        section: "Introduction",
        currentText: "Current opening",
        suggestion: "Start with a specific moment or story that illustrates who you are",
        reason: "A compelling hook grabs the reader's attention immediately",
        priority: "high",
      },
      {
        section: "Body Paragraphs",
        currentText: "General statements",
        suggestion: "Replace general statements with specific examples and personal anecdotes",
        reason: "Specific details make your essay memorable and authentic",
        priority: "high",
      },
      {
        section: "Conclusion",
        currentText: "Ending",
        suggestion: "Connect your conclusion back to your opening and reinforce your main theme",
        reason: "Creates a cohesive essay that resonates with readers",
        priority: "medium",
      },
    ],
    wordCount,
    feedback: "Great start on your essay! The college application essay is your opportunity to show admissions officers who you are beyond grades and test scores. Continue revising and consider asking a teacher, counselor, or trusted adult to review your essay. Multiple drafts are normal - the best essays are refined over time!",
  };
}

// ============================================================================
// GET - Check availability
// ============================================================================

export async function GET() {
  return NextResponse.json({
    available: true,
    feature: "AI Essay Reviewer",
    description: "Get constructive feedback on your college application essays",
    requiresAuth: true,
    promptTypes: [
      "personal-statement",
      "specific-question",
      "supplemental-essay",
      "scholarship-essay",
      "common-app",
      "general",
    ],
    limits: {
      minLength: 50,
      maxLength: 15000,
      maxWordCount: 3000,
    },
  });
}
