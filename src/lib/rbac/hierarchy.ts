/**
 * Role Hierarchy for Hierarchical Ecosystem
 *
 * Defines the hierarchical relationships between user types.
 * Higher roles can perform actions on lower roles' data.
 *
 * Hierarchy:
 * - Platform Admin (admin) > School Admin (school-admin)
 * - School Admin (school-admin) > Teachers, Counselors, Parents
 * - Teachers, Counselors > Students (their assigned students)
 * - Parents > Their own children
 */

/**
 * Role hierarchy - each role can manage the roles listed in their array
 */
export const ROLE_HIERARCHY: Record<string, string[]> = {
  // Platform admin can manage all roles
  "admin": ["school-admin", "ministry", "teacher", "counselor", "parent", "student"],

  // Ministry can view all schools but not manage them
  "ministry": [],

  // School admin can manage staff and students in their school
  "school-admin": ["teacher", "counselor", "parent", "student"],

  // Counselors can view and manage their assigned students
  "counselor": ["student"],

  // Teachers can view and manage their assigned students
  "teacher": ["student"],

  // Parents can view their own children's data
  "parent": [],

  // Students have no authority over others
  "student": [],
};

/**
 * Role level - higher number = higher authority
 */
export const ROLE_LEVEL: Record<string, number> = {
  "admin": 100,
  "ministry": 90,
  "school-admin": 80,
  "teacher": 60,
  "counselor": 60,
  "parent": 50,
  "student": 40,
};

/**
 * Check if role1 has authority over role2
 */
export function hasAuthorityOver(role1: string, role2: string): boolean {
  // Same role can have authority if they're higher level
  if (role1 === role2) {
    return ROLE_LEVEL[role1] > 50;
  }

  // Check if role2 is in role1's hierarchy
  return ROLE_HIERARCHY[role1]?.includes(role2) ?? false;
}

/**
 * Get the minimum authority level required for a role
 */
export function getRoleLevel(role: string): number {
  return ROLE_LEVEL[role] ?? 0;
}

/**
 * Check if a user's role is at least the required level
 */
export function hasMinimumRole(userRole: string, requiredRole: string): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

/**
 * Portal to role mapping
 */
export const PORTAL_TO_ROLE: Record<string, string> = {
  "admin": "admin",
  "school-admin": "school-admin",
  "teacher": "teacher",
  "student": "student",
  "parent": "parent",
  "counselor": "counselor",
  "ministry": "ministry",
};

/**
 * Role to portal mapping (reverse of above)
 */
export const ROLE_TO_PORTAL: Record<string, string> = {
  "admin": "admin",
  "school-admin": "school-admin",
  "teacher": "teacher",
  "student": "student",
  "parent": "parent",
  "counselor": "counselor",
  "ministry": "ministry",
};

/**
 * Check if a user type is considered staff (can approve applications)
 */
export function isStaffRole(role: string): boolean {
  return ["admin", "school-admin", "teacher", "counselor"].includes(role);
}

/**
 * Check if a user type is considered admin (can manage school)
 */
export function isAdminRole(role: string): boolean {
  return ["admin", "school-admin"].includes(role);
}

/**
 * Check if a user type is platform-level (not school-specific)
 */
export function isPlatformRole(role: string): boolean {
  return ["admin", "ministry"].includes(role);
}

/**
 * Check if a user type is school-level (belongs to a specific school)
 */
export function isSchoolRole(role: string): boolean {
  return ["school-admin", "teacher", "counselor", "student", "parent"].includes(role);
}
