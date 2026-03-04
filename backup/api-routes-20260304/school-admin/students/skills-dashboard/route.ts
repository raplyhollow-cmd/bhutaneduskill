/**
 * SCHOOL ADMIN SKILLS DASHBOARD API
 *
 * GET /api/school-admin/students/skills-dashboard - School-wide skills overview
 *
 * Provides school administrators with:
 * - Skills distribution across all students
 * - At-risk students (missing critical skills)
 * - Top performers by skill category
 * - Pending self-reported skills needing validation
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { studentSkills, users, studentProgressAnalytics } from "@/lib/db/schema";
import { eq, desc, count, sql, gte, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/school-admin/students/skills-dashboard - School-wide skills overview
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId, user } = auth;
    const schoolId = user.schoolId;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");

    try {
      // Get all students in this school
      const schoolStudents = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.schoolId, schoolId || ""));

      const studentIds = schoolStudents.map(s => s.id);

      if (studentIds.length === 0) {
        return successResponse({
          summary: {
            totalStudents: 0,
            studentsWithSkills: 0,
            skillsDistribution: {},
          },
          skillsByCategory: {},
          atRiskStudents: [],
          topPerformers: [],
          pendingValidations: [],
        });
      }

      // Get skills distribution by category
      const skillsByCategory = await db
        .select({
          category: studentSkills.category,
          count: count(),
        })
        .from(studentSkills)
        .where(
          and(
            sql`${studentSkills.userId} = ANY(${studentIds})`,
            eq(studentSkills.status, "approved")
          )
        )
        .groupBy(studentSkills.category);

      const distribution: Record<string, number> = {};
      for (const row of skillsByCategory) {
        distribution[row.category] = row.count;
      }

      // Get top skills
      const topSkills = await db
        .select({
          skillName: studentSkills.skillName,
          category: studentSkills.category,
          count: count(),
        })
        .from(studentSkills)
        .where(
          and(
            sql`${studentSkills.userId} = ANY(${studentIds})`,
            eq(studentSkills.status, "approved")
          )
        )
        .groupBy(studentSkills.skillName, studentSkills.category)
        .orderBy(desc(count()))
        .limit(10);

      // Get students with most skills
      const topPerformers = await db
        .select({
          userId: studentSkills.userId,
          studentFirstName: users.firstName,
          studentLastName: users.lastName,
          skillCount: count(),
        })
        .from(studentSkills)
        .innerJoin(users, eq(studentSkills.userId, users.id))
        .where(
          and(
            sql`${studentSkills.userId} = ANY(${studentIds})`,
            eq(studentSkills.status, "approved")
          )
        )
        .groupBy(studentSkills.userId, users.firstName, users.lastName)
        .orderBy(desc(count()))
        .limit(10);

      // Get pending self-reported skills
      const pendingValidations = await db
        .select({
          id: studentSkills.id,
          skillName: studentSkills.skillName,
          category: studentSkills.category,
          level: studentSkills.level,
          userId: studentSkills.userId,
          studentFirstName: users.firstName,
          studentLastName: users.lastName,
          createdAt: studentSkills.createdAt,
        })
        .from(studentSkills)
        .innerJoin(users, eq(studentSkills.userId, users.id))
        .where(
          and(
            sql`${studentSkills.userId} = ANY(${studentIds})`,
            eq(studentSkills.isInferred, false),
            eq(studentSkills.status, "pending")
          )
        )
        .orderBy(desc(studentSkills.createdAt))
        .limit(20);

      // Identify at-risk students (few skills, low attendance, etc.)
      const atRiskStudents = await db
        .select({
          userId: studentProgressAnalytics.userId,
          studentFirstName: users.firstName,
          studentLastName: users.lastName,
          riskLevel: studentProgressAnalytics.riskLevel,
          skillsCount: sql<number>`(
            SELECT COUNT(*)
            FROM ${studentSkills}
            WHERE ${studentSkills.userId} = ${studentProgressAnalytics.userId}
            AND ${studentSkills.status} = 'approved'
          )`.mapWith(Number),
        })
        .from(studentProgressAnalytics)
        .innerJoin(users, eq(studentProgressAnalytics.userId, users.id))
        .where(
          and(
            sql`${studentProgressAnalytics.userId} = ANY(${studentIds})`,
            sql`(${studentProgressAnalytics.riskLevel} = 'medium' OR ${studentProgressAnalytics.riskLevel} = 'high' OR ${studentProgressAnalytics.riskLevel} = 'critical')`
          )
        )
        .limit(20);

      return successResponse({
        summary: {
          totalStudents: studentIds.length,
          studentsWithSkills: new Set(topPerformers.map(p => p.userId)).size,
          skillsDistribution: distribution,
          totalApprovedSkills: Object.values(distribution).reduce((a, b) => a + b, 0),
          pendingValidations: pendingValidations.length,
        },
        topSkills,
        skillsByCategory: distribution,
        topPerformers: topPerformers.map(p => ({
          ...p,
          fullName: `${p.studentFirstName} ${p.studentLastName}`.trim(),
        })),
        atRiskStudents: atRiskStudents.map(s => ({
          ...s,
          fullName: `${s.studentFirstName} ${s.studentLastName}`.trim(),
        })),
        pendingValidations: pendingValidations.map(p => ({
          ...p,
          fullName: `${p.studentFirstName} ${p.studentLastName}`.trim(),
        })),
      });
    } catch (error) {
      logger.error("Failed to get school admin skills dashboard", { userId, schoolId, error });
      return errorResponse("Failed to retrieve skills dashboard", 500);
    }
  },
  ["school-admin"]
);
