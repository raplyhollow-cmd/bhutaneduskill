import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import {
  assessments,
  riasecResults,
  mbtiResults,
  careerMatches,
  users,
} from "@/lib/db/schema";
import { eq, desc, and, isNotNull, gt, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * Student Assessment Profile API
 *
 * Returns comprehensive assessment data for the student dashboard including:
 * - Completed assessments count
 * - RIASEC results with Holland code
 * - MBTI personality type
 * - Top career matches
 * - User profile context (grade, interests, goals)
 * - Journal entry count for AI analysis
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(['student']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    const { userId } = authResult;

    // Get completed assessments
    const userAssessments = await db
      .select()
      .from(assessments)
      .where(and(eq(assessments.userId, userId), eq(assessments.status, 'completed')))
      .orderBy(desc(assessments.completedAt));

    // Get RIASEC results if available
    const riasecResult = await db
      .select()
      .from(riasecResults)
      .where(eq(riasecResults.userId, userId))
      .limit(1);

    // Get MBTI results if available
    const mbtiResult = await db
      .select()
      .from(mbtiResults)
      .where(eq(mbtiResults.userId, userId))
      .limit(1);

    // Get top career matches (if RIASEC completed)
    let topCareers: any[] = [];
    if (riasecResult.length > 0) {
      // Get the RIASEC assessment ID to find career matches
      const riasecAssessment = userAssessments.find(a => a.type === 'riasec');

      if (riasecAssessment) {
        const matches = await db
          .select({
            careerId: careerMatches.careerId,
            matchScore: careerMatches.matchScore,
          })
          .from(careerMatches)
          .where(eq(careerMatches.assessmentId, riasecAssessment.id))
          .orderBy(desc(careerMatches.matchScore))
          .limit(5);

        // Get career details from the careers table (if exists)
        for (const match of matches) {
          // If tenant module fails, create basic entry
          topCareers.push({
            id: match.careerId,
            title: match.careerId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            matchScore: match.matchScore,
          });
        }
      }
    }

    // Get user profile for context
    const [user] = await db
      .select({
        id: users.id,
        grade: users.grade,
        interests: users.interests,
        goals: users.goals,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Get journal stats for AI analysis context
    // TODO: Fix journals table reference
    // const [journalStats] = await db
    //   .select({
    //     totalEntries: sql<number>`count(*)`.mapWith(Number),
    //     lastEntryAt: sql<string>`max(${journals.createdAt})`.mapWith(String),
    //   })
    //   .from(journals)
    //   .where(eq(journals.userId, userId));

    const journalStatsResult = [{ totalEntries: 0, lastEntryAt: null }];
    const journalStats = journalStatsResult[0] || { totalEntries: 0, lastEntryAt: null };

    // Get Holland Code description
    const getHollandCodeDescription = (code: string): string => {
      const descriptions: Record<string, string> = {
        RIA: "Creative and practical - enjoys building, designing, and creating",
        RIS: "Technical and helpful - enjoys solving problems and helping others",
        RIE: "Practical and persuasive - enjoys building and leading projects",
        RIC: "Detail-oriented technical - enjoys structured technical work",
        RAE: "Practical leader - enjoys building and persuading",
        RAS: "Technical helper - enjoys working with tools and helping people",
        IRA: "Analytical creative - enjoys research and artistic pursuits",
        IRI: "Pure researcher - enjoys deep investigation and analysis",
        IAS: "Investigative helper - enjoys research and helping others",
        IAE: "Scientific innovator - enjoys research and entrepreneurial ventures",
        AIR: "Artistic builder - enjoys creative design and building",
        AIE: "Creative entrepreneur - enjoys art and business",
        AIS: "Artistic helper - enjoys creative expression and helping",
        SAE: "Helping leader - enjoys helping and leading others",
        SIA: "Supportive investigator - enjoys helping and researching",
        SEC: "Service organizer - enjoys helping and organizing",
        SRI: "Practical helper - enjoys hands-on work and helping",
        EAS: "Persuasive helper - enjoys leading and helping",
        ERI: "Enterprising builder - enjoys business and practical work",
        CES: "Structured helper - enjoys organizing and helping",
        CRI: "Technical organizer - enjoys structure and technical work",
        CRE: "Detail-oriented leader - enjoys accuracy and leadership",
      };
      return descriptions[code] || "Unique combination of interests and abilities";
    };

    // Format response
    const response = {
      completedAssessments: userAssessments.length,
      assessmentTypes: userAssessments.map(a => a.type),
      riasec: riasecResult.length > 0 ? {
        hollandCode: riasecResult[0].hollandCode,
        description: getHollandCodeDescription(riasecResult[0].hollandCode),
        scores: riasecResult[0].scores as Record<string, number> || {},
        dominantTraits: riasecResult[0].hollandCode.split(''),
      } : null,
      mbti: mbtiResult.length > 0 ? {
        type: mbtiResult[0].personalityType,
        description: `${mbtiResult[0].personalityType} personality type`,
        strengths: mbtiResult[0].strengths || [],
      } : null,
      topCareers,
      profile: {
        grade: user?.grade || 0,
        interests: user?.interests || [],
        goals: user?.goals || [],
        fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student',
      },
      journal: {
        totalEntries: journalStats?.totalEntries || 0,
        lastEntryAt: journalStats?.lastEntryAt || null,
        hasRecentEntries: !!journalStats?.lastEntryAt,
      },
      recommendations: {
        hasEnoughData: (userAssessments.length >= 2 && (journalStats?.totalEntries || 0) >= 3),
        message: (userAssessments.length < 2)
          ? "Complete more assessments to unlock personalized AI insights"
          : (journalStats?.totalEntries || 0) < 3
          ? "Write at least 3 journal entries to unlock AI-powered emotional insights"
          : "Your profile is ready for AI-powered insights!",
      }
    };

    logger.info("Assessment profile fetched", {
      userId,
      completedAssessments: response.completedAssessments,
      hasRIASEC: !!response.riasec,
      hasMBTI: !!response.mbti,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error(error, { route: "/api/student/assessment-profile", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch assessment profile" },
      { status: 500 }
    );
  }
}
