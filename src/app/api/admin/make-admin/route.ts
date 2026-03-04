/**
 * MAKE PLATFORM ADMIN API
 *
 * Temporary API endpoint to make a user a platform admin.
 * This helps users who are stuck in the setup wizard.
 *
 * POST /api/admin/make-admin
 * Body: { email: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({
        error: `User with email ${email} not found in database`,
        hint: "The user must sign in with Clerk first before they can be made an admin"
      }, { status: 404 });
    }

    const user = existing[0];

    // Update to platform admin
    await db
      .update(users)
      .set({
        type: "admin",
        onboardingStatus: "completed",
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email));

    return NextResponse.json({
      success: true,
      message: `Successfully made ${email} a platform admin`,
      user: {
        id: user.id,
        email: user.email,
        type: "admin",
        onboardingStatus: "completed"
      }
    });

  } catch (error: any) {
    console.error("Make admin error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to make user admin" },
      { status: 500 }
    );
  }
}

// GET endpoint to check user status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email query parameter is required" }, { status: 400 });
    }

    // Check if user exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({
        found: false,
        message: `User with email ${email} not found in database`
      });
    }

    const user = existing[0];

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        onboardingStatus: user.onboardingStatus,
        isActive: user.isActive,
      }
    });

  } catch (error: any) {
    console.error("Check user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check user" },
      { status: 500 }
    );
  }
}
