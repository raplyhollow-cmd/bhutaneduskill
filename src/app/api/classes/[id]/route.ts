/**
 * SINGLE CLASS API
 *
 * Routes:
 * GET    /api/classes/[id]    → get class details
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { classes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get class details
export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(["school-admin", "admin", "teacher", "student"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const classRecord = await db
      .select()
      .from(classes)
      .where(eq(classes.id, id))
      .limit(1);

    if (classRecord.length === 0) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      class: classRecord[0],
    });
  } catch (error: any) {
    console.error("Class GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch class" },
      { status: 500 }
    );
  }
}
