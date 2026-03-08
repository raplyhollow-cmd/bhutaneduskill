/**
 * STUDENT MODULE [id] API
 *
 * GET /api/student/modules/[id] - Get details of a specific module
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, notFoundResponse } from "@/lib/api/response-helpers";

// In-memory module data for demo
const MODULES_DB: Record<string, any> = {
  mod_digital_literacy: {
    id: "mod_digital_literacy",
    title: "Digital Literacy Fundamentals",
    description: "Learn essential computer and internet skills for the modern world",
    category: "Technical",
    difficulty: "Beginner",
    duration: "4 hours",
    lessons: 8,
    status: "available",
    thumbnail: "/images/modules/digital-literacy.png",
    learningObjectives: [
      "Understand basic computer operations",
      "Navigate the internet safely",
      "Use common software applications",
      "Practice good digital citizenship",
    ],
    lessonsList: [
      { id: "l1", title: "Introduction to Computers", duration: "30 min", completed: false },
      { id: "l2", title: "Internet Basics", duration: "30 min", completed: false },
      { id: "l3", title: "Email Communication", duration: "25 min", completed: false },
      { id: "l4", title: "Online Safety", duration: "30 min", completed: false },
      { id: "l5", title: "Microsoft Word Basics", duration: "35 min", completed: false },
      { id: "l6", title: "Microsoft Excel Basics", duration: "35 min", completed: false },
      { id: "l7", title: "Presentations", duration: "30 min", completed: false },
      { id: "l8", title: "Final Assessment", duration: "25 min", completed: false },
    ],
  },
};

export const GET = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { userId } = auth;
    const { id } = await context.params;

    const module = MODULES_DB[id];

    if (!module) {
      return notFoundResponse("Module not found");
    }

    return successResponse({
      success: true,
      module,
    });
  },
  ['student']
);
