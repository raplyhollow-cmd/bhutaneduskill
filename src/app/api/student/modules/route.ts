/**
 * STUDENT MODULES API
 *
 * GET /api/student/modules - List all available learning modules
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    // For now, return a list of predefined modules
    // In a real implementation, this would come from a database
    const modules = [
      {
        id: "mod_digital_literacy",
        title: "Digital Literacy Fundamentals",
        description: "Learn essential computer and internet skills",
        category: "Technical",
        difficulty: "Beginner",
        duration: "4 hours",
        lessons: 8,
        status: "available",
        thumbnail: "/images/modules/digital-literacy.png",
      },
      {
        id: "mod_career_exploration",
        title: "Career Exploration",
        description: "Discover your ideal career path",
        category: "Career",
        difficulty: "Beginner",
        duration: "3 hours",
        lessons: 6,
        status: "available",
        thumbnail: "/images/modules/career.png",
      },
      {
        id: "mod_communication",
        title: "Effective Communication",
        description: "Master verbal and written communication",
        category: "Soft Skills",
        difficulty: "Intermediate",
        duration: "5 hours",
        lessons: 10,
        status: "available",
        thumbnail: "/images/modules/communication.png",
      },
      {
        id: "mod_financial_literacy",
        title: "Financial Literacy",
        description: "Understand money management and budgeting",
        category: "Life Skills",
        difficulty: "Beginner",
        duration: "3 hours",
        lessons: 7,
        status: "available",
        thumbnail: "/images/modules/financial.png",
      },
    ];

    return successResponse({
      success: true,
      modules,
    });
  },
  ['student']
);
