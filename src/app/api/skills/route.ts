/**
 * SKILLS API
 *
 * GET /api/skills - Get user's skills progress
 * POST /api/skills - Update user's skills progress
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

// Skills categories with levels
const SKILL_CATEGORIES = {
  "Programming": { icon: "Code", color: "bg-blue-100 text-blue-600" },
  "Design": { icon: "Palette", color: "bg-purple-100 text-purple-600" },
  "Mathematics": { icon: "Calculator", color: "bg-green-100 text-green-600" },
  "Communication": { icon: "MessageCircle", color: "bg-orange-100 text-orange-600" },
  "Problem Solving": { icon: "TrendingUp", color: "bg-red-100 text-red-600" },
  "Leadership": { icon: "Users", color: "bg-indigo-100 text-indigo-600" },
  "Languages": { icon: "BookOpen", color: "bg-teal-100 text-teal-600" },
  "Science": { icon: "Flask", color: "bg-cyan-100 text-cyan-600" },
};

// ============================================================================
// GET /api/skills - Get user's skills progress
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    // Fetch user with settings field
    const userRecords = await db
      .select({
        id: users.id,
        settings: users.settings,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userSettings = (userRecords[0]?.settings as { skills?: Record<string, number> } | undefined) || {};
    const userSkills = userSettings?.skills || {};

    return successResponse({
      skills: SKILL_CATEGORIES,
      userProgress: userSkills,
    });
  },
  ['student']
);

// ============================================================================
// POST /api/skills - Update user's skills progress
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;
    const { skill, level, action } = await request.json();

    // Fetch current settings
    const userRecords = await db
      .select({
        id: users.id,
        settings: users.settings,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userSettings = (userRecords[0]?.settings as { skills?: Record<string, number> } | undefined) || {};
    const currentSkills = userSettings?.skills || {};
    const currentLevel = currentSkills[skill] || 0;

    let newLevel = currentLevel;
    if (action === "increment") {
      newLevel = Math.min(100, currentLevel + 5);
    } else if (action === "decrement") {
      newLevel = Math.max(0, currentLevel - 5);
    } else if (typeof level === "number") {
      newLevel = Math.max(0, Math.min(100, level));
    }

    currentSkills[skill] = newLevel;

    // Update user profile
    await db
      .update(users)
      .set({
        settings: { ...userSettings, skills: currentSkills },
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return successResponse({
      success: true,
      skill,
      level: newLevel,
    });
  },
  ['student']
);
