/**
 * BATCH USER OPERATIONS API (Platform Admin)
 *
 * POST /api/admin/users/batch - Perform bulk operations on multiple users
 *   - activate: Set isActive = true for multiple users
 *   - deactivate: Set isActive = false for multiple users
 *   - delete: Soft delete multiple users
 *   - hardDelete: Permanently delete multiple users
 *   - changeRole: Change role for multiple users
 *   - changeType: Change type for multiple users
 *   - assignSchool: Assign school to multiple users
 *   - sendEmail: Send email to multiple users
 *   - export: Generate CSV export of users
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { invalidateAllRoleCache } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

type BatchOperation =
  | 'activate'
  | 'deactivate'
  | 'delete'
  | 'hardDelete'
  | 'changeRole'
  | 'changeType'
  | 'assignSchool'
  | 'assignTenant'
  | 'sendEmail'
  | 'export';

interface BatchRequest {
  operation: BatchOperation;
  userIds: string[];
  params?: {
    role?: string;
    type?: 'student' | 'teacher' | 'parent' | 'school_admin' | 'admin' | 'counselor';
    schoolId?: string | null;
    tenantId?: string | null;
    emailSubject?: string;
    emailBody?: string;
    filters?: {
      role?: string;
      schoolId?: string;
      tenantId?: string;
      status?: string;
      search?: string;
    };
    exportFields?: string[];
  };
}

interface BatchResponse {
  operation: BatchOperation;
  success: boolean;
  processed: number;
  succeeded: string[];
  failed: Array<{ id: string; error: string }>;
  message?: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// POST /api/admin/users/batch - Perform bulk operations
// ============================================================================

import { createApiRoute } from "@/lib/api/route-handler";

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId: adminId } = auth;
    const body: BatchRequest = await request.json();
    const { operation, userIds, params } = body;

    if (!operation) {
      return { error: 'Operation is required', status: 400 };
    }

    // Handle export operation (doesn't require userIds)
    if (operation === 'export') {
      return await handleExport(params, adminId);
    }

    // For all other operations, userIds is required
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return { error: 'userIds array is required for this operation', status: 400 };
    }

    // Limit batch size to prevent abuse
    const maxBatchSize = 100;
    if (userIds.length > maxBatchSize) {
      return { error: `Maximum batch size is ${maxBatchSize} users`, status: 400 };
    }

    // Route to appropriate handler
    switch (operation) {
      case 'activate':
        return await handleActivate(userIds, adminId);
      case 'deactivate':
        return await handleDeactivate(userIds, adminId);
      case 'delete':
        return await handleSoftDelete(userIds, adminId);
      case 'hardDelete':
        return await handleHardDelete(userIds, adminId);
      case 'changeRole':
        return await handleChangeRole(userIds, params?.role, adminId);
      case 'changeType':
        return await handleChangeType(userIds, params?.type, adminId);
      case 'assignSchool':
        return await handleAssignSchool(userIds, params?.schoolId, adminId);
      case 'assignTenant':
        return await handleAssignTenant(userIds, params?.tenantId, adminId);
      case 'sendEmail':
        return await handleSendEmail(userIds, params?.emailSubject, params?.emailBody, adminId);
      default:
        return { error: `Unknown operation: ${operation}`, status: 400 };
    }
  },
  ['admin']
);

// ============================================================================
// OPERATION HANDLERS
// ============================================================================

/**
 * Activate multiple users
 */
async function handleActivate(userIds: string[], adminId: string): Promise<NextResponse> {
  const succeeded: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  // Verify all users exist
  const existingUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, userIds));

  const existingIds = new Set(existingUsers.map(u => u.id));

  for (const id of userIds) {
    if (!existingIds.has(id)) {
      failed.push({ id, error: 'User not found' });
      continue;
    }
  }

  const validIds = userIds.filter(id => existingIds.has(id));

  if (validIds.length === 0) {
    return NextResponse.json({
      data: {
        operation: 'activate',
        success: false,
        processed: 0,
        succeeded: [],
        failed,
      } as BatchResponse,
    } satisfies ApiSuccess<BatchResponse>);
  }

  // Perform batch update
  await db
    .update(users)
    .set({
      isActive: true,
      updatedAt: new Date(),
    })
    .where(inArray(users.id, validIds));

  // Invalidate all role cache since multiple users may be affected
  invalidateAllRoleCache();

  logger.info('Batch activate users', { count: validIds.length, adminId });

  return NextResponse.json({
    data: {
      operation: 'activate',
      success: true,
      processed: validIds.length,
      succeeded: validIds,
      failed,
      message: `Successfully activated ${validIds.length} user(s)`,
    } as BatchResponse,
  } satisfies ApiSuccess<BatchResponse>);
}

/**
 * Deactivate multiple users
 */
async function handleDeactivate(userIds: string[], adminId: string): Promise<NextResponse> {
  const succeeded: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  // Prevent deactivating self
  const selfIndex = userIds.indexOf(adminId);
  const filteredIds = selfIndex > -1 ? userIds.filter((_, i) => i !== selfIndex) : userIds;

  if (filteredIds.length < userIds.length) {
    failed.push({ id: adminId, error: 'Cannot deactivate your own account' });
  }

  if (filteredIds.length === 0) {
    return NextResponse.json({
      data: {
        operation: 'deactivate',
        success: false,
        processed: 0,
        succeeded: [],
        failed,
      } as BatchResponse,
    } satisfies ApiSuccess<BatchResponse>);
  }

  // Verify users exist
  const existingUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, filteredIds));

  const existingIds = new Set(existingUsers.map(u => u.id));

  for (const id of filteredIds) {
    if (!existingIds.has(id)) {
      failed.push({ id, error: 'User not found' });
    } else {
      succeeded.push(id);
    }
  }

  const validIds = succeeded;

  if (validIds.length === 0) {
    return NextResponse.json({
      data: {
        operation: 'deactivate',
        success: false,
        processed: 0,
        succeeded: [],
        failed,
      } as BatchResponse,
    } satisfies ApiSuccess<BatchResponse>);
  }

  // Perform batch update
  await db
    .update(users)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(inArray(users.id, validIds));

  // Invalidate all role cache
  invalidateAllRoleCache();

  logger.info('Batch deactivate users', { count: validIds.length, adminId });

  return NextResponse.json({
    data: {
      operation: 'deactivate',
      success: true,
      processed: validIds.length,
      succeeded: validIds,
      failed,
      message: `Successfully deactivated ${validIds.length} user(s)`,
    } as BatchResponse,
  } satisfies ApiSuccess<BatchResponse>);
}

/**
 * Soft delete multiple users
 */
async function handleSoftDelete(userIds: string[], adminId: string): Promise<NextResponse> {
  // Same as deactivate - just with different messaging
  return await handleDeactivate(userIds, adminId);
}

/**
 * Hard delete multiple users
 */
async function handleHardDelete(userIds: string[], adminId: string): Promise<NextResponse> {
  const succeeded: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  // Prevent deleting self
  const selfIndex = userIds.indexOf(adminId);
  const filteredIds = selfIndex > -1 ? userIds.filter((_, i) => i !== selfIndex) : userIds;

  if (filteredIds.length < userIds.length) {
    failed.push({ id: adminId, error: 'Cannot delete your own account' });
  }

  if (filteredIds.length === 0) {
    return NextResponse.json({
      data: {
        operation: 'hardDelete',
        success: false,
        processed: 0,
        succeeded: [],
        failed,
      } as BatchResponse,
    } satisfies ApiSuccess<BatchResponse>);
  }

  // Verify users exist
  const existingUsers = await db
    .select({ id: users.id, clerkUserId: users.clerkUserId })
    .from(users)
    .where(inArray(users.id, filteredIds));

  const existingMap = new Map(existingUsers.map(u => [u.id, u.clerkUserId]));

  for (const id of filteredIds) {
    if (!existingMap.has(id)) {
      failed.push({ id, error: 'User not found' });
    } else {
      succeeded.push(id);
    }
  }

  const validIds = succeeded;

  if (validIds.length === 0) {
    return NextResponse.json({
      data: {
        operation: 'hardDelete',
        success: false,
        processed: 0,
        succeeded: [],
        failed,
      } as BatchResponse,
    } satisfies ApiSuccess<BatchResponse>);
  }

  // Perform batch delete
  await db.delete(users).where(inArray(users.id, validIds));

  // Invalidate all role cache
  invalidateAllRoleCache();

  logger.info('Batch hard delete users', { count: validIds.length, adminId });

  return NextResponse.json({
    data: {
      operation: 'hardDelete',
      success: true,
      processed: validIds.length,
      succeeded: validIds,
      failed,
      message: `Successfully deleted ${validIds.length} user(s)`,
    } as BatchResponse,
  } satisfies ApiSuccess<BatchResponse>);
}

/**
 * Change role for multiple users
 */
async function handleChangeRole(userIds: string[], role: string | undefined, adminId: string): Promise<NextResponse> {
  if (!role) {
    return NextResponse.json(
      { error: 'role parameter is required for changeRole operation', status: 400 } as ApiErrorResponse,
      { status: 400 }
    );
  }

  const succeeded: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  // Verify users exist
  const existingUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, userIds));

  const existingIds = new Set(existingUsers.map(u => u.id));

  for (const id of userIds) {
    if (!existingIds.has(id)) {
      failed.push({ id, error: 'User not found' });
    } else {
      succeeded.push(id);
    }
  }

  const validIds = succeeded;

  if (validIds.length === 0) {
    return NextResponse.json({
      data: {
        operation: 'changeRole',
        success: false,
        processed: 0,
        succeeded: [],
        failed,
      } as BatchResponse,
    } satisfies ApiSuccess<BatchResponse>);
  }

  // Perform batch update
  await db
    .update(users)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(inArray(users.id, validIds));

  // Invalidate all role cache
  invalidateAllRoleCache();

  logger.info('Batch change role', { count: validIds.length, role, adminId });

  return NextResponse.json({
    data: {
      operation: 'changeRole',
      success: true,
      processed: validIds.length,
      succeeded: validIds,
      failed,
      message: `Successfully changed role to '${role}' for ${validIds.length} user(s)`,
    } as BatchResponse,
  } satisfies ApiSuccess<BatchResponse>);
}

/**
 * Change type for multiple users
 */
async function handleChangeType(
  userIds: string[],
  type: 'student' | 'teacher' | 'parent' | 'school_admin' | 'admin' | 'counselor' | undefined,
  adminId: string
): Promise<NextResponse> {
  if (!type) {
    return NextResponse.json(
      { error: 'type parameter is required for changeType operation', status: 400 } as ApiErrorResponse,
      { status: 400 }
    );
  }

  const validTypes = ['student', 'teacher', 'parent', 'school_admin', 'admin', 'counselor'];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${validTypes.join(', ')}`, status: 400 } as ApiErrorResponse,
      { status: 400 }
    );
  }

  const succeeded: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  // Verify users exist
  const existingUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, userIds));

  const existingIds = new Set(existingUsers.map(u => u.id));

  for (const id of userIds) {
    if (!existingIds.has(id)) {
      failed.push({ id, error: 'User not found' });
    } else {
      succeeded.push(id);
    }
  }

  const validIds = succeeded;

  if (validIds.length === 0) {
    return NextResponse.json({
      data: {
        operation: 'changeType',
        success: false,
        processed: 0,
        succeeded: [],
        failed,
      } as BatchResponse,
    } satisfies ApiSuccess<BatchResponse>);
  }

  // Perform batch update
  await db
    .update(users)
    .set({
      type,
      updatedAt: new Date(),
    })
    .where(inArray(users.id, validIds));

  // Invalidate all role cache
  invalidateAllRoleCache();

  logger.info('Batch change type', { count: validIds.length, type, adminId });

  return NextResponse.json({
    data: {
      operation: 'changeType',
      success: true,
      processed: validIds.length,
      succeeded: validIds,
      failed,
      message: `Successfully changed type to '${type}' for ${validIds.length} user(s)`,
    } as BatchResponse,
  } satisfies ApiSuccess<BatchResponse>);
}

/**
 * Assign school to multiple users
 */
async function handleAssignSchool(userIds: string[], schoolId: string | null | undefined, adminId: string): Promise<NextResponse> {
  const succeeded: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  // Verify users exist
  const existingUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, userIds));

  const existingIds = new Set(existingUsers.map(u => u.id));

  for (const id of userIds) {
    if (!existingIds.has(id)) {
      failed.push({ id, error: 'User not found' });
      continue;
    }
    succeeded.push(id);
  }

  const validIds = succeeded;

  if (validIds.length === 0) {
    return NextResponse.json({
      data: {
        operation: 'assignSchool',
        success: false,
        processed: 0,
        succeeded: [],
        failed,
      } as BatchResponse,
    } satisfies ApiSuccess<BatchResponse>);
  }

  // Perform batch update
  await db
    .update(users)
    .set({
      schoolId: schoolId || null,
      updatedAt: new Date(),
    })
    .where(inArray(users.id, validIds));

  logger.info('Batch assign school', { count: validIds.length, schoolId, adminId });

  return NextResponse.json({
    data: {
      operation: 'assignSchool',
      success: true,
      processed: validIds.length,
      succeeded: validIds,
      failed,
      message: `Successfully assigned school to ${validIds.length} user(s)`,
    } as BatchResponse,
  } satisfies ApiSuccess<BatchResponse>);
}

/**
 * Assign tenant to multiple users
 */
async function handleAssignTenant(userIds: string[], tenantId: string | null | undefined, adminId: string): Promise<NextResponse> {
  const succeeded: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  // Verify users exist
  const existingUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, userIds));

  const existingIds = new Set(existingUsers.map(u => u.id));

  for (const id of userIds) {
    if (!existingIds.has(id)) {
      failed.push({ id, error: 'User not found' });
      continue;
    }
    succeeded.push(id);
  }

  const validIds = succeeded;

  if (validIds.length === 0) {
    return NextResponse.json({
      data: {
        operation: 'assignTenant',
        success: false,
        processed: 0,
        succeeded: [],
        failed,
      } as BatchResponse,
    } satisfies ApiSuccess<BatchResponse>);
  }

  // Perform batch update
  await db
    .update(users)
    .set({
      tenantId: tenantId || null,
      updatedAt: new Date(),
    })
    .where(inArray(users.id, validIds));

  logger.info('Batch assign tenant', { count: validIds.length, tenantId, adminId });

  return NextResponse.json({
    data: {
      operation: 'assignTenant',
      success: true,
      processed: validIds.length,
      succeeded: validIds,
      failed,
      message: `Successfully assigned tenant to ${validIds.length} user(s)`,
    } as BatchResponse,
  } satisfies ApiSuccess<BatchResponse>);
}

/**
 * Send email to multiple users
 */
async function handleSendEmail(
  userIds: string[],
  subject: string | undefined,
  body: string | undefined,
  adminId: string
): Promise<NextResponse> {
  if (!subject || !body) {
    return NextResponse.json(
      { error: 'emailSubject and emailBody are required for sendEmail operation', status: 400 } as ApiErrorResponse,
      { status: 400 }
    );
  }

  // Get users with emails
  const usersWithEmails = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(inArray(users.id, userIds));

  const succeeded: string[] = usersWithEmails.map(u => u.id);
  const failed: Array<{ id: string; error: string }> = [];

  // Find users that don't exist
  const existingIds = new Set(usersWithEmails.map(u => u.id));
  for (const id of userIds) {
    if (!existingIds.has(id)) {
      failed.push({ id, error: 'User not found' });
    }
  }

  // TODO: Implement actual email sending logic
  // This would integrate with your email service (Resend, SendGrid, etc.)
  // For now, we'll just log the intent

  logger.info('Batch send email', {
    count: succeeded.length,
    subject,
    adminId,
    recipients: usersWithEmails.map(u => u.email),
  });

  return NextResponse.json({
    data: {
      operation: 'sendEmail',
      success: true,
      processed: succeeded.length,
      succeeded,
      failed,
      message: `Email queued for ${succeeded.length} recipient(s)`,
      // Uncomment when email is implemented:
      // emailId: 'batch_' + Date.now(),
    } as BatchResponse,
  } satisfies ApiSuccess<BatchResponse>);
}

/**
 * Export users to CSV
 */
async function handleExport(params: BatchRequest['params'], adminId: string): Promise<NextResponse> {
  const { filters, exportFields } = params || {};

  // Default fields to export
  const defaultFields = [
    'id', 'name', 'email', 'type', 'role', 'schoolId', 'tenantId',
    'isActive', 'emailVerified', 'createdAt'
  ];

  const fields = exportFields || defaultFields;

  // Build query with filters
  const { and, or, like, inArray } = await import('drizzle-orm');

  type QueryCondition = ReturnType<typeof eq | typeof inArray>;
  const conditions: QueryCondition[] = [];

  if (filters?.role) {
    const roles = filters.role.split(',');
    conditions.push(inArray(users.type, roles));
  }

  if (filters?.schoolId) {
    // @ts-ignore
    conditions.push(eq(users.schoolId, filters.schoolId));
  }

  if (filters?.tenantId) {
    // @ts-ignore
    conditions.push(eq(users.tenantId, filters.tenantId));
  }

  if (filters?.status) {
    if (filters.status === 'active') {
      // @ts-ignore
      conditions.push(eq(users.isActive, true));
    } else if (filters.status === 'inactive') {
      // @ts-ignore
      conditions.push(eq(users.isActive, false));
    } else if (filters.status === 'pending') {
      // @ts-ignore
      conditions.push(eq(users.onboardingComplete, false));
    }
  }

  if (filters?.search) {
    conditions.push(
      or(
        like(users.name, `%${filters.search}%`),
        like(users.email, `%${filters.search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Fetch users
  const usersList = await db
    .select()
    .from(users)
    .where(whereClause)
    .limit(10000); // Limit export to 10k users

  // Generate CSV
  const headers = fields.join(',');
  const rows = usersList.map(user => {
    return fields.map(field => {
      const value = (user as Record<string, unknown>)[field];
      // Handle null/undefined, escape commas and quotes
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  const csv = [headers, ...rows].join('\n');

  logger.info('Users export', { count: usersList.length, adminId });

  // Return CSV as downloadable file
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="users-export-${Date.now()}.csv"`,
    },
  });
}
