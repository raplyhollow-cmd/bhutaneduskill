import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, wizardProgress, schoolAdminApplications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

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

    // Check if there's a pending application (for school-admins)
    let application: SchoolAdminApplicationRecord[] = [];
    if (dbUser.type === "school-admin") {
      application = await db
        .select()
        .from(schoolAdminApplications)
        .where(eq(schoolAdminApplications.userId, dbUser.id))
        .limit(1);
    }

    // For school admins, we need to check if they have an application
    // and set status accordingly
    if (dbUser.type === "school-admin") {
      if (application.length > 0 && application[0].status === "approved") {
        // Already approved, mark as complete
        await db
          .update(users)
          .set({
            onboardingComplete: true,
            onboardingStatus: "complete",
          })
          .where(eq(users.id, dbUser.id));
      } else if (application.length > 0 && application[0].status === "pending_approval") {
        // Still pending approval, don't mark as complete
        await db
          .update(users)
          .set({
            onboardingComplete: false,
            onboardingStatus: "pending_approval",
          })
          .where(eq(users.id, dbUser.id));
      } else {
        // No application found - shouldn't happen for school-admin
        // Create application record
        if (dbUser.schoolId) {
          const appId = `sa_app_${nanoid()}`;
          await db.insert(schoolAdminApplications).values({
            id: appId,
            userId: dbUser.id,
            schoolId: dbUser.schoolId,
            status: "pending_approval",
            paymentStatus: "pending",
            appliedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          logger.info("Created school admin application from complete wizard", { userId: dbUser.id });
        }

        // Mark as pending approval
        await db
          .update(users)
          .set({
            onboardingComplete: false,
            onboardingStatus: "pending_approval",
          })
          .where(eq(users.id, dbUser.id));
      }
    } else {
      // For other roles, just mark as complete
      await db
        .update(users)
        .set({
          onboardingComplete: true,
          onboardingStatus: "complete",
        })
        .where(eq(users.id, dbUser.id));
    }

    logger.debug("[Setup Complete] Completed setup for user:", dbUser.id, "type:", dbUser.type);

    // Return the approval status so the wizard knows where to redirect
    const needsApproval = dbUser.type === "school-admin" &&
      (application.length === 0 || application[0].status !== "approved");

    return NextResponse.json({
      success: true,
      needsApproval,
      onboardingStatus: dbUser.onboardingStatus,
    });
  } catch (error) {
    logger.error("Error completing wizard:", error);
    return NextResponse.json(
      { error: "Failed to complete wizard" },
      { status: 500 }
    );
  }
}
