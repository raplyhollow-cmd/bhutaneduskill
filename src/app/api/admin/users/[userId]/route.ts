/**
 * SINGLE USER MANAGEMENT API (Platform Admin)
 *
 * GET /api/admin/users/[userId] - Get user details
 * PATCH /api/admin/users/[userId] - Update user
 * DELETE /api/admin/users/[userId] - Delete user
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, schools, tenants } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import { invalidateUserRoleCache } from "@/lib/auth-utils";
import { logUserUpdated, logUserDeleted } from "@/lib/audit-log";
import { createApiRoute } from "@/lib/api/route-handler";
import type { ApiSuccess } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface UserDetails {
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
  employeeId?: string | null;
  department?: string | null;
  subjects?: string | null;
  grade?: number | null;
  section?: string | null;
  profileImage?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  parentContact?: string | null;
  parentPhone?: string | null;
  emergencyContact?: string | null;
  bloodGroup?: string | null;
  enrollmentDate?: string | null;
  settings?: Record<string, any> | null;
  interests?: string[] | null;
  goals?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  school?: {
    id: string;
    name: string;
    code: string;
    city: string;
    state: string;
  } | null;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  type?: string;
  role?: string;
  schoolId?: string | null;
  tenantId?: string | null;
  isActive?: boolean;
  onboardingComplete?: boolean;
  employeeId?: string | null;
  department?: string | null;
  subjects?: string[] | null;
  grade?: number | null;
  section?: string | null;
  profileImage?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  parentContact?: string | null;
  parentPhone?: string | null;
  emergencyContact?: string | null;
  bloodGroup?: string | null;
  settings?: Record<string, any> | null;
  interests?: string[] | null;
  goals?: string | null;
}

type UserParams = { userId: string };

// ============================================================================
// GET /api/admin/users/[userId] - Get user details
// ============================================================================

export const GET = createApiRoute<never, UserDetails, UserParams>(
  async (_request, { userId: adminId }, context) => {
    const { userId } = await context!.params!;

    const userResult = await db
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
        employeeId: users.employeeId,
        department: users.department,
        subjects: users.subjects,
        grade: users.grade,
        section: users.section,
        profileImage: users.profileImage,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        address: users.address,
        city: users.city,
        state: users.state,
        postalCode: users.postalCode,
        country: users.country,
        parentContact: users.parentContact,
        parentPhone: users.parentPhone,
        emergencyContact: users.emergencyContact,
        bloodGroup: users.bloodGroup,
        enrollmentDate: users.enrollmentDate,
        settings: users.settings,
        interests: users.interests,
        goals: users.goals,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        // School details
        schoolId2: schools.id,
        schoolName: schools.name,
        schoolCode: schools.code,
        schoolCity: schools.city,
        schoolState: schools.state,
        // Tenant details
        tenantId2: tenants.id,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
      })
      .from(users)
      .leftJoin(schools, eq(users.schoolId, schools.id))
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found', status: 404 },
        { status: 404 }
      );
    }

    const u = userResult[0];

    const userDetails: UserDetails = {
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
      employeeId: u.employeeId,
      department: u.department,
      subjects: u.subjects,
      grade: u.grade,
      section: u.section,
      profileImage: u.profileImage,
      dateOfBirth: u.dateOfBirth,
      gender: u.gender,
      address: u.address,
      city: u.city,
      state: u.state,
      postalCode: u.postalCode,
      country: u.country,
      parentContact: u.parentContact,
      parentPhone: u.parentPhone,
      emergencyContact: u.emergencyContact,
      bloodGroup: u.bloodGroup,
      enrollmentDate: u.enrollmentDate,
      settings: u.settings,
      interests: u.interests,
      goals: u.goals,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      school: u.schoolId2 ? {
        id: u.schoolId2,
        name: u.schoolName || '',
        code: u.schoolCode || '',
        city: u.schoolCity || '',
        state: u.schoolState || '',
      } : null,
      tenant: u.tenantId2 ? {
        id: u.tenantId2,
        name: u.tenantName || '',
        slug: u.tenantSlug || '',
      } : null,
    };

    return NextResponse.json({
      data: userDetails,
    } satisfies ApiSuccess<UserDetails>);
  },
  ['admin']
);

// ============================================================================
// PATCH /api/admin/users/[userId] - Update user
// ============================================================================

export const PATCH = createApiRoute<UpdateUserRequest, any, UserParams>(
  async (request, { userId: adminId }, context) => {
    const { userId } = await context!.params!;
    const body: UpdateUserRequest = await req.json();

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', status: 404 },
        { status: 404 }
      );
    }

    const user = existingUser[0];

    // If email is being changed, verify uniqueness
    if (body.email && body.email !== user.email) {
      const allWithEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(2);

      const otherUserWithEmail = allWithEmail.find(u => u.id !== userId);
      if (otherUserWithEmail) {
        return NextResponse.json(
          { error: 'Email already in use by another user', status: 409 },
          { status: 409 }
        );
      }
    }

    // Validate type if being changed
    if (body.type) {
      const validTypes = ['student', 'teacher', 'parent', 'school_admin', 'admin', 'counselor'];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { error: `Invalid user type. Must be one of: ${validTypes.join(', ')}`, status: 400 },
          { status: 400 }
        );
      }
    }

    // Verify school exists if being changed
    if (body.schoolId !== undefined && body.schoolId !== null) {
      const school = await db
        .select()
        .from(schools)
        .where(eq(schools.id, body.schoolId))
        .limit(1);

      if (school.length === 0) {
        return NextResponse.json(
          { error: 'Specified school not found', status: 404 },
          { status: 404 }
        );
      }
    }

    // Verify tenant exists if being changed
    if (body.tenantId !== undefined && body.tenantId !== null) {
      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, body.tenantId))
        .limit(1);

      if (tenant.length === 0) {
        return NextResponse.json(
          { error: 'Specified tenant not found', status: 404 },
          { status: 404 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    // Update name if firstName or lastName changed
    if (body.firstName !== undefined || body.lastName !== undefined) {
      const firstName = body.firstName ?? user.firstName;
      const lastName = body.lastName ?? user.lastName;
      updateData.name = `${firstName} ${lastName}`.trim();
    }

    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.schoolId !== undefined) updateData.schoolId = body.schoolId;
    if (body.tenantId !== undefined) updateData.tenantId = body.tenantId;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.onboardingComplete !== undefined) updateData.onboardingComplete = body.onboardingComplete;
    if (body.employeeId !== undefined) updateData.employeeId = body.employeeId;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.grade !== undefined) updateData.grade = body.grade;
    if (body.section !== undefined) updateData.section = body.section;
    if (body.profileImage !== undefined) updateData.profileImage = body.profileImage;
    if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.postalCode !== undefined) updateData.postalCode = body.postalCode;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.parentContact !== undefined) updateData.parentContact = body.parentContact;
    if (body.parentPhone !== undefined) updateData.parentPhone = body.parentPhone;
    if (body.emergencyContact !== undefined) updateData.emergencyContact = body.emergencyContact;
    if (body.bloodGroup !== undefined) updateData.bloodGroup = body.bloodGroup;
    if (body.settings !== undefined) updateData.settings = body.settings;
    if (body.interests !== undefined) updateData.interests = body.interests;
    if (body.goals !== undefined) updateData.goals = body.goals;

    // Handle subjects array to string conversion
    if (body.subjects !== undefined) {
      updateData.subjects = Array.isArray(body.subjects) ? JSON.stringify(body.subjects) : body.subjects;
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    // Invalidate role cache if type changed
    if (body.type !== undefined || body.isActive !== undefined) {
      invalidateUserRoleCache(updatedUser.clerkUserId);
    }

    // Log audit event for user update
    await logUserUpdated(
      userId,
      { email: user.email, type: user.type, role: user.role, name: user.name },
      { email: updatedUser.email, type: updatedUser.type, role: updatedUser.role, name: updatedUser.name },
      adminId,
      request
    );

    // Return updated user without sensitive fields
    const { clerkUserId: _, ...safeUser } = updatedUser;

    return NextResponse.json({
      data: safeUser,
      message: 'User updated successfully',
    } satisfies ApiSuccess<typeof safeUser>);

  },
  ['admin']
);

// ============================================================================
// DELETE /api/admin/users/[userId] - Delete user
// ============================================================================

export const DELETE = createApiRoute<never, null | { success: boolean; message: string }, UserParams>(
  async (request, { userId: adminId }, context) => {
    const { userId } = await context!.params!;
    const { searchParams } = new URL(req.url);
    const hardDelete = searchParams.get('hard') !== 'false'; // Default to hard delete unless explicitly false

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', status: 404 },
        { status: 404 }
      );
    }

    const user = existingUser[0];

    // Prevent self-deletion
    if (user.id === adminId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account', status: 400 },
        { status: 400 }
      );
    }

    if (hardDelete) {
      // Hard delete - permanently remove user from database
      await db.delete(users).where(eq(users.id, userId));

      // Invalidate role cache
      invalidateUserRoleCache(user.clerkUserId);

      // Log audit event for hard delete
      await logUserDeleted(
        userId,
        { email: user.email, type: user.type, role: user.role, name: user.name },
        adminId,
        true,
        request
      );

      return NextResponse.json({
        data: null,
        message: 'User permanently deleted',
      } satisfies ApiSuccess<null>);
    } else {
      // Soft delete - set isActive = false
      await db
        .update(users)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Invalidate role cache
      invalidateUserRoleCache(user.clerkUserId);

      // Log audit event for soft delete (deactivation)
      await logUserDeleted(
        userId,
        { email: user.email, type: user.type, role: user.role, name: user.name },
        adminId,
        false,
        request
      );

      return NextResponse.json({
        data: null,
        message: 'User deactivated successfully',
      } satisfies ApiSuccess<null>);
    }

  },
  ['admin']
);
