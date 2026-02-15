import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, wizardProgress, schools } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
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
      const email = user.emailAddresses?.[0]?.emailAddress || "";

      await db.insert(users).values({
        id: userId,
        clerkUserId: user.id,
        type: "school-admin",
        role: "school-admin",
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        email,
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

    // Update or create wizard progress
    const existingProgress = await db
      .select()
      .from(wizardProgress)
      .where(eq(wizardProgress.userId, dbUser.id))
      .limit(1);

    if (existingProgress.length > 0) {
      // Update existing progress
      await db
        .update(wizardProgress)
        .set({
          currentStep: step === "complete" ? "5" : String((parseInt(existingProgress[0].currentStep as string) || 0) + 1),
          data: { ...(existingProgress[0].data as any), ...data },
          updatedAt: new Date(),
        })
        .where(eq(wizardProgress.id, existingProgress[0].id));
    } else {
      // Create new progress
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
    }

    // Update user details with personal info
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
    console.error("Error in school-admin setup:", error);
    return NextResponse.json(
      { error: "Failed to process setup" },
      { status: 500 }
    );
  }
}
