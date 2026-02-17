import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * GET /api/schools/lookup
 * Lookup schools by code or name
 *
 * NOTE: This endpoint is open (no auth required) because it's used during
 * the setup flow where users need to verify their school code before they
 * have an account or permissions. School codes are not sensitive information.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const name = searchParams.get("name");

    console.log("[SCHOOL LOOKUP] code:", code, "name:", name);

    if (!code && !name) {
      return NextResponse.json(
        { error: "Missing code or name parameter" },
        { status: 400 }
      );
    }

    if (code) {
      // Lookup by code
      const results = await db
        .select()
        .from(schools)
        .where(eq(schools.code, code.toUpperCase()))
        .limit(1);

      console.log("[SCHOOL LOOKUP] results:", results);

      const school = results[0];

      if (!school) {
        return NextResponse.json(
          { school: null, error: "School not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ school });
    }

    if (name) {
      // Search by name - using sql template for proper escaping
      const results = await db.execute(
        sql`SELECT * FROM schools WHERE name LIKE ${'%' + name + '%'} LIMIT 10`
      );

      return NextResponse.json({ schools: results.rows });
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error looking up school:", error);
    return NextResponse.json(
      { error: "Failed to lookup school" },
      { status: 500 }
    );
  }
}
