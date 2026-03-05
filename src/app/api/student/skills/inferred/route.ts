/**
 * STUDENT SKILLS INFERRED API
 *
 * GET /api/student/skills/inferred
 * Returns student's inferred skills with optional career gap analysis
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createApiRoute } from "@/lib/api/route-handler";
import { studentSkills, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(request.url);
    const includeCareerGaps = searchParams.get("includeCareerGaps") === "true";

    // Get student's skills from student_skills table
    const skills = await db
      .select()
      .from(studentSkills)
      .where(eq(studentSkills.userId, userId));

    // If career gaps requested, analyze them
    let careerGaps: any[] = [];
    if (includeCareerGaps) {
      // Simple gap analysis based on skill levels
      const skillMap = new Map(
        skills.map(s => [s.skillName?.toLowerCase(), s.level])
      );

      // Common career skills and expected levels
      const careerSkillRequirements = [
        { skill: "communication", expectedLevel: "intermediate" },
        { skill: "teamwork", expectedLevel: "intermediate" },
        { skill: "problem solving", expectedLevel: "intermediate" },
        { skill: "leadership", expectedLevel: "beginner" },
        { skill: "digital literacy", expectedLevel: "intermediate" },
      ];

      careerGaps = careerSkillRequirements
        .filter(req => {
          const currentLevel = skillMap.get(req.skill);
          if (!currentLevel) return true; // Missing skill is a gap
          const levels = ["beginner", "intermediate", "advanced", "expert"];
          return levels.indexOf(currentLevel) < levels.indexOf(req.expectedLevel);
        })
        .map(req => ({
          skill: req.skill,
          currentLevel: skillMap.get(req.skill) || "none",
          expectedLevel: req.expectedLevel,
          priority: req.expectedLevel === "advanced" ? "high" : "medium",
        }));
    }

    return successResponse({
      success: true,
      skills,
      careerGaps,
    });
  },
  ['student']
);
