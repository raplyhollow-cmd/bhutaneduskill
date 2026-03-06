/**
 * CAREER INTEREST TRACKER SERVICE
 *
 * Tracks how student interests evolve over time:
 * - Interest changes and patterns
 * - Emerging interests
 * - Significant shifts
 * - Re-assessment triggers
 *
 * Last Updated: March 5, 2026
 */

import { db } from "@/lib/db";
import { careerExplorationActivities, careerInterests } from "@/lib/db/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { expandedCareersData } from "@/lib/data/careers-expanded";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface InterestSnapshot {
  careerId: string;
  careerTitle: string;
  interestLevel: "high" | "medium" | "low";
  timestamp: Date;
  source: "explicit" | "inferred" | "assessment";
}

export interface InterestTrend {
  careerId: string;
  careerTitle: string;
  category: string;

  // Trend data
  currentLevel: "high" | "medium" | "low";
  previousLevel?: "high" | "medium" | "low";
  direction: "rising" | "stable" | "declining" | "new";

  // Timeline
  firstSeen: Date;
  lastUpdated: Date;
  dataPoints: number;

  // Significance
  consistent: boolean; // Has interest been consistent over time?
  peakLevel: "high" | "medium" | "low";
}

export interface InterestShift {
  type: "new" | "significant-rise" | "significant-decline" | "category-change";
  description: string;
  fromCareer?: { id: string; title: string };
  toCareer?: { id: string; title: string };
  timestamp: Date;
  significance: "low" | "medium" | "high";
}

export interface ReassessmentTrigger {
  reason: string;
  priority: "low" | "medium" | "high";
  action: string;
  dueDate?: Date;
}

// ============================================================================
// INTEREST TRACKING
// ============================================================================

/**
 * Record a career interest activity
 */
export async function recordCareerActivity({
  studentId,
  activityType,
  metadata = {},
}: {
  studentId: string;
  activityType:
    | "career_view"
    | "career_save"
    | "career_search"
    | "assessment_complete"
    | "coach_chat"
    | "roadmap_view"
    | "rub_program_view";
  metadata?: Record<string, any>;
}): Promise<void> {
  await db.insert(careerExplorationActivities).values({
    id: generateId(),
    studentId,
    activityType,
    metadata: metadata as any,
    createdAt: new Date(),
  });
}

/**
 * Record or update a student's interest in a career
 */
export async function recordCareerInterest({
  studentId,
  careerId,
  interestLevel,
  source = "explicit",
}: {
  studentId: string;
  careerId: string;
  interestLevel: "high" | "medium" | "low";
  source?: "explicit" | "inferred" | "assessment";
}): Promise<void> {
  // Check if interest exists
  const existing = await db.query.careerInterests.findFirst({
    where: and(
      eq(careerInterests.studentId, studentId),
      eq(careerInterests.careerId, careerId)
    ),
  });

  if (existing) {
    // Update existing interest
    await db
      .update(careerInterests)
      .set({
        interestLevel,
        source,
        lastUpdated: new Date(),
        viewCount: (existing.viewCount || 0) + 1,
      })
      .where(eq(careerInterests.id, existing.id));
  } else {
    // Create new interest
    await db.insert(careerInterests).values({
      id: generateId(),
      studentId,
      careerId,
      interestLevel,
      source,
      viewCount: 1,
      firstSeen: new Date(),
      lastUpdated: new Date(),
      createdAt: new Date(),
    });
  }

  // Also record the activity
  await recordCareerActivity({
    studentId,
    activityType: "career_save",
    metadata: { careerId, interestLevel },
  });
}

/**
 * Get student's interest history for a career
 */
export async function getCareerInterestHistory(
  studentId: string,
  careerId: string,
  daysBack: number = 90
): Promise<InterestSnapshot[]> {
  // Get current interest
  const current = await db.query.careerInterests.findFirst({
    where: and(
      eq(careerInterests.studentId, studentId),
      eq(careerInterests.careerId, careerId)
    ),
  });

  const snapshots: InterestSnapshot[] = [];

  if (current) {
    snapshots.push({
      careerId: current.careerId,
      careerTitle: getCareerTitle(current.careerId),
      interestLevel: current.interestLevel as "high" | "medium" | "low",
      timestamp: current.lastUpdated,
      source: current.source as "explicit" | "inferred" | "assessment",
    });
  }

  // Get historical activities
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const activities = await db.query.careerExplorationActivities.findMany({
    where: and(
      eq(careerExplorationActivities.studentId, studentId),
      gte(careerExplorationActivities.createdAt, cutoffDate)
    ),
    orderBy: [desc(careerExplorationActivities.createdAt)],
  });

  // Add activities as snapshots
  for (const activity of activities) {
    const activityCareerId = (activity.metadata as any)?.careerId;
    if (activityCareerId === careerId) {
      snapshots.push({
        careerId,
        careerTitle: getCareerTitle(careerId),
        interestLevel: "medium", // Default for activities
        timestamp: activity.createdAt,
        source: "inferred",
      });
    }
  }

  return snapshots.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Analyze interest trends for a student
 */
export async function analyzeInterestTrends(
  studentId: string,
  daysBack: number = 90
): Promise<{
  trends: InterestTrend[];
  topInterests: InterestTrend[];
  emergingInterests: InterestTrend[];
  decliningInterests: InterestTrend[];
}> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  // Get all interests
  const interests = await db.query.careerInterests.findMany({
    where: and(
      eq(careerInterests.studentId, studentId),
      gte(careerInterests.lastUpdated, cutoffDate)
    ),
  });

  // Get activities for additional data points
  const activities = await db.query.careerExplorationActivities.findMany({
    where: and(
      eq(careerExplorationActivities.studentId, studentId),
      gte(careerExplorationActivities.createdAt, cutoffDate)
    ),
  });

  // Build trends
  const trendMap = new Map<string, InterestTrend>();

  // Process explicit interests
  for (const interest of interests) {
    const career = expandedCareersData.find((c) => c.id === interest.careerId);
    if (!career) continue;

    trendMap.set(interest.careerId, {
      careerId: interest.careerId,
      careerTitle: career.title,
      category: career.category,
      currentLevel: interest.interestLevel as "high" | "medium" | "low",
      firstSeen: interest.firstSeen,
      lastUpdated: interest.lastUpdated,
      dataPoints: interest.viewCount || 1,
      consistent: true, // Will calculate
      peakLevel: interest.interestLevel as "high" | "medium" | "low",
      direction: "stable",
    });
  }

  // Process activities to add inferred interests
  for (const activity of activities) {
    const careerId = (activity.metadata as any)?.careerId;
    if (!careerId) continue;

    const existing = trendMap.get(careerId);
    if (existing) {
      existing.dataPoints++;
    } else {
      const career = expandedCareersData.find((c) => c.id === careerId);
      if (career) {
        trendMap.set(careerId, {
          careerId,
          careerTitle: career.title,
          category: career.category,
          currentLevel: "low",
          firstSeen: activity.createdAt,
          lastUpdated: activity.createdAt,
          dataPoints: 1,
          consistent: true,
          peakLevel: "low",
          direction: "new",
        });
      }
    }
  }

  // Calculate direction for each trend
  const trends: InterestTrend[] = [];
  for (const [careerId, trend] of trendMap) {
    // Determine direction based on data points and recency
    const daysSinceFirst = Math.floor(
      (Date.now() - trend.firstSeen.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysSinceLast = Math.floor(
      (Date.now() - trend.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceFirst < 7) {
      trend.direction = "new";
    } else if (daysSinceLast > 30) {
      trend.direction = "declining";
    } else if (trend.dataPoints >= 3) {
      trend.direction = "rising";
    } else {
      trend.direction = "stable";
    }

    // Check consistency (if interest has been maintained)
    trend.consistent = daysSinceLast < 14 && trend.dataPoints >= 2;

    trends.push(trend);
  }

  // Categorize trends
  const topInterests = trends
    .filter((t) => t.currentLevel === "high")
    .sort((a, b) => b.dataPoints - a.dataPoints)
    .slice(0, 5);

  const emergingInterests = trends
    .filter((t) => t.direction === "new" || t.direction === "rising")
    .sort((a, b) => b.dataPoints - a.dataPoints)
    .slice(0, 5);

  const decliningInterests = trends
    .filter((t) => t.direction === "declining")
    .sort((a, b) => a.dataPoints - b.dataPoints)
    .slice(0, 5);

  return {
    trends: trends.sort((a, b) => b.dataPoints - a.dataPoints),
    topInterests,
    emergingInterests,
    decliningInterests,
  };
}

/**
 * Detect significant shifts in career interests
 */
export async function detectInterestShifts(
  studentId: string,
  daysBack: number = 30
): Promise<InterestShift[]> {
  const shifts: InterestShift[] = [];

  const { trends, emergingInterests, decliningInterests } =
    await analyzeInterestTrends(studentId, daysBack);

  // Detect new high-interest careers
  for (const emerging of emergingInterests) {
    if (emerging.currentLevel === "high" && emerging.dataPoints >= 3) {
      shifts.push({
        type: "new",
        description: `Developed strong interest in ${emerging.careerTitle}`,
        toCareer: { id: emerging.careerId, title: emerging.careerTitle },
        timestamp: emerging.lastUpdated,
        significance: "high",
      });
    }
  }

  // Detect significant declines
  for (const declining of decliningInterests) {
    if (declining.peakLevel === "high" && declining.currentLevel === "low") {
      shifts.push({
        type: "significant-decline",
        description: `Interest in ${declining.careerTitle} has decreased significantly`,
        fromCareer: { id: declining.careerId, title: declining.careerTitle },
        timestamp: declining.lastUpdated,
        significance: "medium",
      });
    }
  }

  // Detect category changes
  const categories = new Map<string, string[]>();
  for (const trend of trends) {
    if (!categories.has(trend.category)) {
      categories.set(trend.category, []);
    }
    categories.get(trend.category)!.push(trend.careerId);
  }

  // Check if interests have shifted between categories
  const recentTrends = trends.filter(
    (t) => Date.now() - t.lastUpdated.getTime() < 14 * 24 * 60 * 60 * 1000
  );

  const recentCategories = new Set(recentTrends.map((t) => t.category));
  const olderCategories = new Set(
    trends
      .filter(
        (t) => Date.now() - t.lastUpdated.getTime() >= 14 * 24 * 60 * 60 * 1000
      )
      .map((t) => t.category)
  );

  for (const recentCat of recentCategories) {
    if (!olderCategories.has(recentCat) && recentTrends.length > 3) {
      shifts.push({
        type: "category-change",
        description: `Exploring new career category: ${recentCat}`,
        timestamp: new Date(),
        significance: "low",
      });
    }
  }

  return shifts.sort((a, b) => {
    const significanceOrder = { high: 3, medium: 2, low: 1 };
    return (
      significanceOrder[b.significance] - significanceOrder[a.significance]
    );
  });
}

/**
 * Generate reassessment triggers based on interest changes
 */
export async function generateReassessmentTriggers(
  studentId: string
): Promise<ReassessmentTrigger[]> {
  const triggers: ReassessmentTrigger[] = [];
  const shifts = await detectInterestShifts(studentId, 30);
  const { trends } = await analyzeInterestTrends(studentId, 90);

  // High significance shifts trigger reassessment
  const highSignificanceShifts = shifts.filter((s) => s.significance === "high");
  if (highSignificanceShifts.length >= 2) {
    triggers.push({
      reason: "Multiple significant interest changes detected",
      priority: "high",
      action: "Schedule career counseling session to discuss new interests",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    });
  }

  // If interests are inconsistent or scattered
  const consistentInterests = trends.filter((t) => t.consistent);
  if (consistentInterests.length === 0 && trends.length >= 5) {
    triggers.push({
      reason: "Interests appear scattered - no consistent patterns",
      priority: "medium",
      action: "Take structured career assessment to clarify interests",
    });
  }

  // If high-interest careers are in very different categories
  const highInterests = trends.filter((t) => t.currentLevel === "high");
  if (highInterests.length >= 3) {
    const categories = new Set(highInterests.map((t) => t.category));
    if (categories.size >= 3) {
      triggers.push({
        reason: "High interest in diverse career categories",
        priority: "medium",
        action: "Consider taking personality assessment to identify best fit",
      });
    }
  }

  // If no recent activity
  const recentActivity = await db.query.careerExplorationActivities.findMany({
    where: and(
      eq(careerExplorationActivities.studentId, studentId),
      gte(
        careerExplorationActivities.createdAt,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      )
    ),
  });

  if (recentActivity.length === 0) {
    triggers.push({
      reason: "No career exploration activity in the last 30 days",
      priority: "low",
      action: "Explore careers in your areas of interest",
    });
  }

  return triggers;
}

/**
 * Get student's career exploration summary
 */
export async function getCareerExplorationSummary(
  studentId: string,
  daysBack: number = 30
): Promise<{
  totalActivities: number;
  activitiesByType: Record<string, number>;
  careersExplored: number;
  topCareers: Array<{ careerId: string; careerTitle: string; views: number }>;
  lastActivity: Date | null;
}> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  // Get activities
  const activities = await db.query.careerExplorationActivities.findMany({
    where: and(
      eq(careerExplorationActivities.studentId, studentId),
      gte(careerExplorationActivities.createdAt, cutoffDate)
    ),
    orderBy: [desc(careerExplorationActivities.createdAt)],
  });

  // Count by type
  const activitiesByType: Record<string, number> = {};
  for (const activity of activities) {
    activitiesByType[activity.activityType] =
      (activitiesByType[activity.activityType] || 0) + 1;
  }

  // Count unique careers
  const careerViews = new Map<string, number>();
  for (const activity of activities) {
    const careerId = (activity.metadata as any)?.careerId;
    if (careerId) {
      careerViews.set(careerId, (careerViews.get(careerId) || 0) + 1);
    }
  }

  // Get top careers
  const topCareers = Array.from(careerViews.entries())
    .map(([careerId, views]) => ({
      careerId,
      careerTitle: getCareerTitle(careerId),
      views,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  return {
    totalActivities: activities.length,
    activitiesByType,
    careersExplored: careerViews.size,
    topCareers,
    lastActivity: activities.length > 0 ? activities[0].createdAt : null,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getCareerTitle(careerId: string): string {
  const career = expandedCareersData.find((c) => c.id === careerId);
  return career?.title || careerId;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

