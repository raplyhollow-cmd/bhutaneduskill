/**
 * Audit Logging Utility
 *
 * Tracks all sensitive operations for accountability and compliance.
 * Uses the audit_log table from the RBAC schema.
 */

import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/rbac-schema";
import { logger } from "@/lib/logger";
import type { NextRequest } from "next/server";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Audit event data structure
 */
export interface AuditEventInput {
  /** The action performed (e.g., "user.created", "college.deleted", "fee.updated") */
  action: string;
  /** Database ID of the user performing the action */
  userId: string;
  /** Type of resource affected (e.g., "user", "college", "fee_structure") */
  resourceType?: string;
  /** ID of the affected resource */
  resourceId?: string;
  /** State before the change */
  oldValues?: Record<string, unknown>;
  /** State after the change */
  newValues?: Record<string, unknown>;
  /** IP address of the request */
  ipAddress?: string;
  /** User agent string from request */
  userAgent?: string;
  /** Additional context metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Standard action categories for audit logging
 */
export const AuditActions = {
  // User management
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  USER_DEACTIVATED: "user.deactivated",
  USER_REACTIVATED: "user.reactivated",
  USER_ROLE_CHANGED: "user.role_changed",

  // Authentication
  LOGIN_SUCCESS: "auth.login_success",
  LOGIN_FAILED: "auth.login_failed",
  LOGOUT: "auth.logout",
  PASSWORD_RESET: "auth.password_reset",

  // Content management
  COLLEGE_CREATED: "college.created",
  COLLEGE_UPDATED: "college.updated",
  COLLEGE_DELETED: "college.deleted",
  SCHOLARSHIP_CREATED: "scholarship.created",
  SCHOLARSHIP_UPDATED: "scholarship.updated",
  SCHOLARSHIP_DELETED: "scholarship.deleted",
  PROGRAM_CREATED: "program.created",
  PROGRAM_UPDATED: "program.updated",
  PROGRAM_DELETED: "program.deleted",

  // Fee management
  FEE_STRUCTURE_CREATED: "fee_structure.created",
  FEE_STRUCTURE_UPDATED: "fee_structure.updated",
  FEE_STRUCTURE_DELETED: "fee_structure.deleted",
  FEE_PAYMENT_RECORDED: "fee.payment_recorded",

  // Assessment management
  ASSESSMENT_CREATED: "assessment.created",
  ASSESSMENT_UPDATED: "assessment.updated",
  ASSESSMENT_DELETED: "assessment.deleted",
  ASSESSMENT_RESULTS_VIEWED: "assessment.results_viewed",

  // School management
  SCHOOL_CREATED: "school.created",
  SCHOOL_UPDATED: "school.updated",
  SCHOOL_DELETED: "school.deleted",

  // Role/Permission management
  ROLE_CREATED: "role.created",
  ROLE_UPDATED: "role.updated",
  ROLE_DELETED: "role.deleted",
  PERMISSION_GRANTED: "permission.granted",
  PERMISSION_REVOKED: "permission.revoked",

  // Data export
  DATA_EXPORTED: "data.exported",
  DATA_IMPORTED: "data.imported",

  // Security events
  UNAUTHORIZED_ACCESS: "security.unauthorized_access",
  SUSPICIOUS_ACTIVITY: "security.suspicious_activity",
} as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extract client IP address from NextRequest
 */
export function getClientIp(request: NextRequest): string | undefined {
  // Check various headers for IP address
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return undefined;
}

/**
 * Extract user agent from NextRequest
 */
export function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get("user-agent") || undefined;
}

// ============================================================================
// AUDIT LOGGING FUNCTIONS
// ============================================================================

/**
 * Log an audit event to the database
 *
 * This function writes to the audit_log table for compliance and accountability.
 * It also logs to the standard logger for immediate visibility.
 *
 * @example
 * ```ts
 * import { logAuditEvent, AuditActions } from "@/lib/audit-log";
 *
 * await logAuditEvent({
 *   action: AuditActions.USER_CREATED,
 *   userId: adminId,
 *   resourceType: "user",
 *   resourceId: newUserId,
 *   newValues: { name, email, type },
 *   ipAddress: getClientIp(request),
 * });
 * ```
 */
export async function logAuditEvent(data: AuditEventInput): Promise<void> {
  const {
    action,
    userId,
    resourceType,
    resourceId,
    oldValues,
    newValues,
    ipAddress,
    userAgent,
    metadata,
  } = data;

  // Log to standard logger for immediate visibility
  logger.info(`[AUDIT] ${action}`, {
    userId,
    resourceType,
    resourceId,
    timestamp: new Date().toISOString(),
  });

  // Write to database
  try {
    await db.insert(auditLog).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      userId,
      action,
      resourceType: resourceType || null,
      resourceId: resourceId || null,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      createdAt: new Date(),
    });

    // Include metadata if provided
    if (metadata) {
      logger.debug("[AUDIT] Metadata", metadata);
    }
  } catch (error) {
    // Don't fail the request if audit logging fails
    // But log the error for investigation
    logger.error("Audit logging failed", { error, action, userId });
  }
}

/**
 * Log an audit event from a NextRequest context
 *
 * Convenience function that extracts IP and user agent automatically
 *
 * @example
 * ```ts
 * import { logAuditEventFromRequest } from "@/lib/audit-log";
 *
 * await logAuditEventFromRequest(request, {
 *   action: AuditActions.USER_DELETED,
 *   userId: adminId,
 *   resourceType: "user",
 *   resourceId: deletedUserId,
 *   oldValues: existingUser,
 * });
 * ```
 */
export async function logAuditEventFromRequest(
  request: NextRequest,
  data: Omit<AuditEventInput, "ipAddress" | "userAgent">
): Promise<void> {
  await logAuditEvent({
    ...data,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });
}

/**
 * Query audit logs for a specific resource
 *
 * @param resourceType - Type of resource to query
 * @param resourceId - ID of the resource to query
 * @param limit - Maximum number of records to return
 * @returns Array of audit log entries
 */
export async function getAuditHistory(
  resourceType: string,
  resourceId: string,
  limit = 100
): Promise<typeof auditLog.$inferSelect[]> {
  try {
    const { eq, and, desc } = await import("drizzle-orm");

    const history = await db
      .select()
      .from(auditLog)
      .where(
        and(
          eq(auditLog.resourceType, resourceType),
          eq(auditLog.resourceId, resourceId)
        )
      )
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);

    return history;
  } catch (error) {
    logger.error("Failed to fetch audit history", { error, resourceType, resourceId });
    return [];
  }
}

/**
 * Query audit logs for a specific user
 *
 * @param userId - Database ID of the user
 * @param limit - Maximum number of records to return
 * @returns Array of audit log entries for the user
 */
export async function getUserAuditHistory(
  userId: string,
  limit = 100
): Promise<typeof auditLog.$inferSelect[]> {
  try {
    const { eq, desc } = await import("drizzle-orm");

    const history = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.userId, userId))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);

    return history;
  } catch (error) {
    logger.error("Failed to fetch user audit history", { error, userId });
    return [];
  }
}

/**
 * Query all audit logs with filtering
 *
 * @param filters - Optional filters for action, resourceType, date range
 * @param limit - Maximum number of records to return
 * @param offset - Number of records to skip
 * @returns Array of audit log entries
 */
export async function getAuditLogs(filters?: {
  action?: string;
  resourceType?: string;
  resourceId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}, limit = 100, offset = 0): Promise<{
  logs: typeof auditLog.$inferSelect[];
  total: number;
}> {
  try {
    const { eq, and, desc, gte, lte, sql } = await import("drizzle-orm");

    const conditions = [];

    if (filters?.action) {
      conditions.push(eq(auditLog.action, filters.action));
    }
    if (filters?.resourceType) {
      conditions.push(eq(auditLog.resourceType, filters.resourceType));
    }
    if (filters?.resourceId) {
      conditions.push(eq(auditLog.resourceId, filters.resourceId));
    }
    if (filters?.userId) {
      conditions.push(eq(auditLog.userId, filters.userId));
    }
    if (filters?.startDate) {
      conditions.push(gte(auditLog.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(auditLog.createdAt, filters.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(auditLog)
      .where(whereClause);

    // Get logs
    const logs = await db
      .select()
      .from(auditLog)
      .where(whereClause)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset);

    return { logs, total: Number(total) };
  } catch (error) {
    logger.error("Failed to fetch audit logs", { error, filters });
    return { logs: [], total: 0 };
  }
}

// ============================================================================
// SPECIALIZED LOGGING HELPERS
// ============================================================================

/**
 * Log user creation
 */
export async function logUserCreated(
  userId: string,
  createdUserData: Record<string, unknown>,
  createdBy: string,
  request?: NextRequest
): Promise<void> {
  const logData: AuditEventInput = {
    action: AuditActions.USER_CREATED,
    userId: createdBy,
    resourceType: "user",
    resourceId: userId,
    newValues: {
      email: createdUserData.email,
      type: createdUserData.type,
      role: createdUserData.role,
      name: createdUserData.name,
    },
    metadata: {
      clerkUserId: createdUserData.clerkUserId,
      schoolId: createdUserData.schoolId,
    },
  };

  if (request) {
    await logAuditEventFromRequest(request, logData);
  } else {
    await logAuditEvent(logData);
  }
}

/**
 * Log user update
 */
export async function logUserUpdated(
  userId: string,
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>,
  updatedBy: string,
  request?: NextRequest
): Promise<void> {
  const changedFields = Object.keys(newValues).filter(
    (key) => JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])
  );

  const logData: AuditEventInput = {
    action: AuditActions.USER_UPDATED,
    userId: updatedBy,
    resourceType: "user",
    resourceId: userId,
    oldValues: changedFields.reduce((acc, key) => ({ ...acc, [key]: oldValues[key] }), {}),
    newValues: changedFields.reduce((acc, key) => ({ ...acc, [key]: newValues[key] }), {}),
    metadata: {
      changedFields,
    },
  };

  if (request) {
    await logAuditEventFromRequest(request, logData);
  } else {
    await logAuditEvent(logData);
  }
}

/**
 * Log user deletion
 */
export async function logUserDeleted(
  userId: string,
  deletedUserData: Record<string, unknown>,
  deletedBy: string,
  hardDelete: boolean,
  request?: NextRequest
): Promise<void> {
  const logData: AuditEventInput = {
    action: hardDelete ? AuditActions.USER_DELETED : AuditActions.USER_DEACTIVATED,
    userId: deletedBy,
    resourceType: "user",
    resourceId: userId,
    oldValues: {
      email: deletedUserData.email,
      type: deletedUserData.type,
      role: deletedUserData.role,
      name: deletedUserData.name,
    },
    metadata: {
      hardDelete,
    },
  };

  if (request) {
    await logAuditEventFromRequest(request, logData);
  } else {
    await logAuditEvent(logData);
  }
}

/**
 * Log content modification (colleges, scholarships, programs)
 */
export async function logContentModified(
  action: typeof AuditActions[keyof typeof AuditActions],
  contentType: "college" | "scholarship" | "program",
  contentId: string,
  oldValues: Record<string, unknown> | undefined,
  newValues: Record<string, unknown> | undefined,
  modifiedBy: string,
  request?: NextRequest
): Promise<void> {
  const logData: AuditEventInput = {
    action,
    userId: modifiedBy,
    resourceType: contentType,
    resourceId: contentId,
    oldValues,
    newValues,
  };

  if (request) {
    await logAuditEventFromRequest(request, logData);
  } else {
    await logAuditEvent(logData);
  }
}

/**
 * Log fee structure modification
 */
export async function logFeeModified(
  action: "created" | "updated" | "deleted",
  feeStructureId: string,
  oldValues: Record<string, unknown> | undefined,
  newValues: Record<string, unknown> | undefined,
  modifiedBy: string,
  request?: NextRequest
): Promise<void> {
  const actionMap = {
    created: AuditActions.FEE_STRUCTURE_CREATED,
    updated: AuditActions.FEE_STRUCTURE_UPDATED,
    deleted: AuditActions.FEE_STRUCTURE_DELETED,
  };

  const logData: AuditEventInput = {
    action: actionMap[action],
    userId: modifiedBy,
    resourceType: "fee_structure",
    resourceId: feeStructureId,
    oldValues,
    newValues,
  };

  if (request) {
    await logAuditEventFromRequest(request, logData);
  } else {
    await logAuditEvent(logData);
  }
}

/**
 * Log assessment result
 */
export async function logAssessmentResult(
  assessmentId: string,
  studentId: string,
  assessmentType: string,
  results: Record<string, unknown>,
  request?: NextRequest
): Promise<void> {
  const logData: AuditEventInput = {
    action: AuditActions.ASSESSMENT_CREATED,
    userId: studentId,
    resourceType: "assessment",
    resourceId: assessmentId,
    newValues: {
      type: assessmentType,
      studentId,
      timestamp: new Date().toISOString(),
    },
    metadata: {
      results: results, // Full results stored as metadata
    },
  };

  if (request) {
    await logAuditEventFromRequest(request, logData);
  } else {
    await logAuditEvent(logData);
  }
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  logAuditEvent,
  logAuditEventFromRequest,
  getAuditHistory,
  getUserAuditHistory,
  getAuditLogs,
  getClientIp,
  getUserAgent,
  AuditActions,
  logUserCreated,
  logUserUpdated,
  logUserDeleted,
  logContentModified,
  logFeeModified,
  logAssessmentResult,
};
