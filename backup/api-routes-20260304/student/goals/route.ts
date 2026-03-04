/**
 * Student Goals API
 * Handles academic and personal goals for students
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute, type AuthContext, type AuthenticatedRequest } from "@/lib/api/route-handler";

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
export const GET = createApiRoute(
  async (req: NextRequest, auth: AuthContext) => {
    const { user } = auth;

    // Fetch user profile with goals
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userRecord) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Get goals from user settings or use defaults
    const userSettings = (userRecord.settings as Record<string, unknown>) || {};
    const savedGoals = (userSettings.goals as Goal[]) || [];

    // If no saved goals, initialize with defaults
    const goals = savedGoals.length > 0 ? savedGoals : DEFAULT_GOALS;

    logger.info("Student goals fetched", { userId: user.id, goalCount: goals.length });

    return Response.json({
      data: {
        goals,
        stats: {
          total: goals.length,
          completed: goals.filter((g) => g.status === "completed").length,
          inProgress: goals.filter((g) => g.status === "in_progress").length,
          notStarted: goals.filter((g) => g.status === "not_started").length,
        },
      }
    });
  },
  ['student']
);

/**
 * POST /api/student/goals - Create a new goal
 */
export const POST = createApiRoute(
  async (req: NextRequest, auth: AuthContext) => {
    const { user } = auth;
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
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userRecord) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const userSettings = (userRecord.settings as Record<string, unknown>) || {};
    const currentGoals = (userSettings.goals as Goal[]) || DEFAULT_GOALS;
    const updatedGoals = [...currentGoals, newGoal];

    await db
      .update(users)
      .set({
        settings: { ...userSettings, goals: updatedGoals },
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    logger.info("Student goal created", { userId: user.id, goalId: newGoal.id });

    return Response.json({
      data: { goal: newGoal }
    });
  },
  ['student']
);

/**
 * PATCH /api/student/goals - Update a goal
 */
export const PATCH = createApiRoute(
  async (req: NextRequest, auth: AuthContext) => {
    const { user } = auth;
    const body = await req.json();
    const { goalId, ...updates } = body;

    if (!goalId) {
      return Response.json({ error: "goalId is required" }, { status: 400 });
    }

    // Fetch user and update goals
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userRecord) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const userSettings = (userRecord.settings as Record<string, unknown>) || {};
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
      .where(eq(users.id, user.id));

    logger.info("Student goal updated", { userId: user.id, goalId });

    return Response.json({
      data: { success: true }
    });
  },
  ['student']
);

/**
 * DELETE /api/student/goals - Delete a goal
 */
export const DELETE = createApiRoute(
  async (req: NextRequest, auth: AuthContext) => {
    const { user } = auth;
    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get("goalId");

    if (!goalId) {
      return Response.json({ error: "goalId is required" }, { status: 400 });
    }

    // Fetch user and update goals
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userRecord) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const userSettings = (userRecord.settings as Record<string, unknown>) || {};
    const currentGoals = (userSettings.goals as Goal[]) || DEFAULT_GOALS;

    const updatedGoals = currentGoals.filter((goal) => goal.id !== goalId);

    await db
      .update(users)
      .set({
        settings: { ...userSettings, goals: updatedGoals },
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    logger.info("Student goal deleted", { userId: user.id, goalId });

    return Response.json({
      data: { success: true }
    });
  },
  ['student']
);