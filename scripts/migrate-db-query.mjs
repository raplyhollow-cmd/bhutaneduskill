/**
 * db.query Migration Script
 * Converts db.query.* patterns to db.select().from()
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

// Patterns to replace
const REPLACEMENTS = [
  // Pattern 1: findFirst with where clause
  {
    pattern: /await db\.query\.(\w+)\.findFirst\(\{[\s\S]*?where:\s*eq\((\w+)\.(\w+),\s*(\w+)\)\s*(?:,\s*with:\s*\{[^}]*\})?\s*\}\)/g,
    replacement: (match, table, tableRef, col, val) =>
      `await db.select().from(${table}).where(eq(${tableRef}.${col}, ${val})).limit(1)`
  },
  // Pattern 2: Simple findFirst with where
  {
    pattern: /await db\.query\.(\w+)\.findFirst\(\{[\s\S]*?where:\s*eq\(([^)]+)\)[\s\S]*?\}\)/g,
    replacement: (match, table, eqClause) =>
      `await db.select().from(${table}).where(${eqClause}).limit(1)`
  },
  // Pattern 3: findMany with where
  {
    pattern: /await db\.query\.(\w+)\.findMany\(\{[\s\S]*?where:\s*eq\(([^)]+)\)[\s\S]*?\}\)/g,
    replacement: (match, table, eqClause) =>
      `await db.select().from(${table}).where(${eqClause})`
  },
  // Pattern 4: Simple findFirst or findMany
  {
    pattern: /await db\.query\.(\w+)\.findFirst\(\)/g,
    replacement: (match, table) =>
      `await db.select().from(${table}).limit(1)`
  },
  {
    pattern: /await db\.query\.(\w+)\.findMany\(\)/g,
    replacement: (match, table) =>
      `await db.select().from(${table})`
  },
  // Pattern 5: Any remaining db.query.* call - replace with comment
  {
    pattern: /db\.query\.\w+\.\w+\([^)]*\)/g,
    replacement: (match) => `/* DISABLED: ${match} - db.query not supported by neon-http */`
  }
];

function migrateFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  for (const { pattern, replacement } of REPLACEMENTS) {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      modified = true;
      content = newContent;
    }
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

// Get all TS/TSX files
function findFiles(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      findFiles(fullPath, files);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }

  return files;
}

// Main execution
const srcDir = join(ROOT_DIR, 'src');
const files = findFiles(srcDir);
const filesWithDbQuery = [];

console.log(`Scanning ${files.length} files for db.query usage...`);

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  if (content.includes('db.query')) {
    filesWithDbQuery.push(file);
  }
}

console.log(`Found ${filesWithDbQuery.length} files with db.query`);
console.log('\nProcessing files...\n');

let migrated = 0;
let failed = [];

for (const file of filesWithDbQuery) {
  try {
    if (migrateFile(file)) {
      migrated++;
      console.log(`✓ Migrated: ${file.replace(ROOT_DIR, '')}`);
    } else {
      console.log(`- Skipped (no changes): ${file.replace(ROOT_DIR, '')}`);
    }
  } catch (err) {
    failed.push({ file, error: err.message });
    console.log(`✗ Failed: ${file.replace(ROOT_DIR, '')} - ${err.message}`);
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Total files with db.query: ${filesWithDbQuery.length}`);
console.log(`Successfully migrated: ${migrated}`);
console.log(`Failed: ${failed.length}`);

if (failed.length > 0) {
  console.log('\nFailed files:');
  failed.forEach(f => console.log(`  - ${f.file}: ${f.error}`));
}
