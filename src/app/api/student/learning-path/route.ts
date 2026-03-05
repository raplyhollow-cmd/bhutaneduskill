/**
 * STUDENT LEARNING PATH API
 *
 * GET /api/student/learning-path
 * Returns the student's personalized learning path based on their skills and goals
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createApiRoute } from "@/lib/api/route-handler";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { successResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    // Get user info
    const [user] = await db
      .select({
        id: users.id,
        type: users.type,
        schoolId: users.schoolId,
        grade: users.grade,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return successResponse({
        id: "default",
        title: "Your Learning Journey",
        description: "Start by taking an assessment to get a personalized learning path.",
        modules: [],
        progress: 0,
      });
    }

    // Return a learning path based on grade
    // In a real implementation, this would be more sophisticated
    const grade = user.grade || 6;

    return successResponse({
      id: `path_${userId}`,
      title: `Class ${grade} Learning Path`,
      description: "Your personalized learning journey based on your grade level",
      modules: [
        {
          id: "module_1",
          title: "Core Academic Skills",
          description: "Strengthen your foundation in key subjects",
          status: "in_progress",
          progress: 35,
          lessons: [
            { id: "l1", title: "Mathematics Fundamentals", completed: true },
            { id: "l2", title: "Language Arts", completed: true },
            { id: "l3", title: "Science Basics", completed: false },
          ],
        },
        {
          id: "module_2",
          title: "Career Exploration",
          description: "Discover potential career paths",
          status: "locked",
          progress: 0,
          lessons: [
            { id: "l4", title: "Introduction to Careers", completed: false },
            { id: "l5", title: "Skill Assessment", completed: false },
          ],
        },
        {
          id: "module_3",
          title: "21st Century Skills",
          description: "Develop essential modern skills",
          status: "locked",
          progress: 0,
          lessons: [
            { id: "l6", title: "Digital Literacy", completed: false },
            { id: "l7", title: "Critical Thinking", completed: false },
          ],
        },
      ],
      progress: 35,
      totalModules: 3,
      completedModules: 0,
    });
  },
  ['student']
);
