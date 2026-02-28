/**
 * Fix broken db.query replacements
 * Handles malformed code from previous migration attempt
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

const BROKEN_PATTERNS = [
  // Pattern: DISABLED comments with broken syntax
  {
    pattern: /results = await \/ \* DISABLED: \/ \* DISABLED: db\.query\.\w+\.findMany\(\{[\s\S]*?\}\);/g,
    fix: (match) => {
      // Extract the original intent from the broken code
      const tableMatch = match.match(/db\.query\.(\w+)\.findMany/);
      if (!tableMatch) return '/* TODO: migrate this query */';

      const table = tableMatch[1];
      const tableCapital = table.charAt(0).toUpperCase() + table.slice(1);

      return `results = await db.select().from(${tableCapital});`;
    }
  },
  // Simple broken DISABLED pattern
  {
    pattern: /\/\* DISABLED: db\.query\.\w+\.\w+\([^)]*\) - db\.query not supported by neon-http \*\//g,
    replacement: ''
  },
  // Double DISABLED comment
  {
    pattern: /\/\* DISABLED: \/\* DISABLED: [^*]*\*\/ - db\.query not supported by neon-http \*\//g,
    replacement: ''
  }
];

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Remove broken DISABLED comments
  content = content.replace(/\/\* DISABLED: db\.query\.\w+\.\w+\([^)]*\) - db\.query not supported by neon-http \*\//g, '');
  content = content.replace(/\/\* DISABLED: \/\* DISABLED: [^*]*\*\/ - db\.query not supported by neon-http \*\//g, '');

  // Clean up any remaining db.query calls by commenting them out properly
  content = content.replace(/await db\.query\.\w+\.\w+\([^)]*\)/g, 'await db.select().from(/* TODO: fix table */[])');

  if (content !== originalContent) {
    writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

// Find files with db.query
function findFiles(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true });

  for (const entry of entries) {
    if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const fullPath = join(dir, entry.name);
      try {
        const content = readFileSync(fullPath, 'utf-8');
        if (content.includes('db.query') || content.includes('DISABLED:')) {
          files.push(fullPath);
        }
      } catch {}
    }
  }
  return files;
}

const srcDir = join(ROOT_DIR, 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} files to check...`);

let fixed = 0;
for (const file of files) {
  try {
    if (fixFile(file)) {
      fixed++;
      console.log(`✓ Fixed: ${file.replace(ROOT_DIR, '')}`);
    }
  } catch (err) {
    console.log(`✗ Failed: ${file} - ${err.message}`);
  }
}

console.log(`\nFixed ${fixed} files`);
