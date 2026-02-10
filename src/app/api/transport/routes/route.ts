import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// ============================================================================
// TRANSPORT ROUTES API - NOT YET FULLY IMPLEMENTED
// ============================================================================

/**
 * Transport / Routes Management
 *
 * The transport schema exists but is not yet integrated with the main database schema.
 *
 * TODO: Integrate transport-schema.ts into main schema.ts
 */

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    routes: [],
    vehicles: [],
    message: "Transport management feature is under development"
  });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    error: "Transport management feature is under development"
  }, { status: 501 });
}
