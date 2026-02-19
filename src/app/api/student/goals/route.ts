/**
 * Student Goals API
 * Handles academic and personal goals for students
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

type GoalStatus = "completed" | "in_progress" | "not_started";
type GoalCategory = "academic" | "assessment" | "exploration" | "portfolio";

interface GoalAction {
  text: string;
  done: boolean;
}

interface Goal {
  id: string;
  title: string;
  deadline: string;
  status: GoalStatus;
  progress: number;
  category: GoalCategory;
  actions: GoalAction[];
}

const DEFAULT_GOALS: Goal[] = [
  {
    id: "g1",
    title: "Complete RIASEC Assessment",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "not_started",
    progress: 0,
    category: "assessment",
    actions: [
      { text: "Take RIASEC assessment", done: false },
      { text: "Review results with counselor", done: false },
    ],
  },
  {
    id: "g2",
    title: "Research 5 RUB Colleges",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "not_started",
    progress: 0,
    category: "exploration",
    actions: [
      { text: "Explore CST programs", done: false },
      { text: "Check Sherubtse College courses", done: false },
      { text: "Review GCBS business programs", done: false },
      { text: "Look into CNR programs", done: false },
      { text: "Visit college websites", done: false },
    ],
  },
];

/**
 * GET /api/student/goals - Fetch student goals
 */
export async function GET() {
  try {
    const authResult = await requireAuth(['student']);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status },
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    // Fetch user profile with goals
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get goals from user settings or use defaults
    const userSettings = (user.settings as Record<string, unknown>) || {};
    const savedGoals = (userSettings.goals as Goal[]) || [];

    // If no saved goals, initialize with defaults
    const goals = savedGoals.length > 0 ? savedGoals : DEFAULT_GOALS;

    logger.info("Student goals fetched", { userId, goalCount: goals.length });

    return NextResponse.json({
      goals,
      stats: {
        total: goals.length,
        completed: goals.filter((g) => g.status === "completed").length,
        inProgress: goals.filter((g) => g.status === "in_progress").length,
        notStarted: goals.filter((g) => g.status === "not_started").length,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/student/goals", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/student/goals - Create a new goal
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(['student']);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status },
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const body = await req.json();

    const newGoal: Goal = {
      id: `g${Date.now()}`,
      title: body.title,
      deadline: body.deadline,
      status: "not_started",
      progress: 0,
      category: body.category || "academic",
      actions: body.actions || [],
    };

    // Fetch user and update goals
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userSettings = (user.settings as Record<string, unknown>) || {};
    const currentGoals = (userSettings.goals as Goal[]) || DEFAULT_GOALS;
    const updatedGoals = [...currentGoals, newGoal];

    await db
      .update(users)
      .set({
        settings: { ...userSettings, goals: updatedGoals },
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    logger.info("Student goal created", { userId, goalId: newGoal.id });

    return NextResponse.json({ goal: newGoal });
  } catch (error) {
    logger.apiError(error, { route: "/api/student/goals", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/student/goals - Update a goal
 */
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAuth(['student']);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status },
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const body = await req.json();
    const { goalId, ...updates } = body;

    if (!goalId) {
      return NextResponse.json(
        { error: "goalId is required" },
        { status: 400 }
      );
    }

    // Fetch user and update goals
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userSettings = (user.settings as Record<string, unknown>) || {};
    const currentGoals = (userSettings.goals as Goal[]) || DEFAULT_GOALS;

    const updatedGoals = currentGoals.map((goal) =>
      goal.id === goalId ? { ...goal, ...updates } : goal
    );

    await db
      .update(users)
      .set({
        settings: { ...userSettings, goals: updatedGoals },
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    logger.info("Student goal updated", { userId, goalId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.apiError(error, { route: "/api/student/goals", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/student/goals - Delete a goal
 */
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireAuth(['student']);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status },
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get("goalId");

    if (!goalId) {
      return NextResponse.json(
        { error: "goalId is required" },
        { status: 400 }
      );
    }

    // Fetch user and update goals
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userSettings = (user.settings as Record<string, unknown>) || {};
    const currentGoals = (userSettings.goals as Goal[]) || DEFAULT_GOALS;

    const updatedGoals = currentGoals.filter((goal) => goal.id !== goalId);

    await db
      .update(users)
      .set({
        settings: { ...userSettings, goals: updatedGoals },
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    logger.info("Student goal deleted", { userId, goalId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.apiError(error, { route: "/api/student/goals", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
