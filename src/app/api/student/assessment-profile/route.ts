import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  assessments,
  riasecResults,
  mbtiResults,
  careerMatches,
  users,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * Student Assessment Profile API
 *
 * Returns comprehensive assessment data for the student dashboard
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

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
    interface CareerMatch {
      id: string;
      title: string;
      matchScore: number;
    }
    let topCareers: CareerMatch[] = [];
    if (riasecResult.length > 0) {
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

        for (const match of matches) {
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
        settings: users.settings,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Extract journal stats from user.settings
    interface UserSettings {
      journalEntries?: Array<{ date: string; entry: string }>;
    }
    const settings = (user?.settings as UserSettings | null) || {};
    const journalEntries = settings.journalEntries || [];

    let totalEntries = journalEntries.length;
    let lastEntryAt: string | null = null;

    if (journalEntries.length > 0) {
      interface JournalEntry {
        date: string;
        entry: string;
      }
      const sortedEntries = [...journalEntries].sort((a: JournalEntry, b: JournalEntry) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      lastEntryAt = sortedEntries[0].date;
    }

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
        totalEntries,
        lastEntryAt,
        hasRecentEntries: !!lastEntryAt,
      },
      recommendations: {
        hasEnoughData: (userAssessments.length >= 2 && totalEntries >= 3),
        message: (userAssessments.length < 2)
          ? "Complete more assessments to unlock personalized AI insights"
          : totalEntries < 3
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

    return response;
  },
  ['student']
);
