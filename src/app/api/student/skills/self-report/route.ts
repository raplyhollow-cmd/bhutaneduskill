/**
 * STUDENT SKILLS SELF-REPORT API
 *
 * POST /api/student/skills/self-report
 * Allows students to self-report their skills
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createApiRoute } from "@/lib/api/route-handler";
import { studentSkills } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { successResponse, badRequestResponse } from "@/lib/api/response-helpers";

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const body = await request.json();
    const { name, category, level, evidence } = body;

    // Validate required fields
    if (!name || !category || !level) {
      return badRequestResponse("Missing required fields: name, category, level");
    }

    // Validate category
    const validCategories = ["academic", "soft", "technical", "creative", "service", "vocational", "other"];
    if (!validCategories.includes(category)) {
      return badRequestResponse(`Invalid category. Must be one of: ${validCategories.join(", ")}`);
    }

    // Validate level
    const validLevels = ["beginner", "intermediate", "advanced", "expert"];
    if (!validLevels.includes(level)) {
      return badRequestResponse(`Invalid level. Must be one of: ${validLevels.join(", ")}`);
    }

    // Create self-reported skill
    const [created] = await db.insert(studentSkills).values({
      id: `skill_${nanoid()}`,
      userId,
      skillName: name,
      category,
      level,
      source: "self_report",
      status: "approved", // Self-reported skills are auto-approved
      evidence: evidence || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return successResponse({
      success: true,
      skill: created,
    }, 201);
  },
  ['student']
);
