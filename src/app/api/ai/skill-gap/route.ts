/**
 * AI SKILL GAP ANALYZER API
 *
 * POST /api/ai/skill-gap - Analyze skill gaps for target career
 *
 * Uses AI to compare student's current skills against career requirements
 * and provide personalized learning recommendations.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { chatWithGemini } from "@/lib/ai/gemini-server";
import { SKILL_GAP_SYSTEM } from "@/lib/ai/prompts";
import { safeTrackAIInteraction, AI_FEATURE_IDS } from "@/lib/ai/track-interaction";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

export interface SkillGapRequest {
  targetCareer: string;
  currentSkills?: string[];
  completedSubjects?: string[];
  assessmentResults?: {
    hollandCode?: string;
    mbtiType?: string;
    grades?: Record<string, number>;
  };
}

export interface SkillBreakdown {
  skill: string;
  current: number;
  required: number;
  gap: number;
  category?: "technical" | "soft" | "academic";
}

export interface LearningResource {
  title: string;
  type: "course" | "video" | "article" | "book" | "practice";
  url?: string;
  provider?: string;
  duration?: string;
  free?: boolean;
}

export interface SkillGapResponse {
  currentSkillLevel: number;
  skillBreakdown: SkillBreakdown[];
  priorityGaps: string[];
  learningResources: LearningResource[];
  timeline: string;
  strengths: string[];
  recommendations: string[];
}

// ============================================================================
// POST - Analyze Skill Gaps
// ============================================================================

export async function POST(request: NextRequest) {
  let requestData: SkillGapRequest = { targetCareer: "" };
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
    requestData = body as SkillGapRequest;

    const {
      targetCareer,
      currentSkills = [],
      completedSubjects = [],
      assessmentResults = {},
    } = requestData;

    // Validate required fields
    if (!targetCareer || typeof targetCareer !== "string") {
      return NextResponse.json(
        {
          error: "Target career is required",
          status: 400,
        } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Build the prompt for AI
    const prompt = buildSkillGapPrompt({
      targetCareer,
      currentSkills,
      completedSubjects,
      assessmentResults,
    });

    // Call Gemini AI for skill gap analysis
    const aiResponse = await chatWithGemini(prompt, SKILL_GAP_SYSTEM);

    // Parse AI response into structured format
    const analysis = parseSkillGapResponse(aiResponse, targetCareer, currentSkills);

    logger.info("Skill gap analysis generated", {
      route: "/api/ai/skill-gap",
      method: "POST",
      userId,
      targetCareer,
      skillLevel: analysis.currentSkillLevel,
    });

    // Track AI interaction (non-blocking)
    safeTrackAIInteraction({
      userId,
      featureId: AI_FEATURE_IDS.SKILL_GAP_ANALYZER,
      interactionData: {
        targetCareer,
        hasCurrentSkills: currentSkills.length > 0,
        hasCompletedSubjects: completedSubjects.length > 0,
        hasAssessmentResults: !!assessmentResults,
        currentSkillLevel: analysis.currentSkillLevel,
        priorityGapsCount: analysis.priorityGaps.length,
        learningResourcesCount: analysis.learningResources.length,
      },
      metadata: {
        usedFallback: false,
        responseTimestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      data: analysis,
      status: 200,
      message: "Skill gap analysis completed successfully",
    } satisfies ApiSuccess<SkillGapResponse>);

  } catch (error: any) {
    logger.apiError(error, {
      route: "/api/ai/skill-gap",
      method: "POST",
    });

    // Check if it's an API key error
    if (error?.message === "Gemini API key not configured") {
      // Return fallback response
      const fallback = generateFallbackAnalysis(requestData);

      // Track fallback usage (non-blocking)
      safeTrackAIInteraction({
        userId,
        featureId: AI_FEATURE_IDS.SKILL_GAP_ANALYZER,
        interactionData: {
          targetCareer: requestData.targetCareer || "unknown",
          hasCurrentSkills: (requestData.currentSkills?.length || 0) > 0,
          fallbackSkillLevel: fallback.currentSkillLevel,
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
        message: "Using offline skill analysis",
      } satisfies ApiSuccess<SkillGapResponse>);
    }

    return NextResponse.json(
      {
        error: "Failed to analyze skill gaps",
        status: 500,
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildSkillGapPrompt(data: SkillGapRequest): string {
  const parts: string[] = [];

  parts.push("Please analyze the skill gap for this student:\n");
  parts.push(`**Target Career:** ${data.targetCareer}`);

  if (data.currentSkills && data.currentSkills.length > 0) {
    parts.push(`**Current Skills:** ${data.currentSkills.join(", ")}`);
  } else {
    parts.push("**Current Skills:** None specified");
  }

  if (data.completedSubjects && data.completedSubjects.length > 0) {
    parts.push(`**Completed Subjects:** ${data.completedSubjects.join(", ")}`);
  }

  if (data.assessmentResults?.hollandCode) {
    parts.push(`**Holland Code:** ${data.assessmentResults.hollandCode}`);
  }

  if (data.assessmentResults?.mbtiType) {
    parts.push(`**MBTI Type:** ${data.assessmentResults.mbtiType}`);
  }

  if (data.assessmentResults?.grades && Object.keys(data.assessmentResults.grades).length > 0) {
    const gradeStr = Object.entries(data.assessmentResults.grades)
      .map(([subject, grade]) => `${subject}: ${grade}`)
      .join(", ");
    parts.push(`**Grades:** ${gradeStr}`);
  }

  parts.push("\n\nPlease provide your analysis in this format:");
  parts.push("1. **Current Skill Level** - Overall percentage (0-100%) of how prepared they are");
  parts.push("2. **Skill Breakdown** - For each key skill, show:");
  parts.push("   - Skill name");
  parts.push("   - Current level (0-100%)");
  parts.push("   - Required level (0-100%)");
  parts.push("   - Gap percentage");
  parts.push("3. **Strengths** - What they already have going for them (3-4 points)");
  parts.push("4. **Priority Gaps** - Top 3-4 skills they need to develop most urgently");
  parts.push("5. **Learning Resources** - Specific recommendations with:");
  parts.push("   - Resource title");
  parts.push("   - Type (course, video, article, book, practice)");
  parts.push("   - Provider if known");
  parts.push("   - Whether it's free or paid");
  parts.push("6. **Timeline** - Estimated time to reach required skill level (e.g., '6-8 weeks')");
  parts.push("7. **Recommendations** - Additional advice for skill development (3-4 points)");

  parts.push("\n\nFocus on skills relevant to the Bhutanese context and available learning resources.");

  return parts.join("\n");
}

// ============================================================================
// RESPONSE PARSER
// ============================================================================

function parseSkillGapResponse(
  aiResponse: string,
  targetCareer: string,
  currentSkills: string[]
): SkillGapResponse {
  const skillBreakdown: SkillBreakdown[] = [];
  const priorityGaps: string[] = [];
  const learningResources: LearningResource[] = [];
  const strengths: string[] = [];
  const recommendations: string[] = [];
  let currentSkillLevel = 50;
  let timeline = "8-12 weeks";

  // Extract current skill level percentage
  const skillLevelPattern = /(?:current skill level|prepared|ready)[:：]?\s*(\d+)\s*%/i;
  const skillLevelMatch = aiResponse.match(skillLevelPattern);
  if (skillLevelMatch) {
    currentSkillLevel = Math.min(Math.max(parseInt(skillLevelMatch[1], 10), 0), 100);
  }

  // Extract skill breakdown
  const breakdownPatterns = [
    /(\w+(?:\s+\w+)?)[:：]\s*(?:current\s*)?(\d+)%(?:\s*\/\s*required\s*(\d+)%)?(?:\s*\(?\s*gap[:：]?\s*(\d+)\s*%?\)?)?/gi,
    /[-\*\u2022]\s*(\w+(?:\s+\w+?)?)[:：]?\s*(?:current|level)?\s*(\d+)%/gi,
  ];

  const seenSkills = new Set<string>();
  for (const pattern of breakdownPatterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(aiResponse)) !== null) {
      const skill = match[1]?.trim();
      const current = parseInt(match[2] || "50", 10);
      const required = parseInt(match[3] || "80", 10);
      const gap = parseInt(match[4] || String(required - current), 10);

      if (skill && !seenSkills.has(skill.toLowerCase())) {
        seenSkills.add(skill.toLowerCase());
        skillBreakdown.push({
          skill,
          current: Math.min(Math.max(current, 0), 100),
          required: Math.min(Math.max(required, 0), 100),
          gap: Math.min(Math.max(gap, 0), 100),
          category: getSkillCategory(skill),
        });
      }
    }
  }

  // Ensure we have at least some skills in breakdown
  if (skillBreakdown.length === 0) {
    skillBreakdown.push(
      { skill: "Technical Skills", current: 40, required: 85, gap: 45, category: "technical" },
      { skill: "Communication", current: 60, required: 80, gap: 20, category: "soft" },
      { skill: "Problem Solving", current: 55, required: 90, gap: 35, category: "soft" },
      { skill: "Industry Knowledge", current: 30, required: 75, gap: 45, category: "academic" }
    );
  }

  // Extract strengths
  const strengthsPattern = /(?:strengths|what they have|already good at|existing strengths)[:：]?\s*([\s\S]*?)(?=\n\n|\n\d+\.|\n(?:priority|gap|learning|timeline|recommendation))/i;
  const strengthsMatch = aiResponse.match(strengthsPattern);
  if (strengthsMatch) {
    const strengthList = strengthsMatch[1]
      .split(/[\n\u2022\u25E6\u25CB\-\*]/)
      .map((s) => s.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((s) => s.length > 5 && s.length < 150);
    strengths.push(...strengthList.slice(0, 4));
  }

  if (strengths.length === 0) {
    strengths.push(
      "Good foundation with completed subjects",
      "Motivation to develop in this career",
      "Access to learning resources"
    );
  }

  // Extract priority gaps
  const gapsPattern = /(?:priority gaps?|skills to develop|need to learn|missing skills?)[:：]?\s*([\s\S]*?)(?=\n\n|\n\d+\.|\n(?:learning|timeline|recommendation|resource))/i;
  const gapsMatch = aiResponse.match(gapsPattern);
  if (gapsMatch) {
    const gapList = gapsMatch[1]
      .split(/[\n\u2022\u25E6\u25CB\-\*]/)
      .map((s) => s.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((s) => s.length > 3 && s.length < 100);
    priorityGaps.push(...gapList.slice(0, 5));
  }

  if (priorityGaps.length === 0) {
    priorityGaps.push(
      "Advanced technical skills",
      "Industry-specific knowledge",
      "Practical hands-on experience"
    );
  }

  // Extract learning resources
  const resourcePattern = /(?:learning resources?|resources?|courses?)[:：]?\s*([\s\S]*?)(?=\n\n|\n\d+\.|\n(?:timeline|recommendation))/i;
  const resourceMatch = aiResponse.match(resourcePattern);
  if (resourceMatch) {
    const resourceList = resourceMatch[1]
      .split(/[\n\u2022\u25E6\u25CB\-\*]/)
      .map((s) => s.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((s) => s.length > 10);

    for (const resource of resourceList.slice(0, 6)) {
      learningResources.push(parseResource(resource));
    }
  }

  if (learningResources.length === 0) {
    learningResources.push(
      { title: "Online Fundamentals Course", type: "course", provider: "Coursera", free: true },
      { title: "YouTube Tutorial Series", type: "video", provider: "YouTube", free: true },
      { title: "Practice Projects", type: "practice", free: true },
      { title: "Industry Reading List", type: "article", provider: "Medium", free: true }
    );
  }

  // Extract timeline
  const timelinePattern = /(?:timeline|time to|estimated|weeks?|months?)[:：]?\s*(\d+(?:-\d+)?\s*(?:weeks?|months?))/i;
  const timelineMatch = aiResponse.match(timelinePattern);
  if (timelineMatch) {
    timeline = timelineMatch[1];
  }

  // Extract recommendations
  const recPattern = /(?:recommendations?|advice?s?|suggestions?)[:：]?\s*([\s\S]*?)$/i;
  const recMatch = aiResponse.match(recPattern);
  if (recMatch) {
    const recList = recMatch[1]
      .split(/[\n\u2022\u25E6\u25CB\-\*]/)
      .map((s) => s.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((s) => s.length > 10 && s.length < 200);
    recommendations.push(...recList.slice(0, 4));
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Start with foundational courses before moving to advanced topics",
      "Practice regularly with real-world projects",
      "Join online communities related to your target career",
      "Seek mentorship from professionals in the field"
    );
  }

  return {
    currentSkillLevel,
    skillBreakdown: skillBreakdown.slice(0, 6),
    priorityGaps: priorityGaps.slice(0, 4),
    learningResources: learningResources.slice(0, 6),
    timeline,
    strengths: strengths.slice(0, 4),
    recommendations: recommendations.slice(0, 4),
  };
}

function getSkillCategory(skill: string): "technical" | "soft" | "academic" {
  const technical = ["programming", "coding", "software", "data", "technical", "computer", "math", "calculation", "analysis", "engineering"];
  const soft = ["communication", "teamwork", "leadership", "presentation", "negotiation", "interpersonal", "problem solving", "creativity"];

  const lowerSkill = skill.toLowerCase();

  if (technical.some((t) => lowerSkill.includes(t))) return "technical";
  if (soft.some((s) => lowerSkill.includes(s))) return "soft";
  return "academic";
}

function parseResource(resourceStr: string): LearningResource {
  // Try to parse resource type and details
  const typePatterns = {
    course: /course|certification|training/i,
    video: /video|tutorial|youtube|watch/i,
    article: /article|blog|read|guide|documentation/i,
    book: /book|ebook|textbook/i,
    practice: /practice|project|hands-on|exercise/i,
  };

  let type: LearningResource["type"] = "course";
  for (const [typeName, pattern] of Object.entries(typePatterns)) {
    if (pattern.test(resourceStr)) {
      type = typeName as LearningResource["type"];
      break;
    }
  }

  // Try to extract provider
  const providerPatterns = [
    /coursera|udemy|khan academy|edx|skillshare/i,
    /youtube|vimeo/i,
    /medium|blog|dev\.to|hashnode/i,
  ];
  let provider: string | undefined;
  for (const pattern of providerPatterns) {
    const match = resourceStr.match(pattern);
    if (match) {
      provider = match[0];
      break;
    }
  }

  // Check if free
  const isFree = /free|no cost|0/i.test(resourceStr);

  // Clean up title
  let title = resourceStr
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/by\s+\w+/gi, "")
    .replace(/-\s*(coursera|udemy|youtube|edx|khan academy)/gi, "")
    .trim();

  if (title.length > 100) {
    title = title.substring(0, 97) + "...";
  }

  return {
    title: title || "Learning Resource",
    type,
    provider,
    free: isFree,
  };
}

// ============================================================================
// FALLBACK ANALYSIS (when AI is unavailable)
// ============================================================================

function generateFallbackAnalysis(data: SkillGapRequest): SkillGapResponse {
  const { targetCareer, currentSkills = [] } = data;

  // Career-specific skill requirements
  const careerSkills: Record<string, SkillBreakdown[]> = {
    "software engineer": [
      { skill: "Programming", current: 30, required: 90, gap: 60, category: "technical" },
      { skill: "Data Structures", current: 20, required: 85, gap: 65, category: "technical" },
      { skill: "Problem Solving", current: 50, required: 85, gap: 35, category: "soft" },
      { skill: "Communication", current: 60, required: 70, gap: 10, category: "soft" },
      { skill: "Mathematics", current: 55, required: 80, gap: 25, category: "academic" },
    ],
    "doctor": [
      { skill: "Biology", current: 40, required: 95, gap: 55, category: "academic" },
      { skill: "Chemistry", current: 35, required: 90, gap: 55, category: "academic" },
      { skill: "Communication", current: 55, required: 85, gap: 30, category: "soft" },
      { skill: "Empathy", current: 70, required: 90, gap: 20, category: "soft" },
      { skill: "Medical Knowledge", current: 10, required: 95, gap: 85, category: "technical" },
    ],
    "teacher": [
      { skill: "Subject Knowledge", current: 50, required: 85, gap: 35, category: "academic" },
      { skill: "Communication", current: 60, required: 90, gap: 30, category: "soft" },
      { skill: "Patience", current: 70, required: 85, gap: 15, category: "soft" },
      { skill: "Presentation", current: 45, required: 80, gap: 35, category: "soft" },
      { skill: "Lesson Planning", current: 30, required: 80, gap: 50, category: "technical" },
    ],
  };

  const defaultSkills: SkillBreakdown[] = [
    { skill: "Technical Skills", current: 40, required: 80, gap: 40, category: "technical" },
    { skill: "Communication", current: 55, required: 75, gap: 20, category: "soft" },
    { skill: "Problem Solving", current: 50, required: 80, gap: 30, category: "soft" },
    { skill: "Industry Knowledge", current: 25, required: 75, gap: 50, category: "academic" },
    { skill: "Teamwork", current: 60, required: 80, gap: 20, category: "soft" },
  ];

  const skillBreakdown = careerSkills[targetCareer.toLowerCase()] || defaultSkills;

  // Adjust current levels based on provided skills
  if (currentSkills.length > 0) {
    currentSkills.forEach((providedSkill) => {
      const match = skillBreakdown.find((s) =>
        s.skill.toLowerCase().includes(providedSkill.toLowerCase()) ||
        providedSkill.toLowerCase().includes(s.skill.toLowerCase())
      );
      if (match) {
        match.current = Math.min(match.current + 25, 75);
        match.gap = Math.max(match.required - match.current, 10);
      }
    });
  }

  // Calculate overall skill level
  const avgCurrent = skillBreakdown.reduce((sum, s) => sum + s.current, 0) / skillBreakdown.length;
  const currentSkillLevel = Math.round(avgCurrent);

  return {
    currentSkillLevel,
    skillBreakdown,
    priorityGaps: skillBreakdown
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 3)
      .map((s) => s.skill),
    learningResources: [
      { title: "Foundation Course", type: "course", provider: "Coursera", free: true },
      { title: "Video Tutorial Series", type: "video", provider: "YouTube", free: true },
      { title: "Practice Exercises", type: "practice", free: true },
      { title: "Industry Articles", type: "article", provider: "Medium", free: true },
      { title: "Recommended Textbook", type: "book", free: false },
    ],
    timeline: currentSkillLevel < 40 ? "12-16 weeks" : currentSkillLevel < 60 ? "8-12 weeks" : "4-8 weeks",
    strengths: [
      "Completed foundational subjects provide good base",
      "Clear career goal helps focus learning",
      "Motivation to develop shows growth mindset",
    ],
    recommendations: [
      "Start with highest-gap skills for biggest impact",
      "Dedicate 2-3 hours daily to skill development",
      "Join online communities for support and networking",
      "Track progress with regular self-assessments",
    ],
  };
}

// ============================================================================
// GET - Check availability
// ============================================================================

export async function GET() {
  return NextResponse.json({
    available: true,
    feature: "AI Skill Gap Analyzer",
    description: "Compare your current skills against career requirements",
    requiresAuth: true,
    inputFields: [
      "targetCareer",
      "currentSkills",
      "completedSubjects",
      "assessmentResults",
    ],
  });
}
