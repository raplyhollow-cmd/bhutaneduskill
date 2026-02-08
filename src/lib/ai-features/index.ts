/**
 * AI-POWERED FEATURES SYSTEM
 *
 * The key to making the platform tempting for schools, teachers, and students
 * while generating valuable data insights for the company.
 *
 * PHILOSOPHY: AI features should be SO useful that users WANT to use the platform,
 * which naturally creates the data asset we need.
 *
 * Features:
 * 1. AI Career Coach - Personalized guidance chatbot
 * 2. AI Career Path Predictor - ML-based career recommendations
 * 3. AI Skill Gap Analyzer - Identify learning needs
 * 4. AI Essay/Statement Review - Help with applications
 * 5. AI Study Planner - Personalized learning schedules
 * 6. AI Mood & Motivation Tracker - Wellness insights
 * 7. AI Interview Coach - Practice for interviews
 * 8. AI Scholarship Matcher - Find funding opportunities
 */

import { db } from "@/lib/db";
import { users, assessments, careerMatches, riasecResults, mbtiResults, examResults } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// ============================================================================
// AI FEATURE CONFIGURATIONS
// ============================================================================

export interface AIFeature {
  id: string;
  name: string;
  description: string;
  category: "guidance" | "prediction" | "learning" | "wellness" | "application";
  icon: string;
  targetRoles: string[];
  dataPoints: string[]; // What data this feature generates
  temptFactor: string; // Why users will love this
}

export const aiFeatures: AIFeature[] = [
  {
    id: "ai-career-coach",
    name: "AI Career Coach",
    description: "24/7 personalized career guidance chatbot that knows your profile",
    category: "guidance",
    icon: "bot",
    targetRoles: ["student", "teacher", "parent"],
    dataPoints: ["queries", "career_interests", "concerns", "engagement_time", "follow_up_actions"],
    temptFactor: "Like having a personal career counselor available anytime - students love asking questions without judgment",
  },
  {
    id: "ai-career-predictor",
    name: "AI Career Path Predictor",
    description: "ML-powered prediction of your future career success based on your profile",
    category: "prediction",
    icon: "trending_up",
    targetRoles: ["student", "counselor", "parent"],
    dataPoints: ["career_confidence", "path_exploration", "prediction_accuracy", "corrections_made"],
    temptFactor: "Students get excited seeing their 'future success probability' - highly shareable and motivating",
  },
  {
    id: "ai-skill-gap",
    name: "AI Skill Gap Analyzer",
    description: "Identifies exactly what skills you need for your dream career",
    category: "learning",
    icon: "zap",
    targetRoles: ["student", "teacher"],
    dataPoints: ["skill_assessments", "learning_paths", "resource_clicks", "progress_tracking"],
    temptFactor: "Shows a clear roadmap - 'You're 70% ready for Computer Engineering, here's what's missing'",
  },
  {
    id: "ai-essay-reviewer",
    name: "AI Essay & Statement Review",
    description: "Get instant feedback on college essays and personal statements",
    category: "application",
    icon: "edit",
    targetRoles: ["student", "teacher"],
    dataPoints: ["essay_topics", "writing_quality", "improvement_areas", "submission_readiness"],
    temptFactor: "Free AI essay editing - students applying to colleges NEED this",
  },
  {
    id: "ai-study-planner",
    name: "AI Study Planner",
    description: "Generates personalized study schedules based on your goals and habits",
    category: "learning",
    icon: "calendar",
    targetRoles: ["student", "teacher", "parent"],
    dataPoints: ["study_patterns", "goal_setting", "completion_rates", "optimal_study_times"],
    temptFactor: "Tells students WHEN they study best and creates a perfect schedule automatically",
  },
  {
    id: "ai-mood-tracker",
    name: "AI Mood & Motivation Tracker",
    description: "Track emotional wellness and get personalized encouragement",
    category: "wellness",
    icon: "heart",
    targetRoles: ["student", "counselor", "parent"],
    dataPoints: ["mood_patterns", "stress_triggers", "motivation_levels", "intervention_points"],
    temptFactor: "Students enjoy tracking their mood and getting supportive messages - builds trust",
  },
  {
    id: "ai-interview-coach",
    name: "AI Interview Coach",
    description: "Practice interviews with AI for college admissions and jobs",
    category: "application",
    icon: "message_circle",
    targetRoles: ["student", "counselor"],
    dataPoints: ["interview_topics", "confidence_levels", "improvement_areas", "practice_count"],
    temptFactor: "Practice interviews without embarrassment - get better with AI feedback",
  },
  {
    id: "ai-scholarship-matcher",
    name: "AI Scholarship Matcher",
    description: "Find scholarships you're eligible for with one click",
    category: "application",
    icon: "dollar_sign",
    targetRoles: ["student", "counselor", "parent"],
    dataPoints: ["scholarship_interests", "eligibility_profiles", "application_success", "funding_needs"],
    temptFactor: "Shows students FREE MONEY they can get - extremely motivating for families",
  },
  {
    id: "ai-class-insights",
    name: "AI Class Insights",
    description: "Teachers get AI analysis of their class's career interests and needs",
    category: "guidance",
    icon: "users",
    targetRoles: ["teacher", "counselor", "admin"],
    dataPoints: ["class_trends", "common_interests", "at_risk_students", "resource_requests"],
    temptFactor: "Teachers love seeing what their class is interested in - helps them teach better",
  },
  {
    id: "ai-rub-predictor",
    name: "AI RUB Admission Predictor",
    description: "Predict chances of admission to RUB colleges based on profile",
    category: "prediction",
    icon: "graduation_cap",
    targetRoles: ["student", "counselor", "parent"],
    dataPoints: ["college_preferences", "qualification_probability", "backup_plans", "enrollment_predictions"],
    temptFactor: "Shows 'You have 85% chance for CST' - helps students plan realistically",
  },
];

// ============================================================================
// DATA INSIGHTS - What we get back from users
// ============================================================================

export interface DataInsightCategory {
  category: string;
  description: string;
  value: string;
  monetizationPotential: "high" | "medium" | "low";
  sources: string[];
}

export const dataInsightCategories: DataInsightCategory[] = [
  {
    category: "Career Interest Trends",
    description: "What careers students are interested in over time",
    value: "Identify emerging career trends, adjust education programs",
    monetizationPotential: "high",
    sources: ["ai-career-coach", "ai-career-predictor", "career-matches"],
  },
  {
    category: "Skill Gap Analysis",
    description: "What skills students are missing for their goals",
    value: "Create targeted training programs, sell courses",
    monetizationPotential: "high",
    sources: ["ai-skill-gap", "assessments", "study-planner"],
  },
  {
    category: "Academic Performance Patterns",
    description: "Correlation between interests, grades, and career goals",
    value: "Research insights, improve education outcomes",
    monetizationPotential: "medium",
    sources: ["exam-results", "ai-study-planner", "ai-rub-predictor"],
  },
  {
    category: "Mental Wellness Indicators",
    description: "Student stress levels, motivation patterns",
    value: "Early intervention, wellness programs",
    monetizationPotential: "medium",
    sources: ["ai-mood-tracker", "journal-entries"],
  },
  {
    category: "College Selection Behavior",
    description: "How students choose colleges and careers",
    value: "College recruitment insights, targeted marketing",
    monetizationPotential: "high",
    sources: ["ai-rub-predictor", "career-plans", "scholarship-matcher"],
  },
  {
    category: "Learning Behavior Patterns",
    description: "How students learn, when they study best",
    value: "Optimize learning platforms, personalized education",
    monetizationPotential: "high",
    sources: ["ai-study-planner", "assessments", "skill-gap-analyzer"],
  },
  {
    category: "Teacher Engagement Data",
    description: "How teachers use the platform, what they need",
    value: "Improve product, identify upsell opportunities",
    monetizationPotential: "medium",
    sources: ["ai-class-insights", "teacher-portal-usage"],
  },
  {
    category: "Family Decision Patterns",
    description: "How families make education/career decisions together",
    value: "Target family-oriented products and services",
    monetizationPotential: "medium",
    sources: ["parent-portal-usage", "shared-career-plans"],
  },
];

// ============================================================================
// AI INTERACTION TRACKING
// ============================================================================

export interface AIInteraction {
  id: string;
  featureId: string;
  userId: string;
  interactionType: "query" | "request" | "feedback" | "correction";
  input: string;
  output: string;
  satisfaction?: number; // 1-5 rating
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// AI CAREER COACH - Main Tempting Feature
// ============================================================================

export interface CareerCoachMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  context?: {
    userProfile?: any;
    assessments?: any[];
    careerMatches?: any[];
  };
}

export interface CareerCoachResponse {
  message: string;
  suggestions?: string[];
  followUpQuestions?: string[];
  resources?: Array<{
    type: "article" | "video" | "assessment" | "career";
    title: string;
    url: string;
  }>;
  dataCaptured?: {
    interests: string[];
    concerns: string[];
    mentionedCareers: string[];
  };
}

/**
 * Generate AI Career Coach response
 * In production, this would call an AI API (OpenAI, Claude, etc.)
 */
export async function generateCareerCoachResponse(
  userId: string,
  message: string,
  conversationHistory: CareerCoachMessage[]
): Promise<CareerCoachResponse> {
  // Get user profile for context
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  // Get recent assessment results
  const riasecResult = await db.query.riasecResults.findFirst({
    where: eq(riasecResults.userId, userId),
  });

  // Get career matches
  const matches = await db.query.careerMatches.findMany({
    where: eq(careerMatches.userId, userId),
    with: { career: true },
    limit: 5,
  });

  // Extract insights from the message (data capture!)
  const interests = extractCareerInterests(message);
  const concerns = extractConcerns(message);
  const mentionedCareers = extractCareerNames(message);

  // Generate response (in production, use AI)
  const response: CareerCoachResponse = {
    message: generateCoachResponse(message, user, riasecResult, matches),
    suggestions: generateSuggestions(user, riasecResult),
    followUpQuestions: generateFollowUpQuestions(message, interests),
    resources: generateRelevantResources(interests, mentionedCareers),
    dataCaptured: {
      interests,
      concerns,
      mentionedCareers,
    },
  };

  return response;
}

function generateCoachResponse(
  message: string,
  user: any,
  riasecResult: any,
  matches: any[]
): string {
  const lowerMessage = message.toLowerCase();

  // Personalized greeting
  const greeting = user?.name
    ? `Hello ${user.name.split(" ")[0]}! `
    : "Hello! ";

  // Career interest responses
  if (lowerMessage.includes("career") || lowerMessage.includes("become") || lowerMessage.includes("want to be")) {
    const topCareer = matches?.[0]?.career?.name;
    if (topCareer) {
      return `${greeting}Based on your assessments, ${topCareer} is a great match for you! You scored ${matches[0].matchScore}% match. Would you like to know what skills you need for this career?`;
    }
    return `${greeting}I'd love to help you explore career options! Have you taken any of our assessments yet? They can help us find careers that fit your personality perfectly.`;
  }

  // Skill/learning responses
  if (lowerMessage.includes("skill") || lowerMessage.includes("learn") || lowerMessage.includes("study")) {
    return `${greeting}Great question! Developing the right skills is crucial for your career success. Based on your goals, I can create a personalized learning plan for you. What specific skill are you most interested in developing?`;
  }

  // College/RUB responses
  if (lowerMessage.includes("college") || lowerMessage.includes("rub") || lowerMessage.includes("university")) {
    return `${greeting}Royal University of Bhutan has excellent programs! Based on your profile and interests, I can help you find the best college and program match. What field of study interests you most?`;
  }

  // Doubt/confusion responses
  if (lowerMessage.includes("confused") || lowerMessage.includes("don't know") || lowerMessage.includes("unsure")) {
    return `${greeting}It's completely normal to feel uncertain! The good news is that we have tools to help you discover your path. Let's start with your interests - what subjects or activities do you enjoy the most?`;
  }

  // Default helpful response
  return `${greeting}I'm your AI Career Coach and I'm here to help you with anything related to your career and education journey. You can ask me about:\n\n• Career options that match your personality\n• Skills you need to develop\n• College and program recommendations\n• Study tips and planning\n• Any career-related questions\n\nWhat would you like to know?`;
}

function generateSuggestions(user: any, riasecResult: any): string[] {
  const suggestions = [
    "Take the DISC assessment to discover your work style",
    "Explore careers matched to your personality type",
    "Create a personalized career plan",
    "Check out RUB programs that match your interests",
  ];

  if (riasecResult?.hollandCode) {
    suggestions.unshift(`Your Holland Code is ${riasecResult.hollandCode} - learn what this means`);
  }

  return suggestions;
}

function generateFollowUpQuestions(message: string, interests: string[]): string[] {
  const questions = [
    "What subjects do you enjoy most in school?",
    "Do you prefer working with people, data, or things?",
    "What are your favorite hobbies or activities?",
    "Do you see yourself starting your own business someday?",
  ];

  // Return 2-3 relevant questions
  return questions.slice(0, 3);
}

function generateRelevantResources(interests: string[], careers: string[]): Array<{
  type: "article" | "video" | "assessment" | "career";
  title: string;
  url: string;
}> {
  return [
    {
      type: "assessment",
      title: "Complete DISC Assessment",
      url: "/student/assessments/disc",
    },
    {
      type: "career",
      title: "Explore Your Career Matches",
      url: "/student/careers",
    },
  ];
}

// Data extraction functions
function extractCareerInterests(message: string): string[] {
  const interests: string[] = [];
  const lowerMessage = message.toLowerCase();

  const interestKeywords = [
    "technology", "computers", "programming", "coding",
    "medical", "healthcare", "doctor", "nurse",
    "teaching", "education",
    "business", "entrepreneur", "startup",
    "art", "design", "creative",
    "science", "research", "biology", "chemistry",
    "engineering", "mechanical", "civil",
  ];

  interestKeywords.forEach((keyword) => {
    if (lowerMessage.includes(keyword)) {
      interests.push(keyword);
    }
  });

  return interests;
}

function extractConcerns(message: string): string[] {
  const concerns: string[] = [];
  const lowerMessage = message.toLowerCase();

  const concernKeywords = {
    "confused": "uncertain about direction",
    "worried": "anxious about future",
    "don't know": "lack of clarity",
    "not good enough": "confidence issue",
    "fail": "fear of failure",
    "parents": "family pressure",
    "marks": "academic concern",
    "grades": "academic concern",
  };

  Object.entries(concernKeywords).forEach(([keyword, concern]) => {
    if (lowerMessage.includes(keyword)) {
      concerns.push(concern);
    }
  });

  return concerns;
}

function extractCareerNames(message: string): string[] {
  const careers: string[] = [];
  const careerPatterns = [
    /software engineer/i,
    /doctor/i,
    /teacher/i,
    /engineer/i,
    /nurse/i,
    /accountant/i,
    /designer/i,
    /scientist/i,
  ];

  careerPatterns.forEach((pattern) => {
    const match = message.match(pattern);
    if (match) {
      careers.push(match[0]);
    }
  });

  return careers;
}

// ============================================================================
// GAMIFICATION - Make it addictive
// ============================================================================

export interface GamificationConfig {
  xpPerAction: Record<string, number>;
  levelUpXP: number[];
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    requirement: string;
    xp: number;
  }>;
}

export const gamificationConfig: GamificationConfig = {
  xpPerAction: {
    "assessment_complete": 100,
    "career_coach_query": 10,
    "study_plan_follow": 25,
    "skill_practice": 15,
    "mood_log": 5,
    "essay_review": 30,
    "scholarship_save": 20,
    "interview_practice": 40,
  },
  levelUpXP: [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500], // Cumulative
  badges: [
    {
      id: "first_assessment",
      name: "Pathfinder",
      description: "Complete your first assessment",
      icon: "compass",
      requirement: "Complete 1 assessment",
      xp: 50,
    },
    {
      id: "career_explorer",
      name: "Explorer",
      description: "Explore 10 different careers",
      icon: "map",
      requirement: "View 10 careers",
      xp: 100,
    },
    {
      id: "ai_chatty",
      name: "Curious Mind",
      description: "Ask 25 questions to AI Career Coach",
      icon: "message_circle",
      requirement: "25 AI queries",
      xp: 200,
    },
    {
      id: "consistent_learner",
      name: "Dedicated Learner",
      description: "Log study activity for 7 days straight",
      icon: "flame",
      requirement: "7-day streak",
      xp: 150,
    },
    {
      id: "skill_builder",
      name: "Skill Builder",
      description: "Complete 5 skill practices",
      icon: "wrench",
      requirement: "5 skill practices",
      xp: 100,
    },
  ],
};

export default {
  aiFeatures,
  dataInsightCategories,
  generateCareerCoachResponse,
  gamificationConfig,
};
