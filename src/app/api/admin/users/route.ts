/**
 * USERS MANAGEMENT API (Platform Admin)
 *
 * GET /api/admin/users - List all users with pagination, filtering, sorting
 * POST /api/admin/users - Create new user
 */

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { users, schools, tenants } from "@/lib/db/schema";
import { eq, desc, like, or, and, count, sql, inArray } from "drizzle-orm";
import { requireAuth, invalidateUserRoleCache } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse, PaginatedResponse, Pagination } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface UserListQuery {
  page?: string;
  limit?: string;
  search?: string;
  role?: string;
  schoolId?: string;
  tenantId?: string;
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
  tenantId?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  onboardingComplete: boolean;
  lastLogin?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  school?: {
    id: string;
    name: string;
    code: string;
  } | null;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  type: 'student' | 'teacher' | 'parent' | 'school_admin' | 'admin' | 'counselor';
  role: string;
  phone?: string;
  schoolId?: string;
  tenantId?: string;
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

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } as ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const query: UserListQuery = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || '',
      role: searchParams.get('role') || '',
      schoolId: searchParams.get('schoolId') || '',
      tenantId: searchParams.get('tenantId') || '',
      status: searchParams.get('status') || '',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    const page = Math.max(1, parseInt(query.page));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit)));
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: any[] = [];

    // Search filter (name, email)
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

    // Role filter
    if (query.role) {
      const roles = query.role.split(',');
      conditions.push(inArray(users.type, roles));
    }

    // School filter
    if (query.schoolId) {
      conditions.push(eq(users.schoolId, query.schoolId));
    }

    // Tenant filter
    if (query.tenantId) {
      conditions.push(eq(users.tenantId, query.tenantId));
    }

    // Status filter
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
    let orderByClause;
    const sortColumn = query.sortBy === 'name' ? users.name :
                       query.sortBy === 'email' ? users.email :
                       query.sortBy === 'type' ? users.type :
                       query.sortBy === 'createdAt' ? users.createdAt :
                       users.createdAt;

    orderByClause = query.sortOrder === 'asc' ? sortColumn : desc(sortColumn);

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
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        // School details
        schoolId2: schools.id,
        schoolName: schools.name,
        schoolCode: schools.code,
        // Tenant details
        tenantId2: tenants.id,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
      })
      .from(users)
      .leftJoin(schools, eq(users.schoolId, schools.id))
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
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
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      school: u.schoolId2 ? {
        id: u.schoolId2,
        name: u.schoolName || '',
        code: u.schoolCode || '',
      } : null,
      tenant: u.tenantId2 ? {
        id: u.tenantId2,
        name: u.tenantName || '',
        slug: u.tenantSlug || '',
      } : null,
    }));

    // Pagination metadata
    const pagination: Pagination = {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    };

    logger.info("Users list fetched", { userId, page, limit, total });

    return NextResponse.json({
      data: formattedUsers,
      pagination,
    } satisfies PaginatedResponse<UserWithDetails>);

  } catch (error) {
    logger.apiError(error, { route: '/api/admin/users', method: 'GET', userId });
    return NextResponse.json(
      { error: 'Failed to fetch users', status: 500, details: error instanceof Error ? error.message : undefined } as ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/admin/users - Create new user
// ============================================================================

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } as ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;

  try {
    const body: CreateUserRequest = await request.json();

    // Validate required fields
    const { email, firstName, lastName, type, role } = body;

    if (!email || !firstName || !lastName || !type || !role) {
      return NextResponse.json(
        { error: 'Email, firstName, lastName, type, and role are required', status: 400 } as ApiErrorResponse,
        { status: 400 }
      );
    }

    // Validate user type
    const validTypes = ['student', 'teacher', 'parent', 'school_admin', 'admin', 'counselor'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid user type. Must be one of: ${validTypes.join(', ')}`, status: 400 } as ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check email uniqueness
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'A user with this email already exists', status: 409 } as ApiErrorResponse,
        { status: 409 }
      );
    }

    // Verify school exists if provided
    if (body.schoolId) {
      const school = await db
        .select()
        .from(schools)
        .where(eq(schools.id, body.schoolId))
        .limit(1);

      if (school.length === 0) {
        return NextResponse.json(
          { error: 'Specified school not found', status: 404 } as ApiErrorResponse,
          { status: 404 }
        );
      }
    }

    // Verify tenant exists if provided
    if (body.tenantId) {
      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, body.tenantId))
        .limit(1);

      if (tenant.length === 0) {
        return NextResponse.json(
          { error: 'Specified tenant not found', status: 404 } as ApiErrorResponse,
          { status: 404 }
        );
      }
    }

    // Generate user ID and clerk user ID placeholder
    const newUserId = `user_${nanoid()}`;
    const newClerkUserId = `clerk_${nanoid()}`;

    // Prepare user data with defaults
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
      schoolId: body.schoolId || null,
      tenantId: body.tenantId || null,
      profileImage: '',
      dateOfBirth: '',
      gender: '',
      grade: body.grade || 0,
      section: body.section || '',
      rollNumber: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Bhutan',
      parentContact: '',
      parentPhone: '',
      emergencyContact: '',
      bloodGroup: '',
      enrollmentDate: now.toISOString(),
      lastLogin: null,
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

    // TODO: Create Clerk user via Clerk API if sendInvitation is true
    // TODO: Send welcome email

    // Return created user without sensitive fields
    const { clerkUserId: _, ...safeUser } = createdUser;

    return NextResponse.json({
      data: safeUser,
      message: 'User created successfully',
    } satisfies ApiSuccess<typeof safeUser>, { status: 201 });

  } catch (error) {
    logger.apiError(error, { route: '/api/admin/users', method: 'POST', userId });
    return NextResponse.json(
      { error: 'Failed to create user', status: 500, details: error instanceof Error ? error.message : undefined } as ApiErrorResponse,
      { status: 500 }
    );
  }
}
