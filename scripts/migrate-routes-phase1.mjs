#!/usr/bin/env node

/**
 * Route Migration Script - Phase 1: Core Routes
 * Migrates setup, verification, and auth routes to createApiRoute pattern
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const routesToMigrate = [
  // Setup routes
  'src/app/api/setup/admin/route.ts',
  'src/app/api/setup/complete/route.ts',
  'src/app/api/setup/counselor/route.ts',
  'src/app/api/setup/import/route.ts',
  'src/app/api/setup/ministry/route.ts',
  'src/app/api/setup/parent/route.ts',
  'src/app/api/setup/school-admin/route.ts',
  'src/app/api/setup/student/route.ts',
  'src/app/api/setup/teacher/route.ts',
  // Verification routes
  'src/app/api/verification/ministry/route.ts',
  'src/app/api/verification/verify-domain/route.ts',
  'src/app/api/verification/school/route.ts',
  // Auth routes
  'src/app/api/auth/set-role/route.ts',
];

function migrateRoute(filePath) {
  const fullPath = join(process.cwd(), filePath);
  let content = readFileSync(fullPath, 'utf-8');

  // Skip if already migrated
  if (content.includes('createApiRoute')) {
    console.log(`✓ ${filePath} - Already migrated`);
    return;
  }

  // Check if route uses clerk auth() or currentUser() directly (setup routes pattern)
  const usesClerkAuth = content.includes('await auth()') || content.includes('await currentUser()');

  if (usesClerkAuth) {
    // For setup routes that use Clerk auth directly, we need to keep the pattern
    // but standardize error handling
    console.log(`⊘ ${filePath} - Uses Clerk auth directly (setup route pattern)`);
    return;
  }

  // Standard migration pattern for routes with requireAuth
  const oldPattern = /export async function (GET|POST|PUT|PATCH|DELETE)\(request: NextRequest(?:, \{ params \}: \{ params: Promise<.*> \})?\) \{[\s\S]*?try \{[\s\S]*?const authResult = await requireAuth\(([^)]*)\);[\s\S]*?if \("error" in authResult\) \{[\s\S]*?return NextResponse\.json\(\{ error: authResult\.error \}, \{ status: authResult\.status \}\);[\s\S]*?\}/;

  if (!oldPattern.test(content)) {
    console.log(`? ${filePath} - Non-standard pattern, skipping`);
    return;
  }

  // Extract HTTP method
  const methodMatch = content.match(/export async function (GET|POST|PUT|PATCH|DELETE)/);
  if (!methodMatch) {
    console.log(`? ${filePath} - No HTTP method found`);
    return;
  }
  const method = methodMatch[1];

  // Extract allowed roles
  const rolesMatch = content.match(/await requireAuth\(([^)]*)\)/);
  const allowedRoles = rolesMatch ? rolesMatch[1] : '[]';

  // Update imports
  content = content.replace(
    /import \{ NextRequest, NextResponse \} from "next\/server";/,
    'import { NextRequest } from "next/server";'
  );

  // Add createApiRoute import if not present
  if (!content.includes('createApiRoute')) {
    content = content.replace(
      /import \{ NextRequest \} from "next\/server";/,
      'import { NextRequest } from "next/server";\nimport { createApiRoute } from "@/lib/api/route-handler";'
    );
  }

  // Replace function signature
  content = content.replace(
    /export async function (GET|POST|PUT|PATCH|DELETE)\(request: NextRequest(?:, \{ params \}: \{ params: Promise<.*> \})?\) \{[\s\S]*?try \{[\s\S]*?const authResult = await requireAuth\(([^)]*)\);[\s\S]*?if \("error" in authResult\) \{[\s\S]*?return NextResponse\.json\(\{ error: authResult\.error \}, \{ status: authResult\.status \}\);[\s\S]*?\}/,
    `export const ${method} = createApiRoute(\n  async (request: NextRequest, auth) => {`
  );

  // Remove extra closing brace and add createApiRoute closing
  const closingBraceIndex = content.lastIndexOf('  } catch (error)');
  if (closingBraceIndex !== -1) {
    content = content.substring(0, closingBraceIndex) +
      `  },\n  ${allowedRoles}\n);` +
      content.substring(content.lastIndexOf('\n}') + 2);
  }

  // Write back
  writeFileSync(fullPath, content, 'utf-8');
  console.log(`✓ ${filePath} - Migrated`);
}

// Run migration
routesToMigrate.forEach(migrateRoute);

console.log('\nPhase 1 migration complete!');
