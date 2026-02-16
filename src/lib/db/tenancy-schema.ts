/**
 * Multi-Tenancy Database Schema
 * Handles tenant management for ministry, district, and school hierarchy
 * Supports verification workflows and tenant isolation
 */

import { pgTable, text, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";

// ============================================================================
// TENANTS TABLE
// ============================================================================

/**
 * Tenants represent organizations in the system with theme customization
 * This table is used for multi-tenant theming support
 */
export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),

  // Basic information
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // URL-friendly identifier for the tenant
  domain: text("domain").notNull().unique(), // Custom domain for the tenant

  // Branding/Theme
  logo: text("logo").notNull(), // URL to logo image
  primaryColor: text("primary_color").notNull(), // Primary brand color (hex or rgb)
  secondaryColor: text("secondary_color").notNull(), // Secondary brand color

  // Configuration (JSON string in database)
  settings: text("settings"), // Additional tenant settings as JSON

  // Status
  isActive: boolean("is_active").default(true),

  // Metadata
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// VERIFICATION REQUESTS TABLE
// ============================================================================

/**
 * Verification requests for tenant signup and verification
 * Tracks the workflow of verifying schools and ministries
 */
export const verificationRequests = pgTable("verification_requests", {
  id: text("id").primaryKey(),

  // References
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(), // User submitting the request

  // Request type
  type: text("type").notNull(), // "school_signup" | "ministry_signup" | "domain_verification" | "document_verification"

  // Documents submitted
  documents: json("documents").notNull().$type<Array<{
    type: string; // "registration_certificate" | "tax_clearance" | "authorization_letter" etc.
    url: string;
    name: string;
    size?: number;
  }>>(),

  // Additional info
  governmentId: text("government_id"), // Ministry-issued ID if available
  domain: text("domain"), // Domain to verify if using domain verification

  // Status
  status: text("status").notNull().default("pending"), // "pending" | "under_review" | "approved" | "rejected" | "more_info_required"

  // Review details
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: text("reviewed_by"), // User ID of admin who reviewed
  notes: text("notes"), // Review notes or rejection reason
  rejectionReason: text("rejection_reason"),

  // Additional info requested
  additionalInfoRequested: json("additional_info_requested").$type<Array<{
    field: string;
    reason: string;
    received: boolean;
  }>>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TENANT USERS TABLE
// ============================================================================

/**
 * Links users to tenants with specific roles
 * Allows users to belong to multiple tenants
 */
export const tenantUsers = pgTable("tenant_users", {
  id: text("id").primaryKey(),

  // References
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),

  // Role within this tenant
  role: text("role").notNull(), // "admin" | "teacher" | "student" | "parent" | "counselor"

  // Status
  isActive: boolean("is_active").default(true),
  isPrimary: boolean("is_primary").default(false), // For users with multiple tenants

  // Invitation status
  invitedBy: text("invited_by"), // User ID who invited
  invitedAt: timestamp("invited_at", { withTimezone: true }),
  joinedAt: timestamp("joined_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TENANT SETTINGS TABLE
// ============================================================================

/**
 * Per-tenant settings and configurations
 * Allows for tenant-specific customization
 */
export const tenantSettings = pgTable("tenant_settings", {
  id: text("id").primaryKey(),

  // Reference
  tenantId: text("tenant_id").unique().notNull().references(() => tenants.id, { onDelete: "cascade" }),

  // Academic settings
  academicYearStart: text("academic_year_start"), // MM-DD format
  academicYearEnd: text("academic_year_end"),
  currentAcademicYear: text("current_academic_year"),

  // Grading settings
  gradingScale: json("grading_scale").$type<Array<{
    grade: string;
    minPercentage: number;
    maxPercentage: number;
    description: string;
  }>>(),
  passingPercentage: integer("passing_percentage").default(40),

  // Attendance settings
  attendanceThreshold: integer("attendance_threshold"), // Minimum % for passing
  attendanceMarkingTime: text("attendance_marking_time"), // Default time for marking

  // Fee settings
  currency: text("currency").default("BTN"),
  lateFeePercentage: integer("late_fee_percentage"),
  lateFeeGraceDays: integer("late_fee_grace_days"),

  // Communication settings
  smsEnabled: boolean("sms_enabled").default(false),
  emailEnabled: boolean("email_enabled").default(true),
  notificationEmail: text("notification_email"),

  // Security settings
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  passwordExpiryDays: integer("password_expiry_days"),
  sessionTimeoutMinutes: integer("session_timeout_minutes"),

  // Integration settings
  rubIntegrationEnabled: boolean("rub_integration_enabled").default(false),
  rubApiKey: text("rub_api_key"),
  rubSchoolCode: text("rub_school_code"),

  // Custom fields
  customFields: json("custom_fields").$type<Record<string, any>>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TENANT AUDIT LOG TABLE
// ============================================================================

/**
 * Audit log for tenant-level actions
 * Tracks important changes and actions for compliance
 */
export const tenantAuditLog = pgTable("tenant_audit_log", {
  id: text("id").primaryKey(),

  // Reference
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  // Action details
  action: text("action").notNull(), // "create" | "update" | "delete" | "verify" | "suspend"
  entityType: text("entity_type").notNull(), // "tenant" | "user" | "school" | "subscription"
  entityId: text("entity_id").notNull(),

  // Who made the change
  performedBy: text("performed_by").notNull(), // User ID
  performedByRole: text("performed_by_role"), // Role at time of action

  // Change details
  oldValue: json("old_value").$type<Record<string, any>>(),
  newValue: json("new_value").$type<Record<string, any>>(),
  changes: json("changes").$type<Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>>(),

  // Context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  reason: text("reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type NewVerificationRequest = typeof verificationRequests.$inferInsert;

export type TenantUser = typeof tenantUsers.$inferSelect;
export type NewTenantUser = typeof tenantUsers.$inferInsert;

export type TenantSetting = typeof tenantSettings.$inferSelect;
export type NewTenantSetting = typeof tenantSettings.$inferInsert;

export type TenantAuditLogEntry = typeof tenantAuditLog.$inferSelect;
export type NewTenantAuditLogEntry = typeof tenantAuditLog.$inferInsert;
