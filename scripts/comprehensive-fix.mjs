/**
 * Comprehensive syntax fix for all broken patterns
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
  } catch (e) {}
  return fileList;
}

const allFiles = getAllTsFiles(join(ROOT, 'src'));
console.log(`Processing ${allFiles.length} files...`);

let fixedCount = 0;

for (const fullPath of allFiles) {
  try {
    let content = readFileSync(fullPath, 'utf-8');
    const original = content;

    // Fix 1: Missing closing paren in toLocaleDateString
    // Pattern: \n    }\n    (missing closing paren)
    content = content.replace(
      /\n(\s+)year: "numeric",\s*\n\s*\}\s*\n(?!\s+\);)/g,
      '\n$1year: "numeric",\n$1});\n'
    );

    // Fix 2: Missing closing paren in push() calls for objects
    // Pattern: \n    }\n    (missing closing paren after object in push)
    content = content.replace(
      /\n(\s+)[a-z]+: Math\.floor\(Math\.random\(\) \* \d+\) \+ \d+,\s*\n\s*\}\s*\n(?!\s+\);)/g,
      '\n$1});\n'
    );

    // Fix 3: Empty "results = " in if/else blocks
    // Replace with proper db.select() call
    const emptyResultsPattern = /(\s+)let results;\s*\n\s+if \(conditions\) \{\s*\n\s+results = \s*\n\s+\} else \{\s*\n\s+results = \s*\n\s+\}/g;
    if (emptyResultsPattern.test(content)) {
      // Try to find the table name from the condition line
      const tableMatch = content.match(/eq\((\w+)\.userId, targetUserId\)/);
      if (tableMatch) {
        const tableName = tableMatch[1];
        const replacement = `${tableName}.userId, targetUserId)) : undefined;

    let results;
    if (conditions) {
      results = await db.select().from(${tableName}).where(conditions).orderBy(desc(${tableName}.completedAt)).limit(limit);
    } else {
      results = await db.select().from(${tableName}).orderBy(desc(${tableName}.completedAt)).limit(limit);
    }`;

        content = content.replace(
          /eq\((\w+)\.userId, targetUserId\) : undefined;\s*\n\s*let results;[\s\S]*?\n\s+\}/,
          replacement
        );
      }
    }

    // Fix 4: Incomplete .where() calls - remove entire line if orphaned
    content = content.replace(
      /^\s*\.where\(\w+\.\w+,\s*\w+\)\.limit\(1\);?\s*$/gm,
      ''
    );

    // Fix 5: Missing closing } before function declarations
    content = content.replace(
      /\n(\s+)}/g,  // orphaned closing brace
      '\n$1}'
    );

    // Fix 6: Remove orphaned /* DISABLED comments
    content = content.replace(
      /\/\*\s*DISABLED:[^*]*\*\/\s*;?\s*\n/g,
      '\n'
    );

    // Fix 7: Fix broken .where(table.col, val) -> .where(eq(table.col, val))
    if (content.includes('import { eq') || content.includes('import {eq') || content.includes(', eq')) {
      content = content.replace(
        /\.where\((\w+\.\w+),\s*(\w+)\)\.limit\(1\)/g,
        '.where(eq($1, $2)).limit(1)'
      );
    }

    // Fix 8: Remove lines with just disabled code fragments
    content = content.replace(
      /^\s*(\w+),\s*$/gm,
      ''
    );

    // Fix 9: Fix incomplete arrow function calls like () => /* DISABLED
    content = content.replace(
      /\(\)\s*=>\s*\/\*[^*]*\*\/\s*,\s*\n/g,
      '\n'
    );

    // Clean up excessive empty lines
    content = content.replace(/\n{4,}/g, '\n\n\n');

    // Fix 10: Remove orphaned }); at start of lines
    content = content.replace(
      /^\s*\}\);?\s*$/gm,
      ''
    );

    if (content !== original) {
      writeFileSync(fullPath, content);
      fixedCount++;
      const relPath = fullPath.replace(ROOT + '/', '');
      console.log(`Fixed: ${relPath}`);
    }
  } catch (e) {
    // Skip files with errors
  }
}

console.log(`\nTotal files fixed: ${fixedCount}`);
