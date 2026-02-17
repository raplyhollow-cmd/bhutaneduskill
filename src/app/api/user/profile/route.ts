import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

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

    // Transform the profile to include bio from settings and grade display name
    const transformedProfile = userProfile ? {
      ...userProfile,
      bio: (userProfile as any).settings?.bio || "",
      grade: (userProfile as any).classGrade ? `Class ${(userProfile as any).classGrade}` : "",
    } : null;

    return NextResponse.json({ profile: transformedProfile });
  } catch (error) {
    logger.error(error, { route: "/api/user/profile", method: "GET" });
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
      logger.security("unauthorized_access_attempt", { route: "/api/user/profile", method: "POST" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    logger.info("Updating profile", { userId });

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
      logger.debug("Updating existing user", { userId: existingUser.id });

      // Build update object with only the fields that exist in schema
      // We use sql to do a partial update, only updating provided fields
      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      // Only update fields that are provided and exist in schema
      if (typeof firstName === "string") updateData.firstName = firstName.trim();
      if (typeof lastName === "string") updateData.lastName = lastName.trim();
      if (typeof email === "string") updateData.email = email.trim();
      if (typeof dateOfBirth === "string") updateData.dateOfBirth = dateOfBirth;
      if (typeof grade === "string" && grade) {
        const gradeNum = parseInt(grade.replace("Class ", "").trim());
        if (!isNaN(gradeNum) && gradeNum > 0) {
          updateData.classGrade = gradeNum;
        }
      }
      if (typeof school === "string") updateData.school = school.trim();
      if (Array.isArray(interests)) updateData.interests = interests;
      if (typeof goals === "string") updateData.goals = goals.trim();
      if (typeof bio === "string") {
        const currentSettings = (existingUser as any).settings || {};
        updateData.settings = { ...currentSettings, bio: bio.trim() };
      }

      logger.debug("User profile update data", { updateData });

      // Perform the update
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, existingUser.id));

      return NextResponse.json({
        success: true,
        profile: { ...existingUser, ...updateData }
      });
    } else {
      logger.info("Creating new user", { clerkUserId: userId });

      // Create new user with minimum required fields
      const newUserData: any = {
        id: `user-${Date.now()}`,
        clerkUserId: userId,
        type: "student",
        role: "student",
        name: `${firstName || ""} ${lastName || ""}`.trim() || "Student",
        firstName: firstName || "",
        lastName: lastName || "",
        email: email || "",
        phone: "",           // Required but empty for now
        profileImage: "",    // Required but empty for now
        gender: "",          // Required but empty for now
        section: "",         // Required but empty for now
        rollNumber: "",      // Required but empty for now
        address: "",         // Required but empty for now
        city: "",            // Required but empty for now
        state: "",           // Required but empty for now
        postalCode: "",      // Required but empty for now
        country: "Bhutan",   // Required with default
        parentContact: "",   // Required but empty for now
        parentPhone: "",     // Required but empty for now
        emergencyContact: "", // Required but empty for now
        bloodGroup: "",      // Required but empty for now
        enrollmentDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        // Optional fields
        school: school || "",
        interests: interests || [],
        goals: goals || "",
        settings: bio ? { bio } : {},
      };

      // Add optional fields if provided
      if (dateOfBirth) newUserData.dateOfBirth = dateOfBirth;
      if (grade) {
        const gradeNum = parseInt(grade.replace("Class ", ""));
        if (!isNaN(gradeNum)) newUserData.classGrade = gradeNum;
      }

      logger.debug("Creating user with data", { userId: newUserData.id });

      const result = await db
        .insert(users)
        .values(newUserData)
        .returning();

      const newUser = Array.isArray(result) ? result[0] : result;
      logger.info("User created successfully", { userId: newUser.id });

      return NextResponse.json({ success: true, profile: newUser });
    }
  } catch (error) {
    logger.error(error, { route: "/api/user/profile", method: "POST" });

    // Get more detailed error info
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
      // Check for common database errors
      if (error.message.includes("violates")) {
        errorMessage = "Database constraint violation: " + error.message;
      } else if (error.message.includes("null value in column")) {
        errorMessage = "Missing required field: " + error.message;
      } else if (error.message.includes("duplicate key")) {
        errorMessage = "Duplicate entry: " + error.message;
      }
    }

    return NextResponse.json(
      { error: "Failed to save profile", details: errorMessage },
      { status: 500 }
    );
  }
}
