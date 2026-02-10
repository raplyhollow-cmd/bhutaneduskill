import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ============================================================================
// GET /api/rub/applications - Get RUB applications
// ============================================================================

export async function GET(request: NextRequest) {
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

    // RUB applications feature is secondary - return empty for now
    // TODO: Implement proper RUB schema integration
    return NextResponse.json({
      applications: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    console.error("RUB applications fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

// ============================================================================
// POST /api/rub/applications - Create RUB application
// ============================================================================

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: "RUB applications feature coming soon"
  }, { status: 501 });
}

// ============================================================================
// PATCH /api/rub/applications - Update RUB application
// ============================================================================

export async function PATCH(request: NextRequest) {
  return NextResponse.json({
    error: "RUB applications feature coming soon"
  }, { status: 501 });
}
