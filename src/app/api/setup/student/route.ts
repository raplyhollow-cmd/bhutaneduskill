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

    logger.info("Student setup received", { step, data });

    // Get user from database
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, user.id))
      .limit(1);

    let dbUser;

    if (userRecord.length === 0) {
      // User doesn't exist - create them with default values
      logger.info("Creating new student user", { clerkUserId: user.id });

      const newUserId = `user-${Date.now()}`;
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      // Defensive email extraction - try multiple methods
      const email = user.primaryEmailAddress?.emailAddress
        || user.emailAddresses?.find((e: { id: string; emailAddress?: string }) => e.id === user.primaryEmailAddressId)?.emailAddress
        || user.emailAddresses?.[0]?.emailAddress
        || "";

      // Create the user with minimum required fields
      await db.insert(users).values({
        id: newUserId,
        clerkUserId: user.id,
        type: "student",
        role: "student",
        name: `${firstName} ${lastName}`.trim() || "Student",
        firstName,
        lastName,
        email,
        // Required fields with defaults
        phone: "",
        profileImage: user.imageUrl || "",
        gender: "",
        grade: 0,
        section: "",
        rollNumber: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Bhutan",
        parentContact: "",
        parentPhone: "",
        emergencyContact: "",
        bloodGroup: "",
        enrollmentDate: new Date().toISOString().split('T')[0],
        lastLogin: new Date().toISOString(),
        onboardingComplete: step === "complete",
        createdAt: new Date(),
        updatedAt: new Date(),
        // Optional fields - will be updated from form data
        ...(data.personalDetails?.fullName && {
          firstName: data.personalDetails.fullName.split(" ")[0],
          lastName: data.personalDetails.fullName.split(" ").slice(1).join(" "),
          name: data.personalDetails.fullName,
        }),
        ...(data.personalDetails?.dateOfBirth && {
          dateOfBirth: data.personalDetails.dateOfBirth,
        }),
        ...(data.personalDetails?.gender && {
          gender: data.personalDetails.gender,
        }),
        ...(data.personalDetails?.bloodGroup && {
          bloodGroup: data.personalDetails.bloodGroup,
        }),
        ...(data.academicDetails?.grade && {
          classGrade: parseInt(data.academicDetails.grade),
          grade: parseInt(data.academicDetails.grade),
        }),
        ...(data.academicDetails?.section && {
          section: data.academicDetails.section,
        }),
        ...(data.academicDetails?.rollNumber && {
          rollNumber: data.academicDetails.rollNumber,
        }),
        ...(data.guardianDetails?.guardianName && {
          parentContact: data.guardianDetails.guardianName,
        }),
        ...(data.guardianDetails?.guardianPhone && {
          parentPhone: data.guardianDetails.guardianPhone,
        }),
      });

      dbUser = (await db.select().from(users).where(eq(users.id, newUserId)).limit(1))[0];

      logger.info("Created new student user", { userId: dbUser.id });
    } else {
      dbUser = userRecord[0];
    }

    // Update or create wizard progress (gracefully handle missing table)
    let existingProgress: Array<{ id: string; currentStep: string; data: Record<string, unknown> }> = [];
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
            currentStep: step === "complete" ? "5" : String((parseInt(existingProgress[0].currentStep as string) || 0) + 1),
            data: { ...(existingProgress[0].data as Record<string, unknown>), ...data },
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
      const nameParts = data.personalDetails.fullName?.split(" ") || ["", ""];
      const updateData: {
        firstName: string;
        lastName: string;
        dateOfBirth?: string;
      } = {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" "),
      };
      if (data.personalDetails.dateOfBirth) {
        updateData.dateOfBirth = data.personalDetails.dateOfBirth;
      }
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, dbUser.id));
    }

    if (data.academicDetails) {
      const updateData: Record<string, number | string> = {};
      if (data.academicDetails.grade) {
        updateData.classGrade = parseInt(data.academicDetails.grade);
        updateData.grade = parseInt(data.academicDetails.grade);
      }
      if (data.academicDetails.section) {
        updateData.section = data.academicDetails.section;
      }
      if (Object.keys(updateData).length > 0) {
        await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, dbUser.id));
      }
    }

    // Mark onboarding as complete when step is "complete"
    if (step === "complete") {
      await db
        .update(users)
        .set({ onboardingComplete: true })
        .where(eq(users.id, dbUser.id));
      logger.info("Marked onboarding as complete for student", { userId: dbUser.id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(error, { route: "/api/setup/student", method: "POST" });
    return NextResponse.json(
      { error: "Failed to process setup", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
