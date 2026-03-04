/**
 * STUDENT SELF-REPORTED SKILLS API
 *
 * POST /api/student/skills/self-report - Add a self-reported skill
 * GET /api/student/skills/self-report - Get pending self-reported skills
 * PUT /api/student/skills/self-report - Update a self-reported skill
 * DELETE /api/student/skills/self-report - Delete a self-reported skill
 *
 * Students can add skills they have outside school (farming, weaving, etc.)
 * These skills are "pending" until a teacher validates them.
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { studentSkills } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { nanoid } from "nanoid";
import {
  addSelfReportedSkill,
  getStudentSkills,
  type SkillCategory,
  type SkillLevel,
} from "@/lib/intelligence/skills-inference-engine";

// ============================================================================
// GET /api/student/skills/self-report - Get self-reported skills
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";

    try {
      const whereConditions = [eq(studentSkills.userId, userId), eq(studentSkills.isInferred, false)];

      if (status !== "all") {
        whereConditions.push(eq(studentSkills.status, status));
      }

      const skills = await db
        .select()
        .from(studentSkills)
        .where(and(...whereConditions))
        .orderBy(desc(studentSkills.createdAt));

      return successResponse({
        skills,
        summary: {
          total: skills.length,
          pending: skills.filter(s => s.status === "pending").length,
          approved: skills.filter(s => s.status === "approved").length,
          rejected: skills.filter(s => s.status === "rejected").length,
        },
      });
    } catch (error) {
      logger.error("Failed to get self-reported skills", { userId, error });
      return errorResponse("Failed to retrieve skills", 500);
    }
  },
  ["student"]
);

// ============================================================================
// POST /api/student/skills/self-report - Add a self-reported skill
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    try {
      const body = await req.json();
      const { name, category, level, evidence } = body;

      // Validate required fields
      if (!name || !category || !level) {
        return errorResponse("Missing required fields: name, category, level", 400);
      }

      // Validate category
      const validCategories: SkillCategory[] = ["academic", "soft", "technical", "creative", "service", "vocational", "other"];
      if (!validCategories.includes(category)) {
        return errorResponse(`Invalid category. Must be one of: ${validCategories.join(", ")}`, 400);
      }

      // Validate level
      const validLevels: SkillLevel[] = ["beginner", "intermediate", "advanced", "expert"];
      if (!validLevels.includes(level)) {
        return errorResponse(`Invalid level. Must be one of: ${validLevels.join(", ")}`, 400);
      }

      // Check for duplicate skill
      const [existing] = await db
        .select()
        .from(studentSkills)
        .where(
          and(
            eq(studentSkills.userId, userId),
            eq(studentSkills.skillName, name)
          )
        )
        .limit(1);

      if (existing) {
        return errorResponse("You already have this skill. Please update the existing one instead.", 400);
      }

      // Add the self-reported skill
      await addSelfReportedSkill(userId, { name, category, level, evidence });

      return successResponse({
        message: "Skill added successfully. It will be visible once your teacher validates it.",
        skill: {
          name,
          category,
          level,
          status: "pending",
        },
      });
    } catch (error) {
      logger.error("Failed to add self-reported skill", { userId, error });
      return errorResponse("Failed to add skill", 500);
    }
  },
  ["student"]
);
