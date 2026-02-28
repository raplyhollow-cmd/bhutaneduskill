/**
 * PLATFORM ADMIN - ROLES MANAGEMENT
 *
 * CRUD operations for RBAC roles
 */

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { roles, rolePermissions, userRoles } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { RolesClient } from "./roles-client";

export default async function AdminRolesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch all roles
  const rolesList = await db
    .select()
    .from(roles)
    .orderBy(desc(roles.createdAt));

  // Calculate counts for each role
  const rolesWithCounts = await Promise.all(
    rolesList.map(async (role) => {
      const [permCount] = await db
        .select({ count: rolePermissions.id })
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, role.id));

      const [userCount] = await db
        .select({ count: userRoles.id })
        .from(userRoles)
        .where(eq(userRoles.roleId, role.id));

      return {
        ...role,
        permissionCount: permCount?.count ? 1 : 0,
        userCount: userCount?.count ? 1 : 0,
      };
    })
  );

  return <RolesClient roles={rolesWithCounts} />;
}
