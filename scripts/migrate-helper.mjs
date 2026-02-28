#!/usr/bin/env node

/**
 * Fast Route Migration Helper
 * Migrates standard requireAuth pattern routes to createApiRoute
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const routeMigrations = [
  {
    file: 'src/app/api/journal/route.ts',
    methods: [
      {
        name: 'GET',
        roles: ['student'],
        startMarker: "// GET /api/journal - Get user's journal entries\nexport async function GET",
        endMarker: "  } catch (error: unknown) {\n    logger.apiError(error, { route: \"/api/journal\", method: \"GET\" });\n    return NextResponse.json({ error: \"Failed to save entry\" }, { status: 500 });\n  }\n}",
      },
      {
        name: 'POST',
        roles: ['student'],
        startMarker: "// POST /api/journal - Create a new journal entry\nexport async function POST",
        endMarker: "  } catch (error: unknown) {\n    logger.apiError(error, { route: \"/api/journal\", method: \"POST\" });\n    return NextResponse.json({ error: \"Failed to save entry\" }, { status: 500 });\n  }\n}",
      }
    ]
  },
  {
    file: 'src/app/api/library/route.ts',
    methods: [
      {
        name: 'GET',
        roles: ['student', 'teacher', 'admin', 'school-admin'],
      },
      {
        name: 'POST',
        roles: ['student', 'teacher'],
      },
      {
        name: 'PUT',
        roles: ['student', 'teacher'],
      },
      {
        name: 'DELETE',
        roles: ['admin', 'school-admin'],
      }
    ]
  },
  {
    file: 'src/app/api/results/route.ts',
    methods: [
      { name: 'GET', roles: ['student', 'teacher', 'admin', 'school-admin', 'parent'] },
      { name: 'POST', roles: ['teacher', 'admin', 'school-admin'] }
    ]
  },
  {
    file: 'src/app/api/study-abroad/route.ts',
    methods: [
      { name: 'GET', roles: ['student', 'teacher', 'counselor'] },
      { name: 'POST', roles: ['student'] }
    ]
  },
  {
    file: 'src/app/api/teachers/route.ts',
    methods: [
      { name: 'GET', roles: ['admin', 'school-admin'] },
      { name: 'POST', roles: ['admin', 'school-admin'] }
    ]
  },
  {
    file: 'src/app/api/transport/route.ts',
    methods: [
      { name: 'GET', roles: ['student', 'parent', 'admin', 'school-admin'] },
      { name: 'POST', roles: ['admin', 'school-admin'] }
    ]
  },
];

function migrateRoute(filePath, methods) {
  const fullPath = join(process.cwd(), filePath);
  let content = readFileSync(fullPath, 'utf-8');

  // Skip if already migrated
  if (content.includes('createApiRoute')) {
    console.log(`✓ ${filePath} - Already migrated`);
    return true;
  }

  // Update imports
  content = content.replace(
    /import \{ NextRequest, NextResponse \} from "next\/server";/,
    'import { NextRequest } from "next/server";'
  );

  // Add createApiRoute import
  if (!content.includes('createApiRoute')) {
    content = content.replace(
      /import \{ NextRequest \} from "next\/server";/,
      'import { NextRequest } from "next/server";\nimport { createApiRoute } from "@/lib/api/route-handler";'
    );
  }

  // Migrate each method
  for (const method of methods) {
    const { name, roles } = method;

    // Pattern: export async function NAME(request: NextRequest) {
    const pattern = new RegExp(`export async function ${name}\\(request: NextRequest\\) \\{[\\s\\S]*?const authResult = await requireAuth\\([^)]+\\);[\\s\\S]*?if \\('error' in authResult\\) \\{[\\s\\S]*?return NextResponse\\.json\\(\\{ error: authResult\\.error \\}, \\{ status: authResult\\.status \\}\\);[\\s\\S]*?const \\{ userId, user \\} = authResult;`, 'g');

    content = content.replace(
      pattern,
      `export const ${name} = createApiRoute(\n  async (request: NextRequest, auth) => {\n    const { userId, user } = auth;`
    );

    // Replace closing try-catch with createApiRoute closing
    const catchPattern = /  \} catch \(error\) \{[\s\S]*?logger\.apiError\(error, \{ route: "[^"]+", method: "[^"]+" \}\);[\s\S]*?return NextResponse\.json\(\{ error: "[^"]+" \}, \{ status: 500 \}\);[\s\S]*?  \}\n\}/g;

    content = content.replace(
      catchPattern,
      `  },\n  ${JSON.stringify(roles)}\n);`
    );

    // Replace other NextResponse returns
    content = content.replace(
      /return NextResponse\.json\((\{[^}]+\}), \{ status: (\d+) \}\)/g,
      'return { ...$1, status: $2 }'
    );

    content = content.replace(
      /return NextResponse\.json\((\{[^}]+\})\)/g,
      'return $1'
    );
  }

  // Write back
  writeFileSync(fullPath, content, 'utf-8');
  console.log(`✓ ${filePath} - Migrated ${methods.length} methods`);
  return true;
}

// Run migrations
let totalMigrated = 0;
for (const route of routeMigrations) {
  if (migrateRoute(route.file, route.methods)) {
    totalMigrated++;
  }
}

console.log(`\n✓ Migrated ${totalMigrated} route files`);
