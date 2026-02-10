import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// ============================================================================
// MESSAGES API - NOT YET FULLY IMPLEMENTED
// ============================================================================

/**
 * Communication / Messages
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
    conversations: [],
    messages: [],
    message: "Messages feature is under development"
  });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    error: "Messages feature is under development"
  }, { status: 501 });
}
