/**
 * Fix TypeScript Syntax Errors v3
 * Fixes:
 * 1. Broken /* DISABLED: */ patterns
 * 2. Wrong .where() syntax (missing eq())
 */

import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const ROOT = 'd:/VS STUDIO PROJECT/bhutaneduskill';

const files = globSync('src/**/*.{ts,tsx}', { cwd: ROOT });

let fixedCount = 0;

for (const file of files) {
  const fullPath = `${ROOT}/${file}`;
  let content = readFileSync(fullPath, 'utf-8');
  const original = content;

  // Fix 1: Remove broken /* DISABLED: */ patterns with closing lines
  // Pattern 1: await /* DISABLED: , ... followed by lines ending with });
  content = content.replace(
    /await\s+\/\*\s*DISABLED:[^*]*\*\/[\s\S]*?\n\s*\}\);?\s*\n/g,
    '\n'
  );

  // Pattern 2: () => /* DISABLED: , ... followed by lines
  content = content.replace(
    /\(\)\s*=>\s*\/\*\s*DISABLED:[^*]*\*\/[\s\S]*?\n\s*\}\),?\s*\n/g,
    '\n'
  );

  // Pattern 3: await /* DISABLED: ]; followed by closing braces
  content = content.replace(
    /await\s+\/\*\s*DISABLED:[^*]*\*\/\s*\];[\s\S]*?\n\s*\}\s*\n/g,
    '\n'
  );

  // Pattern 4: await /* DISABLED: ; (single line)
  content = content.replace(
    /await\s+\/\*\s*DISABLED:[^*]*\*\/\s*;?\s*\n/g,
    '\n'
  );

  // Pattern 5: const x = await /* DISABLED: ,
  content = content.replace(
    /const\s+\w+\s*=\s*await\s+\/\*\s*DISABLED:[^*]*\*\/[\s\S]*?\n\s*\]\s*;?\s*\n/g,
    '\n'
  );

  // Pattern 6: ? await /* DISABLED: }' })`
  content = content.replace(
    /\?\s*await\s+\/\*\s*DISABLED:[^*]*\*\/[^}]*\}\'\`\)\`[\s\S]*?\n\s*\]\s*;?\s*\n/g,
    '\n'
  );

  // Fix 2: Wrong .where() syntax - .where(table.column, value) should be .where(eq(table.column, value))
  // But only if eq is imported
  if (content.includes("import { eq") || content.includes('import {eq')) {
    // Pattern: .where(users.id, userId) -> .where(eq(users.id, userId))
    content = content.replace(
      /\.where\((\w+\.\w+),\s*(\w+)\)/g,
      '.where(eq($1, $2))'
    );
  }

  // Fix 3: Remove orphan closing braces from broken patterns
  // Look for patterns like });
  // that appear after line breaks and don't have matching opening
  content = content.replace(
    /\n\s*\}\);?\s*\n\s*\}/g,
    '\n}'
  );

  if (content !== original) {
    writeFileSync(fullPath, content);
    fixedCount++;
    console.log(`Fixed: ${file}`);
  }
}

console.log(`\nTotal files fixed: ${fixedCount}`);
