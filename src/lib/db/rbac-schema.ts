/**
 * RBAC (Role-Based Access Control) Schema
 *
 * Manages dynamic roles, permissions, and access control for the SaaS platform
 * Allows platform admins to create roles and assign granular permissions
 */

import { pgTable, text, boolean, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

// ============================================================================
// ROLES TABLE
// ============================================================================

/**
 * Dynamic roles that can be created and managed by platform admins
 */
export const roles = pgTable("roles", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  isSystemRole: boolean("is_system_role").default(false), // Cannot delete system roles
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// PERMISSIONS TABLE
// ============================================================================

/**
 * Granular permissions for different resources and actions
 */
export const permissions = pgTable("permissions", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  resource: text("resource").notNull(), // "schools", "users", "billing", "analytics"
  action: text("action").notNull(), // "create", "read", "update", "delete"
  description: text("description"),
  module: text("module"), // "schools", "users", "analytics", "billing"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// ROLE_PERMISSIONS TABLE (Junction)
// ============================================================================

/**
 * Many-to-many relationship between roles and permissions
 */
export const rolePermissions = pgTable("role_permissions", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: text("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => ({
  uniqueRolePermission: unique().on(table.roleId, table.permissionId),
}));

// ============================================================================
// USER_ROLES TABLE (Junction)
// ============================================================================

/**
 * Allow users to have multiple roles
 */
export const userRoles = pgTable("user_roles", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull(), // References users.id - FK added separately to avoid circular import
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  assignedBy: text("assigned_by"), // References users.id - FK added separately to avoid circular import
  expiresAt: timestamp("expires_at", { withTimezone: true }), // For temporary role assignments
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => ({
  uniqueUserRole: unique().on(table.userId, table.roleId),
}));

// ============================================================================
// COMPONENT_ACCESS TABLE
// ============================================================================

/**
 * Controls which UI components each role can access
 */
export const componentAccess = pgTable("component_access", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  componentPath: text("component_path").notNull(), // "/admin/schools", "/admin/billing"
  componentName: text("component_name").notNull(), // "Schools Management", "Billing"
  canView: boolean("can_view").default(false),
  canCreate: boolean("can_create").default(false),
  canUpdate: boolean("can_update").default(false),
  canDelete: boolean("can_delete").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  uniqueRoleComponent: unique().on(table.roleId, table.componentPath),
}));

// ============================================================================
// AUDIT_LOG TABLE
// ============================================================================

/**
 * Track all admin actions for accountability
 */
export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id"), // References users.id - FK added separately to avoid circular import
  action: text("action").notNull(), // "school.created", "user.deleted", "role.assigned"
  resourceType: text("resource_type"), // "school", "user", "role", "permission"
  resourceId: text("resource_id"),
  oldValues: jsonb("old_values"), // Before state
  newValues: jsonb("new_values"), // After state
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type ComponentAccess = typeof componentAccess.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
