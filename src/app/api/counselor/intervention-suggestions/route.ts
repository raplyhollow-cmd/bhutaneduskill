import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Type for AI suggestions
interface InterventionSuggestions {
  talkingPoints: string[];
  gnhAlignment: string[];
  resources: Array<{ title: string; description: string }>;
}

// POST /api/counselor/intervention-suggestions - Get AI-powered intervention suggestions
export const POST = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;

    const body = await req.json();
    const { studentId, behavioralTags, notes, severity, interventionType } = body;

    if (!studentId) {
      return { error: "Student ID is required", status: 400 } satisfies ApiErrorResponse;
    }

    // Check if Gemini API is configured
    if (!GEMINI_API_KEY) {
      // Return fallback suggestions when AI is not configured
      // These provide basic guidance when AI features are unavailable
      const mockSuggestions: InterventionSuggestions = {
        talkingPoints: [
          "Start by acknowledging the student's feelings and concerns",
          "Ask open-ended questions to understand their perspective",
          "Share observations about specific behaviors you've noticed",
          "Discuss how these behaviors might be affecting their goals",
        ],
        gnhAlignment: [
          "Psychological wellbeing - fostering emotional resilience",
          "Community vitality - strengthening peer relationships",
          "Time use - balancing academics with personal growth",
        ],
        resources: [
          {
            title: "School Counseling Resources",
            description: "Local counseling materials and worksheets",
          },
          {
            title: "Gross National Happiness Education",
            description: "GNH-aligned guidance for student wellbeing",
          },
        ],
      };
      return { data: { suggestions: mockSuggestions } } satisfies ApiSuccess<{ suggestions: InterventionSuggestions }>;
    }

    // Generate AI suggestions using Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a school counselor in Bhutan practicing GNH (Gross National Happiness) values.
A student has been flagged with the following observations:
- Behavioral tags: ${behavioralTags?.join(", ") || "None"}
- Severity: ${severity || "medium"}
- Notes: ${notes || "None"}
- Planned intervention: ${interventionType || "counseling session"}

Provide:
1. 3-4 talking points for the counseling session
2. GNH-aligned principles to focus on (3 items)
3. 2-3 relevant resources

Respond in JSON format:
{
  "talkingPoints": ["point1", "point2", "point3"],
  "gnhAlignment": ["principle1", "principle2", "principle3"],
  "resources": [{"title": "title", "description": "description"}]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse AI response
    let suggestions: InterventionSuggestions;
    try {
      // Extract JSON from response (may have markdown wrapper)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]) as InterventionSuggestions;
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      logger.error("Failed to parse AI response", { responseText, error: parseError });
      // Return fallback suggestions
      suggestions = {
        talkingPoints: [
          "Begin by creating a safe and welcoming environment",
          "Listen actively to understand the student's perspective",
          "Collaboratively identify goals and next steps",
        ],
        gnhAlignment: [
          "Emotional wellbeing - building resilience and self-awareness",
          "Social connection - strengthening peer support networks",
        ],
        resources: [
          {
            title: "School Counseling Services",
            description: "Professional support available on campus",
          },
        ],
      };
    }

    logger.info("AI intervention suggestions generated", { studentId });

    return { data: { suggestions } } satisfies ApiSuccess<{ suggestions: InterventionSuggestions }>;
  },
  ["counselor"]
);
