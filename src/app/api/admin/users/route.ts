/**
 * USERS MANAGEMENT API (Platform Admin)
 *
 * GET /api/admin/users - List all users with pagination, filtering, sorting
 * POST /api/admin/users - Create new user
 *
 * MIGRATED: Now uses createApiRoute wrapper for cleaner code
 */

import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { createClerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, schools } from "@/lib/db/schema";
import { eq, desc, like, or, and, count, inArray } from "drizzle-orm";
import { invalidateUserRoleCache } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { logUserCreated } from "@/lib/audit-log";
import type { ApiSuccess, ApiErrorResponse, PaginatedResponse, Pagination } from "@/types";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { errorResponse, successResponse, createdResponse, badRequestResponse, conflictResponse, notFoundResponse } from "@/lib/api/response-helpers";
import type { SQL } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

type WhereCondition = SQL | undefined;

// ============================================================================
// TYPES
// ============================================================================

interface UserListQuery {
  page?: string;
  limit?: string;
  search?: string;
  role?: string;
  schoolId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UserWithDetails {
  id: string;
  clerkUserId: string;
  type: string;
  role: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  schoolId?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  onboardingComplete: boolean;
  onboardingStatus?: string | null;
  lastLogin?: string | null;
  createdAt: Date;
  updatedAt: Date;
  school?: {
    id: string;
    name: string;
    code: string;
  } | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
}

interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  type: 'student' | 'teacher' | 'parent' | 'school_admin' | 'admin' | 'counselor' | 'ministry';
  role: string;
  phone?: string;
  schoolId?: string;
  grade?: number;
  section?: string;
  employeeId?: string;
  subjects?: string[];
  department?: string;
  sendInvitation?: boolean;
}

// ============================================================================
// GET /api/admin/users - List all users
// ============================================================================

export const GET = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const query: UserListQuery = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || '',
      role: searchParams.get('role') || '',
      schoolId: searchParams.get('schoolId') || '',
      status: searchParams.get('status') || '',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    const page = Math.max(1, parseInt(query.page));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit)));
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: WhereCondition[] = [];

    if (query.search) {
      conditions.push(
        or(
          like(users.name, `%${query.search}%`),
          like(users.email, `%${query.search}%`),
          like(users.firstName, `%${query.search}%`),
          like(users.lastName, `%${query.search}%`)
        )
      );
    }

    if (query.role) {
      const roles = query.role.split(',');
      conditions.push(inArray(users.type, roles));
    }

    if (query.schoolId) {
      conditions.push(eq(users.schoolId, query.schoolId));
    }

    if (query.status) {
      if (query.status === 'active') {
        conditions.push(eq(users.isActive, true));
      } else if (query.status === 'inactive') {
        conditions.push(eq(users.isActive, false));
      } else if (query.status === 'pending') {
        conditions.push(eq(users.onboardingComplete, false));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(whereClause);

    // Build sorting
    const sortColumn = query.sortBy === 'name' ? users.name :
                       query.sortBy === 'email' ? users.email :
                       query.sortBy === 'type' ? users.type :
                       query.sortBy === 'createdAt' ? users.createdAt :
                       users.createdAt;

    const orderByClause = query.sortOrder === 'asc' ? sortColumn : desc(sortColumn);

    // Fetch users with joined data
    const usersList = await db
      .select({
        id: users.id,
        clerkUserId: users.clerkUserId,
        type: users.type,
        role: users.role,
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        schoolId: users.schoolId,
        tenantId: users.tenantId,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
        onboardingComplete: users.onboardingComplete,
        onboardingStatus: users.onboardingStatus,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        // School details
        schoolId2: schools.id,
        schoolName: schools.name,
        schoolCode: schools.code,
      })
      .from(users)
      .leftJoin(schools, eq(users.schoolId, schools.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Format response
    const formattedUsers: UserWithDetails[] = usersList.map((u) => ({
      id: u.id,
      clerkUserId: u.clerkUserId,
      type: u.type,
      role: u.role,
      name: u.name,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      schoolId: u.schoolId,
      tenantId: u.tenantId,
      isActive: u.isActive,
      emailVerified: u.emailVerified,
      onboardingComplete: u.onboardingComplete,
      onboardingStatus: u.onboardingStatus,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      school: u.schoolId2 ? {
        id: u.schoolId2,
        name: u.schoolName || '',
        code: u.schoolCode || '',
      } : null,
    }));

    const pagination: Pagination = {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    };

    logger.info("Users list fetched", { userId, page, limit, total });

    return successResponse({
      data: formattedUsers,
      pagination,
    } as PaginatedResponse<UserWithDetails>);
  },
  ['admin']
);

// ============================================================================
// POST /api/admin/users - Create new user
// ============================================================================

export const POST = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;

    const body: CreateUserRequest = await req.json();

    // Validate required fields
    const { email, firstName, lastName, type, role } = body;

    if (!email || !firstName || !lastName || !type || !role) {
      return badRequestResponse('Email, firstName, lastName, type, and role are required');
    }

    // Validate user type
    const validTypes = ['student', 'teacher', 'parent', 'school_admin', 'admin', 'counselor', 'ministry'];
    if (!validTypes.includes(type)) {
      return badRequestResponse(`Invalid user type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Check email uniqueness
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return conflictResponse('A user with this email already exists');
    }

    // Verify school exists if provided
    if (body.schoolId) {
      const school = await db
        .select()
        .from(schools)
        .where(eq(schools.id, body.schoolId))
        .limit(1);

      if (school.length === 0) {
        return notFoundResponse('Specified school');
      }
    }

    // Generate user ID
    const newUserId = `user_${nanoid()}`;

    // Create user in Clerk.com FIRST
    let clerkUser;
    try {
      const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        firstName,
        lastName,
        skipPasswordRequirement: true,
      });
      logger.info("[Admin] Created Clerk user", { userId: clerkUser.id, email });
    } catch (clerkError: unknown) {
      logger.error("[Admin] Failed to create Clerk user", clerkError);
      const errorMsg = clerkError instanceof Error ? clerkError.message : 'Unknown error';
      return badRequestResponse(`Failed to create user in Clerk: ${errorMsg}`);
    }

    // Prepare user data
    const newClerkUserId = clerkUser.id;
    const now = new Date();
    const userData = {
      id: newUserId,
      clerkUserId: newClerkUserId,
      type,
      role,
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      email,
      phone: body.phone || '',
      schoolId: (body.schoolId || null) as string | null,
      tenantId: null as string | null,
      profileImage: null as string | null,
      dateOfBirth: null as string | null,
      gender: null as string | null,
      grade: body.grade || 0,
      section: null as string | null,
      rollNumber: null as string | null,
      address: null as string | null,
      city: null as string | null,
      state: null as string | null,
      postalCode: null as string | null,
      country: 'Bhutan',
      parentContact: null as string | null,
      parentPhone: null as string | null,
      emergencyContact: null as string | null,
      bloodGroup: null as string | null,
      enrollmentDate: now.toISOString(),
      lastLogin: null as string | null,
      employeeId: body.employeeId || null,
      subjects: body.subjects ? JSON.stringify(body.subjects) : '',
      emailVerified: false,
      onboardingComplete: false,
      isActive: true,
      department: body.department || null,
      createdAt: now,
      updatedAt: now,
    };

    // Create user in database
    const result = await db
      .insert(users)
      .values(userData)
      .returning();

    const createdUser = Array.isArray(result) ? result[0] : result;

    logger.info('User created', { userId: createdUser.id, createdBy: userId, type });

    // Log audit event
    await logUserCreated(
      createdUser.id,
      {
        email: createdUser.email,
        type: createdUser.type,
        role: createdUser.role,
        name: createdUser.name,
        clerkUserId: createdUser.clerkUserId,
        schoolId: createdUser.schoolId,
      },
      userId,
      req
    );

    // Return created user without sensitive fields
    const { clerkUserId: _, ...safeUser } = createdUser;

    return createdResponse({
      ...safeUser,
      message: 'User created successfully',
    });
  },
  ['admin']
);
