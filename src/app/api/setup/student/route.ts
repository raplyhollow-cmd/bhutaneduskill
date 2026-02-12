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

    if (userRecord.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dbUser = userRecord[0];

    // Update or create wizard progress
    const existingProgress = await db
      .select()
      .from(wizardProgress)
      .where(eq(wizardProgress.userId, dbUser.id))
      .limit(1);

    if (existingProgress.length > 0) {
      await db
        .update(wizardProgress)
        .set({
          currentStep: step === "complete" ? 5 : existingProgress[0].currentStep + 1,
          data: { ...(existingProgress[0].data as any), ...data },
          updatedAt: new Date(),
        })
        .where(eq(wizardProgress.id, existingProgress[0].id));
    } else {
      await db.insert(wizardProgress).values({
        id: nanoid(),
        userId: dbUser.id,
        userType: "student",
        currentStep: 1,
        totalSteps: 5,
        completed: false,
        data,
        skippedSteps: [],
        startedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Update user details
    if (data.personalDetails) {
      const nameParts = data.personalDetails.fullName.split(" ");
      await db
        .update(users)
        .set({
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" "),
          dateOfBirth: data.personalDetails.dateOfBirth,
        })
        .where(eq(users.id, dbUser.id));
    }

    if (data.academicDetails) {
      await db
        .update(users)
        .set({
          classGrade: parseInt(data.academicDetails.grade),
          section: data.academicDetails.section,
        })
        .where(eq(users.id, dbUser.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in student setup:", error);
    return NextResponse.json(
      { error: "Failed to process setup" },
      { status: 500 }
    );
  }
}
