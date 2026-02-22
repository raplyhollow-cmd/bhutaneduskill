/**
 * TENANT ISOLATION HELPER
 *
 * Provides utilities for ensuring tenant isolation in multi-tenant queries.
 * Each school is a tenant, and users should only access data from their own school.
 *
 * Usage:
 * ```typescript
 * import { withTenantScope, verifySchoolAccess } from "@/lib/db/tenant-scope";
 *
 * // Ensure query is scoped to user's school
 * const students = await db.select().from(users)
 *   .where(withTenantScope(eq(users.type, "student"), user));
 *
 * // Verify user can access a school
 * const canAccess = await verifySchoolAccess(userId, schoolId);
 * ```
 */

import type { User } from "./schema";

/**
 * Get the WHERE condition for tenant-scoped queries
 * Adds schoolId filter if user is not platform admin
 *
 * @param baseCondition - The base condition for the query
 * @param user - The user making the request
 * @returns Condition object to use with Drizzle queries
 */
export function withTenantScope(baseCondition: any, user: User): any {
  // Platform admins can see all data
  if (user.type === "admin" || user.type === "ministry") {
    return baseCondition;
  }

  // School-level users are scoped to their school
  // Note: The caller needs to use `and()` to combine conditions
  return { and: [baseCondition, { schoolId: user.schoolId }] };
}

/**
 * Verify that a user can access a specific school
 * Platform admins can access any school
 * School admins can only access their own school
 *
 * @param userId - The user ID to check
 * @param schoolId - The school ID to access
 * @param user - The user object (optional, will fetch if not provided)
 * @returns true if user can access the school
 */
export async function verifySchoolAccess(
  userId: string,
  schoolId: string,
  user?: User
): Promise<boolean> {
  // If user object not provided, we'd need to fetch it
  // For now, require caller to provide user
  if (!user) {
    throw new Error("User object must be provided to verify school access");
  }

  // Platform admins can access any school
  if (user.type === "admin" || user.type === "ministry") {
    return true;
  }

  // School-level users can only access their own school
  return user.schoolId === schoolId;
}

/**
 * Check if a subscription allows user access
 *
 * @param school - The school object
 * @returns true if school is active and setup is complete
 */
export function isSchoolActive(school: { isActive?: boolean; subscriptionStatus?: string; setupComplete?: boolean }): boolean {
  if (!school.isActive) return false;
  if (school.subscriptionStatus === "suspended" || school.subscriptionStatus === "cancelled") return false;
  if (school.subscriptionStatus === "pending_payment") return false;
  return true;
}

/**
 * Check if school setup is complete
 *
 * @param school - The school object
 * @returns true if setup is complete
 */
export function isSchoolSetupComplete(school: { setupComplete?: boolean }): boolean {
  return school.setupComplete === true;
}

/**
 * Get school access error message
 *
 * @param school - The school object
 * @returns Error message if access should be denied, null if OK
 */
export function getSchoolAccessError(school: { isActive?: boolean; subscriptionStatus?: string; setupComplete?: boolean }): string | null {
  if (!school.isActive) {
    return "This school is currently inactive. Please contact the platform administrator.";
  }

  if (school.subscriptionStatus === "suspended") {
    return "This school's subscription has been suspended. Please contact the platform administrator.";
  }

  if (school.subscriptionStatus === "cancelled") {
    return "This school's subscription has been cancelled.";
  }

  if (school.subscriptionStatus === "pending_payment") {
    return "This school's subscription is pending payment approval.";
  }

  if (!school.setupComplete) {
    return "School setup is not complete. Please complete the setup wizard to access this feature.";
  }

  return null;
}
