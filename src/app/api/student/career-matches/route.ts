/**
 * STUDENT CAREER MATCHES API
 *
 * GET /api/student/career-matches
 * Returns personalized career matches based on student's skills and assessments
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createApiRoute } from "@/lib/api/route-handler";
import { users, studentSkills } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { successResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(request.url);
    const assessmentType = searchParams.get("assessmentType");

    // Get student's info
    const [user] = await db
      .select({
        id: users.id,
        grade: users.grade,
        interests: users.interests,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Get student's skills
    const skills = await db
      .select()
      .from(studentSkills)
      .where(eq(studentSkills.userId, userId));

    // Analyze skills and suggest career paths
    const skillCategories = skills.reduce((acc, skill) => {
      const category = skill.category || "other";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Generate career matches based on skills
    const careerMatches: Array<{
      career: string;
      matchScore: number;
      reasoning: string;
      requiredSkills: string[];
      avgSalary?: string;
      growthOutlook?: string;
    }> = [];

    // Analyze top skill categories
    const topCategories = Object.entries(skillCategories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Technical careers
    if (skillCategories.technical > 0 || skillCategories.academic > 0) {
      careerMatches.push(
        {
          career: "Software Developer",
          matchScore: 85,
          reasoning: "Based on your strong technical skills and problem-solving abilities",
          requiredSkills: ["Programming", "Problem Solving", "Mathematics"],
          avgSalary: "Nu. 30,000 - 80,000/month",
          growthOutlook: "High",
        },
        {
          career: "Data Analyst",
          matchScore: 80,
          reasoning: "Your analytical skills and attention to detail make this a good fit",
          requiredSkills: ["Data Analysis", "Statistics", "Critical Thinking"],
          avgSalary: "Nu. 25,000 - 60,000/month",
          growthOutlook: "Very High",
        }
      );
    }

    // Creative careers
    if (skillCategories.creative > 0) {
      careerMatches.push({
        career: "Graphic Designer",
        matchScore: 78,
        reasoning: "Your creative abilities and visual thinking skills stand out",
        requiredSkills: ["Design", "Creativity", "Communication"],
        avgSalary: "Nu. 20,000 - 50,000/month",
        growthOutlook: "Moderate",
      });
    }

    // Service careers
    if (skillCategories.service > 0 || skillCategories.soft > 0) {
      careerMatches.push({
        career: "Healthcare Professional",
        matchScore: 82,
        reasoning: "Your service orientation and people skills are strong",
        requiredSkills: ["Empathy", "Communication", "Scientific Knowledge"],
        avgSalary: "Nu. 25,000 - 70,000/month",
        growthOutlook: "High",
      });
    }

    // Default matches if no specific skills
    if (careerMatches.length === 0) {
      careerMatches.push(
        {
          career: "Business Administration",
          matchScore: 70,
          reasoning: "A versatile career path with many opportunities",
          requiredSkills: ["Management", "Communication", "Organization"],
          avgSalary: "Nu. 25,000 - 60,000/month",
          growthOutlook: "Moderate",
        },
        {
          career: "Teaching/Education",
          matchScore: 68,
          reasoning: "Share knowledge and inspire others",
          requiredSkills: ["Communication", "Subject Knowledge", "Patience"],
          avgSalary: "Nu. 20,000 - 45,000/month",
          growthOutlook: "Steady",
        }
      );
    }

    // Sort by match score
    careerMatches.sort((a, b) => b.matchScore - a.matchScore);

    return successResponse({
      success: true,
      careerMatches: careerMatches.slice(0, 5), // Top 5 matches
      skillSummary: {
        totalSkills: skills.length,
        topCategories,
        averageLevel: skills.length > 0
          ? skills.reduce((sum, s) => {
              const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
              return sum + (levels[s.level as keyof typeof levels] || 0);
            }, 0) / skills.length
          : 0,
      },
    });
  },
  ['student']
);
