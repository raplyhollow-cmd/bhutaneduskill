import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

/**
 * POST /api/schools/verify-code
 * Verify a school code during setup wizard
 * Requires authentication but open to all authenticated users (setup flow)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication (any role - this is for setup wizard)
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "School code is required" }, { status: 400 });
    }

    const schoolRecords = await db
      .select()
      .from(schools)
      .where(eq(schools.code, code.toUpperCase()))
      .limit(1);

    if (schoolRecords.length === 0) {
      return NextResponse.json({ error: "Invalid school code" }, { status: 404 });
    }

    return NextResponse.json({ school: schoolRecords[0] });
  } catch (error) {
    console.error("School code verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
