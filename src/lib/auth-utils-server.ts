/**
 * SERVER-ONLY Authentication Utilities
 *
 * This file contains server-side only imports and should only be imported
 * by API routes and other server components.
 *
 * For client components, use API routes instead.
 */

"use server";

import { logger } from "@/lib/logger";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Database User entity (minimal)
 */
export interface DbUser {
  id: string;
  clerkUserId: string;
  type: string;
  schoolId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Successful authentication result
 */
export interface AuthSuccess {
  user: DbUser;
  userId: string;
}

/**
 * Failed authentication result
 */
export interface AuthError {
  error: string;
  status: number;
}

/**
 * Authentication result type
 */
export type AuthResult = AuthSuccess | AuthError;

// ============================================================================
// SERVER-ONLY: requireAuth for API Routes
// ============================================================================

/**
 * Server-side authentication check for API routes
 * This should only be imported in API routes (not client components)
 *
 * @param allowedRoles - Array of roles that can access this route
 * @returns Object with user and userId on success, or error response on failure
 */
export async function requireAuthServer(allowedRoles?: string[]): Promise<AuthResult> {
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized", status: 401 };
  }

  // Import db and users here to avoid circular dependency
  const { db } = await import("@/lib/db");
  const { users } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  // Get user with role from database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .limit(1);

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  // Check role if required
  if (allowedRoles && allowedRoles.length > 0) {
    if (user.type && !allowedRoles.includes(user.type as string)) {
      return { error: "Forbidden: Insufficient permissions", status: 403 };
    }
  }

  return { user, userId: user.id };
}

/**
 * Server-side check for specific roles
 * Returns just the userId or null if not authenticated
 */
export async function getServerUserId(): Promise<string | null> {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    return userId || null;
  } catch {
    return null;
  }
}

/**
 * Server-side check if user has any of the specified roles
 */
export async function hasServerRole(userId: string, roles: string[]): Promise<boolean> {
  try {
    const { db } = await import("@/lib/db");
    const { users } = await import("@/lib/db/schema");
    const { eq, or } = await import("drizzle-orm");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (!user) return false;
    if (!user.type) return false;

    return roles.includes(user.type as string);
  } catch {
    return false;
  }
}

/**
 * Alias for requireAuth from auth-utils (for use server compatibility)
 * This function can only be used in server actions or API routes
 */
export async function requireAuthServerError(allowedRoles?: string[]): Promise<AuthResult> {
  // Import the auth-utils requireAuth function
  const { requireAuth } = await import("./auth-utils");
  return requireAuth(allowedRoles);
}
