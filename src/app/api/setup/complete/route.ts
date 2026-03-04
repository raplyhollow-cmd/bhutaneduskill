/**
 * SETUP COMPLETE API
 *
 * Marks user setup as complete using the unified API pattern.
 * This is called after the unified setup wizard is completed.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (userRecords.length === 0) {
      return NextResponse.json({ error: "User not found. Please complete setup first." }, { status: 404 });
    }

    // Update onboarding status to completed
    await db
      .update(users)
      .set({
        onboardingStatus: "completed",
        updatedAt: new Date(),
      })
      .where(eq(users.clerkUserId, userId));

    return NextResponse.json({
      success: true,
      message: "Setup completed successfully",
      redirectPath: getPortalPath(userRecords[0].type),
    });

  } catch (error: any) {
    console.error("Setup complete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete setup" },
      { status: 500 }
    );
  }
}

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
