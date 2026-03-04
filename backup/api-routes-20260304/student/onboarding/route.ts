import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET /api/student/onboarding
 *
 * Get student onboarding checklist status
 * Shows: Which steps completed, progress percentage, next action
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    // In production, would fetch from database
    // For now, return static steps
    // TODO: Implement onboarding progress tracking in database

    const steps = [
      {
        id: "profile",
        title: "Complete Your Profile",
        description: "Tell us about yourself",
        link: "/student/settings/profile",
        completed: false, // TODO: Check if profile is complete
        optional: false,
      },
      {
        id: "riasec",
        title: "Take RIASEC Assessment",
        description: "Discover your career aptitudes",
        link: "/student/assessment/riasec",
        completed: false, // TODO: Check if assessment completed
        optional: false,
      },
      {
        id: "roadmap",
        title: "View Your Roadmap",
        description: "See your personalized career path",
        link: "/student/roadmap",
        completed: false, // TODO: Check if roadmap viewed
        optional: false,
      },
      ];

    const completed = steps.filter((s) => s.completed).length;
    const total = steps.filter((s) => !s.optional).length;

    return {
      steps,
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      nextStep: steps.find((s) => !s.completed && !s.optional) || null,
    };
  },
  ["student"]
);
