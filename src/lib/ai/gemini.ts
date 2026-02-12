/**
 * GEMINI AI INTEGRATION SERVICE
 *
 * Safe, error-free integration with Google Gemini API
 * Handles all AI features for Bhutan EduSkill
 *
 * FREE TIER: 1,500 requests/day
 */

import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";

// ============================================================================
// CONFIGURATION
// ============================================================================

// Get API key from environment with fallback
const API_KEY = process.env.GEMINI_API_KEY || "";

if (!API_KEY) {
  console.warn("[Gemini] GEMINI_API_KEY not found in environment variables");
}

// Initialize Gemini client
let genAI: GoogleGenerativeAI | null = null;

try {
  if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log("[Gemini] Client initialized successfully");
  }
} catch (error) {
  console.error("[Gemini] Failed to initialize Gemini client:", error);
}

// Generation configuration for safety and consistency
const generationConfig: GenerationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};

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
  recentGrades?: number[];
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
// ERROR HANDLING
// ============================================================================

class GeminiError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "GeminiError";
  }
}

function isGeminiAvailable(): boolean {
  return genAI !== null && API_KEY.length > 0;
}

// ============================================================================
// CAREER COACH - MAIN FEATURE
// ============================================================================

/**
 * Chat with AI Career Coach
 * This is the primary AI feature for students
 */
export async function chatWithCareerCoach(
  userMessage: string,
  context: AIContext,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  // Check if Gemini is available
  if (!isGeminiAvailable()) {
    return {
      message: getFallbackResponse(userMessage, context),
      suggestions: getFallbackSuggestions(context),
      error: false,
      fallback: true,
    };
  }

  try {
    // Get the model
    const model = genAI!.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig,
    });

    // Build the prompt with context
    const prompt = buildCareerCoachPrompt(userMessage, context, conversationHistory);

    console.log("[Gemini] Sending request...");

    // Generate response with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timeout after 30 seconds")), 30000);
    });

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]) as any;

    const response = result.response;
    const text = response.text();

    console.log("[Gemini] Response received, length:", text.length);

    // Parse the response for structured data
    return parseCareerCoachResponse(text, context);

  } catch (error: any) {
    console.error("[Gemini] Error in chatWithCareerCoach:", error);

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
// PROMPT BUILDING
// ============================================================================

function buildCareerCoachPrompt(
  userMessage: string,
  context: AIContext,
  conversationHistory: ChatMessage[]
): string {
  const firstName = context.userName?.split(" ")[0] || "Student";

  let prompt = `You are a friendly AI Career Coach for Bhutanese students. Your role is to help students discover their career path, choose the right subjects, and plan their future education at RUB (Royal University of Bhutan) or other institutions.

STUDENT PROFILE:
- Name: ${firstName}
- Role: ${context.userRole || "student"}
- Holland Code (RIASEC): ${context.hollandCode || "Not taken yet"}
- MBTI Type: ${context.mbtiType || "Not taken yet"}
- Top Career Match: ${context.topCareer || "None"}
- Match Score: ${context.careerMatchScore || 0}%
- Assessments Completed: ${context.completedAssessments || 0}

CONVERSATION HISTORY:
${conversationHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n")}

CURRENT MESSAGE: ${userMessage}

IMPORTANT GUIDELINES:
1. Be encouraging, positive, and supportive
2. Keep responses concise (under 200 words)
3. Use simple language suitable for Class 6-12 students
4. Reference their assessment results when relevant
5. Suggest specific careers that match their profile
6. Recommend they take assessments if they haven't
7. For RUB questions, mention specific colleges when possible
8. End with 2-3 specific follow-up questions as suggestions

Format your response as:
MESSAGE: [your friendly response]
SUGGESTIONS: [suggestion 1], [suggestion 2], [suggestion 3]
RESOURCES: [optional - type|title|url format]

Remember: You are helping Bhutanese students build their future. Be inspiring!`;

  return prompt;
}

// ============================================================================
// RESPONSE PARSING
// ============================================================================

function parseCareerCoachResponse(text: string, context: AIContext): ChatResponse {
  try {
    let message = text;
    const suggestions: string[] = [];
    const resources: Array<{ type: "article" | "video" | "assessment" | "career"; title: string; url: string }> = [];

    // Parse suggestions
    const suggestionsMatch = text.match(/SUGGESTIONS:\s*(.+?)(?:\n|$)/i);
    if (suggestionsMatch) {
      const suggestionsText = suggestionsMatch[1];
      const parsedSuggestions = suggestionsText.split(",").map(s => s.trim()).filter(s => s.length > 0);
      suggestions.push(...parsedSuggestions);
      // Remove suggestions line from message
      message = message.replace(/SUGGESTIONS:\s*.+?\n?/gi, "").trim();
    }

    // Parse resources
    const resourcesMatch = text.match(/RESOURCES:\s*(.+?)(?:\n\n|$)/i);
    if (resourcesMatch) {
      let resourcesText = resourcesMatch[1];

      // Handle multiline resources with simpler approach
      const lines = resourcesText.split("\n");
      const resourceLines = lines.filter(line => line.trim().length > 0 && !line.startsWith("RESOURCES"));

      for (const line of resourceLines) {
        const parts = line.split("|").map(p => p.trim());
        if (parts.length >= 2) {
          const resourceType = parts[0];
          const validTypes = ["article", "video", "assessment", "career"];
          resources.push({
            type: validTypes.includes(resourceType) ? resourceType as any : "article",
            title: parts[1],
            url: parts[2] || "#",
          });
        }
      }
      // Remove resources section from message - line by line
      const messageLines = message.split("\n");
      const filteredLines = messageLines.filter(line => {
        const trimmed = line.trim();
        return !trimmed.startsWith("RESOURCES") && !trimmed.includes("|");
      });
      message = filteredLines.join("\n").trim();
    }

    // Remove MESSAGE: prefix if present
    message = message.replace(/^MESSAGE:\s*/i, "").trim();

    // If no suggestions parsed, add default ones
    if (suggestions.length === 0) {
      suggestions.push(
        "Tell me more about my career options",
        "What should I study after Class 12?",
        "How can I improve my skills?"
      );
    }

    return {
      message,
      suggestions,
      resources,
    };

  } catch (error) {
    console.error("[Gemini] Error parsing response:", error);
    return {
      message: text,
      suggestions: [
        "Tell me more about my career options",
        "What should I study after Class 12?",
      ],
    };
  }
}

// ============================================================================
// FALLBACK RESPONSES (When API fails)
// ============================================================================

function getFallbackResponse(message: string, context: AIContext): string {
  const lowerMessage = message.toLowerCase();
  const firstName = context.userName?.split(" ")[0] || "Student";

  // Career-related queries
  if (lowerMessage.includes("career") || lowerMessage.includes("become") || lowerMessage.includes("want to be")) {
    if (context.topCareer) {
      return `Great question ${firstName}! Based on your assessments, **${context.topCareer}** is a great match for you with a ${context.careerMatchScore || 0}% compatibility score.

Your ${context.hollandCode ? `Holland Code is ${context.hollandCode}` : "personality type"} shows strengths that align well with this career.

Would you like me to explain why this career matches you, or would you like to see other options?`;
    }
    return `I'd love to help you find the right career ${firstName}! To give you the best recommendations, I need to understand your personality better.

You've completed ${context.completedAssessments || 0} assessment${context.completedAssessments === 1 ? "" : "s"}. Taking more assessments will help me find careers that truly fit you!

Try starting with the RIASEC assessment - it's fun and reveals a lot about your interests.`;
  }

  // Skill/learning queries
  if (lowerMessage.includes("skill") || lowerMessage.includes("learn") || lowerMessage.includes("study") || lowerMessage.includes("improve")) {
    return `That's a great mindset ${firstName}! 🌟

Building the right skills is crucial for career success. I can help you:

1. **Identify skill gaps** - See what skills you need for your dream career
2. **Create a study plan** - Personalized learning schedule
3. **Find learning resources** - Curated content for your goals

Which would you like to start with?`;
  }

  // College/RUB queries
  if (lowerMessage.includes("college") || lowerMessage.includes("rub") || lowerMessage.includes("university") || lowerMessage.includes("admission")) {
    return `Royal University of Bhutan has excellent opportunities ${firstName}! 🎓

I can help you:

• **Find programs** that match your career goals
• **Check eligibility** based on your marks
• **Predict admission chances** for different colleges
• **Understand requirements** for each program

What field are you most interested in?`;
  }

  // Confusion/uncertainty queries
  if (lowerMessage.includes("confused") || lowerMessage.includes("don't know") || lowerMessage.includes("unsure") || lowerMessage.includes("no idea") || lowerMessage.includes("help me")) {
    return `It's completely okay to feel uncertain ${firstName}! You're not alone in this. 💚

Let me help you find some clarity. The best way to discover your path is by understanding yourself better:

1. **Your personality** - What comes naturally to you?
2. **Your interests** - What do you enjoy doing?
3. **Your strengths** - What are you good at?

I recommend starting with our fun personality assessments. They'll help us discover careers that fit YOU!`;
  }

  // Default response
  return `Hi ${firstName}! 👋 I'm your AI Career Coach and I'm here to help you with anything related to your career and education journey.

**Here's what I can help you with:**

• 🎯 Find careers that match your personality
• 📚 Plan what to study after Class 10/12
• 🎓 Explore RUB colleges and programs
• 💪 Discover and build your skills
• 📝 Get help with applications and essays
• 💬 Just chat about your future!

What would you like to explore?`;
}

function getFallbackSuggestions(context: AIContext): string[] {
  const suggestions: string[] = [];

  if (context.completedAssessments === 0) {
    suggestions.push("Take the RIASEC assessment");
  } else if (context.completedAssessments < 3) {
    suggestions.push("Take more assessments for better matches");
  }

  if (!context.topCareer) {
    suggestions.push("What careers suit me?");
  } else {
    suggestions.push("Tell me more about " + context.topCareer);
  }

  suggestions.push("What should I study after Class 12?");
  suggestions.push("Show me RUB programs");

  return suggestions.slice(0, 4);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  isGeminiAvailable,
  GeminiError,
};

export default {
  chatWithCareerCoach,
  isGeminiAvailable,
};
