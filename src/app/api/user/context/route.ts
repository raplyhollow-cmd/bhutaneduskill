import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, schools, userRoles, roles, rolePermissions, permissions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

interface UserContextUser {
  id: string;
  clerkUserId: string;
  type: string;
  role: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  schoolId?: string;
  tenantId?: string;
  onboardingComplete?: boolean;
  isActive?: boolean;
  lastLogin?: string | null;
}

interface UserContextSchool {
  id: string;
  name: string;
  code: string;
  type?: string;
  logo?: string;
  city?: string;
  state?: string;
}

interface UserContextData {
  user: UserContextUser;
  school?: UserContextSchool;
  permissions: string[];
}

interface UserContextSuccessResponse {
  success: true;
  data: UserContextData;
}

interface UserContextErrorResponse {
  success: false;
  error: string;
}

type UserContextResponse = UserContextSuccessResponse | UserContextErrorResponse;

// ============================================================================
// GET /api/user/context
// ============================================================================

/**
 * Get complete user context in a single API call
 * Returns user, school, and permissions data
 *
 * This eliminates the need for multiple API calls across the application
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth();

    if ("error" in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error } satisfies UserContextErrorResponse,
        { status: authResult.status }
      );
    }

    const { user } = authResult;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" } satisfies UserContextErrorResponse,
        { status: 401 }
      );
    }

    logger.debug("Fetching user context", { userId: user.id, userType: user.type });

    // Build minimal user object (only essential fields for context)
    const contextUser: UserContextUser = {
      id: user.id,
      clerkUserId: user.clerkUserId,
      type: user.type,
      role: user.type,
      name: user.name || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      profileImage: (user as { profileImage?: string }).profileImage ?? undefined,
      schoolId: user.schoolId ?? undefined,
      tenantId: (user as { tenantId?: string }).tenantId ?? undefined,
      onboardingComplete: (user as { onboardingComplete?: boolean }).onboardingComplete ?? undefined,
      isActive: (user as { isActive?: boolean }).isActive ?? undefined,
      lastLogin: (user as { lastLogin?: string | null }).lastLogin,
    };

    // Fetch school if user has one
    let contextSchool: UserContextSchool | undefined;
    if (user.schoolId) {
      try {
        const schoolDataResult = await db
          .select({
            id: schools.id,
            name: schools.name,
            code: schools.code,
            type: schools.type,
            logo: schools.logo,
            city: schools.city,
            state: schools.state,
          })
          .from(schools)
          .where(eq(schools.id, user.schoolId))
          .limit(1);

        const schoolData = schoolDataResult[0];

        if (schoolData) {
          contextSchool = {
            id: schoolData.id,
            name: schoolData.name,
            code: schoolData.code,
            type: schoolData.type ?? undefined,
            logo: schoolData.logo ?? undefined,
            city: schoolData.city ?? undefined,
            state: schoolData.state ?? undefined,
          };
        }
      } catch (schoolError) {
        // Don't fail entire request if school fetch fails
        logger.warn("Failed to fetch school for user context", {
          userId: user.id,
          schoolId: user.schoolId,
          error: schoolError instanceof Error ? schoolError.message : String(schoolError),
        });
      }
    }

    // Fetch permissions via RBAC (user_roles -> roles -> role_permissions -> permissions)
    let userPermissions: string[] = [];

    try {
      // Get user's roles from user_roles table (not users.type)
      const userRoleRecords = await db
        .select({
          roleId: userRoles.roleId,
        })
        .from(userRoles)
        .where(eq(userRoles.userId, user.id));

      if (userRoleRecords.length > 0) {
        const roleIds = userRoleRecords.map((r) => r.roleId);

        // Get permissions for all user's roles
        const permissionRecords = await db
          .select({
            permissionSlug: permissions.slug,
          })
          .from(rolePermissions)
          .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(sql`${rolePermissions.roleId} = ANY(${roleIds})`);

        userPermissions = [...new Set(permissionRecords.map((p) => p.permissionSlug))];
      }

      // If no RBAC permissions, add default role-based permissions
      if (userPermissions.length === 0) {
        userPermissions = getDefaultPermissionsForType(user.type);
      }
    } catch (permError) {
      // Don't fail entire request if permission fetch fails
      logger.warn("Failed to fetch RBAC permissions, using defaults", {
        userId: user.id,
        userType: user.type,
        error: permError instanceof Error ? permError.message : String(permError),
      });
      userPermissions = getDefaultPermissionsForType(user.type);
    }

    const responseData: UserContextData = {
      user: contextUser,
      school: contextSchool,
      permissions: userPermissions,
    };

    logger.info("User context fetched successfully", {
      userId: user.id,
      userType: user.type,
      hasSchool: !!contextSchool,
      permissionsCount: userPermissions.length,
    });

    return NextResponse.json({
      success: true,
      data: responseData,
    } satisfies UserContextSuccessResponse);
  } catch (error) {
    logger.error(error, { route: "/api/user/context", method: "GET" });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user context",
      } satisfies UserContextErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get default permissions based on user type
 * This is a fallback when RBAC is not configured
 */
function getDefaultPermissionsForType(userType: string): string[] {
  const permissionMap: Record<string, string[]> = {
    admin: [
      // Platform admin permissions
      "schools.view",
      "schools.create",
      "schools.update",
      "schools.delete",
      "users.view",
      "users.create",
      "users.update",
      "users.delete",
      "analytics.view",
      "billing.view",
      "notifications.manage",
      "settings.manage",
    ],
    "school-admin": [
      // School admin permissions
      "students.view",
      "students.create",
      "students.update",
      "teachers.view",
      "teachers.create",
      "teachers.update",
      "classes.view",
      "classes.manage",
      "attendance.view",
      "reports.view",
    ],
    teacher: [
      // Teacher permissions
      "students.view",
      "classes.view",
      "homework.create",
      "homework.view",
      "assessments.create",
      "assessments.view",
      "attendance.manage",
    ],
    student: [
      // Student permissions
      "profile.view",
      "profile.update",
      "assessments.view",
      "homework.view",
      "classes.view",
      "progress.view",
    ],
    parent: [
      // Parent permissions
      "children.view",
      "children.progress",
      "fees.view",
      "attendance.view",
    ],
    counselor: [
      // Counselor permissions
      "students.view",
      "interventions.create",
      "interventions.view",
      "sessions.create",
      "sessions.view",
      "notes.create",
    ],
    ministry: [
      // Ministry permissions
      "schools.view",
      "schools.create",
      "analytics.view",
      "policies.manage",
      "notifications.manage",
      "billing.view",
    ],
  };

  return permissionMap[userType] || [];
}
