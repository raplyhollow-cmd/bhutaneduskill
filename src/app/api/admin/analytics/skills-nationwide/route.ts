/**
 * PLATFORM ADMIN NATIONWIDE SKILLS ANALYTICS API
 *
 * GET /api/admin/analytics/skills-nationwide - Aggregate skills data across all schools
 *
 * Provides platform administrators with:
 * - Skills distribution by region/school
 * - Demand gap analysis (skills needed vs available)
 * - Emerging skills trends
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { studentSkills, users, schools } from "@/lib/db/schema";
import { eq, desc, count, sql, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/admin/analytics/skills-nationwide - Nationwide skills analytics
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const { searchParams } = new URL(req.url);
    const groupBy = searchParams.get("groupBy") || "school"; // school, region, category
    const limit = parseInt(searchParams.get("limit") || "50");

    try {
      // Get skills by category (nationwide)
      const skillsByCategory = await db
        .select({
          category: studentSkills.category,
          count: count(),
        })
        .from(studentSkills)
        .where(eq(studentSkills.status, "approved"))
        .groupBy(studentSkills.category)
        .orderBy(desc(count()));

      const categoryDistribution: Record<string, number> = {};
      for (const row of skillsByCategory) {
        categoryDistribution[row.category] = row.count;
      }

      // Get top skills nationwide
      const topSkills = await db
        .select({
          skillName: studentSkills.skillName,
          category: studentSkills.category,
          count: count(),
        })
        .from(studentSkills)
        .where(eq(studentSkills.status, "approved"))
        .groupBy(studentSkills.skillName, studentSkills.category)
        .orderBy(desc(count()))
        .limit(20);

      // Get skills by school
      const skillsBySchool = await db
        .select({
          schoolId: schools.id,
          schoolName: schools.name,
          districtId: schools.districtId,
          skillCount: sql<number>`COUNT(DISTINCT ${studentSkills.id})`.mapWith(Number),
        })
        .from(studentSkills)
        .innerJoin(users, eq(studentSkills.userId, users.id))
        .innerJoin(schools, eq(users.schoolId, schools.id))
        .where(eq(studentSkills.status, "approved"))
        .groupBy(schools.id, schools.name, schools.districtId)
        .orderBy(desc(sql`COUNT(DISTINCT ${studentSkills.id})`))
        .limit(limit);

      // Get skills by district/region
      const skillsByRegion = await db
        .select({
          districtId: schools.districtId,
          skillCount: sql<number>`COUNT(DISTINCT ${studentSkills.id})`.mapWith(Number),
          studentCount: sql<number>`COUNT(DISTINCT ${studentSkills.userId})`.mapWith(Number),
        })
        .from(studentSkills)
        .innerJoin(users, eq(studentSkills.userId, users.id))
        .innerJoin(schools, eq(users.schoolId, schools.id))
        .where(eq(studentSkills.status, "approved"))
        .groupBy(schools.districtId)
        .orderBy(desc(sql`COUNT(DISTINCT ${studentSkills.id})`));

      // Calculate demand gap (compare with career requirements)
      const { careers } = await import("@/lib/db/schema");

      // Get skills required by careers
      const careerSkills = await db
        .select({ skills: careers.skills })
        .from(careers)
        .where(eq(careers.isActive, true));

      const requiredSkills = new Map<string, number>();
      for (const career of careerSkills) {
        const skillArray = (career.skills as string[]) || [];
        for (const skill of skillArray) {
          requiredSkills.set(skill.toLowerCase(), (requiredSkills.get(skill.toLowerCase()) || 0) + 1);
        }
      }

      // Get skills students actually have
      const studentSkillsList = await db
        .select({ skillName: studentSkills.skillName })
        .from(studentSkills)
        .where(eq(studentSkills.status, "approved"));

      const availableSkills = new Map<string, number>();
      for (const skill of studentSkillsList) {
        const key = skill.skillName.toLowerCase();
        availableSkills.set(key, (availableSkills.get(key) || 0) + 1);
      }

      // Calculate gap
      const demandGap: Record<string, { demand: number; available: number; gap: number }> = {};
      for (const [skill, demand] of requiredSkills) {
        const available = availableSkills.get(skill) || 0;
        demandGap[skill] = {
          demand,
          available,
          gap: Math.max(0, demand - available),
        };
      }

      // Top shortages (skills most needed but least available)
      const shortages = Object.entries(demandGap)
        .filter(([_, data]) => data.gap > 0)
        .sort((a, b) => b[1].gap - a[1].gap)
        .slice(0, 15)
        .map(([skill, data]) => ({ skill, ...data }));

      return successResponse({
        summary: {
          totalSkills: Object.values(categoryDistribution).reduce((a, b) => a + b, 0),
          uniqueSkills: topSkills.length,
          categories: Object.keys(categoryDistribution).length,
          schoolsTracked: skillsBySchool.length,
          districtsTracked: skillsByRegion.length,
        },
        skillsByCategory: categoryDistribution,
        topSkills,
        bySchool: skillsBySchool,
        byRegion: skillsByRegion,
        demandGap: shortages,
      });
    } catch (error) {
      logger.error("Failed to get nationwide skills analytics", { userId, error });
      return errorResponse("Failed to retrieve analytics", 500);
    }
  },
  ["admin"]
);
