/**
 * Fix empty assignment patterns like:
 *   results =
 *
 * Replaces with proper db.select() pattern
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
console.log(`Processing ${allFiles.length} TypeScript files...`);

let fixedCount = 0;

for (const fullPath of allFiles) {
  try {
    let content = readFileSync(fullPath, 'utf-8');
    const original = content;

    // Pattern 1: Empty results = pattern with if/else
    // Matches:
    //   let results;
    //   if (conditions) {
    //     results =
    //   } else {
    //     results =
    //   }

    // Find the table name being used in the condition
    const emptyResultsMatch = content.match(
      /const conditions = targetUserId \? eq\((\w+)\.userId, targetUserId\) : undefined;\s*\n\s*let results;\s*\n\s*if \(conditions\) \{\s*\n\s*results = \n\s*\} else \{\s*\n\s*results = \n\s*\}/
    );

    if (emptyResultsMatch) {
      const tableName = emptyResultsMatch[1];
      const replacement = `const conditions = targetUserId ? eq(${tableName}.userId, targetUserId) : undefined;

    let results;
    if (conditions) {
      results = await db.select().from(${tableName}).where(conditions).orderBy(desc(${tableName}.completedAt)).limit(limit);
    } else {
      results = await db.select().from(${tableName}).orderBy(desc(${tableName}.completedAt)).limit(limit);
    }`;

      content = content.replace(emptyResultsMatch[0], replacement);
    }

    // Pattern 2: Missing closing parenthesis in toLocaleDateString calls
    // Matches:
    //   year: "numeric",
    // }
    // (missing closing paren for toLocaleDateString)
    content = content.replace(
      /(\s+year: "numeric",)\s*\n\s*\}\s*\n(?!\s*\);)/,
      '$1\n      });\n'
    );

    // Pattern 3: Missing closing paren in push() calls
    // Matches:
    //   payments: Math.floor(Math.random() * 45) + 8,
    // }
    // (missing closing paren for push())
    content = content.replace(
      /(\s+payments: Math\.floor\(Math\.random\(\) \* 45\) \+ 8,)\s*\n\s*\}\s*\n(?!\s*\);)/,
      '$1\n      });\n'
    );

    // Pattern 4: Fix .where(users.id, userId) - only if eq is imported
    if (content.includes('import { eq') || content.includes('import {eq') || content.includes(', eq')) {
      // Be careful - only replace simple cases
      content = content.replace(
        /\.where\((users\.id|students\.id|teachers\.id),\s*(userId|studentId|teacherId)\)\.limit\(1\);?/g,
        '.where(eq($1, $2)).limit(1);'
      );
      content = content.replace(
        /\.where\((\w+\.\w+),\s*(\w+)\)\.limit\(1\)/g,
        '.where(eq($1, $2)).limit(1)'
      );
    }

    // Clean up excessive empty lines
    content = content.replace(/\n{4,}/g, '\n\n\n');

    if (content !== original) {
      writeFileSync(fullPath, content);
      fixedCount++;
      const relPath = fullPath.replace(ROOT + '/', '');
      console.log(`Fixed: ${relPath}`);
    }
  } catch (e) {
    // Skip errors
  }
}

console.log(`\nTotal files fixed: ${fixedCount}`);
