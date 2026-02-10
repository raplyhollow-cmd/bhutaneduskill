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
      .where(eq(users.clerkId, user.id))
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
          currentStep: step === "complete" ? 4 : existingProgress[0].currentStep + 1,
          data: { ...(existingProgress[0].data as any), ...data },
          updatedAt: new Date(),
        })
        .where(eq(wizardProgress.id, existingProgress[0].id));
    } else {
      await db.insert(wizardProgress).values({
        id: nanoid(),
        userId: dbUser.id,
        userType: "counselor",
        currentStep: 1,
        totalSteps: 4,
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
    console.error("Error in counselor setup:", error);
    return NextResponse.json(
      { error: "Failed to process setup" },
      { status: 500 }
    );
  }
}
