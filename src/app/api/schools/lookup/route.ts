import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq, or, like } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";

/**
 * GET /api/schools/lookup
 * Lookup schools by code or name
 * Requires authentication and schools.read permission
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // Check schools.read permission
    const permCheck = await requirePermission(userId, "schools.read");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const name = searchParams.get("name");

    if (!code && !name) {
      return NextResponse.json(
        { error: "Missing code or name parameter" },
        { status: 400 }
      );
    }

    let school;

    if (code) {
      // Lookup by code
      const results = await db
        .select()
        .from(schools)
        .where(eq(schools.code, code.toUpperCase()))
        .limit(1);

      school = results[0];
    } else if (name) {
      // Search by name
      const results = await db
        .select()
        .from(schools)
        .where(like(schools.name, `%${name}%`))
        .limit(10);

      return NextResponse.json({ schools: results });
    }

    if (!school) {
      return NextResponse.json(
        { school: null, error: "School not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ school });
  } catch (error) {
    console.error("Error looking up school:", error);
    return NextResponse.json(
      { error: "Failed to lookup school" },
      { status: 500 }
    );
  }
}
