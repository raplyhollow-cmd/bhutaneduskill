import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, wizardProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

interface ClerkJSEmailAddress {
  id: string;
  emailAddress: string;
}

interface WizardProgressRecord {
  id: string;
  userId: string;
  currentStep: string;
  completedSteps: string[];
  data: Record<string, unknown>;
  isCompleted: boolean;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Counselor Setup API
 *
 * Handles the setup of Counselor users during registration.
 * Creates a user with type="counselor" if not exists.
 *
 * Note: This route intentionally uses Clerk's auth() directly instead of requireAuth()
 * because it's called during the setup wizard for users who may not exist in the database yet.
 * The setup wizard pattern requires: 1) Clerk auth (user exists in Clerk) 2) Check database 3) Create if not exists
 */

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { step, data } = body;

    // Get user from database
    let userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    // Create user if not exists (user signed in via Clerk but not in DB yet)
    let dbUser;
    if (userRecord.length === 0) {
      const user = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }).then((res) => res.json());

      const newUserId = `user-${nanoid()}`;
      const firstName = user.first_name || "Counselor";
      const lastName = user.last_name || "";
      // Defensive email extraction - try multiple methods
      const email = user.email_addresses?.[0]?.email_address
        || user.primary_email_address?.email_address
        || "";

      await db.insert(users).values({
        id: newUserId,
        clerkUserId: userId,
        type: "counselor",
        role: "counselor",
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        email,
        // Required fields with defaults
        phone: "",
        profileImage: user.image_url || "",
        gender: "other",
        grade: 0,
        section: null, // JSON column
        rollNumber: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Bhutan",
        parentContact: null, // JSON column
        parentPhone: null, // JSON column
        emergencyContact: null, // JSON column
        bloodGroup: "",
        enrollmentDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        onboardingComplete: step === "complete",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Fetch the newly created user
      userRecord = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
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
    let existingProgress: WizardProgressRecord[] = [];
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
            data: { ...(existingProgress[0]?.data || {}), ...data },
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
      const fullName = data.personalDetails.fullName || "";
      const nameParts = fullName.trim().split(" ");
      await db
        .update(users)
        .set({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: data.personalDetails.email || "",
          phone: data.personalDetails.phone || "",
        })
        .where(eq(users.id, dbUser.id));
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    logger.error("Counselor setup error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to process setup",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
