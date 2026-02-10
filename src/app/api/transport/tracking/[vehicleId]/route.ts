import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// ============================================================================
// TRANSPORT TRACKING API - NOT YET FULLY IMPLEMENTED
// ============================================================================

/**
 * Transport / Vehicle Tracking
 *
 * The transport schema exists but is not yet integrated with the main database schema.
 *
 * TODO: Integrate transport-schema.ts into main schema.ts
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vehicleId } = await params;

  return NextResponse.json({
    vehicleId,
    location: null,
    status: "unknown",
    message: "Transport tracking feature is under development"
  });
}
