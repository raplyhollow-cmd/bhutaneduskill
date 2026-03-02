import { logger } from "@/lib/logger";

/**
 * Authentication & Authorization Utilities
 * Server-side role verification to prevent cookie manipulation attacks
 *
 * IMPORTANT: This file contains server-side only imports and must be marked as such.
 */

import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";

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
  const user = await db
    .select({
      type: users.type,
      schoolId: users.schoolId,
      tenantId: users.tenantId,
    })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1)
    .then(rows => rows[0] || null);

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
  const targetUser = await db
    .select({
      id: users.id,
      clerkUserId: users.clerkUserId,
      schoolId: users.schoolId,
      type: users.type,
    })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1)
    .then(rows => rows[0] || null);

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

  // Parents can access their children - FERPA COMPLIANCE
  if (actorRoleInfo.role === 'parent' && targetUser.type === 'student') {
    return await verifyParentChildRelationship(actorClerkUserId, targetUserId);
  }

  return false;
}

/**
 * Verify parent-child relationship for FERPA compliance
 *
 * CRITICAL: This ensures parents can ONLY access their own children's data
 *
 * @param parentClerkUserId - The parent's Clerk user ID
 * @param studentUserId - The student's database user ID
 * @returns true if parent is verified to be linked to this child
 */
export async function verifyParentChildRelationship(
  parentClerkUserId: string,
  studentUserId: string
): Promise<boolean> {
  try {
    // Import tables here to avoid circular dependencies
    const { parents, parentToStudent, users } = await import("@/lib/db/schema");

    // First get the user record from clerkUserId
    const userRecords = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, parentClerkUserId))
      .limit(1);

    if (userRecords.length === 0) {
      logger.warn("User record not found for Clerk ID", { parentClerkUserId });
      return false;
    }

    const userId = userRecords[0].id;

    // Get parent record for this user
    const parentRecords = await db
      .select({ id: parents.id })
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (parentRecords.length === 0) {
      logger.warn("Parent record not found for user", { parentClerkUserId });
      return false;
    }

    const parentId = parentRecords[0].id;

    // Check if parent-student relationship exists
    const relationships = await db
      .select()
      .from(parentToStudent)
      .where(
        and(
          eq(parentToStudent.parentId, parentId),
          eq(parentToStudent.studentId, studentUserId)
        )
      )
      .limit(1);

    const hasRelationship = relationships.length > 0;

    if (!hasRelationship) {
      logger.security("ferpa_violation_attempt", {
        parentClerkUserId,
        studentUserId,
        attemptedAccess: "parent accessing non-linked child"
      });
    }

    return hasRelationship;
  } catch (error) {
    logger.error("Error verifying parent-child relationship", { error, parentClerkUserId, studentUserId });
    // Fail closed for security
    return false;
  }
}

/**
 * Get all verified child IDs for a parent
 *
 * @param parentClerkUserId - The parent's Clerk user ID
 * @returns Array of student user IDs that this parent is verified to access
 */
export async function getVerifiedChildIds(parentClerkUserId: string): Promise<string[]> {
  try {
    const { parents, parentToStudent, users } = await import("@/lib/db/schema");

    // First get the user record from clerkUserId
    const userRecords = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, parentClerkUserId))
      .limit(1);

    if (userRecords.length === 0) {
      return [];
    }

    const userId = userRecords[0].id;

    // Get parent record
    const parentRecords = await db
      .select({ id: parents.id })
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (parentRecords.length === 0) {
      return [];
    }

    const parentId = parentRecords[0].id;

    // Get all linked student IDs
    const relationships = await db
      .select({ studentId: parentToStudent.studentId })
      .from(parentToStudent)
      .where(eq(parentToStudent.parentId, parentId));

    return relationships.map((r) => r.studentId);
  } catch (error) {
    logger.error("Error getting verified child IDs", { error, parentClerkUserId });
    return [];
  }
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
    allowedRoles: ['school-admin'],
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
// SESSION HELPERS - JWT Token Management
// ============================================================================

/**
 * JWT Secret key - SECURITY CRITICAL
 *
 * JWT_SECRET environment variable MUST be set in production.
 * In development, a fallback is provided but should NOT be used in production.
 *
 * @throws {Error} If JWT_SECRET is not set in production environment
 */
function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  // SECURITY: No fallback in production - fail closed
  if (!secret) {
    const isDevelopment = process.env.NODE_ENV === "development";
    if (isDevelopment) {
      // Only use fallback in development with a warning
      console.warn("[SECURITY] JWT_SECRET not set - using development fallback. DO NOT use in production!");
      return new TextEncoder().encode("dev-secret-change-in-production-min-32-chars");
    }

    // Production requires JWT_SECRET to be set
    throw new Error(
      "JWT_SECRET environment variable is required in production. " +
      "Set a secure random string (at least 32 characters) to prevent token forgery."
    );
  }

  // Validate minimum length
  if (secret.length < 32) {
    throw new Error(
      "JWT_SECRET must be at least 32 characters long for security. " +
      `Current length: ${secret.length}`
    );
  }

  return new TextEncoder().encode(secret);
}

/**
 * Session token payload interface
 */
export interface SessionTokenPayload {
  userId: string;
  clerkUserId: string;
  role: string;
  schoolId: string | null;
  tenantId: string;
  iat: number;
  exp: number;
}

/**
 * Token rotation state (in-memory for single-instance deployments)
 * In production with multiple instances, use Redis or similar
 */
const revokedTokens = new Set<string>();
const TOKEN_ROTATION_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Clean up expired revoked tokens
 */
setInterval(() => {
  revokedTokens.clear();
}, TOKEN_ROTATION_TTL);

/**
 * Create a secure JWT session token
 *
 * @param userId - Database user ID
 * @param clerkUserId - Clerk user ID
 * @param role - User role
 * @param schoolId - User's school ID (optional)
 * @param tenantId - User's tenant ID
 * @returns Signed JWT token
 */
export async function createSessionToken(
  userId: string,
  clerkUserId: string,
  role: string,
  schoolId: string | null,
  tenantId: string
): Promise<string> {
  const now = Date.now();
  const exp = now + (24 * 60 * 60 * 1000); // 24 hours

  const token = await new SignJWT({
    userId,
    clerkUserId,
    role,
    schoolId,
    tenantId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(getJWTSecret());

  logger.debug("Session token created", { userId, role });
  return token;
}

/**
 * Validate a JWT session token
 *
 * @param token - JWT token to validate
 * @returns Object with valid status and decoded payload
 */
export async function validateSessionToken(token: string): Promise<{
  valid: boolean;
  payload?: SessionTokenPayload;
  error?: string;
}> {
  try {
    // Check if token is revoked
    if (revokedTokens.has(token)) {
      return { valid: false, error: 'Token revoked' };
    }

    const { payload } = await jwtVerify(token, getJWTSecret());

    // Verify required fields
    if (!payload.userId || !payload.clerkUserId || !payload.role) {
      return { valid: false, error: 'Invalid token payload' };
    }

    logger.debug("Session token validated", {
      userId: payload.userId,
      role: payload.role,
    });

    return {
      valid: true,
      payload: {
        userId: payload.userId as string,
        clerkUserId: payload.clerkUserId as string,
        role: payload.role as string,
        schoolId: (payload.schoolId as string | null) || null,
        tenantId: payload.tenantId as string,
        iat: payload.iat as number,
        exp: payload.exp as number,
      },
    };
  } catch (error) {
    logger.warn("Session token validation failed", { error: error instanceof Error ? error.message : 'Unknown error' });
    return { valid: false, error: 'Invalid token' };
  }
}

/**
 * Revoke a session token (for logout or security events)
 *
 * @param token - Token to revoke
 */
export function revokeSessionToken(token: string): void {
  revokedTokens.add(token);
  logger.security("session_token_revoked", { tokenHash: token.slice(0, 10) + '...' });
}

/**
 * Rotate a session token (issue new token, revoke old one)
 *
 * @param oldToken - Old token to rotate
 * @returns New token or null if rotation failed
 */
export async function rotateSessionToken(oldToken: string): Promise<string | null> {
  const validation = await validateSessionToken(oldToken);

  if (!validation.valid || !validation.payload) {
    return null;
  }

  // Revoke old token
  revokeSessionToken(oldToken);

  // Create new token
  const newToken = await createSessionToken(
    validation.payload.userId,
    validation.payload.clerkUserId,
    validation.payload.role,
    validation.payload.schoolId,
    validation.payload.tenantId
  );

  logger.security("session_token_rotated", {
    userId: validation.payload.userId,
    role: validation.payload.role,
  });

  return newToken;
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
  | { user: User; userId: string }
  | { error: string; status: number }
> {
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();

  if (!userId) {
    console.log("[requireAuth] No userId from Clerk");
    return { error: "Unauthorized", status: 401 };
  }

  console.log("[requireAuth] Clerk userId:", userId);

  // Get user with role from database
  // IMPORTANT: Use db.select() instead of db.query.users.findFirst() to avoid loading relations
  // The users table has a self-referential 'parent' relation that causes circular reference issues
  let userRecords;
  try {
    userRecords = await db
      .select({
        id: users.id,
        clerkUserId: users.clerkUserId,
        type: users.type,
        role: users.role,  // Also select role as fallback
        firstName: users.firstName,
        lastName: users.lastName,
        name: users.name,
        email: users.email,
        phone: users.phone,
        schoolId: users.schoolId,
        onboardingStatus: users.onboardingStatus,
        onboardingComplete: users.onboardingComplete,
        profileImage: users.profileImage,  // Fixed: was profilePicture (doesn't exist)
      })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);
  } catch (dbError) {
    console.error("[requireAuth] Database query failed:", dbError);
    return {
      error: `Authentication failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
      status: 500
    };
  }

  console.log("[requireAuth] Database query result count:", userRecords.length);

  if (userRecords.length === 0) {
    console.log("[requireAuth] User not found in database for clerkUserId:", userId);
    return { error: "User not found", status: 404 };
  }

  // Cast through unknown first because we're selecting a subset of User fields
  const user = userRecords[0] as unknown as User;

  console.log("[requireAuth] User found:", { id: user.id, type: user.type, role: (user as any).role, allowedRoles });

  // Check role if required (empty array = no role restriction)
  // Check both 'type' and 'role' columns for flexibility
  const userRole = user.type || (user as any).role;
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log("[requireAuth] Role mismatch - user type:", user.type, "user role:", (user as any).role, "allowed:", allowedRoles);
    return { error: "Forbidden", status: 403 };
  }

  console.log("[requireAuth] SUCCESS - returning user");
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

// ============================================================================
// HIERARCHY HELPERS
// ============================================================================

/**
 * Check if a user has authority over another user's data
 * Based on role hierarchy and school membership
 *
 * @param requesterUser - The user making the request
 * @param targetUser - The user whose data is being accessed
 * @returns true if requester has authority over target
 */
export function hasAuthorityOver(requesterUser: User, targetUser: User): boolean {
  // Users can always access their own data
  if (requesterUser.id === targetUser.id) {
    return true;
  }

  // Platform admins have authority over everyone
  if (requesterUser.type === "admin") {
    return true;
  }

  // School admins can manage users in their school
  if (requesterUser.type === "school-admin" && requesterUser.schoolId === targetUser.schoolId) {
    // School admin can manage students, teachers, counselors in their school
    const schoolManagedRoles = ["student", "teacher", "counselor", "parent"];
    return schoolManagedRoles.includes(targetUser.type);
  }

  // Teachers can view students in their school (for classroom management)
  if (requesterUser.type === "teacher" && targetUser.type === "student") {
    return requesterUser.schoolId === targetUser.schoolId;
  }

  // Counselors can view students in their school
  if (requesterUser.type === "counselor" && targetUser.type === "student") {
    return requesterUser.schoolId === targetUser.schoolId;
  }

  // Parents can view their own children - FERPA COMPLIANCE
  if (requesterUser.type === "parent") {
    // We need to check the parent_to_student relationship table
    // This requires the clerkUserId for the parent
    // The hasAuthorityOver function signature doesn't include clerkUserId,
    // so this check needs to happen at the API level using verifyParentChildRelationship
    return false; // Requires explicit verification via verifyParentChildRelationship
  }

  return false;
}

/**
 * Check if a user can access a specific school's data
 *
 * @param user - The user making the request
 * @param schoolId - The school being accessed
 * @returns true if user can access this school
 */
export function canAccessSchool(user: User, schoolId: string): boolean {
  // Platform admins and ministry can access any school
  if (["admin", "ministry"].includes(user.type)) {
    return true;
  }

  // School users can only access their own school
  return user.schoolId === schoolId;
}

/**
 * Check if a user can approve applications for their school
 *
 * @param user - The user making the request
 * @returns true if user can approve applications
 */
export function canApproveApplications(user: User): boolean {
  return ["admin", "school-admin"].includes(user.type);
}

/**
 * Check if a user needs to complete setup before accessing their portal
 *
 * @param user - The user to check
 * @returns true if setup is needed
 */
export function needsSetup(user: User): boolean {
  // Platform admins skip setup
  if (user.type === "admin") {
    return false;
  }

  // Check if user has completed onboarding
  if (!user.onboardingComplete) {
    return true;
  }

  // School admins need to complete school setup if not done
  if (user.type === "school-admin" && user.schoolId) {
    // This would require checking the school's setup_complete field
    // For now, we'll return false since the user's onboarding is complete
    return false;
  }

  return false;
}

/**
 * Verify school activation status for school users
 * Returns error if school is not active or setup is not complete
 *
 * @param user - The user to check
 * @returns Error message if access should be denied, null if OK
 */
export async function verifySchoolActivation(user: User): Promise<{ error: string } | null> {
  // Platform admins are always allowed
  if (user.type === "admin") {
    return null;
  }

  // Users without school are OK (they're in setup)
  if (!user.schoolId) {
    return null;
  }

  // Fetch school to check status
  const { schools } = await import("@/lib/db/schema");
  const school = await db
    .select({
      isActive: schools.isActive,
      subscriptionStatus: schools.subscriptionStatus,
      setupComplete: schools.setupComplete,
    })
    .from(schools)
    .where(eq(schools.id, user.schoolId))
    .limit(1)
    .then(rows => rows[0] || null);

  if (!school) {
    return { error: "School not found" };
  }

  // Check activation status
  if (!school.isActive) {
    return { error: "Your school is currently inactive. Please contact the platform administrator." };
  }

  if (school.subscriptionStatus === "suspended") {
    return { error: "Your school's subscription has been suspended. Please contact the platform administrator." };
  }

  if (school.subscriptionStatus === "cancelled") {
    return { error: "Your school's subscription has been cancelled." };
  }

  if (school.subscriptionStatus === "pending_payment") {
    return { error: "Your school's subscription is pending payment approval." };
  }

  // Check setup status for school admins
  if (user.type === "school-admin" && !school.setupComplete) {
    return { error: "Please complete the school setup wizard to access this feature." };
  }

  return null;
}

/**
 * Get the redirect path for a user based on their onboarding status
 *
 * @param user - The user to check
 * @returns The path to redirect to for setup, or null if no setup needed
 */
export function getSetupRedirectPath(user: User): string | null {
  if (!needsSetup(user)) {
    return null;
  }

  // Map user types to their setup pages
  const setupPaths: Record<string, string> = {
    "school-admin": "/setup/school-admin",
    "teacher": "/setup/teacher",
    "student": "/setup/student",
    "parent": "/setup/parent",
    "counselor": "/setup/counselor",
    "ministry": "/setup/ministry",
  };

  return setupPaths[user.type] || "/setup/unified";
}
