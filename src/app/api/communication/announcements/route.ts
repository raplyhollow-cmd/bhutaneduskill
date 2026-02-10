import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// ============================================================================
// ANNOUNCEMENTS API - NOT YET FULLY IMPLEMENTED
// ============================================================================

/**
 * Communication / Announcements
 *
 * The messaging schema exists but is not yet integrated with the main database schema.
 *
 * TODO: Integrate messaging-schema.ts into main schema.ts
 */

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    announcements: [],
    message: "Announcements feature is under development"
  });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    error: "Announcements feature is under development"
  }, { status: 501 });
}
