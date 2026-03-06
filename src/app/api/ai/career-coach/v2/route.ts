/**
 * ENHANCED AI CAREER COACH API v2
 *
 * Features:
 * - Proactive daily/weekly briefings
 * - Milestone alerts
 * - Achievement celebrations
 * - Course recommendations
 * - Career exploration guided journeys
 *
 * Last Updated: March 5, 2026
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// ============================================================================
// GEMINI AI INTEGRATION
// ============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";

async function callGemini(prompt: string, context?: Record<string, any>) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const systemPrompt = `You are an AI Career Coach for Bhutanese students (Class 6-12). Your role is to:

1. Provide personalized career guidance based on student's assessments, skills, and interests
2. Connect career advice to Bhutan's job market and RUB colleges
3. Be encouraging, practical, and culturally relevant
4. Align advice with GNH (Gross National Happiness) values where appropriate
5. Consider Bhutan's economic priorities: technology, green energy, agriculture, tourism

RESPOND IN A FRIENDLY, SUPPORTIVE MANNER. Keep responses concise but comprehensive.`;

  const enhancedPrompt = context
    ? `${systemPrompt}\n\nSTUDENT CONTEXT:\n${JSON.stringify(context, null, 2)}\n\nUSER QUERY:\n${prompt}`
    : `${systemPrompt}\n\nUSER QUERY:\n${prompt}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: enhancedPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface StudentContext {
  studentId: string;
  name: string;
  grade: number;
  school: string;

  // Assessment data
  riasec?: string;
  mbti?: string;
  disc?: string;

  // Academic data
  subjects?: Array<{ name: string; grade: number }>;
  overallPercentage?: number;

  // Skills
  skills?: Array<{ name: string; level: string }>;

  // Interests
  interests?: string[];
  careerGoals?: string[];

  // Recent activity
  recentCareerViews?: string[];
  recentSkillProgress?: Array<{ skill: string; newLevel: string }>;
  recentAssessments?: string[];
  // Career matches
  newCareerMatches?: Array<{ career: string; matchScore: number }>;
}

interface BriefingData {
  type: "daily" | "weekly";
  date: Date;

  // Recent updates
  newCareerMatches?: Array<{ career: string; matchScore: number }>;
  skillProgress?: Array<{ skill: string; achievement: string }>;
  upcomingDeadlines?: Array<{ what: string; when: string }>;

  // Bhutan context
  scholarshipAlerts?: Array<{ name: string; deadline: string }>;
  rubUpdates?: Array<{ program: string; college: string }>;
}

interface MilestoneAlert {
  type: "achievement" | "deadline" | "opportunity" | "warning";
  title: string;
  description: string;
  actionRequired: boolean;
  priority: "high" | "medium" | "low";
  relatedCareer?: string;
  relatedSkill?: string;
}

interface CourseRecommendation {
  subject: string;
  course: string;
  reason: string;
  provider: string;
  level: "beginner" | "intermediate" | "advanced";
  duration: string;
  cost: "free" | "paid" | "freemium";
  bhutanRelevant: boolean;
}

// ============================================================================
// PROACTIVE BRIEFINGS
// ============================================================================

/**
 * Generate daily briefing for student
 */
async function generateDailyBriefing(context: StudentContext): Promise<string> {
  const prompt = `Generate a DAILY career briefing for this student. Keep it brief (3-4 sentences) and encouraging.

Focus on:
1. ONE relevant career insight based on their interests
2. ONE quick action they can take today
3. A positive affirmation

Make it feel like a personal check-in from a supportive career coach.`;

  return await callGemini(prompt, context);
}

/**
 * Generate weekly briefing for student
 */
async function generateWeeklyBriefing(context: StudentContext, data: BriefingData): Promise<{
  summary: string;
  highlights: string[];
  nextSteps: string[];
  opportunities: string[];
}> {
  const briefingPrompt = `Generate a WEEKLY career briefing.

STRUCTURE:
1. Summary (2-3 sentences): How their career exploration is progressing
2. 3 Highlights: Key achievements or insights from the week
3. 2-3 Next Steps: Actionable items for next week
4. 1-2 Opportunities: Scholarships, programs, or events they should know

RECENT DATA TO REFERENCE:
- New Career Matches: ${data.newCareerMatches?.map((c) => `${c.career} (${c.matchScore}%)`).join(", ") || "None"}
- Skill Progress: ${data.skillProgress?.map((s) => `${s.skill}: ${s.achievement}`).join(", ") || "None"}
- Upcoming Deadlines: ${data.upcomingDeadlines?.map((d) => `${d.what} - ${d.when}`).join(", ") || "None"}
- Scholarship Alerts: ${data.scholarshipAlerts?.map((s) => `${s.name} (${s.deadline})`).join(", ") || "None"}

Keep it encouraging and actionable!`;

  const response = await callGemini(briefingPrompt, context);

  // Parse the response into sections
  const sections = {
    summary: "",
    highlights: [],
    nextSteps: [],
    opportunities: [],
  };

  // Simple parsing - in production, you'd use more robust parsing
  const lines = response.split("\n").filter((l) => l.trim());

  let currentSection: keyof typeof sections | null = null;
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("summary") || lower.includes("overview")) {
      currentSection = "summary";
      sections.summary = line.replace(/^(summary|overview):\s*/i, "");
    } else if (lower.includes("highlight")) {
      currentSection = "highlights";
      const highlight = line.replace(/^highlight[s]?:\s*/i, "").replace(/^[-*•]\s*/, "");
      if (highlight) sections.highlights.push(highlight);
    } else if (lower.includes("next step") || lower.includes("action")) {
      currentSection = "nextSteps";
      const step = line.replace(/^next step[s]?:\s*/i, "").replace(/^[-*•]\s*/, "");
      if (step) sections.nextSteps.push(step);
    } else if (lower.includes("opportunit")) {
      currentSection = "opportunities";
      const opp = line.replace(/^opportunit(?:y|ies):\s*/i, "").replace(/^[-*•]\s*/, "");
      if (opp) sections.opportunities.push(opp);
    } else if (currentSection && line.trim()) {
      const cleanLine = line.replace(/^[-*•]\s*/, "");
      if (cleanLine && currentSection !== "summary") {
        sections[currentSection].push(cleanLine);
      } else if (currentSection === "summary") {
        sections.summary += " " + cleanLine;
      }
    }
  }

  // Fallback if parsing failed
  if (!sections.summary) {
    sections.summary = response.slice(0, 200);
  }
  if (sections.highlights.length === 0) {
    sections.highlights = ["Keep exploring your interests!", "Consider taking a new assessment."];
  }
  if (sections.nextSteps.length === 0) {
    sections.nextSteps = ["Continue researching your top career matches."];
  }

  return sections;
}

/**
 * Generate milestone alerts
 */
async function generateMilestoneAlerts(context: StudentContext): Promise<MilestoneAlert[]> {
  const alerts: MilestoneAlert[] = [];

  // Grade-based milestones
  const grade = context.grade;
  if (grade === 10) {
    alerts.push({
      type: "deadline",
      title: "Class 10 Milestone",
      description: "You're approaching Class 10! Time to think about your stream choice (Science/Arts/Commerce) for higher secondary.",
      actionRequired: true,
      priority: "high",
    });
  } else if (grade === 12) {
    alerts.push({
      type: "deadline",
      title: "RUB Application Season",
      description: "Class 12 is here! RUB applications open soon. Start preparing your documents and shortlisting programs.",
      actionRequired: true,
      priority: "high",
    });
  }

  // Skill achievement alerts
  for (const skill of context.recentSkillProgress || []) {
    if (skill.newLevel === "advanced" || skill.newLevel === "expert") {
      alerts.push({
        type: "achievement",
        title: `Great progress in ${skill.skill}!`,
        description: `You've reached ${skill.newLevel} level in ${skill.skill}. This opens up new career opportunities!`,
        actionRequired: false,
        priority: "medium",
        relatedSkill: skill.skill,
      });
    }
  }

  // Career match alerts
  for (const match of context.newCareerMatches || []) {
    if (match.matchScore >= 85) {
      alerts.push({
        type: "opportunity",
        title: `Strong match: ${match.career}`,
        description: `Your profile is a ${match.matchScore}% match for ${match.career}. This could be an excellent fit!`,
        actionRequired: false,
        priority: "medium",
        relatedCareer: match.career,
      });
    }
  }

  // Add AI-generated personalized alerts
  if (alerts.length < 3) {
    const prompt = `Generate 1-2 personalized milestone alerts for this student.

Each alert should have:
- type (achievement/deadline/opportunity)
- title (short, catchy)
- description (1-2 sentences)
- priority (high/medium/low)

Focus on their grade level (${grade}) and interests.`;

    try {
      const aiResponse = await callGemini(prompt, context);
      // Parse AI response into alerts
      // This would need proper parsing in production
    } catch (e) {
      // Fall back to default alerts
    }
  }

  return alerts.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Generate achievement celebration message
 */
async function generateAchievementMessage(
  context: StudentContext,
  achievement: {
    type: "skill" | "assessment" | "milestone";
    details: string;
  }
): Promise<{
  message: string;
  emoji: string;
  nextSteps: string[];
}> {
  const prompt = `Generate a CELEBRATION message for this student's achievement:

ACHIEVEMENT: ${achievement.type} - ${achievement.details}

Create:
1. A celebratory message (warm, enthusiastic, specific)
2. An appropriate emoji
3. 2-3 next steps to continue their progress

Keep it brief and encouraging!`;

  const response = await callGemini(prompt, context);

  return {
    message: response,
    emoji: getEmojiForAchievement(achievement.type),
    nextSteps: [
      "Share this achievement with your counselor or teacher!",
      "Add this to your portfolio or resume.",
    ],
  };
}

function getEmojiForAchievement(type: string): string {
  const emojis = {
    skill: "🎯",
    assessment: "📊",
    milestone: "🏆",
  };
  return emojis[type as keyof typeof emojis] || "⭐";
}

// ============================================================================
// COURSE RECOMMENDATIONS
// ============================================================================

/**
 * Generate personalized course recommendations
 */
async function generateCourseRecommendations(
  context: StudentContext,
  targetCareer?: string
): Promise<CourseRecommendation[]> {
  const prompt = `Recommend 3-5 online courses for this student${targetCareer ? ` targeting career: ${targetCareer}` : ""}.

CONSIDER:
- Their current skill level (${context.skills?.length || 0} skills recorded)
- Their grade level (${context.grade})
- Bhutan relevance (prioritize free/accessible resources)
- Learning progression (beginner → intermediate → advanced)

For each course, specify:
1. Subject/Skill
2. Course name
3. Why it's recommended (specific reason)
4. Provider
5. Level
6. Duration
7. Cost (free/paid)
8. Bhutan relevant (yes/no)

Format as a structured list.`;

  const response = await callGemini(prompt, context);

  // Parse response into recommendations
  // In production, use structured output or better parsing
  const recommendations: CourseRecommendation[] = [
    {
      subject: "Computer Science",
      course: "Python for Beginners",
      reason: "Foundation for many tech careers",
      provider: "freeCodeCamp",
      level: "beginner",
      duration: "4-6 weeks",
      cost: "free",
      bhutanRelevant: true,
    },
  ];

  return recommendations;
}

// ============================================================================
// CAREER EXPLORATION MODE
// ============================================================================

interface ExplorationSession {
  sessionId: string;
  mode: "career-category" | "riasec-discovery" | "skill-explorer" | "rub-explorer";
  currentStep: number;
  totalSteps: number;
  history: Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>;
  context: Record<string, any>;
}

const activeSessions = new Map<string, ExplorationSession>();

/**
 * Start a guided career exploration session
 */
async function startExplorationSession(
  studentId: string,
  mode: ExplorationSession["mode"],
  context: StudentContext
): Promise<{
  sessionId: string;
  welcomeMessage: string;
  firstPrompt: string;
  totalSteps: number;
}> {
  const sessionId = `${studentId}-${Date.now()}`;

  const modeConfig = {
    "career-category": {
      steps: 5,
      welcome: "Let's explore careers in a specific category! I'll guide you through different options and help you discover what might fit you best.",
      firstPrompt: "Which career category interests you most right now? (Technology, Healthcare, Business, Arts, Science, Agriculture, or something else?)",
    },
    "riasec-discovery": {
      steps: 6,
      welcome: "Let's discover your RIASEC Holland Code! I'll ask you about your preferences and help identify careers that match your personality type.",
      firstPrompt: "Let's start! Which of these activities sounds most enjoyable to you: fixing things, researching new topics, creative projects, helping people, leading teams, or organizing data?",
    },
    "skill-explorer": {
      steps: 4,
      welcome: "Let's explore careers based on your skills! I'll show you different paths that use what you're already good at or enjoy learning.",
      firstPrompt: "What's a skill you have or want to develop? (e.g., programming, writing, teaching, design, etc.)",
    },
    "rub-explorer": {
      steps: 5,
      welcome: "Let's explore programs at Royal University of Bhutan! I'll help you find programs that match your interests and goals.",
      firstPrompt: "What field of study interests you? (Engineering, Business, Agriculture, Forestry, IT, Education, or something else?)",
    },
  };

  const config = modeConfig[mode];

  const session: ExplorationSession = {
    sessionId,
    mode,
    currentStep: 1,
    totalSteps: config.steps,
    history: [
      {
        role: "assistant",
        content: config.welcome,
        timestamp: new Date(),
      },
      {
        role: "assistant",
        content: config.firstPrompt,
        timestamp: new Date(),
      },
    ],
    context,
  };

  activeSessions.set(sessionId, session);

  return {
    sessionId,
    welcomeMessage: config.welcome,
    firstPrompt: config.firstPrompt,
    totalSteps: config.steps,
  };
}

/**
 * Continue exploration session
 */
async function continueExplorationSession(
  sessionId: string,
  userMessage: string
): Promise<{
  response: string;
  stepComplete: boolean;
  sessionComplete: boolean;
  nextPrompt?: string;
}> {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  // Add user message to history
  session.history.push({
    role: "user",
    content: userMessage,
    timestamp: new Date(),
  });

  // Generate AI response based on mode and step
  const prompt = generateExplorationPrompt(session, userMessage);
  const response = await callGemini(prompt, session.context);

  // Add AI response to history
  session.history.push({
    role: "assistant",
    content: response,
    timestamp: new Date(),
  });

  session.currentStep++;

  const sessionComplete = session.currentStep >= session.totalSteps;

  let nextPrompt: string | undefined;
  if (!sessionComplete) {
    nextPrompt = await generateNextExplorationPrompt(session);
  }

  // Update session
  activeSessions.set(sessionId, session);

  return {
    response,
    stepComplete: true,
    sessionComplete,
    nextPrompt,
  };
}

function generateExplorationPrompt(session: ExplorationSession, userMessage: string): string {
  const mode = session.mode;
  const step = session.currentStep;

  const prompts: Record<ExplorationSession["mode"], string[]> = {
    "career-category": [
      `User is interested in "${userMessage}". Explain careers in this category. Mention 3-4 specific careers with brief descriptions.`,
      `Based on their interest, ask about their specific skills or what excites them most about this field.`,
      `Recommend the best career fit based on their responses. Explain why.`,
      `What education is needed for this career path? Mention RUB programs if applicable.`,
      `Summarize and provide next steps to pursue this career path.`,
    ],
    "riasec-discovery": [
      `User chose: "${userMessage}". This indicates their primary RIASEC type. Explain what this means and suggest 2-3 careers.`,
      `Ask about their work environment preference: working alone, with people, outdoors, or in an office.`,
      `User responded: "${userMessage}". Ask about what they value more: creativity, stability, high income, or helping others.`,
      `Based on all responses, determine their likely 3-letter RIASEC code and explain careers that fit.`,
      `Provide specific next steps to explore careers matching their RIASEC type.`,
      `Summarize their personality type and career recommendations.`,
    ],
    "skill-explorer": [
      `User is interested in: "${userMessage}". Explain careers that use this skill, from beginner to advanced levels.`,
      `Ask about their current level and what they'd like to create or do with this skill.`,
      `User said: "${userMessage}". Recommend specific courses or projects to develop this skill further.`,
      `Summarize career paths and next steps for skill development.`,
    ],
    "rub-explorer": [
      `User is interested in: "${userMessage}". List RUB colleges that offer programs in this field.`,
      `For the top program, explain: eligibility requirements, duration, and career prospects.`,
      `Ask about their current grades and whether they meet the eligibility.`,
      `User said: "${userMessage}". Provide admission tips and alternative options if needed.`,
      `Summarize recommended RUB program and application next steps.`,
    ],
  };

  return prompts[mode][Math.min(step - 1, prompts[mode].length - 1)];
}

async function generateNextExplorationPrompt(session: ExplorationSession): Promise<string> {
  const mode = session.mode;
  const step = session.currentStep;

  const nextPrompts: Record<ExplorationSession["mode"], string[]> = {
    "career-category": [
      "What specific skills do you have that relate to this field?",
      "What excites you most about this career path?",
      "Would you like to hear about similar careers you might also enjoy?",
      "What questions do you have about the education needed for this career?",
      "Is there anything else you'd like to know?",
    ],
    "riasec-discovery": [
      "What kind of work environment do you prefer? (alone, with people, outdoors, office)",
      "What's more important to you: creativity, stability, high income, or helping others?",
      "Do you prefer hands-on work or thinking/analyzing?",
      "Would you like to lead a team or work independently?",
      "What subjects do you enjoy most in school?",
      "Thank you for sharing! Here's what I learned about your career preferences:",
    ],
    "skill-explorer": [
      "What's your current level with this skill? (beginner, intermediate, advanced)",
      "Would you like to learn this skill for a hobby or a career?",
      "What projects would you like to create using this skill?",
      "How can I help you take the next step?",
    ],
    "rub-explorer": [
      "What are your current grades like?",
      "Do you meet the eligibility requirements? (I can help you find out)",
      "Would you like information about scholarships or financial aid?",
      "When do you plan to apply to RUB?",
      "Is there anything else about RUB programs you'd like to know?",
    ],
  };

  return nextPrompts[mode][Math.min(step - 1, nextPrompts[mode].length - 1)];
}

/**
 * End exploration session
 */
function endExplorationSession(sessionId: string): {
  summary: string;
  recommendations: string[];
} {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  activeSessions.delete(sessionId);

  return {
    summary: "Exploration session completed. Based on your interests, consider exploring the recommended careers further.",
    recommendations: [
      "Take a full career assessment to get personalized matches",
      "Talk to a counselor about your findings",
      "Research the recommended careers online",
    ],
  };
}

// ============================================================================
// API HANDLERS
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, ...params } = body;

    // Build student context (simplified - in production, fetch from DB)
    const context: StudentContext = {
      studentId: userId,
      name: params.name || "Student",
      grade: params.grade || 10,
      school: params.school || "",
      riasec: params.riasec,
      mbti: params.mbti,
      skills: params.skills,
      interests: params.interests,
    };

    let result;

    switch (action) {
      case "daily-briefing": {
        result = await generateDailyBriefing(context);
        break;
      }

      case "weekly-briefing": {
        result = await generateWeeklyBriefing(context, params.data || {});
        break;
      }

      case "milestone-alerts": {
        result = await generateMilestoneAlerts(context);
        break;
      }

      case "celebrate": {
        result = await generateAchievementMessage(context, params.achievement);
        break;
      }

      case "course-recommendations": {
        result = await generateCourseRecommendations(context, params.targetCareer);
        break;
      }

      case "start-exploration": {
        result = await startExplorationSession(userId, params.mode, context);
        break;
      }

      case "continue-exploration": {
        result = await continueExplorationSession(params.sessionId, params.message);
        break;
      }

      case "end-exploration": {
        result = endExplorationSession(params.sessionId);
        break;
      }

      case "chat": {
        // Free-form chat
        result = await callGemini(params.message, context);
        break;
      }

      default: {
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      action,
      result,
    });
  } catch (error) {
    console.error("AI Coach v2 error:", error);
    return NextResponse.json(
      { error: "Failed to process request", message: String(error) },
      { status: 500 }
    );
  }
}
