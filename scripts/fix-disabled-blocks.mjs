/**
 * Surgical fix for DISABLED db.query blocks
 * Only removes the exact broken patterns
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = 'd:/VS STUDIO PROJECT/bhutaneduskill';

function getAllTsFiles(dir, fileList = []) {
  try {
    const files = readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = join(dir, file.name);
      if (file.isDirectory()) {
        getAllTsFiles(fullPath, fileList);
      } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
        fileList.push(fullPath);
      }
    }
  } catch (e) {
    // Skip directories that can't be read
  }
  return fileList;
}

const allFiles = getAllTsFiles(join(ROOT, 'src'));
console.log(`Processing ${allFiles.length} TypeScript files...`);

let fixedCount = 0;

for (const fullPath of allFiles) {
  try {
    let content = readFileSync(fullPath, 'utf-8');
    const original = content;

    // Pattern 1: await /* DISABLED: ... }); multi-line
    // This matches from "await /* DISABLED:" to the first "});" followed by newline
    content = content.replace(
      /await\s+\/\*\s*DISABLED:[\s\S]*?\n\s*\}\);?\s*\n/g,
      '\n'
    );

    // Pattern 2: () => /* DISABLED: ... }); multi-line
    content = content.replace(
      /\(\)\s*=>\s*\/\*\s*DISABLED:[\s\S]*?\n\s*\}\),?\s*\n/g,
      '\n'
    );

    // Pattern 3: const x = await /* DISABLED: ... ];
    content = content.replace(
      /const\s+\w+\s*=\s*await\s+\/\*\s*DISABLED:[\s\S]*?\n\s*\];\s*\n/g,
      '\n'
    );

    // Pattern 4: Single line await /* DISABLED: */ ;
    content = content.replace(
      /await\s+\/\*\s*DISABLED:[^}]*?\*\/\s*;?\s*\n/g,
      '\n'
    );

    // Pattern 5: const x = /* DISABLED: */ ; (single line)
    content = content.replace(
      /const\s+\w+\s*=\s*\/\*\s*DISABLED:[^}]*?\*\/\s*;?\s*\n/g,
      '\n'
    );

    // Pattern 6: ? await /* DISABLED: } ...
    content = content.replace(
      /\?\s*await\s+\/\*\s*DISABLED:[\s\S]*?\}\s*\n/g,
      '\n'
    );

    // Pattern 7: Incomplete .where() calls like .where(users.id, userId).limit(1);
    content = content.replace(
      /\.where\(\w+\.\w+,\s*\w+\)\.limit\(1\);?\s*\n/g,
      '\n'
    );

    // Clean up excessive empty lines (but keep structure)
    content = content.replace(/\n{4,}/g, '\n\n\n');

    if (content !== original) {
      writeFileSync(fullPath, content);
      fixedCount++;
      const relPath = fullPath.replace(ROOT + '/', '');
      console.log(`Fixed: ${relPath}`);
    }
  } catch (e) {
    // Skip files that can't be processed
  }
}

console.log(`\nTotal files fixed: ${fixedCount}`);
console.log('Run `npx tsc --noEmit` to check remaining errors.');
