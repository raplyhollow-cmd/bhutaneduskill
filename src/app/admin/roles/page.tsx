/**
 * PLATFORM ADMIN - ROLES MANAGEMENT
 *
 * CRUD operations for RBAC roles
 */

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { RolesClient } from "./roles-client";

export default async function AdminRolesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch all roles with counts
  const rolesList = await db.query.roles.findMany({
    orderBy: [desc(roles.createdAt)],
    with: {
      rolePermissions: true,
      userRoles: true,
    },
  });

  // Calculate counts for each role
  const rolesWithCounts = rolesList.map((role) => ({
    ...role,
    permissionCount: role.rolePermissions.length,
    userCount: role.userRoles.length,
  }));

  return <RolesClient roles={rolesWithCounts} />;
}
