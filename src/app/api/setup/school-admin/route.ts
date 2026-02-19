import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, wizardProgress, schools } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
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
      const firstName = user.firstName || "School";
      const lastName = user.lastName || "Admin";
      // Defensive email extraction - try multiple methods
      const email = user.primaryEmailAddress?.emailAddress
        || user.emailAddresses?.find((e: any) => e.id === user.primaryEmailAddressId)?.emailAddress
        || user.emailAddresses?.[0]?.emailAddress
        || "";

      await db.insert(users).values({
        id: userId,
        clerkUserId: user.id,
        type: "school-admin",
        role: "school-admin",
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

    // Verify school code if provided
    if (data?.schoolCode) {
      const schoolRecord = await db
        .select()
        .from(schools)
        .where(eq(schools.code, data.schoolCode))
        .limit(1);

      if (schoolRecord.length === 0) {
        return NextResponse.json({ error: "Invalid school code" }, { status: 400 });
      }

      // Link user to school
      await db
        .update(users)
        .set({ schoolId: schoolRecord[0].id })
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
      // Update existing progress
      try {
        await db
          .update(wizardProgress)
          .set({
            currentStep: step === "complete" ? "5" : String((parseInt(existingProgress[0].currentStep as string) || 0) + 1),
            data: { ...(existingProgress[0].data as any), ...data },
            updatedAt: new Date(),
          })
          .where(eq(wizardProgress.id, existingProgress[0].id));
      } catch (error) {
        logger.warn("Could not update wizard_progress", { error });
      }
    } else {
      // Create new progress
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

    // Update user details with personal info
    if (data.personalDetails) {
      const fullName = data.personalDetails.fullName || data.adminName || "";
      const nameParts = fullName.trim().split(" ");
      await db
        .update(users)
        .set({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: data.personalDetails.email || data.adminEmail || dbUser.email,
          phone: data.personalDetails.phone || data.adminPhone || "",
        })
        .where(eq(users.id, dbUser.id));
    } else if (data.adminName) {
      // Handle school-admin specific fields
      const nameParts = data.adminName.trim().split(" ");
      await db
        .update(users)
        .set({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: data.adminEmail || dbUser.email,
          phone: data.adminPhone || "",
        })
        .where(eq(users.id, dbUser.id));
    }

    // Mark onboarding as complete when step is "complete"
    if (step === "complete") {
      await db
        .update(users)
        .set({ onboardingComplete: true })
        .where(eq(users.id, dbUser.id));
      logger.info("Marked onboarding as complete for school-admin", { userId: dbUser.id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("School-admin setup error:", error);
    return NextResponse.json(
      {
        error: "Failed to process setup",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
