import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, wizardProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, user.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dbUser = userRecord[0];

    // Update user as onboarding complete
    await db
      .update(users)
      .set({ onboardingComplete: true })
      .where(eq(users.id, dbUser.id));

    // Update wizard progress
    const existingProgress = await db
      .select()
      .from(wizardProgress)
      .where(eq(wizardProgress.userId, dbUser.id))
      .limit(1);

    if (existingProgress.length > 0) {
      await db
        .update(wizardProgress)
        .set({
          isCompleted: true,
          completed: true,
          updatedAt: new Date(),
        })
        .where(eq(wizardProgress.id, existingProgress[0].id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing wizard:", error);
    return NextResponse.json(
      { error: "Failed to complete wizard" },
      { status: 500 }
    );
  }
}
