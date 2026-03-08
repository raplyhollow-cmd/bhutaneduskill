/**
 * SCHOOL ADMIN - TEACHERS API
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["school-admin", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const schoolId = user?.schoolId;

    // Query users with type='teacher'
    let teacherUsers;
    if (schoolId) {
      teacherUsers = await db.select().from(users).where(
        and(eq(users.type, "teacher"), eq(users.schoolId, schoolId))
      );
    } else {
      teacherUsers = await db.select().from(users).where(eq(users.type, "teacher"));
    }

    // Transform to match expected frontend format (flat structure, not nested user object)
    // Normalize all values to ensure frontend doesn't get null/undefined strings
    const teachersList = teacherUsers.map((teacherUser: any) => ({
      id: teacherUser.id,
      userId: teacherUser.id,
      firstName: teacherUser.firstName || "",
      lastName: teacherUser.lastName || "",
      email: teacherUser.email || "",
      name: teacherUser.name || "",
      phoneNumber: teacherUser.phoneNumber || teacherUser.phone || "",
      employeeId: teacherUser.employeeId || null,
    }));

    return NextResponse.json({
      success: true,
      data: { teachers: teachersList },
    });
  } catch (error: any) {
    console.error("Teachers API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}
