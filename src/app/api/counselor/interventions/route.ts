import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/counselor/interventions - Get counselor interventions
// Note: This returns empty array for now as interventions table doesn't exist in schema
// When interventions table is added to schema, this will be updated
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true },
    });

    if (!currentUser || currentUser.type !== "counselor") {
      return NextResponse.json({ error: "Forbidden - counselors only" }, { status: 403 });
    }

    // Return empty array - interventions feature not implemented in database yet
    // When interventions table is added, this will query it
    return NextResponse.json({
      interventions: [],
      stats: {
        totalInterventions: 0,
        activeInterventions: 0,
        completedThisMonth: 0,
        highPriorityCount: 0,
      },
    });
  } catch (error) {
    console.error("Counselor interventions fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch interventions" }, { status: 500 });
  }
}

// POST /api/counselor/interventions - Create a new intervention
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, type, category, priority, description, targetDate } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true },
    });

    if (!currentUser || currentUser.type !== "counselor") {
      return NextResponse.json({ error: "Forbidden - counselors only" }, { status: 403 });
    }

    // Return mock response - interventions feature not implemented in database yet
    return NextResponse.json({
      intervention: {
        id: `intervention_${Date.now()}`,
        counselorId: currentUser.id,
        studentId,
        type: type || "academic",
        category: category || "General",
        priority: priority || "medium",
        status: "active",
        startDate: new Date().toISOString().split("T")[0],
        targetDate,
        progress: 0,
        description,
        goals: [],
        notes: null,
        followUpDate: null,
      },
      message: "Intervention tracking feature coming soon - interventions table not yet in database schema",
    }, { status: 201 });
  } catch (error) {
    console.error("Counselor intervention creation error:", error);
    return NextResponse.json({ error: "Failed to create intervention" }, { status: 500 });
  }
}
