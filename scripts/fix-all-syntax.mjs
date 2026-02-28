/**
 * Comprehensive Syntax Fixer
 * Fixes broken db.query migrations across all files
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = 'd:/VS STUDIO PROJECT/bhutaneduskill';

// Get all TypeScript files
function getAllTsFiles(dir, fileList = []) {
  const files = readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = join(dir, file.name);
    if (file.isDirectory()) {
      getAllTsFiles(fullPath, fileList);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allFiles = getAllTsFiles(join(ROOT, 'src'));
console.log(`Found ${allFiles.length} TypeScript files`);

const fixedCount = { disabled: 0, where: 0, braces: 0 };

for (const fullPath of allFiles) {
  try {
    let content = readFileSync(fullPath, 'utf-8');
    const original = content;

    // Fix 1: Remove DISABLED db.query blocks (multi-line patterns)
    const patterns = [
      // await /* DISABLED: ... });
      [/await\s+\/\*[^\n]*DISABLED:[\s\S]*?\n\s*\}\);?\s*\n/g, '\n'],
      // () => /* DISABLED: ... });
      [/\(\)\s*=>\s*\/\*[^\n]*DISABLED:[\s\S]*?\n\s*\}\),?\s*\n/g, '\n'],
      // const x = await /* DISABLED: ... ];
      [/const\s+\w+\s*=\s*await\s+\/\*[^\n]*DISABLED:[\s\S]*?\n\s*\];\s*\n/g, '\n'],
      // await /* DISABLED: ... ; (single line-ish)
      [/await\s+\/\*[^\n]*DISABLED:[^\n]*\*\/\s*;?\s*\n/g, '\n'],
      // const x = /* DISABLED: ... ; (single line)
      [/const\s+\w+\s*=\s*\/\*[^\n]*DISABLED:[^\n]*\*\/\s*;?\s*\n/g, '\n'],
      // ? await /* DISABLED: ... } patterns
      [/\?\s*await\s+\/\*[^\n]*DISABLED:[\s\S]*?\}\s*\n/g, '\n'],
    ];

    for (const [pattern, replacement] of patterns) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) fixedCount.disabled++;
      content = newContent;
    }

    // Fix 2: Wrong .where() syntax - only if eq is imported
    if (content.includes("eq") && (content.includes("import {") || content.includes('import{'))) {
      const newContent = content.replace(
        /\.where\((\w+\.\w+),\s*(\w+)\)(?!\s*\))/g,
        '.where(eq($1, $2))'
      );
      if (newContent !== content) fixedCount.where++;
      content = newContent;
    }

    // Fix 3: Orphaned closing braces and cleanup
    content = content.replace(/\n{3,}/g, '\n\n');
    content = content.replace(/\n\s*\}\);?\s*\n\s*}/g, '\n}');

    if (content !== original) {
      writeFileSync(fullPath, content);
      const relPath = fullPath.replace(ROOT + '/', '');
      console.log(`Fixed: ${relPath}`);
    }
  } catch (e) {
    // Skip files that can't be read
  }
}

console.log(`\nFixes applied:`);
console.log(`  - Disabled blocks: ${fixedCount.disabled}`);
console.log(`  - where() syntax: ${fixedCount.where}`);
console.log(`\nDone! Run \`npx tsc --noEmit\` to check remaining errors.`);
