#!/usr/bin/env node

/**
 * Route Migration Script
 * Migrates API routes from old pattern to createApiRoute pattern
 */

import { readFileSync, writeFileSync } from 'fs';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_DIR = join(__dirname, '../src/app/api');

// Routes to skip (use Clerk auth directly)
const SKIP_ROUTES = [
  'src/app/api/auth/set-role/route.ts',
  'src/app/api/clerk/webhook/route.ts',
];

/**
 * Check if a file needs migration
 */
function needsMigration(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  // Skip if already using createApiRoute
  if (content.includes('createApiRoute')) {
    return false;
  }

  // Check if it has old pattern exports
  const oldPattern = /export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/;
  return oldPattern.test(content);
}

/**
 * Migrate a route file
 */
function migrateRoute(filePath) {
  console.log(`Migrating: ${filePath}`);

  let content = readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Add import if not present
  if (!content.includes('createApiRoute')) {
    // Find existing imports
    const importEndIndex = content.indexOf('\n\n');
    if (importEndIndex > 0) {
      const beforeImports = content.substring(0, importEndIndex);
      const afterImports = content.substring(importEndIndex);

      // Add createApiRoute import
      if (!beforeImports.includes('createApiRoute')) {
        content = beforeImports + '\nimport { createApiRoute } from "@/lib/api/route-handler";' + afterImports;
      }
    }
  }

  // Remove requireAuth import if it exists and we're replacing all auth calls
  content = content.replace(/import\s*{\s*requireAuth\s*}.*from.*"@\/lib\/auth-utils"[;\s]*\n?/g, '');

  // Remove ApiSuccess, ApiErrorResponse imports if only used in error responses
  // We'll keep them if used elsewhere

  // Migrate each HTTP method
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  for (const method of methods) {
    const regex = new RegExp(`export\\s+(async\\s+)?function\\s+${method}\\s*\\(`, 'g');

    if (regex.test(content)) {
      content = content.replace(regex, `export const ${method} = createApiRoute(`);
    }
  }

  // Transform the function body - this is more complex and needs careful handling
  // For now, just doing the simple export transformation

  if (content !== originalContent) {
    writeFileSync(filePath, content, 'utf-8');
    return true;
  }

  return false;
}

/**
 * Recursively find route files
 */
function findRouteFiles(dir) {
  const files = [];

  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (item === 'route.ts') {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Main migration function
 */
function main() {
  console.log('Finding routes that need migration...\n');

  const routeFiles = findRouteFiles(API_DIR);
  const filesNeedingMigration = routeFiles.filter(file => {
    const relativePath = file.replace(__dirname.replace('/scripts', ''), '').replace(/\\/g, '/');
    return !SKIP_ROUTES.some(skip => relativePath.includes(skip)) && needsMigration(file);
  });

  console.log(`Found ${filesNeedingMigration.length} files to migrate:\n`);

  let migratedCount = 0;

  for (const file of filesNeedingMigration) {
    const relativePath = file.replace(process.cwd(), '').replace(/\\/g, '/');
    console.log(relativePath);

    if (migrateRoute(file)) {
      migratedCount++;
    }
  }

  console.log(`\nMigration complete!`);
  console.log(`Migrated: ${migratedCount} files`);
  console.log(`Remaining: ${filesNeedingMigration.length - migratedCount} files`);
}

main();
