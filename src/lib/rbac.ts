/**
 * RBAC (Role-Based Access Control) Helper
 *
 * Provides functions for checking user permissions and component access
 *
 * Usage in API routes:
 * ```typescript
 * import { hasPermission, hasAnyPermission, canAccessComponent } from "@/lib/rbac";
 *
 * // Check single permission
 * if (!(await hasPermission(userId, "schools.create"))) {
 *   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 * }
 *
 * // Check multiple permissions (any)
 * if (!(await hasAnyPermission(userId, ["schools.create", "schools.update"]))) {
 *   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 * }
 *
 * // Check component access
 * if (!(await canAccessComponent(userId, "/admin/schools"))) {
 *   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 * }
 * ```
 */

import { neon } from "@neondatabase/serverless";
import * as schema from "@/lib/db/schema";

const sql = neon(process.env.DATABASE_URL!);

// ============================================================================
// TYPES
// ============================================================================

export interface UserPermission {
  id: string;
  slug: string;
  name: string;
  resource: string;
  action: string;
  module: string;
}

export interface UserRole {
  id: string;
  name: string;
  slug: string;
}

export interface ComponentAccessRule {
  componentPath: string;
  componentName: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

// ============================================================================
// PERMISSION CHECKS
// ============================================================================

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<UserPermission[]> {
  const result = await sql`
    SELECT DISTINCT p.id, p.slug, p.name, p.resource, p.action, p.module
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = ${userId}
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  `;

  return result as unknown as UserPermission[];
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const result = await sql`
    SELECT r.id, r.name, r.slug
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ${userId}
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  `;

  return result as unknown as UserRole[];
}

/**
 * Check if user has a specific permission
 * @param userId - User ID from database
 * @param permissionSlug - Permission slug (e.g., "schools.create")
 */
export async function hasPermission(
  userId: string,
  permissionSlug: string
): Promise<boolean> {
  const result = await sql`
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = ${userId}
      AND p.slug = ${permissionSlug}
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    LIMIT 1
  `;

  return result.length > 0;
}

/**
 * Check if user has any of the specified permissions
 * @param userId - User ID from database
 * @param permissionSlugs - Array of permission slugs
 */
export async function hasAnyPermission(
  userId: string,
  permissionSlugs: string[]
): Promise<boolean> {
  const result = await sql`
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = ${userId}
      AND p.slug = ANY(${permissionSlugs})
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    LIMIT 1
  `;

  return result.length > 0;
}

/**
 * Check if user has all of the specified permissions
 * @param userId - User ID from database
 * @param permissionSlugs - Array of permission slugs
 */
export async function hasAllPermissions(
  userId: string,
  permissionSlugs: string[]
): Promise<boolean> {
  const result = await sql`
    SELECT COUNT(DISTINCT p.slug) as count
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = ${userId}
      AND p.slug = ANY(${permissionSlugs})
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  `;

  return result[0]?.count >= permissionSlugs.length;
}

// ============================================================================
// COMPONENT ACCESS CHECKS
// ============================================================================

/**
 * Check if user can access a specific component/path
 * @param userId - User ID from database
 * @param componentPath - Component path (e.g., "/admin/schools")
 */
export async function canAccessComponent(
  userId: string,
  componentPath: string
): Promise<boolean> {
  const result = await sql`
    SELECT 1
    FROM user_roles ur
    JOIN component_access ca ON ca.role_id = ur.role_id
    WHERE ur.user_id = ${userId}
      AND (
        ca.component_path = ${componentPath}
        OR ${componentPath} LIKE ca.component_path
      )
      AND ca.can_view = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    LIMIT 1
  `;

  return result.length > 0;
}

/**
 * Get component access rules for a user
 */
export async function getComponentAccess(
  userId: string
): Promise<ComponentAccessRule[]> {
  const result = await sql`
    SELECT DISTINCT
      ca.component_path as "componentPath",
      ca.component_name as "componentName",
      ca.can_view as "canView",
      ca.can_create as "canCreate",
      ca.can_update as "canUpdate",
      ca.can_delete as "canDelete"
    FROM user_roles ur
    JOIN component_access ca ON ca.role_id = ur.role_id
    WHERE ur.user_id = ${userId}
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  `;

  return result as unknown as ComponentAccessRule[];
}

// ============================================================================
// ROLE MANAGEMENT
// ============================================================================

/**
 * Assign a role to a user
 */
export async function assignRole(
  userId: string,
  roleId: string,
  assignedBy: string,
  expiresAt?: Date
): Promise<void> {
  await sql`
    INSERT INTO user_roles (id, user_id, role_id, assigned_by, expires_at, created_at)
    VALUES (${crypto.randomUUID()}, ${userId}, ${roleId}, ${assignedBy}, ${expiresAt || null}, NOW())
  `;
}

/**
 * Remove a role from a user
 */
export async function removeRole(userId: string, roleId: string): Promise<void> {
  await sql`
    DELETE FROM user_roles
    WHERE user_id = ${userId} AND role_id = ${roleId}
  `;
}

// ============================================================================
// MIDDLEWARE HELPERS
// ============================================================================

/**
 * Require specific permission - returns error response if not allowed
 * Use in API routes like:
 * ```typescript
 * const permCheck = await requirePermission(userId, "schools.create");
 * if (permCheck) return permCheck;
 * ```
 */
export async function requirePermission(
  userId: string,
  permissionSlug: string
): Promise<Response | null> {
  const hasAccess = await hasPermission(userId, permissionSlug);

  if (!hasAccess) {
    return Response.json(
      {
        success: false,
        error: "You don't have permission to perform this action",
        required: permissionSlug,
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Require any of specified permissions - returns error response if not allowed
 */
export async function requireAnyPermission(
  userId: string,
  permissionSlugs: string[]
): Promise<Response | null> {
  const hasAccess = await hasAnyPermission(userId, permissionSlugs);

  if (!hasAccess) {
    return Response.json(
      {
        success: false,
        error: "You don't have permission to perform this action",
        required: permissionSlugs,
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Require component access - returns error response if not allowed
 */
export async function requireComponentAccess(
  userId: string,
  componentPath: string
): Promise<Response | null> {
  const hasAccess = await canAccessComponent(userId, componentPath);

  if (!hasAccess) {
    return Response.json(
      {
        success: false,
        error: "You don't have access to this resource",
        required: componentPath,
      },
      { status: 403 }
    );
  }

  return null;
}
