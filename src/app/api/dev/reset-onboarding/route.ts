/**
 * DEV: Reset Onboarding
 *
 * Development-only endpoint to reset user onboarding status.
 * Allows going through the unified setup flow again.
 *
 * Usage: GET /api/dev/reset-onboarding
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;

    // Reset onboarding status
    const result = await db
      .update(users)
      .set({
        onboardingComplete: false,
        onboardingStatus: "not_started",
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding reset. Redirecting to setup...",
      redirectUrl: "/setup/unified",
      user: {
        email: result[0].email,
        name: `${result[0].firstName} ${result[0].lastName}`,
        role: result[0].type,
      },
    });
  },
  ["admin", "school-admin", "student", "teacher", "parent", "counselor", "ministry"]
);
