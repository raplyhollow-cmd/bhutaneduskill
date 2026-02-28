import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, wizardProgress, schools, schoolAdminApplications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

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

interface SchoolAdminApplicationRecord {
  id: string;
  userId: string;
  schoolId: string;
  status: string;
  paymentStatus: string;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * School Admin Setup API
 *
 * Handles the setup of School Admin users during registration.
 * Creates a user with type="school-admin" if not exists.
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
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user from Clerk
    const clerkUser = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    }).then((res) => res.json());

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
      const newUserId = `user-${nanoid()}`;
      const firstName = clerkUser.first_name || "School";
      const lastName = clerkUser.last_name || "Admin";
      // Defensive email extraction - try multiple methods
      const email = clerkUser.email_addresses?.[0]?.email_address
        || clerkUser.primary_email_address?.email_address
        || "";

      await db.insert(users).values({
        id: newUserId,
        clerkUserId: userId,
        type: "school-admin",
        role: "school-admin",
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        email,
        phone: "", // Will be updated from form data
        profileImage: clerkUser.image_url || null,
        dateOfBirth: null, // Will be updated from form data
        gender: null,
        grade: 0, // Required integer, default to 0
        section: null, // JSON column - use null not ""
        rollNumber: null,
        address: null,
        city: null,
        state: null,
        postalCode: null,
        country: "Bhutan",
        parentContact: null, // JSON column
        parentPhone: null, // JSON column
        emergencyContact: null, // JSON column
        bloodGroup: null,
        enrollmentDate: new Date().toISOString().split('T')[0], // Date only string
        lastLogin: new Date().toISOString().split('T')[0],
        emailVerified: false,
        onboardingComplete: false,
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

    // Verify school code if provided
    if (data?.schoolCode) {
      const schoolRecord = await db
        .select({
          id: schools.id,
          name: schools.name,
          code: schools.code,
        })
        .from(schools)
        .where(eq(schools.code, data.schoolCode))
        .limit(1);

      if (schoolRecord.length === 0) {
        return new Response(
          JSON.stringify({ error: "Invalid school code" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Link user to school
      await db
        .update(users)
        .set({ schoolId: schoolRecord[0].id })
        .where(eq(users.id, dbUser.id));

      dbUser.schoolId = schoolRecord[0].id;
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
      // Update existing progress
      try {
        await db
          .update(wizardProgress)
          .set({
            currentStep: step === "complete" ? "5" : String((parseInt(existingProgress[0].currentStep as string) || 0) + 1),
            data: { ...(existingProgress[0]?.data || {}), ...data },
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
          phone: data.personalDetails.phone || data.adminPhone || dbUser.phone,
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
          phone: data.adminPhone || dbUser.phone,
        })
        .where(eq(users.id, dbUser.id));
    }

    // Mark onboarding as complete when step is "complete"
    if (step === "complete") {
      // Set onboarding status to pending_approval for platform admin review
      await db
        .update(users)
        .set({
          onboardingComplete: true,
          onboardingStatus: "pending_approval",
        })
        .where(eq(users.id, dbUser.id));

      // Create school admin application for platform admin approval
      if (dbUser.schoolId) {
        // Check if application already exists
        let existingApplication: SchoolAdminApplicationRecord[] = [];
        try {
          existingApplication = await db
            .select()
            .from(schoolAdminApplications)
            .where(eq(schoolAdminApplications.userId, dbUser.id))
            .limit(1);
        } catch {
          logger.warn("school_admin_applications table doesn't exist, skipping application creation");
        }

        if (existingApplication.length === 0) {
          try {
            await db.insert(schoolAdminApplications).values({
              id: `sa_app_${nanoid()}`,
              userId: dbUser.id,
              schoolId: dbUser.schoolId,
              status: "pending_approval",
              paymentStatus: "pending",
              appliedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            logger.info("Created school admin application", { userId: dbUser.id, schoolId: dbUser.schoolId });
          } catch (err) {
            logger.warn("Could not create school admin application", { error: err });
          }
        }
      }

      logger.info("School admin setup complete, awaiting approval", { userId: dbUser.id });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    logger.error("School-admin setup error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process setup",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
