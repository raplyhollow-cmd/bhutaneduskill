import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    console.log("[debug-users] Direct query to users table");

    const result = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(20);

    console.log("[debug-users] Found", result.length, "users");

    const teachers = result.filter((u: any) => u.type === "teacher");
    console.log("[debug-users] Teachers:", teachers.length);

    return NextResponse.json({
      success: true,
      data: {
        data: result,
        pagination: { total: result.length, page: 1, limit: 20, totalPages: 1 },
      },
    });
  } catch (error: any) {
    console.error("[debug-users] Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
