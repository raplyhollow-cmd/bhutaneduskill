/**
 * RBAC Seed Script
 *
 * Creates default roles and permissions for the SaaS platform
 *
 * Run: npx tsx scripts/seed-rbac.ts
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import * as schema from "../src/lib/db/schema";
import { nanoid } from "nanoid";

const sql = neon(process.env.DATABASE_URL!);

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title: string) {
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60));
}

async function seedRoles() {
  section("SEEDING ROLES");

  const roles = [
    {
      id: "role_platform_admin",
      name: "Platform Admin",
      slug: "platform-admin",
      description: "Full access to manage the entire platform",
      is_system_role: true,
    },
    {
      id: "role_school_admin",
      name: "School Admin",
      slug: "school-admin",
      description: "Manage a single school's data and users",
      is_system_role: true,
    },
    {
      id: "role_ministry",
      name: "Ministry",
      slug: "ministry",
      description: "Ministry of Education - view analytics and reports",
      is_system_role: true,
    },
    {
      id: "role_teacher",
      name: "Teacher",
      slug: "teacher",
      description: "Teaching staff with classroom responsibilities",
      is_system_role: true,
    },
    {
      id: "role_student",
      name: "Student",
      slug: "student",
      description: "Students attending classes",
      is_system_role: true,
    },
    {
      id: "role_parent",
      name: "Parent",
      slug: "parent",
      description: "Parents/guardians of students",
      is_system_role: true,
    },
    {
      id: "role_counselor",
      name: "Counselor",
      slug: "counselor",
      description: "Career and guidance counselors",
      is_system_role: true,
    },
    {
      id: "role_content_manager",
      name: "Content Manager",
      slug: "content-manager",
      description: "Manage careers, assessments, and content",
      is_system_role: false,
    },
    {
      id: "role_billing_manager",
      name: "Billing Manager",
      slug: "billing-manager",
      description: "Manage billing and payments (read-only)",
      is_system_role: false,
    },
  ];

  for (const role of roles) {
    await sql`
      INSERT INTO roles (id, name, slug, description, is_system_role, created_at, updated_at)
      VALUES (
        ${role.id},
        ${role.name},
        ${role.slug},
        ${role.description},
        ${role.is_system_role},
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO NOTHING
    `;
    log(`  ✓ ${role.name}`, "green");
  }

  log(`\n✓ Created ${roles.length} roles`, "green");
}

async function seedPermissions() {
  section("SEEDING PERMISSIONS");

  const permissions = [
    // Schools
    { id: "perm_school_create", name: "Create Schools", slug: "schools.create", resource: "schools", action: "create", module: "schools" },
    { id: "perm_school_read", name: "View Schools", slug: "schools.read", resource: "schools", action: "read", module: "schools" },
    { id: "perm_school_update", name: "Update Schools", slug: "schools.update", resource: "schools", action: "update", module: "schools" },
    { id: "perm_school_delete", name: "Delete Schools", slug: "schools.delete", resource: "schools", action: "delete", module: "schools" },

    // Users
    { id: "perm_user_create", name: "Create Users", slug: "users.create", resource: "users", action: "create", module: "users" },
    { id: "perm_user_read", name: "View Users", slug: "users.read", resource: "users", action: "read", module: "users" },
    { id: "perm_user_update", name: "Update Users", slug: "users.update", resource: "users", action: "update", module: "users" },
    { id: "perm_user_delete", name: "Delete Users", slug: "users.delete", resource: "users", action: "delete", module: "users" },
    { id: "perm_user_assign_roles", name: "Assign Roles", slug: "users.assign-roles", resource: "users", action: "update", module: "users" },

    // Roles & Permissions
    { id: "perm_role_create", name: "Create Roles", slug: "roles.create", resource: "roles", action: "create", module: "rbac" },
    { id: "perm_role_read", name: "View Roles", slug: "roles.read", resource: "roles", action: "read", module: "rbac" },
    { id: "perm_role_update", name: "Update Roles", slug: "roles.update", resource: "roles", action: "update", module: "rbac" },
    { id: "perm_role_delete", name: "Delete Roles", slug: "roles.delete", resource: "roles", action: "delete", module: "rbac" },
    { id: "perm_role_assign_permissions", name: "Assign Permissions", slug: "roles.assign-permissions", resource: "roles", action: "update", module: "rbac" },

    // Analytics
    { id: "perm_analytics_view", name: "View Analytics", slug: "analytics.view", resource: "analytics", action: "read", module: "analytics" },
    { id: "perm_analytics_export", name: "Export Data", slug: "analytics.export", resource: "analytics", action: "read", module: "analytics" },

    // Billing
    { id: "perm_billing_view", name: "View Billing", slug: "billing.view", resource: "billing", action: "read", module: "billing" },
    { id: "perm_billing_manage", name: "Manage Billing", slug: "billing.manage", resource: "billing", action: "update", module: "billing" },

    // Classes
    { id: "perm_class_create", name: "Create Classes", slug: "classes.create", resource: "classes", action: "create", module: "classes" },
    { id: "perm_class_read", name: "View Classes", slug: "classes.read", resource: "classes", action: "read", module: "classes" },
    { id: "perm_class_update", name: "Update Classes", slug: "classes.update", resource: "classes", action: "update", module: "classes" },
    { id: "perm_class_delete", name: "Delete Classes", slug: "classes.delete", resource: "classes", action: "delete", module: "classes" },

    // Homework
    { id: "perm_homework_create", name: "Create Homework", slug: "homework.create", resource: "homework", action: "create", module: "homework" },
    { id: "perm_homework_read", name: "View Homework", slug: "homework.read", resource: "homework", action: "read", module: "homework" },
    { id: "perm_homework_update", name: "Update Homework", slug: "homework.update", resource: "homework", action: "update", module: "homework" },
    { id: "perm_homework_delete", name: "Delete Homework", slug: "homework.delete", resource: "homework", action: "delete", module: "homework" },

    // Assessments
    { id: "perm_assessment_create", name: "Create Assessments", slug: "assessments.create", resource: "assessments", action: "create", module: "assessments" },
    { id: "perm_assessment_read", name: "View Assessments", slug: "assessments.read", resource: "assessments", action: "read", module: "assessments" },
    { id: "perm_assessment_update", name: "Update Assessments", slug: "assessments.update", resource: "assessments", action: "update", module: "assessments" },
    { id: "perm_assessment_delete", name: "Delete Assessments", slug: "assessments.delete", resource: "assessments", action: "delete", module: "assessments" },

    // Content (Careers, Resources)
    { id: "perm_content_manage", name: "Manage Content", slug: "content.manage", resource: "content", action: "update", module: "content" },
    { id: "perm_content_publish", name: "Publish Content", slug: "content.publish", resource: "content", action: "update", module: "content" },

    // Notifications
    { id: "perm_notification_create", name: "Send Notifications", slug: "notifications.create", resource: "notifications", action: "create", module: "notifications" },
    { id: "perm_notification_read", name: "View Notifications", slug: "notifications.read", resource: "notifications", action: "read", module: "notifications" },

    // Reports
    { id: "perm_reports_view", name: "View Reports", slug: "reports.view", resource: "reports", action: "read", module: "reports" },
    { id: "perm_reports_generate", name: "Generate Reports", slug: "reports.generate", resource: "reports", action: "create", module: "reports" },
  ];

  for (const perm of permissions) {
    await sql`
      INSERT INTO permissions (id, name, slug, resource, action, description, module, created_at)
      VALUES (
        ${perm.id},
        ${perm.name},
        ${perm.slug},
        ${perm.resource},
        ${perm.action},
        ${perm.name},
        ${perm.module},
        NOW()
      )
      ON CONFLICT (slug) DO NOTHING
    `;
  }

  log(`✓ Created ${permissions.length} permissions`, "green");
}

async function seedRolePermissions() {
  section("CHECKING EXISTING ROLE PERMISSIONS");

  // Check if permissions are already assigned
  const existingCount = await sql`SELECT COUNT(*) as count FROM role_permissions`;
  log(`  Found ${existingCount[0].count} existing role permissions`, "blue");

  if (existingCount[0].count > 0) {
    log(`  ✓ Role permissions already assigned, skipping seeding`, "green");
    return;
  }

  section("ASSIGNING PERMISSIONS TO ROLES");

  // Platform Admin - ALL permissions
  const platformAdminPerms = await sql`SELECT id FROM permissions`;
  for (const perm of platformAdminPerms) {
    const existing = await sql`SELECT id FROM role_permissions WHERE role_id = 'role_platform_admin' AND permission_id = ${perm.id}`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO role_permissions (id, role_id, permission_id, created_at)
        VALUES (${nanoid()}, 'role_platform_admin', ${perm.id}, NOW())
      `;
    }
  }
  log(`  ✓ Platform Admin: ALL permissions (${platformAdminPerms.length})`, "green");

  // School Admin - Limited permissions
  const schoolAdminPerms = [
    "perm_school_read",
    "perm_school_update",
    "perm_user_create",
    "perm_user_read",
    "perm_user_update",
    "perm_class_create",
    "perm_class_read",
    "perm_class_update",
    "perm_homework_create",
    "perm_homework_read",
    "perm_homework_update",
    "perm_homework_delete",
    "perm_assessment_create",
    "perm_assessment_read",
    "perm_assessment_update",
    "perm_analytics_view",
    "perm_reports_view",
    "perm_reports_generate",
  ];

  for (const permSlug of schoolAdminPerms) {
    const perm = await sql`SELECT id FROM permissions WHERE slug = ${permSlug}`;
    if (perm.length > 0) {
      const existing = await sql`SELECT id FROM role_permissions WHERE role_id = 'role_school_admin' AND permission_id = ${perm[0].id}`;
      if (existing.length === 0) {
        await sql`
          INSERT INTO role_permissions (id, role_id, permission_id, created_at)
          VALUES (${nanoid()}, 'role_school_admin', ${perm[0].id}, NOW())
        `;
      }
    }
  }
  log(`  ✓ School Admin: ${schoolAdminPerms.length} permissions`, "green");

  // Ministry - Read-only permissions
  const ministryPerms = [
    "perm_school_read",
    "perm_user_read",
    "perm_analytics_view",
    "perm_analytics_export",
    "perm_billing_view",
    "perm_reports_view",
    "perm_notification_read",
  ];

  for (const permSlug of ministryPerms) {
    const perm = await sql`SELECT id FROM permissions WHERE slug = ${permSlug}`;
    if (perm.length > 0) {
      const existing = await sql`SELECT id FROM role_permissions WHERE role_id = 'role_ministry' AND permission_id = ${perm[0].id}`;
      if (existing.length === 0) {
        await sql`
          INSERT INTO role_permissions (id, role_id, permission_id, created_at)
          VALUES (${nanoid()}, 'role_ministry', ${perm[0].id}, NOW())
        `;
      }
    }
  }
  log(`  ✓ Ministry: ${ministryPerms.length} permissions`, "green");

  // Teacher - Limited permissions
  const teacherPerms = [
    "perm_class_read",
    "perm_homework_create",
    "perm_homework_read",
    "perm_homework_update",
    "perm_assessment_create",
    "perm_assessment_read",
    "perm_assessment_update",
    "perm_analytics_view",
  ];

  for (const permSlug of teacherPerms) {
    const perm = await sql`SELECT id FROM permissions WHERE slug = ${permSlug}`;
    if (perm.length > 0) {
      const existing = await sql`SELECT id FROM role_permissions WHERE role_id = 'role_teacher' AND permission_id = ${perm[0].id}`;
      if (existing.length === 0) {
        await sql`
          INSERT INTO role_permissions (id, role_id, permission_id, created_at)
          VALUES (${nanoid()}, 'role_teacher', ${perm[0].id}, NOW())
        `;
      }
    }
  }
  log(`  ✓ Teacher: ${teacherPerms.length} permissions`, "green");

  log(`\n✓ Role permissions assigned`, "green");
}

async function seedComponentAccess() {
  section("SEEDING COMPONENT ACCESS");

  const components = [
    // Platform Admin - All access
    { roleId: "role_platform_admin", componentPath: "/admin/*", componentName: "All Admin", canView: true, canCreate: true, canUpdate: true, canDelete: true },

    // School Admin - Limited to their school
    { roleId: "role_school_admin", componentPath: "/school-admin/*", componentName: "School Admin", canView: true, canCreate: true, canUpdate: true, canDelete: false },
    { roleId: "role_school_admin", componentPath: "/school-admin/dashboard", componentName: "Dashboard", canView: true, canCreate: false, canUpdate: false, canDelete: false },
    { roleId: "role_school_admin", componentPath: "/school-admin/students", componentName: "Students", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    { roleId: "role_school_admin", componentPath: "/school-admin/teachers", componentName: "Teachers", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    { roleId: "role_school_admin", componentPath: "/school-admin/classes", componentName: "Classes", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    { roleId: "role_school_admin", componentPath: "/school-admin/homework", componentName: "Homework", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    { roleId: "role_school_admin", componentPath: "/school-admin/reports", componentName: "Reports", canView: true, canCreate: true, canUpdate: false, canDelete: false },

    // Teacher - Portal access
    { roleId: "role_teacher", componentPath: "/teacher/*", componentName: "Teacher Portal", canView: true, canCreate: false, canUpdate: false, canDelete: false },
    { roleId: "role_teacher", componentPath: "/teacher/dashboard", componentName: "Dashboard", canView: true, canCreate: false, canUpdate: false, canDelete: false },
    { roleId: "role_teacher", componentPath: "/teacher/classes", componentName: "Classes", canView: true, canCreate: false, canUpdate: false, canDelete: false },
    { roleId: "role_teacher", componentPath: "/teacher/homework", componentName: "Homework", canView: true, canCreate: true, canUpdate: true, canDelete: false },
    { roleId: "role_teacher", componentPath: "/teacher/assessments", componentName: "Assessments", canView: true, canCreate: true, canUpdate: true, canDelete: false },

    // Student - Portal access
    { roleId: "role_student", componentPath: "/student/*", componentName: "Student Portal", canView: true, canCreate: false, canUpdate: false, canDelete: false },
    { roleId: "role_student", componentPath: "/student/dashboard", componentName: "Dashboard", canView: true, canCreate: false, canUpdate: false, canDelete: false },
    { roleId: "role_student", componentPath: "/student/classes", componentName: "Classes", canView: true, canCreate: false, canUpdate: false, canDelete: false },
    { roleId: "role_student", componentPath: "/student/homework", componentName: "Homework", canView: true, canCreate: false, canUpdate: false, canDelete: false },
    { roleId: "role_student", componentPath: "/student/progress", componentName: "Progress", canView: true, canCreate: false, canUpdate: false, canDelete: false },

    // Parent - Portal access
    { roleId: "role_parent", componentPath: "/parent/*", componentName: "Parent Portal", canView: true, canCreate: false, canUpdate: false, canDelete: false },
    { roleId: "role_parent", componentPath: "/parent/dashboard", componentName: "Dashboard", canView: true, canCreate: false, canUpdate: false, canDelete: false },
    { roleId: "role_parent", componentPath: "/parent/children", componentName: "Children", canView: true, canCreate: false, canUpdate: false, canDelete: false },

    // Content Manager
    { roleId: "role_content_manager", componentPath: "/admin/content", componentName: "Content Management", canView: true, canCreate: true, canUpdate: true, canDelete: true },
  ];

  for (const comp of components) {
    const existing = await sql`SELECT id FROM component_access WHERE role_id = ${comp.roleId} AND component_path = ${comp.componentPath}`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO component_access (
          id, role_id, component_path, component_name,
          can_view, can_create, can_update, can_delete,
          created_at, updated_at
        )
        VALUES (
          ${nanoid()},
          ${comp.roleId},
          ${comp.componentPath},
          ${comp.componentName},
          ${comp.canView},
          ${comp.canCreate},
          ${comp.canUpdate},
          ${comp.canDelete},
          NOW(),
          NOW()
        )
      `;
    }
  }

  log(`✓ Created ${components.length} component access rules`, "green");
}

async function main() {
  console.log("\n");
  log("╔════════════════════════════════════════════════════════════╗", "cyan");
  log("║           RBAC SEED - Roles & Permissions                    ║", "cyan");
  log("╚════════════════════════════════════════════════════════════╝", "cyan");

  try {
    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();
    await seedComponentAccess();

    console.log("\n");
    log("✓ RBAC seeding completed successfully!", "green");
    console.log("\n");

    // Summary
    const roleCount = await sql`SELECT COUNT(*) as count FROM roles`;
    const permCount = await sql`SELECT COUNT(*) as count FROM permissions`;
    const rpCount = await sql`SELECT COUNT(*) as count FROM role_permissions`;
    const caCount = await sql`SELECT COUNT(*) as count FROM component_access`;

    console.log("Summary:");
    log(`  Roles: ${roleCount[0].count}`, "blue");
    log(`  Permissions: ${permCount[0].count}`, "blue");
    log(`  Role Permissions: ${rpCount[0].count}`, "blue");
    log(`  Component Access Rules: ${caCount[0].count}`, "blue");
    console.log("\n");

  } catch (error) {
    console.error("\n✗ Error seeding RBAC:", error);
    process.exit(1);
  }
}

main().catch(console.error);
