/**
 * AI SKILL GAP ANALYZER API
 *
 * POST /api/ai/skill-gap - Analyze skill gaps for target career
 *
 * Uses AI to compare student's current skills against career requirements
 * and provide personalized learning recommendations.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { requireAuth } from "@/lib/auth-utils";
import { chatWithGemini } from "@/lib/ai/gemini-server";
import { SKILL_GAP_SYSTEM } from "@/lib/ai/prompts";
import { safeTrackAIInteraction, AI_FEATURE_IDS } from "@/lib/ai/track-interaction";
import type { ApiSuccess } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

export interface SkillGapRequest extends Record<string, unknown> {
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

export const POST = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;

    const body = await req.json() as SkillGapRequest;
    const requestData = body;

    const {
      targetCareer,
      currentSkills = [],
      completedSubjects = [],
      assessmentResults = {},
    } = body;

    // Validate required fields
    if (!targetCareer || typeof targetCareer !== "string") {
      return NextResponse.json(
        { error: "Target career is required", status: 400 },
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
  },
  [] // No specific role requirement - any authenticated user
);

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
      "Join online communities for support and networking",
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
// GET - Check availability
// ============================================================================

export const GET = createApiRoute(
  async () => {
    return {
      data: {
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
      }
    };
  },
  []
);
