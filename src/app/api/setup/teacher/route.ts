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

    const body = await request.json();
    const { step, data } = body;

    // Get user from database
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, user.id))
      .limit(1);

    let dbUser;

    if (userRecord.length === 0) {
      // User doesn't exist - create them
      console.log("[Teacher Setup] Creating new user for clerkUserId:", user.id);

      const newUserId = `user-${Date.now()}`;
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      // Defensive email extraction - try multiple methods
      const email = user.primaryEmailAddress?.emailAddress
        || user.emailAddresses?.find((e: any) => e.id === user.primaryEmailAddressId)?.emailAddress
        || user.emailAddresses?.[0]?.emailAddress
        || "";

      // Create the user
      await db.insert(users).values({
        id: newUserId,
        clerkUserId: user.id,
        type: "teacher",
        role: "teacher",
        name: `${firstName} ${lastName}`.trim() || "Teacher",
        firstName,
        lastName,
        email,
        // Required fields with defaults
        phone: data.personalDetails?.phone || "",
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
        // Additional teacher fields
        department: "",
        employeeId: data.personalDetails?.employeeId || "",
        subjects: data.subjects || [],
        // Optional fields from form
        ...(data.personalDetails?.fullName && {
          firstName: data.personalDetails.fullName.split(" ")[0],
          lastName: data.personalDetails.fullName.split(" ").slice(1).join(" "),
          name: data.personalDetails.fullName,
        }),
        ...(data.personalDetails?.email && { email: data.personalDetails.email }),
        ...(data.personalDetails?.phone && { phone: data.personalDetails.phone }),
      });

      dbUser = (await db.select().from(users).where(eq(users.id, newUserId)).limit(1))[0];

      console.log("[Teacher Setup] Created new user:", dbUser.id);
    } else {
      dbUser = userRecord[0];
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
      console.warn("[Teacher Setup] wizard_progress table not available, skipping progress tracking");
    }

    if (existingProgress.length > 0) {
      try {
        await db
          .update(wizardProgress)
          .set({
            currentStep: step === "complete" ? "5" : String((parseInt(existingProgress[0].currentStep) || 0) + 1),
            data: { ...(existingProgress[0].data as any), ...data },
            updatedAt: new Date(),
          })
          .where(eq(wizardProgress.id, existingProgress[0].id));
      } catch (error) {
        console.warn("[Teacher Setup] Could not update wizard_progress:", error);
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
        console.warn("[Teacher Setup] Could not insert wizard_progress:", error);
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
          employeeId: data.personalDetails.employeeId,
          subjects: data.subjects || [],
        })
        .where(eq(users.id, dbUser.id));
    }

    // Mark onboarding as complete when step is "complete"
    if (step === "complete") {
      await db
        .update(users)
        .set({ onboardingComplete: true })
        .where(eq(users.id, dbUser.id));
      console.log("[Teacher Setup] Marked onboarding as complete for user:", dbUser.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in teacher setup:", error);
    return NextResponse.json(
      { error: "Failed to process setup" },
      { status: 500 }
    );
  }
}
