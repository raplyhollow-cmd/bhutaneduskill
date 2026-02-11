/**
 * Automated TypeScript Error Fixing Script
 *
 * This script automatically detects and fixes common TypeScript errors
 * by applying regex-based patterns across the codebase.
 *
 * Usage: npx ts-node scripts/auto-fix-typescript.ts
 * Or: npm run fix:types
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const PROJECT_DIR = "C:\\Users\\pc\\AI Career\\career-guidance";

/**
 * Comments that should be preserved - don't modify lines containing these
 */
const PRESERVE_COMMENTS = [
  /\/\/ @ts-expect-error/,
  /\/\/ \/\/ @ts-expect-error/,
  /\/\/ ts-ignore/,
];

interface FixPattern {
  name: string;
  filePattern: RegExp;
  find: RegExp;
  replace: string | ((match: string, ...groups: string[]) => string);
  description: string;
}

/**
 * Fix patterns for common TypeScript errors
 */
const fixes: FixPattern[] = [
  {
    name: "optional-chaining-array-access",
    filePattern: /classes\/\[id\]\/page\.tsx$/,
    find: /(\w+)\.(\w+)\[0\](?!\?\s*\[)/g,
    replace: "($1.$2?.[0] ?? '')",
    description: "Add optional chaining to array access (firstName[0] -> firstName?.[0] ?? '')"
  },
  {
    name: "safe-first-initial",
    filePattern: /classes\/\[id\]\/page\.tsx$/,
    find: /\((\w+\.(\w+)\s+&&\s+\2\.(\w+)\[0\])\s+\|\|\s+""\)\s*\+\s*\((\w+\.(\w+)\s+&&\s+\6\.(\w+)\[0\])\s+\|\|\s+""\)/g,
    replace: "($1?.[0] ?? '') + ($4?.[0] ?? '')",
    description: "Simplify safe first initial concatenation"
  },
  {
    name: "optional-name-display",
    filePattern: /classes\/\[id\]\/page\.tsx$/,
    find: /\{(\w+)\.(\w+)\}\s*\{\s*(\2)\.(\w+)\s*\}/g,
    replace: "{ $1?.[$2 ?? ''] ?? '' }",
    description: "Add optional chaining for name display"
  },
  {
    name: "null-to-undefined",
    filePattern: /announcement.*\.tsx?$/,
    find: /excerpt:\s*(selectedAnnouncement\.excerpt)/g,
    replace: "excerpt: (selectedAnnouncement.excerpt ?? undefined)",
    description: "Convert null to undefined for excerpt field"
  },
  {
    name: "sql-count-function",
    filePattern: /attendance\/page\.tsx$/,
    find: /count:\s*\{\s*count:\s*\(\)\s*=>\s*1\s*\}/g,
    replace: "count: sql`COUNT(*)`",
    description: "Fix SQL count function syntax"
  }
];

/**
 * Runs the build and returns the output
 */
function runBuild(): string {
  try {
    return execSync("npm run build", {
      cwd: PROJECT_DIR,
      encoding: "utf-8",
      stdio: "pipe",
      timeout: 120000
    });
  } catch (error: any) {
    return error.stdout + error.stderr;
  }
}

/**
 * Extracts TypeScript errors from build output
 */
function extractErrors(buildOutput: string): Array<{ file: string; line: string; message: string }> {
  const errors: Array<{ file: string; line: string; message: string }> = [];
  const lines = buildOutput.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("Type error:") || (line.includes("Property") && line.includes("does not exist"))) {
      // Extract file path
      const fileMatch = line.match(/\.\/(.+\.tsx)/);
      if (fileMatch) {
        errors.push({
          file: fileMatch[1],
          line: line.trim(),
          message: lines[i + 1]?.trim() || ""
        });
      }
    }
  }
  return errors;
}

/**
 * Applies fixes to a single file
 * Skips lines that contain preserved comments (@ts-expect-error, ts-ignore)
 */
function applyFixesToFile(filePath: string): boolean {
  if (!existsSync(filePath)) {
    return false;
  }

  const content = readFileSync(filePath, "utf-8");
  let newContent = content;
  let applied = false;

  for (const fix of fixes) {
    if (!fix.filePattern.test(filePath)) continue;

    const before = newContent;
    newContent = newContent.replace(fix.find, (match, ...groups) => {
      // Check if the line contains a preserved comment
      const lines = newContent.split("\n");
      for (const line of lines) {
        if (line.includes(match)) {
          // Check if this line or the line before/after has a preserved comment
          const lineIndex = lines.indexOf(line);
          const checkLines = [
            lines[lineIndex - 1],
            line,
            lines[lineIndex + 1]
          ].filter(Boolean);

          for (const checkLine of checkLines) {
            for (const preservePattern of PRESERVE_COMMENTS) {
              if (preservePattern.test(checkLine)) {
                // Don't modify - preserve the original
                return match;
              }
            }
          }
        }
      }
      // No preserved comment found, apply the fix
      return typeof fix.replace === "function"
        ? fix.replace(match, ...groups)
        : fix.replace;
    });

    if (before !== newContent) {
      console.log(`  ✅ ${fix.description}`);
      console.log(`     File: ${filePath}`);
      applied = true;
    }
  }

  if (applied) {
    writeFileSync(filePath, newContent, "utf-8");
  }
  return applied;
}

/**
 * Scans directory and applies fixes
 */
function scanAndFix(dryRun = false): number {
  let fixed = 0;
  const srcDir = join(PROJECT_DIR, "src");

  function scanDir(dir: string) {
    if (!existsSync(dir)) return;

    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
        if (applyFixesToFile(fullPath)) {
          fixed++;
        }
      }
    }
  }

  scanDir(srcDir);
  return fixed;
}

/**
 * Main function
 */
function main() {
  console.log("🔧 Auto-fixing TypeScript errors...\n");
  console.log("Analyzing current build...\n");

  const buildOutput = runBuild();
  const errors = extractErrors(buildOutput);

  if (errors.length === 0) {
    console.log("✅ No TypeScript errors found!");
    console.log("\nBuild is successful!");
    return;
  }

  console.log(`Found ${errors.length} TypeScript errors\n`);

  // Group errors by file
  const errorsByFile = new Map<string, number>();
  for (const error of errors) {
    const count = errorsByFile.get(error.file) || 0;
    errorsByFile.set(error.file, count + 1);
  }

  console.log("Errors by file:");
  for (const [file, count] of errorsByFile) {
    console.log(`  ${file}: ${count} error(s)`);
  }

  console.log("\n🔧 Applying fixes...\n");

  const fixed = scanAndFix();

  if (fixed > 0) {
    console.log(`\n✅ Fixed ${fixed} file(s)`);
    console.log("\n🔄 Run build again to verify:");
    console.log("   npm run build");
  } else {
    console.log("\n⚠️  No automatic fixes could be applied.");
    console.log("\nThese errors require manual fixing:");

    // Show unique error messages
    const uniqueMessages = new Set<string>();
    for (const error of errors) {
      // Extract the actual error message
      const match = error.line.match(/Type error:\s*(.+)/);
      if (match) {
        uniqueMessages.add(match[1]);
      }
    }

    for (const msg of uniqueMessages) {
      console.log(`  - ${msg}`);
    }
  }
}

// Run if called directly
main();
