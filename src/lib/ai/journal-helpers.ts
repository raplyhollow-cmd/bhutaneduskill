import { logger } from "@/lib/logger";
import { chatWithGemini, type ChatMessage } from "./gemini-server";
import { JOURNAL_AI_SYSTEM } from "./prompts";

// ============================================================================
// TYPES
// ============================================================================

export interface JournalContext {
  userName?: string;
  interests?: string[];
  recentMood?: string;
  pastTopics?: string[];
  careerMatches?: string[];
  completedAssessments?: number;
}

export interface AIInsightResponse {
  prompt?: string;
  suggestions?: string[];
  feedback?: string;
  tags?: string[];
  summary?: string;
}

// ============================================================================
// FALLBACK RESPONSES (when Gemini is unavailable)
// ============================================================================

function getFallbackPrompt(): string {
  const fallbacks = [
    "What's something new you learned about yourself today?",
    "Describe a moment when you felt proud of your efforts.",
    "What skill would you like to develop this month?",
    "Write about a person who inspires you and why.",
    "What's one goal you're working towards?",
    "Describe a challenge you overcame recently.",
    "What subjects do you enjoy most in school?",
    "How do you want to grow this year?",
    "What makes you feel motivated?",
    "Who supports you in your journey?",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

function getFallbackTags(): string[] {
  const tagSets = [
    ["Career Goals", "Skills", "Progress"],
    ["Achievement", "Learning", "Growth"],
    ["Future", "Dreams", "Interests"],
    ["School", "Challenge", "Reflection"],
    ["Wellness", "Feelings", "Goals"],
  ];
  return tagSets[Math.floor(Math.random() * tagSets.length)];
}

function getFallbackFeedback(): string {
  const feedbacks = [
    "Thanks for journaling! Reflecting on your thoughts helps you understand yourself better.",
    "Great job taking time to write! Every entry is a step forward.",
    "Your journal is a safe space to be yourself. Keep writing!",
    "Journaling helps you track your growth. You're doing great!",
    "Your thoughts matter. Thanks for sharing them in your journal.",
  ];
  return feedbacks[Math.floor(Math.random() * feedbacks.length)];
}

// ============================================================================
// AI HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a personalized journaling prompt based on student context
 */
export async function generatePersonalizedPrompt(context?: JournalContext): Promise<string> {
  try {
    const client = await import("@/lib/ai/gemini-server").then(m => m.getGeminiClient?.());

    if (!client) {
      return getFallbackPrompt();
    }

    const prompt = `Generate ONE personalized journaling prompt for a Bhutanese student.

Context:
- Name: ${context?.userName || "Student"}
- Career interests: ${context?.interests?.join(", ") || "not specified"}
- Recent mood: ${context?.recentMood || "neutral"}
- Past topics: ${context?.pastTopics?.slice(0, 3).join(", ") || "various"}
- Completed assessments: ${context?.completedAssessments || 0}

Generate a THOUGHT-PROVOKING prompt that encourages self-reflection.
Keep it under 20 words.
Make it specific to their interests when possible.

Return ONLY the prompt text, nothing else.`;

    const response = await client.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: JOURNAL_AI_SYSTEM,
    }).generateContent(prompt);

    return response.response.text();
  } catch (error) {
    logger.error("Failed to generate AI prompt, using fallback", error);
    return getFallbackPrompt();
  }
}

/**
 * Suggest tags based on journal content analysis
 */
export async function suggestTags(content: string): Promise<string[]> {
  try {
    const client = await import("@/lib/ai/gemini-server").then(m => m.getGeminiClient?.());

    if (!client) {
      return getFallbackTags();
    }

    const prompt = `Analyze this journal entry and suggest 3-5 relevant tags.

Available tags: Career Goals, Skills, Achievement, Challenge, School, Future, Interests, Dreams, Progress, Wellness, Relationships, Hobbies, Learning, Growth.

Journal content (first 500 characters):
"${content.substring(0, 500)}"

Return ONLY a comma-separated list of tags. Maximum 5 tags.
Do not include any explanation, just the tags.`;

    const response = await client.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    }).generateContent(prompt);

    const tags = response.response.text()
      .split(",")
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0)
      .slice(0, 5);

    return tags.length > 0 ? tags : getFallbackTags();
  } catch (error) {
    logger.error("Failed to generate AI tags, using fallback", error);
    return getFallbackTags();
  }
}

/**
 * Get writing suggestions to help student deepen their reflection
 */
export async function getWritingSuggestions(content: string): Promise<string[]> {
  try {
    const client = await import("@/lib/ai/gemini-server").then(m => m.getGeminiClient?.());

    if (!client) {
      return ["Try to add more details to your entry.", "Reflect on how this makes you feel."];
    }

    const prompt = `A student wrote this in their journal:
"${content.substring(0, 300)}"

Provide 2-3 gentle suggestions to help them deepen their reflection.
Each suggestion should be a short question or prompt (under 15 words).
Focus on: going deeper, connecting to goals, or exploring feelings.

Return only the suggestions, one per line. No introduction.`;

    const response = await client.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    }).generateContent(prompt);

    return response.response.text()
      .split("\n")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0)
      .slice(0, 3);
  } catch (error) {
    logger.error("Failed to generate writing suggestions", error);
    return ["Try to add more details to your entry.", "Reflect on how this makes you feel."];
  }
}

/**
 * Generate encouraging feedback after saving a journal entry
 */
export async function generateEntryFeedback(entry: {
  title: string;
  content: string;
  mood: string;
}): Promise<string> {
  try {
    const client = await import("@/lib/ai/gemini-server").then(m => m.getGeminiClient?.());

    if (!client) {
      return getFallbackFeedback();
    }

    const prompt = `A student just saved this journal entry:
Title: "${entry.title}"
Mood: ${entry.mood}
Content: "${entry.content.substring(0, 200)}..."

Generate ONE encouraging message (under 30 words) that:
1. Acknowledges their effort in journaling
2. Validates their feelings
3. Offers gentle encouragement

Return only the message, nothing else.`;

    const response = await client.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: JOURNAL_AI_SYSTEM,
    }).generateContent(prompt);

    return response.response.text();
  } catch (error) {
    logger.error("Failed to generate AI feedback, using fallback", error);
    return getFallbackFeedback();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  generatePersonalizedPrompt,
  suggestTags,
  getWritingSuggestions,
  generateEntryFeedback,
};
