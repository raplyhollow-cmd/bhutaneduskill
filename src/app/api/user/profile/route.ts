import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

/**
 * GET /api/user/profile
 *
 * Returns the current user's profile from the database
 * Used by frontend components to get user information
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const userId = auth.userId;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query user from database using clerkUserId
    const userRecords = await db
      .select({
        id: users.id,
        clerkUserId: users.clerkUserId,
        type: users.type,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        name: users.name,
        email: users.email,
        phone: users.phone,
        profileImage: users.profileImage,
        schoolId: users.schoolId,
        grade: users.grade,
        section: users.section,
        onboardingStatus: users.onboardingStatus,
        onboardingComplete: users.onboardingComplete,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        address: users.address,
        city: users.city,
        state: users.state,
        country: users.country,
        postalCode: users.postalCode,
      })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (userRecords.length === 0) {
      return Response.json({ error: "User not found in database" }, { status: 404 });
    }

    const user = userRecords[0];

    return Response.json({
      data: {
        profile: user
      }
    });
  },
  ["student", "teacher", "parent", "counselor", "school-admin", "admin", "ministry"]
);
