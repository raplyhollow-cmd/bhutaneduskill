import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ============================================================================
// POST /api/subscriptions/checkout - Initiate subscription checkout
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Subscription feature is secondary - return placeholder for now
    // TODO: Implement proper subscription schema integration
    return NextResponse.json({
      success: true,
      message: "Subscription checkout feature coming soon. Please contact support for manual setup.",
      subscriptionId: `sub-${Date.now()}`,
    }, { status: 200 });
  } catch (error) {
    console.error("Subscription checkout error:", error);
    return NextResponse.json({ error: "Failed to initiate checkout" }, { status: 500 });
  }
}
