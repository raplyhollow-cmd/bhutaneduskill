import { logger } from "@/lib/logger";
/**
 * Authentication & Authorization Utilities
 * Server-side role verification to prevent cookie manipulation attacks
 */

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ============================================================================
// ROLE CACHING
// ============================================================================

/**
 * In-memory role cache to reduce database queries
 * Format: Map<clerkUserId, {role, schoolId, cachedAt}>
 *
 * NOTE: setInterval is not used here because it's incompatible with
 * Next.js middleware runtime (Node.js/Edge). Instead, we use lazy
 * expiration - old entries are naturally expired on access.
 */
const roleCache = new Map<string, {
  role: string;
  schoolId: string | null;
  tenantId: string;
  cachedAt: number;
}>();

// Cache TTL: 5 minutes
const ROLE_CACHE_TTL = 5 * 60 * 1000;

/**
 * Clean up expired cache entries (called lazily on cache access)
 * This avoids setInterval which causes issues in Next.js middleware
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of roleCache.entries()) {
    if (now - value.cachedAt > ROLE_CACHE_TTL) {
      roleCache.delete(key);
    }
  }
}

/**
 * Get user role from database with caching
 * This prevents cookie-based role manipulation attacks
 *
 * @param clerkUserId - The Clerk user ID
 * @returns User role info or null
 */
export async function getUserRole(clerkUserId: string): Promise<{
  role: string;
  schoolId: string | null;
  tenantId: string;
} | null> {
  // Clean expired cache entries lazily (avoids setInterval issues)
  cleanExpiredCache();

  // Check cache first
  const cached = roleCache.get(clerkUserId);
  if (cached && Date.now() - cached.cachedAt < ROLE_CACHE_TTL) {
    return cached;
  }

  // Query database
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: {
      type: true,
      schoolId: true,
      tenantId: true,
    },
  });

  if (!user) {
    return null;
  }

  // Cache the result
  const roleInfo = {
    role: user.type,
    schoolId: user.schoolId,
    tenantId: user.tenantId,
  };

  roleCache.set(clerkUserId, {
    ...roleInfo,
    cachedAt: Date.now(),
  });

  return roleInfo;
}

/**
 * Invalidate role cache for a specific user
 * Call this when a user's role changes
 *
 * @param clerkUserId - The Clerk user ID
 */
export function invalidateUserRoleCache(clerkUserId: string): void {
  roleCache.delete(clerkUserId);
}

/**
 * Invalidate all role cache entries
 * Use sparingly (e.g., after bulk role updates)
 */
export function invalidateAllRoleCache(): void {
  roleCache.clear();
  // Also trigger cleanup to ensure memory is freed
  cleanExpiredCache();
}

/**
 * Verify if user has required role
 *
 * @param clerkUserId - The Clerk user ID
 * @param allowedRoles - Array of allowed roles
 * @returns Boolean indicating if user has access
 */
export async function verifyUserRole(
  clerkUserId: string,
  allowedRoles: string[]
): Promise<boolean> {
  const roleInfo = await getUserRole(clerkUserId);

  if (!roleInfo) {
    return false;
  }

  return allowedRoles.includes(roleInfo.role);
}

/**
 * Verify if user can access a specific school's resources
 *
 * @param clerkUserId - The Clerk user ID
 * @param schoolId - The school ID to check access for
 * @returns Boolean indicating if user has access
 */
export async function verifySchoolAccess(
  clerkUserId: string,
  schoolId: string
): Promise<boolean> {
  const roleInfo = await getUserRole(clerkUserId);

  if (!roleInfo) {
    return false;
  }

  // Admins can access any school in their tenant
  // Others must belong to the specific school
  if (roleInfo.role === 'admin') {
    return true; // TODO: Add tenant check if multi-tenant
  }

  return roleInfo.schoolId === schoolId;
}

/**
 * Check if user can perform action on target user
 * Used for cross-user access validation
 *
 * @param actorClerkUserId - The user performing the action
 * @param targetUserId - The target user's database ID
 * @returns Boolean indicating if action is allowed
 */
export async function canAccessUser(
  actorClerkUserId: string,
  targetUserId: string
): Promise<boolean> {
  const actorRoleInfo = await getUserRole(actorClerkUserId);

  if (!actorRoleInfo) {
    return false;
  }

  // Get target user info
  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, targetUserId),
    columns: {
      id: true,
      clerkUserId: true,
      schoolId: true,
      type: true,
    },
  });

  if (!targetUser) {
    return false;
  }

  // Self-access is always allowed
  if (targetUser.clerkUserId === actorClerkUserId) {
    return true;
  }

  // Admins and counselors can access users in their school
  if (['admin', 'counselor'].includes(actorRoleInfo.role)) {
    // Check if same school
    if (actorRoleInfo.schoolId && targetUser.schoolId === actorRoleInfo.schoolId) {
      return true;
    }
  }

  // Teachers can access students in their school
  if (actorRoleInfo.role === 'teacher' && targetUser.type === 'student') {
    if (actorRoleInfo.schoolId && targetUser.schoolId === actorRoleInfo.schoolId) {
      return true;
    }
  }

  // Parents can access their children
  if (actorRoleInfo.role === 'parent' && targetUser.type === 'student') {
    // TODO: Check parent-child relationship
    return true;
  }

  return false;
}

// ============================================================================
// ROUTE PROTECTION HELPERS
// ============================================================================

/**
 * Role-based route access patterns
 */
export const ROUTE_PATTERNS: Record<string, {
  allowedRoles: string[];
  requireSameSchool?: boolean;
}> = {
  '/student': {
    allowedRoles: ['student'],
  },
  '/teacher': {
    allowedRoles: ['teacher'],
  },
  '/parent': {
    allowedRoles: ['parent'],
  },
  '/counselor': {
    allowedRoles: ['counselor', 'admin'],
  },
  '/admin': {
    allowedRoles: ['admin'],
  },
  '/school-admin': {
    allowedRoles: ['admin', 'counselor'],
  },
  '/ministry': {
    allowedRoles: ['ministry'],
  },
  '/api/teacher': {
    allowedRoles: ['teacher', 'admin'],
  },
  '/api/student': {
    allowedRoles: ['student', 'teacher', 'admin', 'counselor', 'parent'],
  },
  '/api/school-admin': {
    allowedRoles: ['admin'],
  },
  '/api/admin': {
    allowedRoles: ['admin'],
  },
  '/api/ministry': {
    allowedRoles: ['ministry', 'admin'],
  },
};

/**
 * Check if a route requires specific role access
 *
 * @param pathname - The route pathname
 * @returns Route access requirements or null (public route)
 */
export function getRouteRequirements(pathname: string): {
  allowedRoles: string[];
  requireSameSchool?: boolean;
} | null {
  // Find matching pattern
  for (const [pattern, requirements] of Object.entries(ROUTE_PATTERNS)) {
    if (pathname.startsWith(pattern)) {
      return requirements;
    }
  }

  // Default: no specific requirements (but still requires auth)
  return null;
}

/**
 * Get dashboard path for a user role
 *
 * @param role - User role
 * @returns Dashboard path
 */
export function getDashboardForRole(role: string): string {
  const dashboards: Record<string, string> = {
    student: '/student/dashboard',
    teacher: '/teacher/dashboard',
    parent: '/parent/dashboard',
    counselor: '/counselor/dashboard',
    admin: '/admin/dashboard',
    'school-admin': '/school-admin/dashboard',
    ministry: '/ministry',
  };

  return dashboards[role] || '/';
}

/**
 * Validate route access based on user role
 *
 * @param pathname - The route pathname
 * @param userRole - The user's role
 * @returns Object with allowed, redirectPath
 */
export function validateRouteAccess(
  pathname: string,
  userRole: string
): {
  allowed: boolean;
  redirectPath?: string;
} {
  const requirements = getRouteRequirements(pathname);

  // No specific requirements - route is accessible to all authenticated users
  if (!requirements) {
    return { allowed: true };
  }

  // Check if user's role is allowed
  if (!requirements.allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard
    return {
      allowed: false,
      redirectPath: getDashboardForRole(userRole),
    };
  }

  return { allowed: true };
}

// ============================================================================
// SESSION HELPERS
// ============================================================================

/**
 * Create a secure session token (for additional validation)
 * In production, this should use a secure JWT or similar
 */
export function createSessionToken(userId: string, role: string): string {
  const payload = {
    userId,
    role,
    timestamp: Date.now(),
  };

  // Simple encoding - in production, use JWT with proper signing
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Validate a session token
 */
export function validateSessionToken(token: string): {
  valid: boolean;
  userId?: string;
  role?: string;
} {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());

    // Check token age (max 24 hours)
    const tokenAge = Date.now() - (payload.timestamp || 0);
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: payload.userId,
      role: payload.role,
    };
  } catch {
    return { valid: false };
  }
}

// ============================================================================
// SECURITY LOGGING
// ============================================================================

/**
 * Log security-relevant auth events
 */
export function logAuthEvent(
  event: 'unauthorized_access' | 'role_mismatch' | 'school_access_denied' | 'auth_success',
  details: {
    clerkUserId?: string;
    attemptedRole?: string;
    actualRole?: string;
    pathname?: string;
    ipAddress?: string;
  }
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...details,
  };

  if (event === 'unauthorized_access' || event === 'role_mismatch') {
    logger.warn('[Security Auth]', logEntry);
  } else {
    logger.debug('[Security Auth]', logEntry);
  }

  // TODO: Send to monitoring/audit service
}

// ============================================================================
// API ROUTE HELPERS
// ============================================================================

/**
 * API route authentication helper
 * Use this in API routes to require authentication and optionally verify roles
 *
 * @example
 * ```ts
 * // Basic auth check
 * const authResult = await requireAuth();
 * if ('error' in authResult) return authResult;
 * const { user, userId } = authResult;
 *
 * // With role requirement
 * const authResult = await requireAuth(['admin', 'school-admin']);
 * if ('error' in authResult) return authResult;
 * const { user, userId } = authResult;
 * ```
 *
 * @param allowedRoles - Array of roles that can access this route
 * @returns Object with user and userId on success, or NextResponse error on failure
 */
export async function requireAuth(allowedRoles?: string[]): Promise<
  | { user: any; userId: string }
  | { error: string; status: number }
> {
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized", status: 401 };
  }

  // Get user with role from database
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  // Check role if required
  if (allowedRoles && !allowedRoles.includes(user.type)) {
    return { error: "Forbidden", status: 403 };
  }

  return { user, userId: user.id };
}

/**
 * Helper to convert auth result to NextResponse
 * Use this after requireAuth to handle errors consistently
 */
export async function authResponse(authResult: Awaited<ReturnType<typeof requireAuth>>) {
  const { NextResponse } = await import("next/server");

  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  return null; // No error, continue with request
}
