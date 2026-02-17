import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, wizardProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { step, data } = body;

    // Get user from database
    let userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, user.id))
      .limit(1);

    // Create user if not exists (user signed in via Clerk but not in DB yet)
    let dbUser;
    if (userRecord.length === 0) {
      const userId = `user-${nanoid()}`;
      const firstName = user.firstName || "Counselor";
      const lastName = user.lastName || "";
      // Defensive email extraction - try multiple methods
      const email = user.primaryEmailAddress?.emailAddress
        || user.emailAddresses?.find((e: any) => e.id === user.primaryEmailAddressId)?.emailAddress
        || user.emailAddresses?.[0]?.emailAddress
        || "";

      await db.insert(users).values({
        id: userId,
        clerkUserId: user.id,
        type: "counselor",
        role: "counselor",
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        email,
        onboardingComplete: step === "complete",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Fetch the newly created user
      userRecord = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, user.id))
        .limit(1);

      dbUser = userRecord[0];
    } else {
      dbUser = userRecord[0];
    }

    // Mark onboarding as complete when step is "complete"
    if (step === "complete") {
      await db
        .update(users)
        .set({ onboardingComplete: true })
        .where(eq(users.id, dbUser.id));
    }

    // Update or create wizard progress (gracefully handle missing table)
    let existingProgress: any[] = [];
    try {
      existingProgress = await db
        .select()
        .from(wizardProgress)
        .where(eq(wizardProgress.userId, dbUser.id))
        .limit(1);
    } catch (error) {
      // wizard_progress table doesn't exist - skip progress tracking
      logger.warn("wizard_progress table not available, skipping progress tracking");
    }

    if (existingProgress.length > 0) {
      try {
        await db
          .update(wizardProgress)
          .set({
            currentStep: step === "complete" ? "4" : String((parseInt(existingProgress[0].currentStep as string) || 0) + 1),
            data: { ...(existingProgress[0].data as any), ...data },
            updatedAt: new Date(),
          })
          .where(eq(wizardProgress.id, existingProgress[0].id));
      } catch (error) {
        logger.warn("Could not update wizard_progress", { error });
      }
    } else {
      try {
        await db.insert(wizardProgress).values({
          id: nanoid(),
          userId: dbUser.id,
          currentStep: "1",
          completedSteps: [],
          data,
          isCompleted: false,
          lastUpdated: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (error) {
        logger.warn("Could not insert wizard_progress", { error });
      }
    }

    // Update user details
    if (data.personalDetails) {
      await db
        .update(users)
        .set({
          firstName: data.personalDetails.fullName.split(" ")[0],
          lastName: data.personalDetails.fullName.split(" ").slice(1).join(" "),
          email: data.personalDetails.email,
          phone: data.personalDetails.phone,
        })
        .where(eq(users.id, dbUser.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(error, { route: "/api/setup/counselor", method: "POST" });
    return NextResponse.json(
      { error: "Failed to process setup" },
      { status: 500 }
    );
  }
}
