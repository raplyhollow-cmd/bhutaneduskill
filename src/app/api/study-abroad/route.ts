import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { STUDY_ABROAD_REQUIREMENTS } from "@/lib/tenant";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

type StudyAbroadCountry = keyof typeof STUDY_ABROAD_REQUIREMENTS;

interface StudyAbroadProgram {
  id: string;
  name: string;
  country: StudyAbroadCountry;
  course: string;
  duration: string;
  tuitionFees: string;
  requirements: string[];
  minIELTS?: number;
  minSAT?: number;
  description?: string;
  intake: string[];
}

interface StudyAbroadApplication {
  id: string;
  programId: string;
  programName: string;
  country: StudyAbroadCountry;
  status: "pending" | "submitted" | "under_review" | "accepted" | "rejected";
  submittedAt?: Date;
  updatedAt: Date;
  documents: {
    transcripts: boolean;
    ieltsScore: boolean;
    satScore: boolean;
    recommendations: boolean;
    portfolio: boolean;
  };
}

interface UserStudyAbroadStats {
  hasIELTS: boolean;
  ieltsScore?: number;
  hasSAT: boolean;
  satScore?: number;
  gpa?: number;
  hasRecommendations: boolean;
  hasPortfolio: boolean;
}

// Helper type for request bodies to avoid TypeScript parsing issues with nested quotes
interface ApplicationDocumentsRequestBody {
  transcripts?: boolean;
  ieltsScore?: boolean;
  satScore?: boolean;
  recommendations?: boolean;
  portfolio?: boolean;
}

interface CreateApplicationRequestBody {
  programId?: string;
  documents?: ApplicationDocumentsRequestBody;
}

interface UpdateApplicationRequestBody {
  applicationId?: string;
  status?: StudyAbroadApplication["status"];
  documents?: ApplicationDocumentsRequestBody;
}

// ============================================================================
// STUDY ABROAD PROGRAMS DATA
// ============================================================================

const STUDY_ABROAD_PROGRAMS: StudyAbroadProgram[] = [
  // Australia Programs
  {
    id: "aus-it-1",
    name: "Bachelor of Information Technology",
    country: "australia",
    course: "IT",
    duration: "3 years",
    tuitionFees: "$32,000 - $40,000 AUD/year",
    requirements: ["Class 12 with Math", "IELTS 6.5+", "Student visa (Subclass 500)"],
    minIELTS: 6.5,
    description: "Comprehensive IT degree with majors in Software Development, Data Science, and Cybersecurity.",
    intake: ["February", "July"],
  },
  {
    id: "aus-eng-1",
    name: "Bachelor of Engineering (Honours)",
    country: "australia",
    course: "Engineering",
    duration: "4 years",
    tuitionFees: "$35,000 - $45,000 AUD/year",
    requirements: ["Class 12 Science with PCM", "IELTS 6.5+", "Student visa"],
    minIELTS: 6.5,
    description: "ACCC-accredited engineering programs with specializations in Civil, Mechanical, Electrical.",
    intake: ["February", "July"],
  },
  {
    id: "aus-bus-1",
    name: "Bachelor of Business Administration",
    country: "australia",
    course: "Business",
    duration: "3 years",
    tuitionFees: "$28,000 - $38,000 AUD/year",
    requirements: ["Class 12 any stream", "IELTS 6.0+", "Student visa"],
    minIELTS: 6.0,
    description: "Business degree with majors in Marketing, Finance, Management, and International Business.",
    intake: ["February", "July", "November"],
  },
  {
    id: "aus-nursing-1",
    name: "Bachelor of Nursing",
    country: "australia",
    course: "Health Sciences",
    duration: "3 years",
    tuitionFees: "$30,000 - $42,000 AUD/year",
    requirements: ["Class 12 Science with PCB", "IELTS 7.0+", "Student visa", "Health checks"],
    minIELTS: 7.0,
    description: "AHPRA-accredited nursing program with clinical placements.",
    intake: ["February", "July"],
  },
  // New Zealand Programs
  {
    id: "nz-it-1",
    name: "Bachelor of Information Technology",
    country: "new-zealand",
    course: "IT",
    duration: "3 years",
    tuitionFees: "$22,000 - $28,000 NZD/year",
    requirements: ["Class 12 with Math", "IELTS 6.0+", "Student visa"],
    minIELTS: 6.0,
    description: "Practical IT degree with industry internships and job opportunities.",
    intake: ["February", "July", "November"],
  },
  {
    id: "nz-hospitality-1",
    name: "Bachelor of International Hospitality Management",
    country: "new-zealand",
    course: "Hospitality",
    duration: "3 years",
    tuitionFees: "$24,000 - $30,000 NZD/year",
    requirements: ["Class 12 any stream", "IELTS 6.0+", "Student visa"],
    minIELTS: 6.0,
    description: "World-renowned hospitality program with work placements.",
    intake: ["February", "July"],
  },
  {
    id: "nz-agri-1",
    name: "Bachelor of Agricultural Science",
    country: "new-zealand",
    course: "Agriculture",
    duration: "3 years",
    tuitionFees: "$26,000 - $32,000 NZD/year",
    requirements: ["Class 12 Science", "IELTS 6.0+", "Student visa"],
    minIELTS: 6.0,
    description: "Applied agriculture program with focus on sustainable farming.",
    intake: ["February", "July"],
  },
  // USA Programs
  {
    id: "usa-cs-1",
    name: "Bachelor of Science in Computer Science",
    country: "usa",
    course: "Computer Science",
    duration: "4 years",
    tuitionFees: "$40,000 - $60,000 USD/year",
    requirements: ["Class 12 Science", "SAT 1200+", "F-1 visa", "Essays", "Recommendations"],
    minSAT: 1200,
    description: "STEM-designated program with OPT work authorization.",
    intake: ["August", "January"],
  },
  {
    id: "usa-eng-1",
    name: "Bachelor of Science in Engineering",
    country: "usa",
    course: "Engineering",
    duration: "4 years",
    tuitionFees: "$45,000 - $65,000 USD/year",
    requirements: ["Class 12 Science with PCM", "SAT 1250+", "F-1 visa"],
    minSAT: 1250,
    description: "ABET-accredited engineering with research opportunities.",
    intake: ["August", "January"],
  },
  {
    id: "usa-bus-1",
    name: "Bachelor of Business Administration",
    country: "usa",
    course: "Business",
    duration: "4 years",
    tuitionFees: "$38,000 - $55,000 USD/year",
    requirements: ["Class 12 any stream", "SAT 1100+", "F-1 visa"],
    minSAT: 1100,
    description: "AACSB-accredited business school with internship programs.",
    intake: ["August", "January"],
  },
  // Singapore Programs
  {
    id: "sg-bus-1",
    name: "Bachelor of Business Administration",
    country: "singapore",
    course: "Business",
    duration: "3 years",
    tuitionFees: "SGD 25,000 - 35,000/year",
    requirements: ["Class 12 any stream", "IELTS 6.5+", "Student pass"],
    minIELTS: 6.5,
    description: "Asian business focus with global perspective.",
    intake: ["August", "January"],
  },
  {
    id: "sg-it-1",
    name: "Bachelor of Computing",
    country: "singapore",
    course: "IT",
    duration: "3 years",
    tuitionFees: "SGD 28,000 - 40,000/year",
    requirements: ["Class 12 with Math", "IELTS 6.5+", "Student pass"],
    minIELTS: 6.5,
    description: "Strong industry connections with tech companies.",
    intake: ["August", "January"],
  },
  {
    id: "sg-design-1",
    name: "Bachelor of Design",
    country: "singapore",
    course: "Design",
    duration: "3 years",
    tuitionFees: "SGD 26,000 - 36,000/year",
    requirements: ["Class 12 any stream", "Portfolio", "IELTS 6.0+", "Student pass"],
    minIELTS: 6.0,
    description: "Design program covering UX, visual communication, and product design.",
    intake: ["August", "January"],
  },
  // Europe Programs
  {
    id: "eu-eng-1",
    name: "Bachelor of Engineering",
    country: "europe",
    course: "Engineering",
    duration: "3-4 years",
    tuitionFees: "EUR 5,000 - 15,000/year",
    requirements: ["Class 12 Science with PCM", "English proficiency", "Student visa"],
    description: "English-taught engineering programs across Europe.",
    intake: ["September", "February"],
  },
  {
    id: "eu-bus-1",
    name: "Bachelor of International Business",
    country: "europe",
    course: "Business",
    duration: "3 years",
    tuitionFees: "EUR 6,000 - 12,000/year",
    requirements: ["Class 12 any stream", "English proficiency", "Student visa"],
    description: "International business with study abroad options.",
    intake: ["September", "February"],
  },
  {
    id: "eu-arts-1",
    name: "Bachelor of Arts",
    country: "europe",
    course: "Arts",
    duration: "3 years",
    tuitionFees: "EUR 5,000 - 10,000/year",
    requirements: ["Class 12 any stream", "English proficiency", "Student visa"],
    description: "Liberal arts education with European cultural focus.",
    intake: ["September", "February"],
  },
];

// In-memory storage for applications (in production, use database)
const applicationsStore = new Map<string, StudyAbroadApplication[]>();

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calculate study abroad readiness score
 */
function calculateReadinessScore(
  userStats: UserStudyAbroadStats,
  country: StudyAbroadCountry
): number {
  const countryReq = STUDY_ABROAD_REQUIREMENTS[country];
  let score = 0;
  const maxScore = 100;

  // Academic readiness (30 points)
  if (userStats.gpa && userStats.gpa >= 60) {
    score += Math.min(30, (userStats.gpa / 100) * 30);
  }

  // Language requirement (40 points)
  if ("ielts" in countryReq && countryReq.ielts) {
    if (userStats.hasIELTS && userStats.ieltsScore) {
      if (userStats.ieltsScore >= countryReq.ielts) {
        score += 40;
      } else {
        score += (userStats.ieltsScore / countryReq.ielts) * 30;
      }
    }
  } else if ("sat" in countryReq && countryReq.sat) {
    if (userStats.hasSAT && userStats.satScore) {
      if (userStats.satScore >= countryReq.sat) {
        score += 40;
      } else {
        score += (userStats.satScore / countryReq.sat) * 30;
      }
    }
  }

  // Documentation (20 points)
  if (userStats.hasRecommendations) score += 10;
  if (userStats.hasPortfolio) score += 10;

  // Base score (10 points)
  score += 10;

  return Math.min(maxScore, Math.round(score));
}

/**
 * Filter programs based on query parameters
 */
function filterPrograms(programs: StudyAbroadProgram[], filters: {
  country?: string | null;
  course?: string | null;
  duration?: string | null;
}): StudyAbroadProgram[] {
  let filtered = [...programs];

  if (filters.country) {
    filtered = filtered.filter((p) => p.country === filters.country);
  }

  if (filters.course) {
    filtered = filtered.filter((p) =>
      p.course.toLowerCase().includes(filters.course!.toLowerCase()) ||
      p.name.toLowerCase().includes(filters.course!.toLowerCase())
    );
  }

  if (filters.duration) {
    filtered = filtered.filter((p) => p.duration.includes(filters.duration!));
  }

  return filtered;
}

/**
 * Get user's study abroad stats from database
 */
async function getUserStudyAbroadStats(userId: string): Promise<UserStudyAbroadStats> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      metadata: true,
    },
  });

  // Parse metadata for study abroad stats
  const metadata = user?.metadata as Record<string, unknown> | null;

  return {
    hasIELTS: metadata?.hasIELTS as boolean ?? false,
    ieltsScore: metadata?.ieltsScore as number | undefined,
    hasSAT: metadata?.hasSAT as boolean ?? false,
    satScore: metadata?.satScore as number | undefined,
    gpa: metadata?.gpa as number | undefined,
    hasRecommendations: metadata?.hasRecommendations as boolean ?? false,
    hasPortfolio: metadata?.hasPortfolio as boolean ?? false,
  };
}

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * GET /api/study-abroad
 * Query params:
 * - country: Filter by country (australia, new-zealand, usa, singapore, europe)
 * - course: Filter by course name
 * - duration: Filter by duration (e.g., "3 years", "4 years")
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId, user } = authResult;

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const country = searchParams.get('country') as StudyAbroadCountry | null;
    const course = searchParams.get('course');
    const duration = searchParams.get('duration');

    // Validate country parameter
    if (country && !(country in STUDY_ABROAD_REQUIREMENTS)) {
      return NextResponse.json(
        { error: "Invalid country parameter", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get user's study abroad stats
    const userStats = await getUserStudyAbroadStats(userId);

    // Filter programs
    const programs = filterPrograms(STUDY_ABROAD_PROGRAMS, { country, course, duration });

    // Calculate readiness scores for each country
    const readinessScores: Record<string, number> = {};
    Object.keys(STUDY_ABROAD_REQUIREMENTS).forEach((countryKey) => {
      readinessScores[countryKey] = calculateReadinessScore(
        userStats,
        countryKey as StudyAbroadCountry
      );
    });

    const averageScore = Math.round(
      Object.values(readinessScores).reduce((a, b) => a + b, 0) /
        Object.values(readinessScores).length
    );

    // Get user's applications
    const userApplications = applicationsStore.get(userId) || [];

    logger.info("Study abroad programs fetched", {
      route: "/api/study-abroad",
      method: "GET",
      userId,
      programsCount: programs.length,
    });

    return NextResponse.json({
      data: {
        programs,
        readinessScores,
        averageScore,
        userStats,
        requirements: STUDY_ABROAD_REQUIREMENTS,
        applications: userApplications,
      },
    } satisfies ApiSuccess<{
      programs: StudyAbroadProgram[];
      readinessScores: Record<string, number>;
      averageScore: number;
      userStats: UserStudyAbroadStats;
      requirements: typeof STUDY_ABROAD_REQUIREMENTS;
      applications: StudyAbroadApplication[];
    }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/study-abroad", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch study abroad programs", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/study-abroad
 * Body:
 * - programId: ID of the program to apply for
 * - documents: Object tracking which documents are ready
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const body = await req.json();
    const { programId, documents } = body as CreateApplicationRequestBody;

    if (!programId) {
      return NextResponse.json(
        { error: "Program ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Find the program
    const program = STUDY_ABROAD_PROGRAMS.find((p) => p.id === programId);
    if (!program) {
      return NextResponse.json(
        { error: "Program not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Check if user already has an application for this program
    const userApplications = applicationsStore.get(userId) || [];
    const existingApplication = userApplications.find((app) => app.programId === programId);

    if (existingApplication) {
      return NextResponse.json(
        { error: "Application already exists for this program", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Create new application
    const newApplication: StudyAbroadApplication = {
      id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      programId,
      programName: program.name,
      country: program.country,
      status: "pending",
      updatedAt: new Date(),
      documents: {
        transcripts: documents?.transcripts ?? false,
        ieltsScore: documents?.ieltsScore ?? false,
        satScore: documents?.satScore ?? false,
        recommendations: documents?.recommendations ?? false,
        portfolio: documents?.portfolio ?? false,
      },
    };

    // Store application
    userApplications.push(newApplication);
    applicationsStore.set(userId, userApplications);

    logger.info("Study abroad application created", {
      route: "/api/study-abroad",
      method: "POST",
      userId,
      applicationId: newApplication.id,
      programId,
    });

    return NextResponse.json({
      data: newApplication,
      message: "Application created successfully. Complete your documents to submit.",
    } satisfies ApiSuccess<StudyAbroadApplication>);
  } catch (error) {
    logger.apiError(error, { route: "/api/study-abroad", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create application", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/study-abroad
 * Body:
 * - applicationId: ID of the application to update
 * - status: New status (optional)
 * - documents: Updated document status (optional)
 */
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const body = await req.json();
    const { applicationId, status, documents } = body as UpdateApplicationRequestBody;

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get user's applications
    const userApplications = applicationsStore.get(userId) || [];
    const applicationIndex = userApplications.findIndex((app) => app.id === applicationId);

    if (applicationIndex === -1) {
      return NextResponse.json(
        { error: "Application not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Update application
    const application = userApplications[applicationIndex];

    if (status) {
      // If submitting, set submittedAt
      if (status === "submitted" && !application.submittedAt) {
        application.submittedAt = new Date();
      }
      application.status = status;
    }

    if (documents) {
      application.documents = { ...application.documents, ...documents };
    }

    application.updatedAt = new Date();

    // Store updated application
    userApplications[applicationIndex] = application;
    applicationsStore.set(userId, userApplications);

    logger.info("Study abroad application updated", {
      route: "/api/study-abroad",
      method: "PATCH",
      userId,
      applicationId,
      status,
    });

    return NextResponse.json({
      data: application,
      message: "Application updated successfully",
    } satisfies ApiSuccess<StudyAbroadApplication>);
  } catch (error) {
    logger.apiError(error, { route: "/api/study-abroad", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update application", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/study-abroad/stats
 * Update user's study abroad stats
 */
export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const body = await req.json();
    const { hasIELTS, ieltsScore, hasSAT, satScore, gpa, hasRecommendations, hasPortfolio } = body as {
      hasIELTS?: boolean;
      ieltsScore?: number;
      hasSAT?: boolean;
      satScore?: number;
      gpa?: number;
      hasRecommendations?: boolean;
      hasPortfolio?: boolean;
    };

    // Update user metadata in database
    await db
      .update(users)
      .set({
        metadata: {
          hasIELTS,
          ieltsScore,
          hasSAT,
          satScore,
          gpa,
          hasRecommendations,
          hasPortfolio,
        },
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    logger.info("Study abroad stats updated", {
      route: "/api/study-abroad",
      method: "PUT",
      userId,
    });

    return NextResponse.json({
      data: {
        hasIELTS,
        ieltsScore,
        hasSAT,
        satScore,
        gpa,
        hasRecommendations,
        hasPortfolio,
      },
      message: "Study abroad stats updated successfully",
    } satisfies ApiSuccess<UserStudyAbroadStats>);
  } catch (error) {
    logger.apiError(error, { route: "/api/study-abroad", method: "PUT" });
    return NextResponse.json(
      { error: "Failed to update study abroad stats", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
