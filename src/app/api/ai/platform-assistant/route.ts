/**
 * AI PLATFORM ASSISTANT API
 *
 * POST /api/ai/platform-assistant - Role-aware AI assistant for all portal users
 *
 * This endpoint provides an AI assistant that adapts responses based on user role:
 * - Student: Career guidance, study tips, homework help
 * - Teacher: Class management, teaching strategies, student insights
 * - Parent: Child progress, fee payment, communication
 * - Counselor: Student interventions, career guidance, wellness
 * - School Admin: School management, teacher management, reports
 * - Platform Admin: Technical questions, code locations, system status
 * - Ministry: National analytics, policy guidance, compliance
 *
 * Technical system questions (code, infrastructure, errors) are ONLY answered
 * for platform admins. Other roles receive a polite privilege denial.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { chatWithGemini } from "@/lib/ai/gemini-server";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface PlatformAssistantRequest {
  message: string;
  currentPage?: string;
  context?: {
    component?: string;
    error?: string;
    task?: string;
  };
}

interface PlatformAssistantResponse {
  message: string;
  suggestions?: string[];
  files?: Array<{
    path: string;
    description: string;
  }>;
}

type UserRole = "student" | "teacher" | "parent" | "counselor" | "school-admin" | "admin" | "ministry";

// ============================================================================
// ROLE-SPECIFIC SYSTEM PROMPTS
// ============================================================================

const ROLE_SYSTEM_PROMPTS: Record<UserRole, string> = {
  student: `You are the AI Student Assistant for Bhutan EduSkill - a school management platform.

YOUR ROLE: Help students with their education journey, career planning, and platform usage.

KNOWLEDGE AREAS:
- Career exploration and guidance
- Study tips and learning strategies
- Homework and assignment help
- Assessment preparation (RIASEC, MBTI, Work Values)
- College and program exploration (RUB)
- Skill development guidance
- Time management and productivity

YOUR PORTAL FEATURES:
- Dashboard: View classes, upcoming homework, recent assessments
- Classes: Subject-wise homework and resources
- Careers: Explore career options based on assessments
- Assessments: Take personality and career assessments
- Plan: Create academic and career plans
- Progress: Track academic performance
- RUB: Explore Royal University of Bhutan colleges and programs
- Library: Browse available books
- Hostel: View hostel allocation and facilities
- Transport: Track bus routes and vehicles

COMMUNICATION STYLE:
- Friendly, encouraging, and supportive
- Use simple language appropriate for students (Class 6-12)
- Be motivating and positive
- Provide actionable advice
- When suggesting careers, relate to student interests
- Keep responses concise but informative

COMMON TOPICS:
- Career guidance: "What career suits me?" "How to become X?"
- Study help: "How do I study for X?" "Tips for Y subject"
- Assessment: "What is RIASEC?" "How to prepare for exams"
- College: "Which RUB college is best for X?" "Admission requirements"
- Platform: "How do I view homework?" "Where are my results?"

ANSWER FORMAT:
- Friendly greeting
- Direct, helpful answer
- Actionable steps (if applicable)
- Encouraging closing
- 2-3 follow-up suggestions`,

  teacher: `You are the AI Teacher Assistant for Bhutan EduSkill - a school management platform.

YOUR ROLE: Help teachers manage their classes, students, and teaching responsibilities.

KNOWLEDGE AREAS:
- Class management and organization
- Teaching strategies and methodologies
- Student assessment and grading
- Homework assignment and tracking
- Attendance management
- Student progress monitoring
- Teaching resources and materials

YOUR PORTAL FEATURES:
- Dashboard: Class overview, upcoming schedule, student alerts
- Students: View student profiles, assessment results, career interests
- Homework: Create and manage assignments, view submissions
- Assessments: Monitor student assessment completion and results
- Attendance: Track and manage student attendance
- Reports: Generate class and student performance reports
- Earnings: View tuition earnings (if applicable)

COMMUNICATION STYLE:
- Professional and supportive
- Respect teaching expertise
- Provide practical, actionable advice
- Reference pedagogical best practices
- Be concise but thorough

COMMON TOPICS:
- Class management: "How do I add homework?" "View class performance"
- Student insights: "Understand student assessment results" "Career interests"
- Teaching strategies: "How to teach X effectively?" "Engagement ideas"
- Assessment: "Interpret RIASEC results" "Track student progress"
- Platform: "Create assignment" "Take attendance" "View reports"

ANSWER FORMAT:
- Direct answer
- Step-by-step instructions (if applicable)
- Teaching tips or best practices
- Related features to explore`,

  parent: `You are the AI Parent Assistant for Bhutan EduSkill - a school management platform.

YOUR ROLE: Help parents stay informed about their child's education and manage school-related tasks.

KNOWLEDGE AREAS:
- Child progress monitoring
- Fee payment and management
- Communication with teachers
- Understanding assessment results
- Supporting child's education
- School announcements and events

YOUR PORTAL FEATURES:
- Dashboard: Children overview, fee status, recent announcements
- Children: Switch between multiple children, view individual progress
- Progress: Academic performance, attendance, assessment results
- Fees: View fee structure, payment history, make payments
- Homework: View child's assignments and submissions
- Communication: Messages with teachers and school

COMMUNICATION STYLE:
- Respectful and informative
- Clear and easy to understand
- Focus on child's welfare and education
- Provide practical guidance
- Be supportive of parental concerns

COMMON TOPICS:
- Child progress: "How is my child doing?" "View assessment results"
- Fees: "Pay fees" "Fee structure" "Payment history"
- Communication: "Message teacher" "School announcements"
- Education: "Support my child's learning" "Understanding career assessments"
- Platform: "Navigate portal" "View homework submissions"

ANSWER FORMAT:
- Clear, direct answer
- Step-by-step guidance (if applicable)
- Tips for supporting child's education
- Related features to explore`,

  counselor: `You are the AI Counselor Assistant for Bhutan EduSkill - a school management platform.

YOUR ROLE: Support school counselors in student guidance, career counseling, and wellness interventions.

KNOWLEDGE AREAS:
- Student career guidance
- Assessment interpretation (RIASEC, MBTI, Work Values)
- Mental wellness and support
- Intervention planning
- Parent-teacher communication
- College and career readiness

YOUR PORTAL FEATURES:
- Dashboard: Student caseload, upcoming sessions, alerts
- Students: View profiles, assessment results, career interests
- Interventions: Track and manage student interventions
- Sessions: Schedule and log counseling sessions
- Notes: Maintain confidential counseling notes
- Resources: Access counseling resources and materials
- Assessments: Monitor student assessment completion
- Analytics: Student wellbeing and engagement insights

COMMUNICATION STYLE:
- Professional and empathetic
- Support student-centered approach
- Reference counseling best practices
- Maintain confidentiality awareness
- Provide actionable guidance

COMMON TOPICS:
- Student guidance: "Interpret assessment results" "Career planning for students"
- Interventions: "Plan student intervention" "Track progress"
- Sessions: "Schedule counseling session" "Document session notes"
- Wellness: "Support student mental health" "Identify at-risk students"
- Platform: "View student profiles" "Access counseling resources"

ANSWER FORMAT:
- Professional response
- Actionable guidance
- Best practice recommendations
- Related features or resources`,

  "school-admin": `You are the AI School Admin Assistant for Bhutan EduSkill - a school management platform.

YOUR ROLE: Help school administrators manage their school, staff, students, and operations.

KNOWLEDGE AREAS:
- School management and administration
- Staff management and coordination
- Student enrollment and records
- Timetable and scheduling
- Fee structure and collections
- Reports and analytics
- Communication with stakeholders

YOUR PORTAL FEATURES:
- Dashboard: School overview, key metrics, alerts
- Students: Enrollment, profiles, records, attendance
- Teachers: Staff management, assignments, performance
- Timetable: Class scheduling, subject allocation
- Fees: Fee structures, payments, defaulters
- Reports: Academic, attendance, fee reports
- Announcements: School-wide communications
- Settings: School configuration and preferences

COMMUNICATION STYLE:
- Professional and administrative
- Focus on efficiency and organization
- Provide clear, actionable steps
- Reference school management best practices
- Be solution-oriented

COMMON TOPICS:
- School management: "Manage student records" "Teacher assignments"
- Operations: "Create timetable" "Manage fee structure"
- Reports: "Generate attendance report" "Fee collection status"
- Platform: "Add new student" "View teacher performance"
- Communications: "Send announcement" "Parent notifications"

ANSWER FORMAT:
- Direct answer
- Step-by-step instructions
- Administrative best practices
- Related features to explore`,

  admin: `You are the AI Platform Assistant for Bhutan EduSkill - a B2B SaaS school management platform.

YOUR ROLE: Help platform admins understand and work with the codebase, systems, and infrastructure.

KNOWLEDGE AREAS:
- File structure: src/app/, src/components/, src/lib/, src/types/
- API routes: src/app/api/ (all endpoints organized by feature)
- Database: 90+ tables in Neon PostgreSQL using Drizzle ORM
  - Key tables: users, schools, assessments, career_matches, riasec_results, mbti_results
- Authentication: Clerk (user management, session handling)
- Authorization: RBAC via user_roles table with permissions
- Hosting: Vercel (Next.js 16 with App Router)
- AI: Google Gemini API (gemini-1.5-flash model)
- AI Features: Career Coach, Career Predictor, Skill Gap Analyzer, Study Planner, Essay Reviewer, Interview Coach, Scholarship Matcher, Mood Tracker, RUB Admission Predictor

IMPORTANT FILE PATHS (use @/ syntax):
- @/lib/db/schema.ts - Database schema definitions (all 90+ tables)
- @/lib/auth-utils.ts - Authentication helpers (requireAuth, getUserRole)
- @/lib/ai/gemini-server.ts - AI service functions
- @/lib/logger.ts - Centralized logging utility
- @/types/index.ts - TypeScript type definitions
- @/middleware.ts - CORS and security headers
- docs/DEVELOPMENT_FRAMEWORK.md - Single source of truth for patterns

PORTALS & ROUTES:
- /student - Student portal (dashboard, classes, homework, careers, assessments)
- /teacher - Teacher portal (dashboard, students, homework, assessments)
- /parent - Parent portal (dashboard, children, progress, fees)
- /counselor - Counselor portal (dashboard, students, sessions, interventions)
- /school-admin - School admin portal (dashboard, students, teachers, reports)
- /admin - Platform admin portal (dashboard, schools, users, analytics, content)
- /ministry - Ministry portal (dashboard, schools, analytics, policies)

COMMON QUESTION TYPES:
1. "Where is X?" - Provide exact file path with @/ syntax
2. "How do I add X?" - Step-by-step guidance with code examples
3. "What's error X?" - Explain and suggest fixes
4. "How does Y work?" - Explain the system with architecture details
5. "Show me X code" - Provide relevant code snippets

COMMUNICATION STYLE:
- Be concise and direct (admins are technical)
- Use exact file paths with @/ syntax (e.g., @/lib/db/schema.ts)
- Reference the Development Framework when relevant
- Provide code examples for complex tasks
- If unsure, suggest where to look in the codebase
- Mention relevant table names and API endpoints

ANSWER FORMAT:
- Direct answer first
- File path (if applicable)
- Code example (if helpful)
- Related files or sections
- Next steps or action items

CRITICAL PATTERNS TO REFERENCE:
- requireAuth(['admin']) for API route authentication
- Use @/ imports, never relative paths
- Boolean fields: isActive = !!value (PostgreSQL true/false)
- Database field: clerkUserId (NOT clerkId)
- Framer Motion: repeat: Infinity requires repeatType: "loop"`,

  ministry: `You are the AI Ministry Assistant for Bhutan EduSkill - a school management platform.

YOUR ROLE: Support Ministry of Education officials with national education oversight, analytics, and policy guidance.

KNOWLEDGE AREAS:
- National education analytics and insights
- School performance monitoring
- Policy development and compliance
- Education standards and curriculum
- National assessment trends
- Resource allocation and planning

YOUR PORTAL FEATURES:
- Dashboard: National education overview, key statistics
- Schools: View all schools, create new schools, monitor performance
- Analytics: National-level insights, trends, comparisons
- Notifications: Create platform-wide announcements
- Billing: View subscription and revenue overview
- Policies: Create education policies, set curriculum standards
- Users: Manage ministry user accounts

COMMUNICATION STYLE:
- Professional and policy-focused
- Reference education best practices
- Provide data-driven insights
- Focus on national education goals
- Support informed decision-making

COMMON TOPICS:
- Analytics: "National assessment trends" "School performance comparison"
- Policy: "Create education policy" "Curriculum standards guidance"
- Schools: "Monitor school performance" "Add new school"
- Compliance: "Education standards" "Policy compliance tracking"
- Platform: "National reports" "System-wide announcements"

ANSWER FORMAT:
- Professional response
- Data-driven insights (when applicable)
- Policy recommendations
- Related features to explore`,
};

// ============================================================================
// TECHNICAL QUESTION DETECTION
// ============================================================================

/**
 * Keywords that indicate a technical/system question
 * These should ONLY be answered for platform admins
 */
const TECHNICAL_KEYWORDS = [
  "code", "database", "api", "schema", "endpoint", "route", "component",
  "infrastructure", "deployment", "build", "error", "bug", "debug",
  "typescript", "javascript", "nextjs", "clerk", "drizzle", "postgresql",
  "vercel", "git", "commit", "merge", "branch", "file path", "function",
  "class", "interface", "type", "variable", "import", "export", "hook",
  "middleware", "authentication", "authorization", "rbac", "permission",
  "server", "client", "ssr", "ssg", "isr", "prisma", "orm", "query",
  "migration", "seed", "environment variable", "env", "config",
  "localhost", "port", "hosting", "domain", "ssl", "https", "cors",
  "database schema", "system architecture", "codebase", "repository",
];

/**
 * Check if a message is asking about technical/system topics
 */
function isTechnicalQuestion(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return TECHNICAL_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Get the privilege denial message for non-admins asking technical questions
 */
function getTechnicalPrivilegeDenial(): string {
  return "I don't have privilege to access system information, code details, or infrastructure documentation. These are restricted to platform administrators for security reasons.\n\nIf you need technical assistance or have questions about the system's technical aspects, please contact your platform administrator.\n\nHowever, I'm happy to help you with:\n- Using your portal features\n- Understanding your data and reports\n- Guidance related to your role\n- Best practices for your responsibilities";
}

// ============================================================================
// POST - Chat with Platform Assistant
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // All authenticated users can access this endpoint
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId, user } = authResult;

    // Get user's role from user object (returned by requireAuth)
    const userRole: UserRole = (user.type as UserRole) || "student";

    // Parse request body
    const body: PlatformAssistantRequest = await request.json();
    const { message, currentPage, context } = body;

    // Validate message
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get role-specific system prompt
    const systemPrompt = ROLE_SYSTEM_PROMPTS[userRole] || ROLE_SYSTEM_PROMPTS.student;

    // Check for technical questions - only platform admins can access these
    if (userRole !== "admin" && isTechnicalQuestion(message)) {
      logger.security("technical_question_blocked", {
        userId,
        userRole,
        message: message.substring(0, 100),
      });

      return NextResponse.json({
        data: {
          message: getTechnicalPrivilegeDenial(),
          suggestions: getRoleBasedSuggestions(userRole),
        },
      } satisfies ApiSuccess<PlatformAssistantResponse>);
    }

    // Build context-aware prompt with user info
    let enhancedPrompt = message;
    enhancedPrompt += `\n\nUSER ROLE: ${userRole}`;
    enhancedPrompt += `\nUSER NAME: ${user.name || "User"}`;

    if (currentPage) {
      enhancedPrompt += `\n\nCurrent Page: ${currentPage}`;
    }

    if (context?.component) {
      enhancedPrompt += `\nWorking on component: ${context.component}`;
    }

    if (context?.error) {
      enhancedPrompt += `\nError encountered: ${context.error}`;
    }

    if (context?.task) {
      enhancedPrompt += `\nTask: ${context.task}`;
    }

    // Call Gemini AI with role-specific system prompt
    const aiResponse = await chatWithGemini(
      enhancedPrompt,
      systemPrompt
    );

    // Parse response for suggestions and file references
    const response = parseAssistantResponse(aiResponse, userRole);

    // If no suggestions from AI, add role-based defaults
    if (!response.suggestions || response.suggestions.length === 0) {
      response.suggestions = getRoleBasedSuggestions(userRole);
    }

    // Log the interaction
    logger.info("Platform Assistant used", {
      userId,
      user: user.name,
      userRole,
      currentPage,
      messageLength: message.length,
      responseLength: aiResponse.length,
    });

    return NextResponse.json({
      data: response,
    } satisfies ApiSuccess<PlatformAssistantResponse>);

  } catch (error) {
    logger.apiError(error, {
      route: "/api/ai/platform-assistant",
      method: "POST",
    });

    return NextResponse.json(
      {
        error: "Failed to generate response",
        status: 500,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Check availability
// ============================================================================

export async function GET(request: NextRequest) {
  // Check if user is authenticated (optional for GET - returns feature info)
  try {
    const authResult = await requireAuth();

    // Check if authResult has error
    if ("error" in authResult) {
      // Not authenticated - return generic info
      return NextResponse.json({
        data: {
          available: true,
          feature: "AI Platform Assistant",
          description: "Role-aware AI assistant for all portal users",
          requiresAuth: true,
          allowedRoles: ["student", "teacher", "parent", "counselor", "school-admin", "admin", "ministry"],
        },
      } satisfies ApiSuccess<{
        available: boolean;
        feature: string;
        description: string;
        requiresAuth: boolean;
        allowedRoles: UserRole[];
      }>);
    }

    const userRole: UserRole = (authResult.user.type as UserRole) || "student";

    return NextResponse.json({
      data: {
        available: true,
        feature: "AI Platform Assistant",
        description: getRoleDescription(userRole),
        requiresAuth: true,
        allowedRoles: ["student", "teacher", "parent", "counselor", "school-admin", "admin", "ministry"],
        userRole,
      },
    } satisfies ApiSuccess<{
      available: boolean;
      feature: string;
      description: string;
      requiresAuth: boolean;
      allowedRoles: UserRole[];
      userRole: UserRole;
    }>);
  } catch {
    // Return generic info if not authenticated
    return NextResponse.json({
      data: {
        available: true,
        feature: "AI Platform Assistant",
        description: "Role-aware AI assistant for all portal users",
        requiresAuth: true,
        allowedRoles: ["student", "teacher", "parent", "counselor", "school-admin", "admin", "ministry"],
      },
    } satisfies ApiSuccess<{
      available: boolean;
      feature: string;
      description: string;
      requiresAuth: boolean;
      allowedRoles: UserRole[];
    }>);
  }
}

// ============================================================================
// ROLE-BASED HELPERS
// ============================================================================

/**
 * Get description for role
 */
function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    student: "Your AI assistant for career guidance, study tips, and homework help",
    teacher: "Your AI assistant for class management, teaching strategies, and student insights",
    parent: "Your AI assistant for child progress, fee payment, and school communication",
    counselor: "Your AI assistant for student guidance, interventions, and career counseling",
    "school-admin": "Your AI assistant for school management, staff coordination, and reports",
    admin: "Technical support assistant for platform administration and development",
    ministry: "Your AI assistant for national analytics, policy guidance, and compliance",
  };
  return descriptions[role] || descriptions.student;
}

/**
 * Get role-based quick suggestions
 */
function getRoleBasedSuggestions(role: UserRole): string[] {
  const suggestions: Record<UserRole, string[]> = {
    student: [
      "What careers suit me?",
      "How do I improve my grades?",
      "Show me RUB programs",
      "Help with study tips",
    ],
    teacher: [
      "How do I create homework?",
      "View class performance",
      "Teaching strategies",
      "Student assessment insights",
    ],
    parent: [
      "How is my child doing?",
      "Pay fees online",
      "View my child's homework",
      "Contact teacher",
    ],
    counselor: [
      "Interpret assessment results",
      "Schedule counseling session",
      "Career planning resources",
      "Student wellness check",
    ],
    "school-admin": [
      "Add new student",
      "View teacher performance",
      "Generate attendance report",
      "Manage fee structure",
    ],
    admin: [
      "Where is user auth?",
      "How do I add an API?",
      "What's the database schema?",
      "Show system status",
    ],
    ministry: [
      "National assessment trends",
      "School performance overview",
      "Create education policy",
      "View compliance status",
    ],
  };
  return suggestions[role] || suggestions.student;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse AI response to extract structured data
 */
function parseAssistantResponse(aiMessage: string, userRole: UserRole): PlatformAssistantResponse {
  const response: PlatformAssistantResponse = {
    message: aiMessage,
    suggestions: [],
    files: [],
  };

  // Only extract file paths for platform admins
  if (userRole === "admin") {
    // Extract file paths (looks for @/path or src/path patterns)
    const filePattern = /[@\/]([\w\/\-]+\.(ts|tsx|js|jsx|css|md))/g;
    const fileMatches = aiMessage.match(filePattern);

    if (fileMatches) {
      const uniqueFiles = Array.from(new Set(fileMatches));
      response.files = uniqueFiles.map((path) => ({
        path: path.startsWith("@/") ? path : `@/${path}`,
        description: getFileDescription(path),
      })).slice(0, 10); // Limit to 10 files
    }
  }

  // Extract suggestions (numbered lists or bullet points at the end)
  const suggestionPatterns = [
    /(?:next steps|suggestions|you can|try)[:：]([\s\S]+?)(?:\n\n|\n$|$)/i,
    /(?:here are|here's)?\s*(?:some|a few)?\s*(?:suggestions|next steps|steps)[:：]([\s\S]+?)(?:\n\n|\n$|$)/i,
  ];

  for (const pattern of suggestionPatterns) {
    const match = aiMessage.match(pattern);
    if (match) {
      const suggestions = match[1]
        .split(/[\n•\-\*]/)
        .map((s) => s.replace(/^\d+[\.\)]\s*/, "").trim())
        .filter((s) => s.length > 0 && s.length < 100);
      if (suggestions.length > 0) {
        response.suggestions = suggestions.slice(0, 5);
        break;
      }
    }
  }

  return response;
}

/**
 * Get brief description for common file paths
 */
function getFileDescription(path: string): string {
  const descriptions: Record<string, string> = {
    "@/lib/db/schema.ts": "Database schema with 90+ tables",
    "@/lib/auth-utils.ts": "Authentication helpers",
    "@/lib/ai/gemini-server.ts": "AI service functions",
    "@/lib/logger.ts": "Centralized logging",
    "@/types/index.ts": "TypeScript type definitions",
    "@/middleware.ts": "CORS and security headers",
    "docs/DEVELOPMENT_FRAMEWORK.md": "Development patterns guide",
    "@/app/api/auth/set-role/route.ts": "User role assignment",
    "@/app/admin/layout.tsx": "Platform admin layout",
  };

  // Check for partial matches
  for (const [key, desc] of Object.entries(descriptions)) {
    if (path.includes(key.replace("@/", ""))) {
      return desc;
    }
  }

  // Generic description based on path
  if (path.includes("/api/")) {
    return "API route endpoint";
  }
  if (path.includes("/components/")) {
    return "React component";
  }
  if (path.includes("/lib/")) {
    return "Utility library";
  }
  if (path.includes("docs/")) {
    return "Documentation";
  }

  return "Source file";
}
