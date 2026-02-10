import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Skills categories with levels
const SKILL_CATEGORIES = {
  "Programming": { icon: "Code", color: "bg-blue-100 text-blue-600" },
  "Design": { icon: "Palette", color: "bg-purple-100 text-purple-600" },
  "Mathematics": { icon: "Calculator", color: "bg-green-100 text-green-600" },
  "Communication": { icon: "MessageCircle", color: "bg-orange-100 text-orange-600" },
  "Problem Solving": { icon: "TrendingUp", color: "bg-red-100 text-red-600" },
  "Leadership": { icon: "Users", color: "bg-indigo-100 text-indigo-600" },
  "Languages": { icon: "BookOpen", color: "bg-teal-100 text-teal-600" },
  "Science": { icon: "Flask", color: "bg-cyan-100 text-cyan-600" },
};

// GET /api/skills - Get user's skills progress
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile
    const userProfile = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkUserId, userId),
    });

    const userSkills = userProfile?.settings?.skills || {};

    return NextResponse.json({
      skills: SKILL_CATEGORIES,
      userProgress: userSkills,
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { skills: SKILL_CATEGORIES, userProgress: {} },
      { status: 200 }
    );
  }
}

// POST /api/skills - Update user's skills progress
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { skill, level, action } = await req.json();

    // Get user's profile
    const userProfile = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkUserId, userId),
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentSkills = (userProfile.settings as any)?.skills || {};
    const currentLevel = currentSkills[skill] || 0;

    let newLevel = currentLevel;
    if (action === "increment") {
      newLevel = Math.min(100, currentLevel + 5);
    } else if (action === "decrement") {
      newLevel = Math.max(0, currentLevel - 5);
    } else if (typeof level === "number") {
      newLevel = Math.max(0, Math.min(100, level));
    }

    currentSkills[skill] = newLevel;

    // Update user profile
    await db
      .update(users)
      .set({
        settings: { ...(userProfile.settings as any), skills: currentSkills },
        updatedAt: new Date(),
      })
      .where(eq(users.id, userProfile.id));

    return NextResponse.json({
      success: true,
      skill,
      level: newLevel,
    });
  } catch (error) {
    console.error("Error updating skills:", error);
    return NextResponse.json({ error: "Failed to update skills" }, { status: 500 });
  }
}
