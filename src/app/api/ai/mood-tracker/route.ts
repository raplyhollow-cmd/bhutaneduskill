import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth-utils";
/**
 * AI MOOD TRACKER / WELLNESS COACH API
 *
 * POST /api/ai/mood-tracker - Get AI-powered wellness insights
 *
 * This feature helps students track their mood, identify patterns,
 * and receive supportive wellness recommendations.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute, type AuthContext } from "@/lib/api/route-handler";
import { chatWithGemini } from "@/lib/ai/gemini-server";
import { MOOD_TRACKER_SYSTEM } from "@/lib/ai/prompts";
import { safeTrackAIInteraction, AI_FEATURE_IDS } from "@/lib/ai/track-interaction";

// ============================================================================
// TYPES
// ============================================================================

interface MoodEntry {
  date: string;
  mood: number; // 1-5 scale
  stress?: number; // 1-5 scale
  sleepHours?: number;
  sleepQuality?: number; // 1-5 scale
  exercised?: boolean;
  exerciseMinutes?: number;
  concerns?: string[];
  notes?: string;
}

interface MoodTrackerRequest {
  currentEntry: MoodEntry;
  history?: MoodEntry[];
  userName?: string;
}

interface MoodTrackerResponse {
  moodSummary: string;
  observations: string[];
  encouragement: string;
  recommendations: string[];
  whenToSeekHelp: string[];
  redFlags: string[];
  crisisResources?: {
    name: string;
    phone: string;
    description: string;
  }[];
  moodTrend: "improving" | "declining" | "stable";
  averageMood: number;
  averageStress: number;
}

// ============================================================================
// BHUTAN CRISIS RESOURCES
// ============================================================================

const BHUTAN_CRISIS_RESOURCES = [
  {
    name: "National Suicide Prevention Hotline",
    phone: "911",
    description: "24/7 emergency support for mental health crises",
  },
  {
    name: "JDWNRH Mental Health Unit",
    phone: "02-322469",
    description: "Thimphu hospital mental health services",
  },
  {
    name: "School Counselor",
    phone: "Contact your school",
    description: "Your school counselor is available during school hours",
  },
  {
    name: "Bhutan Youth Development Fund",
    phone: "02-323505",
    description: "Support services for youth wellbeing",
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detect red flags in mood entries that may indicate crisis
 */
function detectRedFlags(entries: MoodEntry[]): string[] {
  const redFlags: string[] = [];
  const latest = entries[entries.length - 1];

  if (!latest) return redFlags;

  // Very low mood
  if (latest.mood <= 1) {
    redFlags.push("Very low mood rating (feeling very down)");
  }

  // High stress
  if (latest.stress !== undefined && latest.stress >= 5) {
    redFlags.push("Very high stress level");
  }

  // Poor sleep
  if (latest.sleepHours !== undefined && latest.sleepHours < 4) {
    redFlags.push("Severe lack of sleep");
  }

  // Declining mood pattern
  if (entries.length >= 3) {
    const recent = entries.slice(-3);
    const isDeclining = recent.every((entry, i) =>
      i === 0 ? true : entry.mood <= recent[i - 1].mood
    );
    if (isDeclining && recent[2].mood <= 2) {
      redFlags.push("Mood has been declining over several days");
    }
  }

  // Concern keywords
  const concerningKeywords = [
    "hopeless",
    "worthless",
    "suicide",
    "die",
    "end it all",
    "hurt myself",
    "no point",
    "give up",
    "can't go on",
  ];

  if (latest.concerns || latest.notes) {
    const text = `${latest.concerns?.join(" ") || ""} ${latest.notes || ""}`.toLowerCase();
    for (const keyword of concerningKeywords) {
      if (text.includes(keyword)) {
        redFlags.push(`Expression of concerning thoughts or feelings`);
        break;
      }
    }
  }

  return redFlags;
}

/**
 * Calculate mood trend from history
 */
function calculateMoodTrend(entries: MoodEntry[]): "improving" | "declining" | "stable" {
  if (entries.length < 3) return "stable";

  const recent = entries.slice(-7); // Last 7 entries
  const avgRecent = recent.reduce((sum, e) => sum + e.mood, 0) / recent.length;
  const older = entries.slice(0, Math.max(0, entries.length - 7));
  const avgOlder = older.reduce((sum, e) => sum + e.mood, 0) / older.length;

  const diff = avgRecent - avgOlder;
  if (diff > 0.5) return "improving";
  if (diff < -0.5) return "declining";
  return "stable";
}

/**
 * Calculate averages from history
 */
function calculateAverages(entries: MoodEntry[]): { mood: number; stress: number } {
  const moodSum = entries.reduce((sum, e) => sum + e.mood, 0);
  const stressEntries = entries.filter((e) => e.stress !== undefined);
  const stressSum = stressEntries.reduce((sum, e) => sum + (e.stress || 0), 0);

  return {
    mood: Math.round((moodSum / entries.length) * 10) / 10,
    stress: stressEntries.length > 0
      ? Math.round((stressSum / stressEntries.length) * 10) / 10
      : 0,
  };
}

/**
 * Build the prompt for the AI wellness coach
 */
function buildWellnessPrompt(request: MoodTrackerRequest): string {
  const { currentEntry, history = [], userName = "Student" } = request;

  let prompt = `Student Name: ${userName}\n\n`;
  prompt += `TODAY'S ENTRY:\n`;
  prompt += `- Mood Rating (1-5): ${currentEntry.mood}\n`;

  if (currentEntry.stress !== undefined) {
    prompt += `- Stress Level (1-5): ${currentEntry.stress}\n`;
  }

  if (currentEntry.sleepHours !== undefined) {
    prompt += `- Sleep: ${currentEntry.sleepHours} hours`;
    if (currentEntry.sleepQuality) {
      prompt += ` (quality: ${currentEntry.sleepQuality}/5)`;
    }
    prompt += `\n`;
  }

  if (currentEntry.exercised) {
    prompt += `- Exercise: Yes (${currentEntry.exerciseMinutes || "some"} minutes)\n`;
  } else if (currentEntry.exercised === false) {
    prompt += `- Exercise: No\n`;
  }

  if (currentEntry.concerns && currentEntry.concerns.length > 0) {
    prompt += `- Concerns: ${currentEntry.concerns.join(", ")}\n`;
  }

  if (currentEntry.notes) {
    prompt += `- Notes: ${currentEntry.notes}\n`;
  }

  if (history.length > 0) {
    prompt += `\nRECENT HISTORY (last ${Math.min(history.length, 7)} entries):\n`;
    const recentHistory = history.slice(-7);
    recentHistory.forEach((entry, i) => {
      prompt += `${i + 1}. ${entry.date}: Mood ${entry.mood}/5`;
      if (entry.stress) prompt += `, Stress ${entry.stress}/5`;
      prompt += `\n`;
    });

    const averages = calculateAverages([...history, currentEntry]);
    prompt += `\nAverage mood: ${averages.mood}/5\n`;
    if (averages.stress > 0) {
      prompt += `Average stress: ${averages.stress}/5\n`;
    }
  }

  prompt += `\nPlease provide a supportive wellness analysis following this structure:
1. **Mood Summary** - Brief analysis of how they're feeling
2. **Observations** - What patterns or factors affect their mood (bullet points)
3. **Encouragement** - A warm, supportive message
4. **Recommendations** - 3-5 specific wellness suggestions
5. **When to Seek Help** - Clear guidance on when to talk to someone

Be empathetic, non-judgmental, and age-appropriate for a student.`;

  return prompt;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(aiResponse: string): Omit<MoodTrackerResponse, 'moodTrend' | 'averageMood' | 'averageStress' | 'redFlags' | 'crisisResources'> {
  const response: Omit<MoodTrackerResponse, 'moodTrend' | 'averageMood' | 'averageStress' | 'redFlags' | 'crisisResources'> = {
    moodSummary: "",
    observations: [],
    encouragement: "",
    recommendations: [],
    whenToSeekHelp: [],
  };

  // Extract sections using regex patterns
  const moodSummaryMatch = aiResponse.match(/(?:Mood Summary|summary)[:：]([\s\S]*?)(?:\n\n|\n\*\*|\n[0-9]|\n-)/i);
  if (moodSummaryMatch) {
    response.moodSummary = moodSummaryMatch[1].trim();
  } else {
    response.moodSummary = aiResponse.split("\n\n")[0] || aiResponse.substring(0, 200);
  }

  // Extract observations
  const observationsMatch = aiResponse.match(/(?:Observations|observations|what affects|patterns)[:：]([\s\S]*?)(?:\n\n|\n\*\*|\n[0-9])/i);
  if (observationsMatch) {
    const observations = observationsMatch[1]
      .split(/[\n•\-\*]/)
      .map((s) => s.replace(/^\d+[\.\)]\s*/, "").replace(/^\*\*/, "").trim())
      .filter((s) => s.length > 0);
    response.observations = observations.slice(0, 5);
  }

  // Extract encouragement
  const encouragementMatch = aiResponse.match(/(?:Encouragement|encouragement|supportive message|message)[:：]([\s\S]*?)(?:\n\n|\n\*\*|\n[0-9])/i);
  if (encouragementMatch) {
    response.encouragement = encouragementMatch[1].trim();
  }

  // Extract recommendations
  const recommendationsMatch = aiResponse.match(/(?:Recommendations|recommendations|suggestions|wellness suggestions)[:：]([\s\S]*?)(?:\n\n|\n\*\*|\n[0-9]|\nWhen to Seek)/i);
  if (recommendationsMatch) {
    const recommendations = recommendationsMatch[1]
      .split(/[\n•\-\*]/)
      .map((s) => s.replace(/^\d+[\.\)]\s*/, "").replace(/^\*\*/, "").trim())
      .filter((s) => s.length > 0);
    response.recommendations = recommendations.slice(0, 6);
  }

  // Extract when to seek help
  const seekHelpMatch = aiResponse.match(/(?:When to Seek Help|seek help|when to talk|get help)[:：]([\s\S]*?)$/i);
  if (seekHelpMatch) {
    const seekHelp = seekHelpMatch[1]
      .split(/[\n•\-\*]/)
      .map((s) => s.replace(/^\d+[\.\)]\s*/, "").replace(/^\*\*/, "").trim())
      .filter((s) => s.length > 0);
    response.whenToSeekHelp = seekHelp.slice(0, 5);
  }

  return response;
}

/**
 * Generate fallback response when AI is unavailable
 */
function generateFallbackResponse(request: MoodTrackerRequest): Omit<MoodTrackerResponse, 'moodTrend' | 'averageMood' | 'averageStress'> {
  const { currentEntry, history = [], userName = "Student" } = request;
  const firstName = userName.split(" ")[0];

  const redFlags = detectRedFlags([...history, currentEntry]);
  const hasCrisisIndicators = redFlags.length > 0;

  return {
    moodSummary: hasCrisisIndicators
      ? `I notice you're going through a really tough time right now, ${firstName}. Your wellbeing matters, and there are people who want to help.`
      : `Thanks for checking in today, ${firstName}! Tracking your mood is a great step towards understanding yourself better.`,
    observations: history.length > 0
      ? [
          `Your average mood over ${history.length + 1} entries is ${calculateAverages([...history, currentEntry]).mood}/5`,
          currentEntry.stress && currentEntry.stress >= 4 ? "Stress levels seem elevated - this is common for students" : null,
          currentEntry.sleepHours && currentEntry.sleepHours < 6 ? "Sleep appears to be affecting your mood" : null,
          currentEntry.exercised ? "Great job staying active!" : "Exercise might help improve your mood",
        ].filter(Boolean) as string[]
      : ["This is your first entry - keep tracking to see patterns!"],
    encouragement: hasCrisisIndicators
      ? `Please remember that you don't have to face this alone. ${firstName}, there are people who care about you and want to support you through this difficult time.`
      : `${firstName}, remember that it's okay to have difficult days. What matters is that you're taking care of yourself by checking in. You're doing great!`,
    recommendations: [
      "Take 5 deep breaths when feeling overwhelmed",
      "Try to get at least 7-8 hours of sleep tonight",
      "Talk to a friend, family member, or counselor",
      "Take a short walk outside if possible",
      "Write down 3 things you're grateful for",
    ],
    whenToSeekHelp: [
      "If you feel sad or hopeless for more than 2 weeks",
      "If stress is affecting your daily life (sleep, school, relationships)",
      "If you have thoughts of hurting yourself",
      "If you feel overwhelmed and can't cope alone",
      "If you just need someone to talk to",
    ],
    redFlags,
    crisisResources: hasCrisisIndicators ? BHUTAN_CRISIS_RESOURCES : undefined,
  };
}

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * POST - Get AI-powered wellness insights
 */
export const POST = createApiRoute(
  async (req, auth) => {

    const body = await req.json() as MoodTrackerRequest;

    // Validate current entry
    if (!body.currentEntry) {
      return NextResponse.json(
        { error: "Current entry is required" },
        { status: 400 }
      );
    }

    if (!body.currentEntry.mood || body.currentEntry.mood < 1 || body.currentEntry.mood > 5) {
      return NextResponse.json(
        { error: "Mood rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const allEntries = [...(body.history || []), body.currentEntry];

    // Detect red flags first (before AI call for safety)
    const redFlags = detectRedFlags(allEntries);

    // Try to get AI response
    let parsedResponse;
    try {
      const prompt = buildWellnessPrompt({
        ...body,
        userName: "Student",
      });

      const aiResponse = await chatWithGemini(prompt, MOOD_TRACKER_SYSTEM);
      parsedResponse = parseAIResponse(aiResponse);
    } catch (aiError) {
      logger.apiError("AI Mood Tracker error, using fallback:", aiError);
      parsedResponse = generateFallbackResponse(body);
    }

    // Build final response
    const response: MoodTrackerResponse = {
      ...parsedResponse,
      redFlags,
      moodTrend: calculateMoodTrend(allEntries),
      averageMood: calculateAverages(allEntries).mood,
      averageStress: calculateAverages(allEntries).stress,
    };

    // Add crisis resources if there are red flags
    if (redFlags.length > 0) {
      response.crisisResources = BHUTAN_CRISIS_RESOURCES;
    }

    // Track AI interaction (non-blocking)
    safeTrackAIInteraction({
      userId: auth.userId,
      featureId: AI_FEATURE_IDS.MOOD_TRACKER,
      interactionData: {
        currentMood: body.currentEntry.mood,
        currentStress: body.currentEntry.stress,
        hasHistory: (body.history?.length || 0) > 0,
        historyLength: body.history?.length || 0,
        moodTrend: response.moodTrend,
        averageMood: response.averageMood,
        hasRedFlags: redFlags.length > 0,
        redFlagsCount: redFlags.length,
        hasCrisisIndicators: redFlags.length > 0,
      },
      metadata: {
        usedFallback: false,
        responseTimestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(response);
  },
  ['student']
);

/**
 * GET - Check API availability and provide info
 */
export const GET = createApiRoute(
  async () => {
    return {
      data: {
        available: true,
        feature: "AI Mood Tracker & Wellness Coach",
        description: "Track your mood and receive personalized wellness insights",
        requiresAuth: true,
        endpoints: {
          "POST /api/ai/mood-tracker": "Get AI-powered wellness analysis",
        },
        crisisResources: BHUTAN_CRISIS_RESOURCES,
      }
    };
  },
  []
);
