/**
 * Replace console.log with logger.debug
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

// Check if logger is already imported
function hasLoggerImport(content) {
  return /import\s+{\s*logger\s*}/.test(content) ||
         /import\s+logger\s+from/.test(content) ||
         /from\s+["']@\/lib\/logger["']/.test(content);
}

// Add logger import if not present
function addLoggerImport(content) {
  if (hasLoggerImport(content)) {
    return content;
  }

  // Find the first import line
  const importMatch = content.match(/^import\s+.*$/m);
  if (importMatch) {
    const insertPos = importMatch.index + importMatch[0].length + 1;
    return content.slice(0, insertPos) +
      `import { logger } from "@/lib/logger";\n` +
      content.slice(insertPos);
  }

  // If no imports, add at the top
  return `import { logger } from "@/lib/logger";\n` + content;
}

function migrateFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let modified = false;

  // Replace console.log with logger.debug
  if (content.includes('console.log')) {
    content = content.replace(/console\.log\(/g, 'logger.debug(');
    modified = true;
  }

  // Replace console.error with logger.error
  if (content.includes('console.error')) {
    content = content.replace(/console\.error\(/g, 'logger.error(');
    modified = true;
  }

  // Replace console.warn with logger.warn
  if (content.includes('console.warn')) {
    content = content.replace(/console\.warn\(/g, 'logger.warn(');
    modified = true;
  }

  // Replace console.info with logger.info
  if (content.includes('console.info')) {
    content = content.replace(/console\.info\(/g, 'logger.info(');
    modified = true;
  }

  if (modified && !hasLoggerImport(originalContent)) {
    content = addLoggerImport(content);
  }

  if (content !== originalContent) {
    writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

function findFiles(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true });

  for (const entry of entries) {
    if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const fullPath = join(dir, entry.name);
      try {
        const content = readFileSync(fullPath, 'utf-8');
        if (content.includes('console.log') || content.includes('console.error') ||
            content.includes('console.warn') || content.includes('console.info')) {
          files.push(fullPath);
        }
      } catch {}
    }
  }
  return files;
}

const srcDir = join(ROOT_DIR, 'src');
const files = findFiles(srcDir);

console.log(`Processing ${files.length} files with console statements...\n`);

let fixed = 0;
for (const file of files) {
  try {
    if (migrateFile(file)) {
      fixed++;
      console.log(`✓ ${file.replace(ROOT_DIR, '')}`);
    }
  } catch (err) {
    console.log(`✗ ${file}: ${err.message}`);
  }
}

console.log(`\nFixed ${fixed} files`);
