import { auth } from "@clerk/nextjs/server";
import { db } from ".";
import { users, tenants } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Get the current user with tenant information
 * This is the primary function to use for tenant isolation
 */
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
    with: {
      tenant: true,
      school: true,
    },
  });

  return user;
}

/**
 * Verify tenant access for a resource
 * Returns true if the user's tenant matches the resource's tenant
 */
export function verifyTenantAccess(userTenantId: string, resourceTenantId: string): boolean {
  return userTenantId === resourceTenantId;
}

/**
 * Require authentication and return current user
 * Throws error if not authenticated
 */
export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Get tenant ID from current user
 */
export async function getTenantId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.tenantId || null;
}

/**
 * Check if user has specific role
 */
export function hasRole(user: { type: string }, roles: string[]): boolean {
  return roles.includes(user.type);
}

/**
 * Check if user can access resource (same tenant or specific roles)
 */
export function canAccessResource(
  user: { type: string; tenantId: string | null },
  resourceTenantId: string,
  allowedRoles: string[] = ["admin"]
): boolean {
  // Admins can access across tenants (configurable)
  if (user.type === "admin") {
    return true;
  }

  // Check if user has any of the allowed roles
  if (allowedRoles.includes(user.type)) {
    return true;
  }

  // Default: same tenant access
  return user.tenantId === resourceTenantId;
}

/**
 * Apply tenant filter to a query
 * Usage with drizzle:
 * const tenantFilter = createTenantFilter(tenantId);
 */
export function createTenantFilter(tenantId: string) {
  return eq(tenants.id, tenantId);
}

/**
 * School-specific access check
 * Counselors and teachers can only access their school's data
 */
export function canAccessSchool(user: { type: string; schoolId: string | null }, schoolId: string): boolean {
  // Admins can access all schools
  if (user.type === "admin") {
    return true;
  }

  // Same school access
  return user.schoolId === schoolId;
}

/**
 * Get accessible tenant IDs for a user
 * - Admins: all tenants
 * - Others: only their own tenant
 */
export async function getAccessibleTenantIds(userId: string): Promise<string[]> {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  // Admins can see all tenants
  if (user.type === "admin") {
    const allTenants = await db.query.tenants.findMany();
    return allTenants.map((t) => (t as unknown as { id: string }).id);
  }

  // Others can only see their own tenant
  return [user.tenantId];
}
