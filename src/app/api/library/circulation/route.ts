import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// ============================================================================
// LIBRARY CIRCULATION API - NOT YET FULLY IMPLEMENTED
// ============================================================================

/**
 * Library / Circulation Records
 *
 * The library schema exists but is not yet integrated with the main database schema.
 *
 * TODO: Integrate library-schema.ts into main schema.ts
 */

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    circulation: [],
    message: "Library circulation feature is under development"
  });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    error: "Library circulation feature is under development"
  }, { status: 501 });
}
