/**
 * GEMINI AI INTEGRATION SERVICE - SSR SAFE
 *
 * Lazy-loads Google Gemini only when needed (client-side only)
 * Prevents SSR "location is not defined" errors
 */

// Generation configuration for safety and consistency
const generationConfig = {
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
// FALLBACK RESPONSES ONLY - NO GEMINI TO AVOID SSR ISSUES
// ============================================================================

/**
 * Chat with AI Career Coach
 * Returns intelligent fallback responses based on user context
 * Gemini integration available ONLY via /api/ai/career-coach endpoint
 */
export async function chatWithCareerCoach(
  userMessage: string,
  context: AIContext,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  // Return intelligent fallback response
  // Gemini is ONLY used server-side in /api/ai/career-coach route
  return {
    message: getFallbackResponse(userMessage, context),
    suggestions: getFallbackSuggestions(context),
    fallback: true,
  };
}

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
  return `Hi ${firstName}! 👋 I'm your Career Coach and I'm here to help you with anything related to your career and education journey.

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

  if (!context.completedAssessments || context.completedAssessments === 0) {
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

export function isGeminiAvailable(): boolean {
  return false; // Always false on client - use API route instead
}

export default {
  chatWithCareerCoach,
  isGeminiAvailable,
};
