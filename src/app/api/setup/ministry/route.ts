import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * Ministry Setup API
 *
 * Handles the setup of Ministry users during registration.
 * Creates a user with type="ministry" if not exists.
 *
 * Note: This route intentionally uses Clerk's auth() directly instead of requireAuth()
 * because it's called during the setup wizard for users who may not exist in the database yet.
 * The setup wizard pattern requires: 1) Clerk auth (user exists in Clerk) 2) Check database 3) Create if not exists
 */

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { step, data } = body;

    if (step === "complete") {
      // Get user from Clerk
      const user = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }).then((res) => res.json());

      const firstName = user.first_name || "Ministry";
      const lastName = user.last_name || "User";
      const email = user.email_addresses?.[0]?.email_address || "";
      const fullName = `${firstName} ${lastName}`.trim();

      // Check if user exists in database
      let userRecord = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);

      let dbUser;

      if (userRecord.length === 0) {
        // Create new ministry user
        const newUserId = `user_${nanoid()}`;

        await db.insert(users).values({
          id: newUserId,
          clerkUserId: userId,
          type: "ministry",
          role: "ministry",
          name: fullName,
          firstName,
          lastName,
          email,
          phone: data.phone || "",
          schoolId: null, // Ministry users are not tied to a specific school
          profileImage: user.image_url || "",
          dateOfBirth: "",
          gender: "other",
          grade: 0,
          section: null, // JSON column
          rollNumber: "",
          address: "",
          city: data.officeLocation || "",
          state: "",
          postalCode: "",
          country: "Bhutan",
          parentContact: null, // JSON column
          parentPhone: null, // JSON column
          emergencyContact: null, // JSON column
          bloodGroup: "",
          enrollmentDate: new Date().toISOString().split('T')[0],
          lastLogin: new Date().toISOString(),
          employeeId: data.ministryId || "",
          department: data.department || "",
          subjects: null, // JSON column
          isActive: true,
          onboardingComplete: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Fetch newly created user
        userRecord = await db
          .select()
          .from(users)
          .where(eq(users.clerkUserId, userId))
          .limit(1);

        dbUser = userRecord[0];
      } else {
        // Update existing user to ministry type
        await db
          .update(users)
          .set({
            type: "ministry",
            role: "ministry",
            department: data.department || "",
            employeeId: data.ministryId || "",
            onboardingComplete: true,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkUserId, userId));

        dbUser = userRecord[0];
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Ministry setup completed successfully",
          user: {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            type: "ministry",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid step" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    logger.error("Ministry setup error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Setup failed. Please try again."
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
