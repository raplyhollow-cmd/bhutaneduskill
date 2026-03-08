/**
 * STUDENTS SEARCH API
 *
 * Routes:
 * GET    /api/students/search?q=query&limit=10    → search students by name or email
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, students } from "@/lib/db/schema";
import { eq, or, ilike, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(["school-admin", "admin", "teacher"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    // Search students by name or email
    const searchPattern = `%${query}%`;

    let studentResults = await db
      .select({
        id: students.id,
        firstName: users.firstName,
        lastName: users.lastName,
        name: users.name,
        email: users.email,
        phone: users.phone,
        currentClass: students.currentClass,
        section: students.section,
      })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(
        or(
          ilike(users.firstName, searchPattern),
          ilike(users.lastName, searchPattern),
          ilike(users.name, searchPattern),
          ilike(users.email, searchPattern)
        )
      )
      .limit(limit);

    return NextResponse.json({
      success: true,
      students: studentResults,
    });
  } catch (error: any) {
    console.error("Students search error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search students" },
      { status: 500 }
    );
  }
}
