import { logger } from "@/lib/logger";
/**
 * GEMINI AI SERVER-SIDE SERVICE
 *
 * Server-side Google Gemini integration for AI features
 * This runs ONLY on the server to avoid SSR issues and keep API keys secure
 *
 * Usage: Import in API routes and server actions only
 * DO NOT import in client components
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { CAREER_COACH_SYSTEM } from "./prompts";

// ============================================================================
// CONFIGURATION
// ============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY && process.env.NODE_ENV === "production") {
  logger.warn("WARNING: GEMINI_API_KEY not set in production. AI features will use fallback responses.");
}

// Debug: Log if API key is loaded (in development)
if (process.env.NODE_ENV === "development") {
  logger.info("GEMINI_API_KEY status:", GEMINI_API_KEY ? "SET" : "NOT SET");
}

const generationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};

// Type for model initialization options
interface ModelOptions {
  model: string;
  generationConfig: typeof generationConfig;
  systemInstruction?: string;
}

// ============================================================================
// TYPES
// ============================================================================

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIContext {
  userName?: string;
  userRole?: string;
  hollandCode?: string | null;
  mbtiType?: string | null;
  topCareer?: string | null;
  careerMatchScore?: number | null;
  completedAssessments?: number;
  recentGrades?: number;
  // Journal-related fields for personalized AI responses
  recentJournalTopics?: string;
  journalEntryCount?: number;
  recentMoods?: string;
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  resources?: Array<{
    type: "article" | "video" | "assessment" | "career";
    title: string;
    url: string;
  }>;
  error?: boolean;
  fallback?: boolean;
}

// ============================================================================
// CORE GEMINI FUNCTIONS
// ============================================================================

/**
 * Initialize Gemini client (lazy loading)
 */
function getGeminiClient() {
  if (!GEMINI_API_KEY) {
    logger.warn("GEMINI_API_KEY is not set - returning null client");
    return null;
  }
  logger.debug("Creating Gemini client with API key");
  return new GoogleGenerativeAI(GEMINI_API_KEY);
}

/**
 * Chat with Gemini AI
 *
 * @param prompt - The user's message
 * @param systemPrompt - Optional system prompt for context
 * @returns AI response as string
 */
export async function chatWithGemini(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const client = getGeminiClient();

  if (!client) {
    throw new Error("Gemini API key not configured");
  }

  try {
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig,
      systemInstruction: systemPrompt || undefined,
    } as ModelOptions);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    logger.error("Gemini API error:", error);
    throw error;
  }
}

/**
 * Chat with Gemini using conversation history
 *
 * @param prompt - The user's message
 * @param conversationHistory - Previous messages for context
 * @param systemPrompt - Optional system prompt
 * @returns AI response as string
 */
export async function chatWithGeminiWithHistory(
  prompt: string,
  conversationHistory: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  const client = getGeminiClient();

  if (!client) {
    throw new Error("Gemini API key not configured");
  }

  try {
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig,
      systemInstruction: systemPrompt || undefined,
    } as ModelOptions);

    // Start a chat session with history
    const chat = model.startChat({
      history: conversationHistory.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    logger.error("Gemini API error:", error);
    throw error;
  }
}

// ============================================================================
// CAREER COACH FUNCTIONS
// ============================================================================

/**
 * Build context string for AI Career Coach
 */
function buildCareerCoachContext(context: AIContext): string {
  const parts: string[] = [];

  if (context.userName) {
    parts.push(`Student Name: ${context.userName}`);
  }

  if (context.hollandCode) {
    parts.push(`Holland Code (RIASEC): ${context.hollandCode}`);
  }

  if (context.mbtiType) {
    parts.push(`MBTI Personality Type: ${context.mbtiType}`);
  }

  if (context.topCareer) {
    parts.push(`Top Career Match: ${context.topCareer} (${context.careerMatchScore || 0}% compatibility)`);
  }

  if (context.completedAssessments !== undefined) {
    parts.push(`Assessments Completed: ${context.completedAssessments}`);
  }

  // Journal context for AI
  if (context.recentJournalTopics) {
    parts.push(`Recent Journal Topics: ${context.recentJournalTopics}`);
  }

  if (context.journalEntryCount !== undefined && context.journalEntryCount > 0) {
    parts.push(`Journal Entries: ${context.journalEntryCount} total`);
  }

  if (context.recentMoods) {
    parts.push(`Recent Moods: ${context.recentMoods}`);
  }

  return parts.length > 0 ? "\n\nSTUDENT CONTEXT:\n" + parts.join("\n") : "";
}

/**
 * Parse AI response to extract structured data
 */
function parseAIResponse(aiResponse: string): Omit<ChatResponse, "error" | "fallback"> {
  const response: Omit<ChatResponse, "error" | "fallback"> = {
    message: aiResponse,
    suggestions: [],
    resources: [],
  };

  // Extract suggestions (look for numbered lists or bullet points at the end)
  const suggestionPatterns = [
    /(?:suggestions?|recommend|you can|try|consider)[:：]([\s\S]+?)(?:\n\n|\n$|$)/i,
    /(?:here are|here's)?\s*(?:some|a few)?\s*(?:suggestions?|things you can)[:：]([\s\S]+?)(?:\n\n|\n$|$)/i,
  ];

  for (const pattern of suggestionPatterns) {
    const match = aiResponse.match(pattern);
    if (match) {
      const suggestions = match[1]
        .split(/[\n•\-\*]/)
        .map((s) => s.replace(/^\d+[\.\)]\s*/, "").trim())
        .filter((s) => s.length > 0);
      if (suggestions.length > 0) {
        response.suggestions = suggestions.slice(0, 4);
        break;
      }
    }
  }

  // Extract resources (look for links or resource mentions)
  const resourcePatterns = [
    /(?:resource|link|article|video)[:：]?\s*[\"']?([^\"'\n]+)[\"']?\s*(?:https?:\/\/[^\s]+)/gi,
  ];

  const resources: ChatResponse["resources"] = [];
  let resourceMatch;
  const resourceRegex = /(?:learn more|read|watch|visit)[:：]?\s+[\"']?([^\"'\n]+?)[\"']?\s*\((https?:\/\/[^\s)]+)\)/gi;

  while ((resourceMatch = resourceRegex.exec(aiResponse)) !== null) {
    resources.push({
      type: aiResponse.toLowerCase().includes("watch") ? "video" : "article",
      title: resourceMatch[1].trim(),
      url: resourceMatch[2],
    });
  }

  if (resources.length > 0) {
    response.resources = resources;
  }

  return response;
}

/**
 * Chat with AI Career Coach from server
 *
 * This is the main function for the AI Career Coach feature.
 * It uses Gemini to generate personalized career guidance.
 *
 * @param userMessage - The user's message
 * @param context - Student context (name, assessments, etc.)
 * @param conversationHistory - Previous messages for context
 * @returns Structured chat response with message, suggestions, and resources
 */
export async function chatWithCareerCoachFromServer(
  userMessage: string,
  context: AIContext = {},
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  logger.info("chatWithCareerCoachFromServer called", { messageLength: userMessage.length, hasHistory: conversationHistory.length > 0 });

  const client = getGeminiClient();

  // Fallback if API key not configured
  if (!client) {
    logger.warn("Gemini client is null - returning fallback response");
    return {
      message: getFallbackResponse(userMessage, context),
      suggestions: getFallbackSuggestions(context),
      fallback: true,
    };
  }

  logger.info("Calling Gemini API for career coach...");

  try {
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig,
      systemInstruction: CAREER_COACH_SYSTEM,
    } as ModelOptions);

    // Build the complete prompt with conversation history
    // We need to format the conversation properly for Gemini to understand
    let fullPrompt = "";

    if (conversationHistory && conversationHistory.length > 0) {
      // Format conversation for the prompt
      const formattedHistory = conversationHistory.map((msg, index) => {
        const roleLabel = msg.role === "assistant" ? "Career Coach" : "You";
        return `${roleLabel}: ${msg.content}`;
      }).join("\n\n");

      fullPrompt = `PREVIOUS CONVERSATION:\n\n${formattedHistory}\n\nCURRENT MESSAGE:\nYou: ${userMessage}`;
    } else {
      // First message
      fullPrompt = userMessage;
    }

    // Add context information
    const contextStr = buildCareerCoachContext(context);
    fullPrompt = `${fullPrompt}${contextStr}`;

    // Add instruction at the end
    fullPrompt += `

Please provide a helpful, encouraging response that directly addresses their question. If appropriate, include 2-3 follow-up suggestions at the end. Vary your responses - don't be repetitive.`;

    // Always use generateContent for consistent context handling
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiMessage = response.text();

    // Parse structured data from response
    const parsedResponse = parseAIResponse(aiMessage);

    return {
      ...parsedResponse,
      fallback: false,
    };
  } catch (error) {
    logger.error("AI Career Coach error:", error);

    // Return fallback response on error
    return {
      message: getFallbackResponse(userMessage, context),
      suggestions: getFallbackSuggestions(context),
      error: true,
      fallback: true,
    };
  }
}

// ============================================================================
// FALLBACK RESPONSES (used when Gemini is unavailable)
// ============================================================================

function getFallbackResponse(message: string, context: AIContext): string {
  const lowerMessage = message.toLowerCase();
  const firstName = context.userName?.split(" ")[0] || "Student";

  // Career-related queries
  if (lowerMessage.includes("career") || lowerMessage.includes("become") || lowerMessage.includes("want to be")) {
    if (context.topCareer) {
      return `Great question ${firstName}! Based on your assessments, **${context.topCareer}** is a great match for you with a ${context.careerMatchScore || 0}% compatibility score.\n\nYour ${context.hollandCode ? `Holland Code is ${context.hollandCode}` : "personality type"} shows strengths that align well with this career.\n\nWould you like me to explain why this career matches you, or would you like to see other options?`;
    }
    return `I'd love to help you find the right career ${firstName}! To give you the best recommendations, I need to understand your personality better.\n\nYou've completed ${context.completedAssessments || 0} assessment${context.completedAssessments === 1 ? "" : "s"}. Taking more assessments will help me find careers that truly fit you!\n\nTry starting with the RIASEC assessment - it's fun and reveals a lot about your interests.`;
  }

  // Skill/learning queries
  if (lowerMessage.includes("skill") || lowerMessage.includes("learn") || lowerMessage.includes("study") || lowerMessage.includes("improve")) {
    return `That's a great mindset ${firstName}! 🌟\n\nBuilding the right skills is crucial for career success. I can help you:\n\n1. **Identify skill gaps** - See what skills you need for your dream career\n2. **Create a study plan** - Personalized learning schedule\n3. **Find learning resources** - Curated content for your goals\n\nWhich would you like to start with?`;
  }

  // College/RUB queries
  if (lowerMessage.includes("college") || lowerMessage.includes("rub") || lowerMessage.includes("university") || lowerMessage.includes("admission")) {
    return `Royal University of Bhutan has excellent opportunities ${firstName}! 🎓\n\nI can help you:\n\n• **Find programs** that match your career goals\n• **Check eligibility** based on your marks\n• **Predict admission chances** for different colleges\n• **Understand requirements** for each program\n\nWhat field are you most interested in?`;
  }

  // Confusion/uncertainty queries
  if (lowerMessage.includes("confused") || lowerMessage.includes("don't know") || lowerMessage.includes("unsure") || lowerMessage.includes("no idea") || lowerMessage.includes("help me")) {
    return `It's completely okay to feel uncertain ${firstName}! You're not alone in this. 💚\n\nLet me help you find some clarity. The best way to discover your path is by understanding yourself better:\n\n1. **Your personality** - What comes naturally to you?\n2. **Your interests** - What do you enjoy doing?\n3. **Your strengths** - What are you good at?\n\nI recommend starting with our fun personality assessments. They'll help us discover careers that fit YOU!`;
  }

  // Default response
  return `Hi ${firstName}! 👋 I'm your Career Coach and I'm here to help you with anything related to your career and education journey.\n\n**Here's what I can help you with:**\n\n• 🎯 Find careers that match your personality\n• 📚 Plan what to study after Class 10/12\n• 🎓 Explore RUB colleges and programs\n• 💪 Discover and build your skills\n• 📝 Get help with applications and essays\n• 💬 Just chat about your future!\n\nWhat would you like to explore?`;
}

function getFallbackSuggestions(context: AIContext): string[] {
  const suggestions: string[] = [];

  if (!context.completedAssessments || context.completedAssessments === 0) {
    suggestions.push("Take the RIASEC assessment");
  } else if (context.completedAssessments < 3) {
    suggestions.push("Take more assessments for better matches");
  }

  if (!context.topCareer) {
    suggestions.push("What careers suit me?");
  } else {
    suggestions.push(`Tell me more about ${context.topCareer}`);
  }

  suggestions.push("What should I study after Class 12?");
  suggestions.push("Show me RUB programs");

  return suggestions.slice(0, 4);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { getGeminiClient };

export default {
  chatWithGemini,
  chatWithGeminiWithHistory,
  chatWithCareerCoachFromServer,
  isGeminiAvailable: () => !!GEMINI_API_KEY,
};
