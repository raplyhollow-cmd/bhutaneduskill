/**
 * SETUP COMPLETE API
 *
 * Marks user setup as complete using the unified API pattern.
 * This is called after the unified setup wizard is completed.
 *
 * MIGRATED to Pattern B (createApiRoute) for consistent auth handling.
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/setup/complete
 *
 * Marks user setup as complete and redirects to their portal.
 */
export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;

    // Update onboarding status to completed
    // Note: userId is the DATABASE id, so we query by users.id
    await db
      .update(users)
      .set({
        onboardingStatus: "completed",
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return {
      success: true,
      message: "Setup completed successfully",
      redirectPath: getPortalPath(user.type),
    };
  },
  ["student", "teacher", "parent", "counselor", "school-admin", "admin", "ministry"]
);

function getPortalPath(type: string): string {
  const paths: Record<string, string> = {
    student: "/student",
    teacher: "/teacher",
    parent: "/parent",
    counselor: "/counselor",
    "school-admin": "/school-admin",
    admin: "/admin",
    ministry: "/ministry",
  };
  return paths[type] || "/dashboard";
}
