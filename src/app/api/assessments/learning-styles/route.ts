import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, assessments, learningStylesResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

// ============================================================================
// VARK LEARNING STYLES SCORING
// ============================================================================

/**
 * VARK Learning Style Types
 */
type VARKStyle = "visual" | "auditory" | "read_write" | "kinesthetic";

/**
 * VARK Learning Styles Result
 */
interface VARKResult {
  visual: number;       // 0-100 percentage
  auditory: number;     // 0-100 percentage
  readWrite: number;    // 0-100 percentage
  kinesthetic: number;  // 0-100 percentage
  dominantStyle: VARKStyle;
  secondaryStyle?: VARKStyle;
  description: string;
  recommendations: {
    studyTips: string[];
    teachingMethods: string[];
    careerSuggestions: string[];
  };
}

/**
 * Calculate VARK learning styles from assessment answers
 * @param answers - Record of questionId -> selected style
 * @returns Complete VARK assessment result with scores and recommendations
 */
function calculateVARKScores(answers: Record<string, VARKStyle>): VARKResult {
  // Initialize counts for each style
  const counts = {
    visual: 0,
    auditory: 0,
    read_write: 0,
    kinesthetic: 0,
  };

  // Count selections for each style
  Object.values(answers).forEach((style) => {
    if (style in counts) {
      counts[style]++;
    }
  });

  // Calculate percentages
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const visual = total > 0 ? Math.round((counts.visual / total) * 100) : 0;
  const auditory = total > 0 ? Math.round((counts.auditory / total) * 100) : 0;
  const readWrite = total > 0 ? Math.round((counts.read_write / total) * 100) : 0;
  const kinesthetic = total > 0 ? Math.round((counts.kinesthetic / total) * 100) : 0;

  // Determine dominant and secondary styles
  const allScores = [
    { style: "visual" as VARKStyle, score: visual },
    { style: "auditory" as VARKStyle, score: auditory },
    { style: "read_write" as VARKStyle, score: readWrite },
    { style: "kinesthetic" as VARKStyle, score: kinesthetic },
  ].sort((a, b) => b.score - a.score);

  const dominantStyle = allScores[0].style;
  const secondaryStyle = allScores[1].score >= allScores[0].score * 0.7 ? allScores[1].style : undefined;

  return {
    visual,
    auditory,
    readWrite,
    kinesthetic,
    dominantStyle,
    secondaryStyle,
    description: getVARKDescription(dominantStyle, secondaryStyle),
    recommendations: getVARKRecommendations(dominantStyle, secondaryStyle),
  };
}

/**
 * Get description for the dominant learning style
 */
function getVARKDescription(dominant: VARKStyle, secondary?: VARKStyle): string {
  const descriptions: Record<VARKStyle, string> = {
    visual: "You learn best by seeing information. You prefer pictures, diagrams, charts, graphs, and written directions. Visual learners benefit from color-coding, highlighting, and creating visual representations of concepts.",
    auditory: "You learn best by hearing information. You prefer lectures, group discussions, verbal instructions, and talking through ideas. Auditory learners benefit from recording lectures, participating in discussions, and explaining concepts aloud.",
    read_write: "You learn best by reading and writing. You prefer textbooks, notes, lists, handouts, and written exercises. Read/write learners benefit from taking detailed notes, rewriting and reorganizing information, and making lists.",
    kinesthetic: "You learn best by doing and experiencing. You prefer hands-on activities, experiments, field trips, and practical applications. Kinesthetic learners benefit from movement, manipulation of materials, and connecting learning to real-world experiences.",
  };

  let description = descriptions[dominant];
  if (secondary) {
    description += ` You also have strong ${secondary === "read_write" ? "read/write" : secondary} learning preferences, which means you can effectively use strategies from both styles.`;
  }

  return description;
}

/**
 * Get comprehensive recommendations based on learning style
 */
function getVARKRecommendations(dominant: VARKStyle, secondary?: VARKStyle) {
  const allRecommendations: Record<VARKStyle, {
    studyTips: string[];
    teachingMethods: string[];
    careerSuggestions: string[];
  }> = {
    visual: {
      studyTips: [
        "Use diagrams, charts, and graphs to understand information",
        "Highlight key points in different colors",
        "Create mind maps and concept maps to connect ideas",
        "Watch educational videos and tutorials",
        "Use flashcards with images and diagrams",
        "Sit near the front of the class to see clearly",
        "Convert text into visual formats when possible",
        "Use graphic organizers for note-taking",
      ],
      teachingMethods: [
        "Visual presentations with slides and diagrams",
        "Video demonstrations and animations",
        "Written instructions and detailed handouts",
        "Graphic organizers and mind maps",
        "Charts, graphs, and visual data representations",
        "Color-coded materials",
        "Illustrated examples and case studies",
      ],
      careerSuggestions: [
        "Graphic Designer",
        "Architect",
        "Photographer",
        "Artist/Illustrator",
        "UX/UI Designer",
        "Data Analyst/Visualization Specialist",
        "Video Editor",
        "Surgeon/Medical Illustrator",
        "Interior Designer",
        "Fashion Designer",
      ],
    },
    auditory: {
      studyTips: [
        "Record lectures and listen to them later",
        "Discuss topics with classmates or study groups",
        "Read notes aloud to yourself",
        "Use mnemonics, rhymes, and rhythm to remember facts",
        "Teach concepts to others to reinforce learning",
        "Participate actively in class discussions",
        "Listen to podcasts and audiobooks on relevant topics",
        "Record yourself explaining concepts and play it back",
      ],
      teachingMethods: [
        "Lectures with engaging verbal explanations",
        "Group discussions and debates",
        "Oral explanations and storytelling",
        "Question-and-answer sessions",
        "Audio recordings and podcasts",
        "Peer teaching and presentations",
        "Verbal repetition and summarization",
      ],
      careerSuggestions: [
        "Teacher/Professor",
        "Musician/Composer",
        "Radio Host/Podcaster",
        "Speech Therapist",
        "Counselor/Psychologist",
        "Journalist/Reporter",
        "Sales Representative",
        "Broadcaster/Announcer",
        "Interpreter/Translator",
        "Customer Service Representative",
      ],
    },
    read_write: {
      studyTips: [
        "Take detailed notes during lectures",
        "Rewrite and organize your notes regularly",
        "Read textbooks and supplementary materials thoroughly",
        "Make lists and outlines to organize information",
        "Write summaries of what you learn",
        "Use written study guides and worksheets",
        "Create written definitions and glossaries",
        "Practice with written exercises and essays",
      ],
      teachingMethods: [
        "Reading assignments from textbooks and articles",
        "Written exercises and worksheets",
        "Detailed handouts and reading materials",
        "Written step-by-step instructions",
        "Note-taking templates and guides",
        "Essay writing and written reflections",
        "Research assignments and papers",
      ],
      careerSuggestions: [
        "Writer/Author",
        "Editor/Proofreader",
        "Researcher/Academic",
        "Librarian/Archivist",
        "Lawyer/Legal Analyst",
        "Accountant/Bookkeeper",
        "Historian",
        "Journalist/Reporter",
        "Technical Writer",
        "Data Entry Specialist",
      ],
    },
    kinesthetic: {
      studyTips: [
        "Use hands-on activities when possible",
        "Take breaks while studying to move around",
        "Build models or do experiments",
        "Use flashcards and manipulate them physically",
        "Study while standing, pacing, or using a stress ball",
        "Apply concepts to real-world situations immediately",
        "Role-play scenarios to understand concepts",
        "Use computer simulations and interactive learning tools",
      ],
      teachingMethods: [
        "Laboratory experiments and practical work",
        "Hands-on activities and demonstrations",
        "Field trips and site visits",
        "Role-playing exercises and simulations",
        "Practical demonstrations with student participation",
        "Building and creating projects",
        "Physical movement and gestures while learning",
      ],
      careerSuggestions: [
        "Athlete/Coach",
        "Chef/Baker",
        "Mechanic/Technician",
        "Surgeon",
        "Physical Therapist",
        "Carpenter/Tradesperson",
        "Dancer/Choreographer",
        "Personal Trainer/Fitness Instructor",
        "Farmer/Landscaper",
        "Firefighter/EMT",
      ],
    },
  };

  const primary = allRecommendations[dominant];

  // If there's a secondary style, blend recommendations
  if (secondary) {
    const secondaryRecs = allRecommendations[secondary];
    return {
      studyTips: [...primary.studyTips.slice(0, 5), ...secondaryRecs.studyTips.slice(0, 3)],
      teachingMethods: [...primary.teachingMethods.slice(0, 4), ...secondaryRecs.teachingMethods.slice(0, 3)],
      careerSuggestions: [...primary.careerSuggestions.slice(0, 6), ...secondaryRecs.careerSuggestions.slice(0, 4)],
    };
  }

  return primary;
}

/**
 * GET /api/assessments/learning-styles - Get Learning Styles assessment results
 *
 * Query params:
 * - userId: Filter by user ID (for parents viewing children's results)
 * - limit: Maximum results to return (default: 10)
 */
export const GET = createApiRoute(
  async (request, auth) => {
    if (!auth) {
      return { error: "Unauthorized", results: [], status: 401 };
    }

    const { userId, user } = auth;
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Parents can view their children's results
    // Students can only view their own results
    let targetUserId = userIdParam;

    if (user.type === "student") {
      // Students can only see their own results
      targetUserId = userId;
    } else if (user.type === "parent" && !userIdParam) {
      // Parent must specify which child
      return {
        error: "userId parameter is required for parents",
        results: [],
        status: 400
      };
    }

    // Build query conditions
    const whereClause = targetUserId ? eq(learningStylesResults.userId, targetUserId) : undefined;

    const results = await db
      .select()
      .from(learningStylesResults)
      .where(whereClause)
      .orderBy(desc(learningStylesResults.createdAt))
      .limit(limit);

    // Format results to match expected schema
    const formattedResults = results.map((result) => ({
      ...result,
      // Map database schema to expected format
      visual: result.visualScore || 0,
      auditory: result.auditoryScore || 0,
      kinesthetic: result.kinestheticScore || 0,
      readWrite: 0, // Not stored in database, default value
    }));

    return { results: formattedResults };
  },
  ['parent', 'student', 'teacher', 'admin', 'school-admin', 'counselor']
);

export const POST = createApiRoute(
  async (request, auth) => {
    if (!auth) {
      return { error: "Unauthorized", status: 401 };
    }

    const { userId, user } = auth;

    // Check RBAC permission for creating assessments
    // Students can create assessments for themselves without special permission
    if (user.type !== "student") {
      const permCheck = await requirePermission(userId, "assessments.create");
      if (permCheck) return permCheck;
    }

    const body = await request.json();
    const { answers, results: clientResults } = body;

    // Calculate scores on server side if answers are provided
    let calculatedResults: VARKResult;
    if (answers && Object.keys(answers).length > 0) {
      calculatedResults = calculateVARKScores(answers);
    } else if (clientResults) {
      // Use client-provided results if available (for backward compatibility)
      calculatedResults = clientResults;
    } else {
      return { error: "No answers or results provided", status: 400 };
    }

    // Create assessment record
    // Note: assessments table has required fields for academic assessments,
    // but personality assessments use dedicated result tables.
    // We provide minimal values for required fields.
    const assessmentId = `ls_${Date.now()}`;
    const [assessment] = await db
      .insert(assessments)
      .values({
        id: assessmentId,
        title: "Learning Styles Assessment",
        description: `Dominant style: ${calculatedResults.dominantStyle}${calculatedResults.secondaryStyle ? ` (secondary: ${calculatedResults.secondaryStyle})` : ""}`,
        dueDate: new Date().toISOString(), // Current date since it's already completed
        totalPoints: 100,
        passingScore: 0,
        userId: userId,
        type: "learning-styles",
        status: "completed",
        // Store complete results including readWrite score in JSON
        results: {
          answers,
          results: {
            visual: calculatedResults.visual,
            auditory: calculatedResults.auditory,
            readWrite: calculatedResults.readWrite,
            kinesthetic: calculatedResults.kinesthetic,
            dominantStyle: calculatedResults.dominantStyle,
            secondaryStyle: calculatedResults.secondaryStyle,
            description: calculatedResults.description,
            recommendations: calculatedResults.recommendations,
          }
        } as unknown as typeof assessments.$inferInsert.results,
        startedAt: new Date(),
        completedAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Store in learning_styles_results table
    // Note: Table doesn't have readWriteScore column, so we store full recommendations in JSON
    await db.insert(learningStylesResults).values({
      id: `ls_res_${Date.now()}`,
      assessmentId: assessmentId,
      userId: userId,
      visualScore: calculatedResults.visual,
      auditoryScore: calculatedResults.auditory,
      kinestheticScore: calculatedResults.kinesthetic,
      dominantStyle: calculatedResults.dominantStyle,
      recommendations: [
        ...calculatedResults.recommendations.studyTips,
        ...calculatedResults.recommendations.teachingMethods,
        ...calculatedResults.recommendations.careerSuggestions,
      ],
      completedAt: new Date(),
      createdAt: new Date(),
    });

    logger.info("Learning Styles assessment completed", {
      userId,
      assessmentId,
      dominantStyle: calculatedResults.dominantStyle,
      secondaryStyle: calculatedResults.secondaryStyle,
      scores: {
        visual: calculatedResults.visual,
        auditory: calculatedResults.auditory,
        readWrite: calculatedResults.readWrite,
        kinesthetic: calculatedResults.kinesthetic,
      },
    });

    return {
      success: true,
      assessmentId: assessment.id,
      results: {
        visual: calculatedResults.visual,
        auditory: calculatedResults.auditory,
        readWrite: calculatedResults.readWrite,
        kinesthetic: calculatedResults.kinesthetic,
        dominantStyle: calculatedResults.dominantStyle,
        secondaryStyle: calculatedResults.secondaryStyle,
        description: calculatedResults.description,
        recommendations: calculatedResults.recommendations,
      }
    };
  },
  ['student', 'parent', 'teacher', 'admin', 'school-admin', 'counselor']
);
