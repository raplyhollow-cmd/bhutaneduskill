import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/user/profile - Get user profile
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();

    // Handle user not found in DB (new signup case)
    if ("error" in authResult) {
      if (authResult.status === 404) {
        // User exists in Clerk but not in DB - needs setup
        return NextResponse.json({
          profile: null,
          needsSetup: true,
          error: authResult.error
        }, { status: 200 }); // Return 200 so client can handle gracefully
      }
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // User already fetched from DB by requireAuth, just transform and return
    const transformedProfile = {
      ...user,
      bio: (user as any).settings?.bio || "",
      grade: (user as any).classGrade ? `Class ${(user as any).classGrade}` : "",
    };

    return NextResponse.json({ profile: transformedProfile, needsSetup: false });
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
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    if (!user) {
      logger.security("unauthorized_access_attempt", { route: "/api/user/profile", method: "POST" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    logger.info("Updating profile", { userId: user.id });

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

    // Build update object with only the fields that exist in schema
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
      const currentSettings = (user as any).settings || {};
      updateData.settings = { ...currentSettings, bio: bio.trim() };
    }

    logger.debug("User profile update data", { updateData });

    // Perform the update
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id));

    // Return updated profile
    const updatedUser = { ...user, ...updateData };

    return NextResponse.json({
      success: true,
      profile: updatedUser
    });
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
