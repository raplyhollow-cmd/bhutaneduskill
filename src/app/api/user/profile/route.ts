import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/user/profile - Get user profile
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user profile exists
    const userProfile = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkUserId, userId),
    });

    return NextResponse.json({ profile: userProfile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// POST /api/user/profile - Create or update user profile
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      dateOfBirth,
      grade,
      school,
      interests,
      goals,
      bio,
    } = body;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkUserId, userId),
    });

    if (existingUser) {
      // Update existing user
      await db
        .update(users)
        .set({
          firstName,
          lastName,
          email,
          dateOfBirth,
          classGrade: grade ? parseInt(grade.replace("Class ", "")) : null,
          school,
          interests,
          goals,
          settings: { bio },
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));

      return NextResponse.json({ success: true, profile: { ...existingUser, ...body } });
    } else {
      // Create new user
      const result = await db
        .insert(users)
        .values({
          id: `user-${Date.now()}`,
          tenantId: "default",
          clerkUserId: userId,
          type: "student",
          firstName,
          lastName,
          email,
          dateOfBirth,
          classGrade: grade ? parseInt(grade.replace("Class ", "")) : null,
          school,
          interests,
          goals,
          settings: { bio },
          emailVerified: true,
          createdAt: new Date(),
        })
        .returning();

      const newUser = Array.isArray(result) ? result[0] : result;
      return NextResponse.json({ success: true, profile: newUser });
    }
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
