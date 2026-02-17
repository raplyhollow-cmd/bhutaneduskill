import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { userRoles, roles } from "@/lib/db/rbac-schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || user.emailAddresses?.[0]?.emailAddress !== "admin@bhutaneduskill.vercel.app") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, "manual-platform-admin"))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        user: existing[0],
        message: "User already exists"
      });
    }

    // Get the platform-admin role
    const platformAdminRole = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.slug, "platform-admin"))
      .limit(1);

    if (!platformAdminRole || platformAdminRole.length === 0) {
      return NextResponse.json({ error: "Platform admin role not found in RBAC system" }, { status: 500 });
    }

    const roleId = platformAdminRole[0].id;
    const userId = `user-manual-${Date.now()}`;

    // Create the user
    await db.insert(users).values({
      id: userId,
      clerkUserId: "manual-platform-admin",
      type: "admin",
      role: "admin",
      name: "Platform Admin",
      firstName: "Admin",
      lastName: "User",
      email: "admin@bhutaneduskill.vercel.app",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Assign the platform-admin role
    await db.insert(userRoles).values({
      id: nanoid(),
      userId: userId,
      roleId: roleId,
      assignedBy: userId,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: "Platform Admin",
        email: "admin@bhutaneduskill.vercel.app",
        clerkUserId: "manual-platform-admin",
      },
      message: "User created successfully. Use 'Forgot Password' to set a password."
    });

  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { error: "Failed to create platform admin" },
      { status: 500 }
    );
  }
}
