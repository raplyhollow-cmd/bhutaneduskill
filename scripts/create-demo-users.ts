/**
 * Create Demo Users Script
 *
 * This script creates 7 demo users via Clerk API and sets up
 * the corresponding database records with proper relationships.
 *
 * Demo Users:
 * 1. Tashi Wangchuk - Student (Class 8)
 * 2. Karma Dorji - Teacher (Mathematics)
 * 3. Dorji Wangmo - Parent (Tashi's mother)
 * 4. Pema Lhamo - Counselor
 * 5. Choki Wangchuk - School Admin
 * 6. Sonam Tshering - Platform Admin
 * 7. Kinzang Dorji - Ministry
 *
 * Usage: npx tsx scripts/create-demo-users.ts
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

/**
 * Create a Clerk user via direct API call
 */
async function createClerkUserDirect(user: { email: string; firstName: string; lastName: string; password: string }) {
  const response = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: [user.email],
      password: user.password,
      first_name: user.firstName,
      last_name: user.lastName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    return {
      success: false,
      error: error.errors?.[0]?.message || error.message || "Failed to create Clerk user",
    };
  }

  const data = await response.json();
  return { success: true, data };
}

// Demo user definitions
const DEMO_USERS = [
  {
    id: "user-tashi-wangchuk",
    name: "Tashi Wangchuk",
    firstName: "Tashi",
    lastName: "Wangchuk",
    email: "tashi.wangchuk@demo.bt",
    phone: "+975-17-12345",
    type: "student",
    role: "student",
    grade: 8,
    section: "A",
    rollNumber: "08-001",
    gender: "male",
    dateOfBirth: "2011-05-15",
    city: "Thimphu",
    state: "Thimphu",
    schoolCode: "TMSS",
  },
  {
    id: "user-karma-dorji",
    name: "Karma Dorji",
    firstName: "Karma",
    lastName: "Dorji",
    email: "karma.dorji@demo.bt",
    phone: "+975-17-23456",
    type: "teacher",
    role: "teacher",
    employeeId: "TMSS-T-001",
    subjects: ["Mathematics", "Physics"],
    department: "Science",
    gender: "male",
    dateOfBirth: "1988-08-22",
    city: "Thimphu",
    state: "Thimphu",
    schoolCode: "TMSS",
  },
  {
    id: "user-dorji-wangmo",
    name: "Dorji Wangmo",
    firstName: "Dorji",
    lastName: "Wangmo",
    email: "dorji.wangmo@demo.bt",
    phone: "+975-17-34567",
    type: "parent",
    role: "parent",
    gender: "female",
    dateOfBirth: "1980-03-10",
    city: "Thimphu",
    state: "Thimphu",
    occupation: "Civil Servant",
    schoolCode: "TMSS",
  },
  {
    id: "user-pema-lhamo",
    name: "Pema Lhamo",
    firstName: "Pema",
    lastName: "Lhamo",
    email: "pema.lhamo@demo.bt",
    phone: "+975-17-45678",
    type: "counselor",
    role: "counselor",
    employeeId: "TMSS-C-001",
    department: "Student Services",
    gender: "female",
    dateOfBirth: "1985-12-05",
    city: "Thimphu",
    state: "Thimphu",
    schoolCode: "TMSS",
  },
  {
    id: "user-choki-wangchuk",
    name: "Choki Wangchuk",
    firstName: "Choki",
    lastName: "Wangchuk",
    email: "choki.wangchuk@demo.bt",
    phone: "+975-17-56789",
    type: "school_admin",
    role: "school_admin",
    employeeId: "TMSS-A-001",
    department: "Administration",
    gender: "male",
    dateOfBirth: "1978-06-18",
    city: "Thimphu",
    state: "Thimphu",
    schoolCode: "TMSS",
  },
  {
    id: "user-sonam-tshering",
    name: "Sonam Tshering",
    firstName: "Sonam",
    lastName: "Tshering",
    email: "sonam.tshering@demo.bt",
    phone: "+975-17-67890",
    type: "admin",
    role: "admin",
    gender: "male",
    dateOfBirth: "1982-09-25",
    city: "Thimphu",
    state: "Thimphu",
  },
  {
    id: "user-kinzang-dorji",
    name: "Kinzang Dorji",
    firstName: "Kinzang",
    lastName: "Dorji",
    email: "kinzang.dorji@moe.gov.bt",
    phone: "+975-17-78901",
    type: "ministry",
    role: "ministry",
    employeeId: "MOE-M-001",
    department: "Career Guidance Division",
    gender: "male",
    dateOfBirth: "1975-04-12",
    city: "Thimphu",
    state: "Thimphu",
  },
];

// Default password for all demo users
const DEMO_PASSWORD = "Demo@2026!";

/**
 * Generate a unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Find school by code
 */
async function findSchoolByCode(code: string) {
  const result = await sql`
    SELECT id, name FROM schools WHERE code = ${code} LIMIT 1
  `;
  return result[0] || null;
}

/**
 * Create user in database
 */
async function createDatabaseUser(user: typeof DEMO_USERS[0], clerkUserId: string, schoolId: string | null) {
  const userId = generateId("user");
  const now = new Date().toISOString();

  await sql`
    INSERT INTO users (
      id, clerk_user_id, type, role, name, first_name, last_name,
      email, phone, school_id, profile_image, date_of_birth, gender,
      grade, section, roll_number, address, city, state, postal_code,
      country, parent_contact, parent_phone, emergency_contact,
      blood_group, enrollment_date, last_login, employee_id,
      department, subjects, is_active, onboarding_complete,
      created_at, updated_at
    ) VALUES (
      ${userId},
      ${clerkUserId},
      ${user.type},
      ${user.role},
      ${user.name},
      ${user.firstName},
      ${user.lastName},
      ${user.email},
      ${user.phone},
      ${schoolId},
      '',
      ${user.dateOfBirth},
      ${user.gender},
      ${user.grade || 0},
      ${user.section || ''},
      ${user.rollNumber || ''},
      '',
      ${user.city},
      ${user.state},
      '11001',
      'Bhutan',
      '',
      '',
      '',
      '',
      ${now.split('T')[0]},
      ${now},
      ${user.employeeId || ''},
      ${user.department || ''},
      ${user.subjects ? JSON.stringify(user.subjects) : ''},
      true,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (clerk_user_id) DO UPDATE SET
      type = EXCLUDED.type,
      role = EXCLUDED.role,
      school_id = EXCLUDED.school_id,
      updated_at = NOW()
    RETURNING id
  `;

  return userId;
}

/**
 * Assign RBAC role to user
 */
async function assignRole(userId: string, user: typeof DEMO_USERS[0]) {
  // Find role by slug
  const roleResult = await sql`
    SELECT id FROM roles WHERE slug = ${user.role} LIMIT 1
  `;

  if (roleResult.length === 0) {
    console.log(`    ⚠ Role '${user.role}' not found in RBAC, skipping role assignment`);
    return;
  }

  const roleId = roleResult[0].id;

  // Check if user already has the role
  const existing = await sql`
    SELECT id FROM user_roles WHERE user_id = ${userId} AND role_id = ${roleId} LIMIT 1
  `;

  if (existing.length === 0) {
    await sql`
      INSERT INTO user_roles (id, user_id, role_id, assigned_by, created_at)
      VALUES (
        'ur-' || date_part('epoch', NOW())::bigint || '-' || md5(random()::text),
        ${userId},
        ${roleId},
        ${userId},
        NOW()
      )
    `;
    console.log(`    ✓ Assigned RBAC role: ${user.role}`);
  } else {
    console.log(`    ✓ Already has role: ${user.role}`);
  }
}

/**
 * Link student to parent
 */
async function linkStudentToParent(studentId: string, parentId: string) {
  await sql`
    UPDATE users
    SET parent_id = ${parentId}
    WHERE id = ${studentId}
  `;
  console.log(`    ✓ Linked student to parent`);
}

/**
 * Main function
 */
async function main() {
  console.log("=".repeat(70));
  console.log("CREATING DEMO USERS FOR BHUTAN EDU SKILL");
  console.log("=".repeat(70));
  console.log(`\n📝 Default password for all users: ${DEMO_PASSWORD}\n`);

  const results = {
    created: [] as Array<{ name: string; email: string; clerkId: string; dbId: string }>,
    skipped: [] as Array<{ name: string; reason: string }>,
    errors: [] as Array<{ name: string; error: string }>,
  };

  // Find TMSS school for demo users
  const school = await findSchoolByCode("TMSS");
  const schoolId = school?.id || null;

  if (!schoolId) {
    console.log("⚠ Warning: TMSS school not found. Users will not be linked to a school.");
  } else {
    console.log(`✓ Found school: ${school.name} (${schoolId})\n`);
  }

  // Track created user IDs for linking
  const createdUserIds: Record<string, string> = {};

  for (const user of DEMO_USERS) {
    console.log(`\n[Creating: ${user.name}]`);
    console.log(`  Type: ${user.type}`);
    console.log(`  Email: ${user.email}`);

    try {
      // Step 1: Check if user already exists in Clerk by email
      const listResponse = await fetch(
        `https://api.clerk.com/v1/users?email_address=${user.email}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        }
      );

      let clerkUserId: string;

      if (listResponse.ok) {
        const listData = await listResponse.json();
        if (listData.data && listData.data.length > 0) {
          clerkUserId = listData.data[0].id;
          console.log(`  ⚠ User already exists in Clerk: ${clerkUserId}`);
          results.skipped.push({ name: user.name, reason: "Already exists in Clerk" });
        } else {
          // Step 2: Create user in Clerk
          const clerkResult = await createClerkUserDirect({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            password: DEMO_PASSWORD,
          });

          if (!clerkResult.success || !clerkResult.data) {
            throw new Error(clerkResult.error || "Failed to create Clerk user");
          }

          clerkUserId = clerkResult.data.id;
          console.log(`  ✓ Created Clerk user: ${clerkUserId}`);
          results.created.push({
            name: user.name,
            email: user.email,
            clerkId: clerkUserId,
            dbId: "", // Will be filled below
          });
        }
      } else {
        throw new Error("Failed to check Clerk for existing user");
      }

      // Step 3: Create/update database user
      const dbUserId = await createDatabaseUser(user, clerkUserId, schoolId);
      console.log(`  ✓ Database user: ${dbUserId}`);
      createdUserIds[user.id] = dbUserId;

      // Update the clerkId in results
      const createdIndex = results.created.findIndex(r => r.email === user.email);
      if (createdIndex >= 0) {
        results.created[createdIndex].dbId = dbUserId;
      }

      // Step 4: Assign RBAC role
      await assignRole(dbUserId, user);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ Error: ${errorMsg}`);
      results.errors.push({ name: user.name, error: errorMsg });
    }
  }

  // Link Tashi to Dorji (student-parent relationship)
  if (createdUserIds["user-tashi-wangchuk"] && createdUserIds["user-dorji-wangmo"]) {
    console.log(`\n[Linking Student to Parent]`);
    await linkStudentToParent(
      createdUserIds["user-tashi-wangchuk"],
      createdUserIds["user-dorji-wangmo"]
    );
  }

  // Print summary
  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log(`✓ Created: ${results.created.length}`);
  console.log(`⊘ Skipped: ${results.skipped.length}`);
  console.log(`✗ Errors:  ${results.errors.length}`);

  if (results.created.length > 0) {
    console.log("\n📋 Created Users:");
    results.created.forEach((user) => {
      console.log(`  • ${user.name}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Clerk ID: ${user.clerkId}`);
      console.log(`    DB ID: ${user.dbId}`);
    });
  }

  if (results.skipped.length > 0) {
    console.log("\n⊘ Skipped Users:");
    results.skipped.forEach((user) => {
      console.log(`  • ${user.name} - ${user.reason}`);
    });
  }

  if (results.errors.length > 0) {
    console.log("\n✗ Errors:");
    results.errors.forEach((error) => {
      console.log(`  • ${error.name} - ${error.error}`);
    });
  }

  console.log("\n" + "=".repeat(70));
  console.log("🔑 Demo Credentials");
  console.log("=".repeat(70));
  console.log(`All demo users share the same password: ${DEMO_PASSWORD}`);
  console.log("\nSign in at: http://localhost:3003/sign-in");
  console.log("=".repeat(70));
}

// Run the script
main()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Fatal error:", err);
    process.exit(1);
  });
