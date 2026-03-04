/**
 * CLEANUP SCRIPT - Fix broken imports after migration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Files to delete (pages that need full rewrite)
const PAGES_TO_DELETE = [
  'src/app/student/homework/page.tsx',
  'src/app/teacher/homework/create/page.tsx',
  'src/app/teacher/homework/page.tsx',
  'src/app/teacher/homework/[id]/grade/page.tsx',
  'src/app/teacher/attendance/page.tsx',
  'src/app/student/settings/page.tsx',
];

// Replacements for imports
const REPLACEMENTS = [
  {
    from: '@/components/homework',
    to: '@/components/unified',
    action: 'replace',
  },
  {
    from: '@/components/attendance',
    to: '@/components/unified',
    action: 'replace',
  },
  {
    from: '@/components/forms',
    to: '@/components/unified',
    action: 'replace',
  },
  {
    from: '@/components/tables',
    to: '@/components/unified',
    action: 'replace',
  },
  {
    from: '@/components/modals',
    to: '@/components/unified',
    action: 'replace',
  },
];

function log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function deleteFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

function replaceInFile(filePath: string, from: string, to: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes(from)) {
        content = content.replaceAll(from, to);
        fs.writeFileSync(filePath, content);
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function cleanup() {
  log('\n=== CLEANUP: Fixing Broken Imports ===\n', 'info');

  let deletedCount = 0;
  let fixedCount = 0;

  // Delete pages that need full rewrite
  for (const file of PAGES_TO_DELETE) {
    const fullPath = path.join(ROOT, file);
    if (deleteFile(fullPath)) {
      log(`  ✓ Deleted: ${file}`, 'success');
      deletedCount++;
    }
  }

  // Fix imports in remaining files
  const searchDir = path.join(ROOT, 'src/app');
  function processDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        processDir(fullPath);
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        for (const replacement of REPLACEMENTS) {
          if (replaceInFile(fullPath, replacement.from, replacement.to)) {
            log(`  ✓ Fixed: ${path.relative(ROOT, fullPath)}`, 'warning');
            fixedCount++;
          }
        }
      }
    }
  }

  processDir(searchDir);

  log(`\n  Deleted ${deletedCount} pages`, 'success');
  log(`  Fixed imports in ${fixedCount} files`, 'success');
  log('\n✅ CLEANUP COMPLETE!\n', 'success');
}

cleanup().catch(console.error);
