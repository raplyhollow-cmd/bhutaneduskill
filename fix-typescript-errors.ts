#!/usr/bin/env node
/**
 * TypeScript Error Auto-Fixer
 *
 * Run after node import: node fix-typescript-errors.ts
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SRC_DIR = 'src';

interface ErrorFix {
  pattern: RegExp;
  replacement: string;
  description: string;
  files: string[];
}

const fixes: ErrorFix[] = [
  {
    pattern: /variant="ceramic"/g,
    replacement: 'variant="elevated"',
    description: 'ceramic → elevated variant',
    files: [],
  },
  {
    pattern: /size="icon-xs"/g,
    replacement: 'size="icon" className="h-6 w-6"',
    description: 'icon-xs → icon with className',
    files: [],
  },
  {
    pattern: /const\s+message\s*=\s*error\.message/g,
    replacement: 'const message = error instanceof Error ? error.message : "Unknown error"',
    description: 'Safe error.message access',
    files: [],
  },
];

function getAllFiles(dir: string, extension: string): string[] {
  const files: string[] = [];

  function traverse(currentDir: string) {
    const items = readdirSync(currentDir);

    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and .next
        if (!item.includes('node_modules') && !item.includes('.next') && !item.startsWith('.')) {
          traverse(fullPath);
        }
      } else if (item.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function applyFix(content: string, fix: ErrorFix): string {
  return content.replace(fix.pattern, fix.replacement);
}

function main() {
  console.log('🔧 TypeScript Error Auto-Fixer\n');

  const tsFiles = getAllFiles(SRC_DIR, '.ts');
  const tsxFiles = getAllFiles(SRC_DIR, '.tsx');
  const allFiles = [...tsFiles, ...tsxFiles];

  console.log(`Found ${allFiles.length} TypeScript files\n`);

  let totalFixes = 0;

  for (const fix of fixes) {
    console.log(`Applying: ${fix.description}`);

    for (const file of allFiles) {
      try {
        let content = readFileSync(file, 'utf-8');
        const newContent = applyFix(content, fix);

        if (content !== newContent) {
          writeFileSync(file, newContent, 'utf-8');
          totalFixes++;
          fix.files.push(file);
        }
      } catch (err) {
        // Skip files that can't be read
      }
    }

    console.log(`  → Fixed ${fix.files.length} files\n`);
  }

  console.log(`\n✅ Total fixes applied: ${totalFixes}`);

  console.log('\n📊 Running TypeScript check...\n');
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
  } catch {
    console.log('\n⚠️  Some errors remain. Check output above.');
  }
}

main();
