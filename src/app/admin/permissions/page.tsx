/**
 * PLATFORM ADMIN - PERMISSIONS MATRIX
 *
 * Grid showing roles x permissions with toggle functionality
 */

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { roles, permissions, rolePermissions } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { PermissionsClient } from "./permissions-client";
import type { Role, Permission } from "@/lib/db/rbac-schema";

async function getPermissionMatrix() {
  // Get all roles and permissions
  const allRoles = await db
    .select()
    .from(roles)
    .orderBy(asc(roles.name));

  const allPermissions = await db
    .select()
    .from(permissions)
    .orderBy(asc(permissions.module), asc(permissions.resource), asc(permissions.action));

  // Get all role-permission assignments
  const allAssignments = await db.select().from(rolePermissions);

  // Build matrix: permissionId -> Set of roleIds that have it
  const permissionMap = new Map<string, Set<string>>();
  for (const assignment of allAssignments) {
    if (!permissionMap.has(assignment.permissionId)) {
      permissionMap.set(assignment.permissionId, new Set());
    }
    permissionMap.get(assignment.permissionId)!.add(assignment.roleId);
  }

  // Group permissions by module
  const groupedPermissions = (allPermissions as Permission[]).reduce<Record<string, Permission[]>>((acc, perm) => {
    const module = perm.module || "other";
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(perm);
    return acc;
  }, {});

  return {
    roles: allRoles as Role[],
    permissions: allPermissions as Permission[],
    groupedPermissions,
    permissionMap,
  };
}

export default async function AdminPermissionsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const data = await getPermissionMatrix();

  return <PermissionsClient {...data} />;
}
