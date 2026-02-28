#!/usr/bin/env node

/**
 * Comprehensive Route Migration Script
 * Migrates ALL routes to createApiRoute pattern systematically
 */

const fs = require('fs');
const path = require('path');

// Find all route files that need migration
function findRoutesToMigrate(dir) {
  const routes = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      routes.push(...findRoutesToMigrate(fullPath));
    } else if (file.name === 'route.ts') {
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Skip if already migrated
      if (content.includes('createApiRoute')) {
        continue;
      }

      // Skip setup routes (they use Clerk auth directly)
      if (fullPath.includes('/setup/')) {
        continue;
      }

      // Only migrate if it has requireAuth pattern
      if (content.includes('requireAuth') && content.includes('export async function')) {
        routes.push(fullPath);
      }
    }
  }

  return routes;
}

function migrateRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Skip if already migrated
  if (content.includes('createApiRoute')) {
    return false;
  }

  // Skip setup routes
  if (filePath.includes('/setup/')) {
    return false;
  }

  // Update imports
  content = content.replace(
    /import \{ NextRequest, NextResponse \} from "next\/server";/g,
    'import { NextRequest } from "next/server";'
  );

  // Add createApiRoute import if not present
  if (!content.includes('createApiRoute') && content.includes('requireAuth')) {
    const requireAuthImport = content.includes('from "@/lib/auth-utils"');
    if (requireAuthImport) {
      content = content.replace(
        /from "@\/lib\/auth-utils"/,
        'from "@/lib/auth-utils"\nimport { createApiRoute } from "@/lib/api/route-handler"'
      );
    } else {
      // Add import after first import line
      content = content.replace(
        /(\nimport [^\n]+;\n)/,
        '$1import { createApiRoute } from "@/lib/api/route-handler";\n'
      );
    }
  }

  // Pattern to match and replace requireAuth boilerplate
  const authPattern = /export async function (GET|POST|PUT|PATCH|DELETE)\((req|request): NextRequest(?:, \{ params \}: \{ params: Promise<[^>]+> \})?\) \{\s*try \{\s*const authResult = await requireAuth\(([^)]+)\);\s*if \('error' in authResult\) \{\s*return NextResponse\.json\(\{ error: authResult\.error \}, \{ status: authResult\.status \}\);\s*\}\s*(const \{ userId, user \} = authResult;)?/g;

  let match;
  let replacements = [];

  while ((match = authPattern.exec(content)) !== null) {
    const method = match[1];
    const roles = match[3];
    const hasDestructuring = match[4];

    replacements.push({
      start: match.index,
      end: match.index + match[0].length,
      replacement: `export const ${method} = createApiRoute(\n  async (request: NextRequest, auth) => {\n${hasDestructuring ? '    const { userId, user } = auth;' : ''}`
    });
  }

  // Apply replacements in reverse order to maintain positions
  replacements.reverse().forEach(rep => {
    content = content.substring(0, rep.start) + rep.replacement + content.substring(rep.end);
  });

  // Replace closing try-catch blocks with createApiRoute closing
  // Pattern: } catch (error) { logger... return NextResponse... } }
  const catchPattern = /([\s\S]*?)  \} catch \(error(?:: unknown)?\) \{\s*logger\.(?:apiError|error)\(error, \{ route: "[^"]*", method: "[^"]*" \}\);\s*return NextResponse\.json\(\{ error: "[^"]*" \}, \{ status: 500 \}\);\s*  \}\n\}/g;

  content = content.replace(catchPattern, (match, p1) => {
    // Extract roles from the createApiRoute call if available
    const rolesMatch = p1.match(/export const (GET|POST|PUT|PATCH|DELETE) = createApiRoute\(\s*async \([^)]*\) [^=>]*=> \s*([^,]*),\s*\[([^\]]+)\]\s*\);/);
    if (rolesMatch) {
      return `${p1.trim()}  },\n  [${rolesMatch[3]}]\n);`;
    }
    return match;
  });

  // Replace NextResponse.json returns with plain objects (except those with explicit status)
  content = content.replace(
    /return NextResponse\.json\((\{[^}]+\}), \{ status: (\d+) \}\)/g,
    'return { ...$1, status: $2 }'
  );

  // Simple NextResponse.json returns
  content = content.replace(
    /return NextResponse\.json\((\{[^}]+\})\)(?!,\s*\{ status:)/g,
    'return $1'
  );

  // Write back if changed
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }

  return false;
}

// Main execution
const apiDir = path.join(process.cwd(), 'src/app/api');
const routesToMigrate = findRoutesToMigrate(apiDir);

console.log(`Found ${routesToMigrate.length} routes to migrate`);

let migrated = 0;
let failed = 0;

for (const route of routesToMigrate) {
  try {
    if (migrateRoute(route)) {
      console.log(`✓ ${path.relative(process.cwd(), route)}`);
      migrated++;
    }
  } catch (error) {
    console.error(`✗ ${path.relative(process.cwd(), route)}: ${error.message}`);
    failed++;
  }
}

console.log(`\nMigration complete:`);
console.log(`  ✓ Migrated: ${migrated}`);
console.log(`  ✗ Failed: ${failed}`);
console.log(`  Total processed: ${routesToMigrate.length}`);
