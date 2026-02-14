/**
 * Build Error Batch Scanner
 *
 * Scans ALL Next.js build errors in ONE run and groups them by type.
 * Outputs a prioritized markdown report with actionable fix hints.
 *
 * Usage: npm run scan:errors
 * Or: npx tsx scripts/scan-build-errors.ts
 *
 * Based on the proven batch-fix approach that resolved 173 TypeScript errors in 30 minutes.
 */

import { execSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PROJECT_DIR = __dirname;
const REPORT_FILE = join(PROJECT_DIR, "..", "build-errors-report.md");

interface BuildError {
  file: string;
  line: number;
  type: 'critical' | 'high' | 'medium';
  category: string;
  message: string;
  fixHint: string;
  code?: string;
}

interface ErrorReport {
  timestamp: string;
  totalErrors: number;
  byType: Record<string, number>;
  errors: BuildError[];
  batchFixes: BatchFixOpportunity[];
}

interface BatchFixOpportunity {
  category: string;
  count: number;
  files: string[];
  suggestedAction: string;
}

/**
 * Error patterns for detection and categorization
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  category: string;
  priority: 'critical' | 'high' | 'medium';
  fixHint: (match: RegExpMatchArray) => string;
  extractCode?: (match: RegExpMatchArray) => string;
}> = [
  // Critical: Build lock
  {
    pattern: /Unable to acquire lock.*another instance of next build running/i,
    category: "Build Lock",
    priority: "critical",
    fixHint: () => `Stop other build processes (Ctrl+C in other terminals, or \`taskkill /F /IM node.exe\`)`
  },

  // Critical: Module not found
  // Critical: Module not found
  {
    pattern: /Module not found: Can't resolve\s+'([^']+)'\s+in\s+'([^']+)'/,
    category: "Module Not Found",
    priority: "critical",
    fixHint: (m) => `Install module: \`npm install ${m[1]}\` or fix import path in \`${m[2]}\``
  },
  {
    pattern: /Module not found: Can't resolve\s+'([^']+)'/,
    category: "Module Not Found",
    priority: "critical",
    fixHint: (m) => `Install module: \`npm install ${m[1]}\` or fix import path`
  },

  // Critical: Missing environment variables
  {
    pattern: /process\.env\.(\w+)\s+(is not defined|has no value)/,
    category: "Missing Environment Variable",
    priority: "critical",
    fixHint: (m) => `Add \`${m[1]}\` to your \`.env\` file or provide a default value`
  },

  // Critical: Export not found
  {
    pattern: /export '([^']+)' \(imported as '([^']+)'\) was not found in '([^']+)'/,
    category: "Export Not Found",
    priority: "critical",
    fixHint: (m) => `Check if \`${m[1]}\` is exported from \`${m[3]}\`, or fix the import in \`${m[2]}\``
  },
  {
    pattern: /export '([^']+)' was not found in '([^']+)'/,
    category: "Export Not Found",
    priority: "critical",
    fixHint: (m) => `Check if \`${m[1]}\` is exported from \`${m[2]}\` or fix the import`
  },

  // High: TypeScript type errors
  {
    pattern: /Type '([^']+)' is not assignable to type '([^']+)'/,
    category: "TypeScript Type Mismatch",
    priority: "high",
    fixHint: (m) => `Type mismatch: \`${m[1]}\` cannot be assigned to \`${m[2]}\`. Add type conversion or fix schema`,
    extractCode: (m) => `${m[1]} → ${m[2]}`
  },
  {
    pattern: /Property '([^']+)' does not exist on type '([^']+)'/,
    category: "Property Does Not Exist",
    priority: "high",
    fixHint: (m) => `Property \`${m[1]}\` missing from type \`${m[2]}\`. Check schema or add property`,
    extractCode: (m) => `${m[2]}.${m[1]}`
  },
  {
    pattern: /Type '([^' ]+)' is missing the following properties from type '([^' ]+)': ([\w\s,]+)/,
    category: "Missing Properties",
    priority: "high",
    fixHint: (m) => `Missing properties: \`${m[3]}\`. Add to \`${m[1]}\` or use Partial<\`${m[2]}\`>`
  },
  {
    pattern: /Argument of type '([^']+)' is not assignable to parameter of type '([^']+)'/,
    category: "TypeScript Argument Type Error",
    priority: "high",
    fixHint: (m) => `Argument type mismatch. Convert \`${m[1]}\` to \`${m[2]}\` or fix function signature`
  },

  // High: Database/Drizzle errors
  {
    pattern: /column "([^"]+)" does not exist/i,
    category: "Database Column Missing",
    priority: "high",
    fixHint: (m) => `Column \`${m[1]}\` not found in database. Add to \`schema.ts\` or run migration`
  },
  {
    pattern: /relation "([^"]+)" does not exist/i,
    category: "Database Relation Missing",
    priority: "high",
    fixHint: (m) => `Table/relation \`${m[1]}\` not found. Check schema or create table`
  },

  // High: Build compilation errors
  {
    pattern: /Failed to compile/,
    category: "Build Failed",
    priority: "high",
    fixHint: () => `Build compilation failed. Check for syntax errors, missing dependencies, or type errors above`
  },

  // Medium: ESLint warnings
  {
    pattern: /'([^']+)' is assigned a value but never used/,
    category: "Unused Variable",
    priority: "medium",
    fixHint: (m) => `Remove unused variable \`${m[1]}\` or use it in your code`
  },
  {
    pattern: /'([^']+)' is defined but never used/,
    category: "Unused Import/Definition",
    priority: "medium",
    fixHint: (m) => `Remove unused import/definition \`${m[1]}\``
  },

  // Medium: React/Next.js specific
  {
    pattern: /Text content does not match server-rendered HTML/,
    category: "Hydration Mismatch",
    priority: "medium",
    fixHint: () => `Hydration error. Check for conditional rendering, use \`useEffect\` for client-only content`
  },
  {
    pattern: /Hooks can only be called inside of the body of a function component/,
    category: "React Hook Rule Violation",
    priority: "medium",
    fixHint: () => `React hook called outside component. Move hook inside component or follow Rules of Hooks`
  },

  // Medium: CSS/Styled-jsx
  {
    pattern: /CSS syntax error/i,
    category: "CSS Syntax Error",
    priority: "medium",
    fixHint: () => `Fix CSS syntax. Check for missing semicolons, invalid selectors, or malformed properties`
  },
];

/**
 * Extract file and line number from error lines
 */
function extractFileLine(line: string): { file: string; lineNum: number } | null {
  // Next.js error format: "src/app/page.tsx:42:15"
  const nextJsMatch = line.match(/^([\w\\/.-]+):(\d+):?\d*$/);
  if (nextJsMatch) {
    return { file: nextJsMatch[1], lineNum: parseInt(nextJsMatch[2], 10) };
  }

  // TypeScript error format: "src/app/page.tsx(42,15):"
  const tsMatch = line.match(/^([\w\\/.-]+)\((\d+),?\d*\):/);
  if (tsMatch) {
    return { file: tsMatch[1], lineNum: parseInt(tsMatch[2], 10) };
  }

  return null;
}

/**
 * Parse build output and extract all errors
 */
function parseBuildOutput(output: string): BuildError[] {
  const errors: BuildError[] = [];
  const lines = output.split("\n");
  let currentFile = "";
  let currentLine = 0;
  let currentError = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and non-error lines
    if (!line || line.includes("Building") || line.includes("Compiling") || line.includes("✓")) {
      continue;
    }

    // Extract file and line if present
    const fileMatch = extractFileLine(line);
    if (fileMatch) {
      currentFile = fileMatch.file;
      currentLine = fileMatch.lineNum;
    }

    // Try to match error patterns
    let matched = false;
    for (const pattern of ERROR_PATTERNS) {
      const match = line.match(pattern.pattern);
      if (match) {
        errors.push({
          file: currentFile || "Unknown",
          line: currentLine || 0,
          type: pattern.priority,
          category: pattern.category,
          message: line,
          fixHint: pattern.fixHint(match),
          code: pattern.extractCode?.(match)
        });
        matched = true;
        break;
      }
    }

    // If no pattern matched but line contains error keywords, add as generic error
    if (!matched && (line.includes("Error") || line.includes("error:"))) {
      currentError = line;
      // Look ahead for context
      let context = "";
      for (let j = 1; j <= 3 && i + j < lines.length; j++) {
        if (lines[i + j].trim()) {
          context += lines[i + j].trim() + " ";
        }
      }
      errors.push({
        file: currentFile || "Unknown",
        line: currentLine || 0,
        type: "high",
        category: "Generic Error",
        message: line + " " + context,
        fixHint: "Review the error message and fix the underlying issue"
      });
    }
  }

  return errors;
}

/**
 * Group errors by category and find batch fix opportunities
 */
function findBatchFixes(errors: BuildError[]): BatchFixOpportunity[] {
  const categoryMap = new Map<string, BuildError[]>();

  for (const error of errors) {
    if (!categoryMap.has(error.category)) {
      categoryMap.set(error.category, []);
    }
    categoryMap.get(error.category)!.push(error);
  }

  const fixes: BatchFixOpportunity[] = [];
  const fileSets = new Map<string, Set<string>>();

  for (const [category, categoryErrors] of categoryMap) {
    const files = new Set(categoryErrors.map(e => e.file));

    fixes.push({
      category,
      count: categoryErrors.length,
      files: Array.from(files).slice(0, 10), // Limit to top 10 files
      suggestedAction: getBatchFixAction(category, categoryErrors)
    });
  }

  // Sort by count (most frequent first)
  return fixes.sort((a, b) => b.count - a.count);
}

function getBatchFixAction(category: string, errors: BuildError[]): string {
  switch (category) {
    case "Module Not Found":
      return `Install all missing modules: \`npm install ${[...new Set(errors.map(e => e.message.match(/'([^']+)'/)?.[1]))].join(" ")}\``;
    case "TypeScript Type Mismatch":
    case "Property Does Not Exist":
      return `Fix related schema/types in one file, then rebuild`;
    case "Missing Environment Variable":
      return `Add all missing env vars to \`.env\` at once`;
    case "Export Not Found":
      return `Review all imports and exports in affected files`;
    default:
      return `Fix all ${errors.length} ${category.toLowerCase()} errors together`;
  }
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(errors: BuildError[], batchFixes: BatchFixOpportunity[]): string {
  const timestamp = new Date().toISOString();
  const totalErrors = errors.length;

  const byType = {
    critical: errors.filter(e => e.type === 'critical').length,
    high: errors.filter(e => e.type === 'high').length,
    medium: errors.filter(e => e.type === 'medium').length
  };

  let md = `# Build Error Scan Report

**Generated:** ${new Date().toLocaleString()}
**Total Errors:** ${totalErrors}

## Summary

| Priority | Count |
|----------|-------|
| 🔴 Critical | ${byType.critical} |
| 🟠 High | ${byType.high} |
| 🟡 Medium | ${byType.medium} |

---

`;

  // Critical errors section
  const criticalErrors = errors.filter(e => e.type === 'critical');
  if (criticalErrors.length > 0) {
    md += `## 🔴 Critical Errors (Fix First)

These errors will completely block your build. Fix these first.

`;

    for (const error of criticalErrors) {
      md += `### [${error.category}] \`${error.file}:${error.line || '?'}\`

\`\`\`
${error.message.slice(0, 200)}${error.message.length > 200 ? '...' : ''}
\`\`\`

**Fix:** ${error.fixHint}

---
`;
    }
  }

  // High priority section
  const highErrors = errors.filter(e => e.type === 'high');
  if (highErrors.length > 0) {
    md += `## 🟠 High Priority Errors

${highErrors.length} high-priority errors that should be fixed after critical errors.

`;

    for (const error of highErrors.slice(0, 20)) { // Limit to 20 for readability
      md += `#### [${error.category}] \`${error.file}:${error.line || '?'}\`

${error.message.slice(0, 150)}${error.message.length > 150 ? '...' : ''}

**Fix:** ${error.fixHint}

`;
    }

    if (highErrors.length > 20) {
      md += `\n_*... and ${highErrors.length - 20} more high-priority errors_*\n\n`;
    }
  }

  // Medium priority section
  const mediumErrors = errors.filter(e => e.type === 'medium');
  if (mediumErrors.length > 0) {
    md += `## 🟡 Medium Priority Errors

${mediumErrors.length} medium-priority warnings.

`;

    for (const error of mediumErrors.slice(0, 15)) {
      md += `- \`${error.file}:${error.line || '?'}\` - ${error.message.slice(0, 100)}\n`;
    }

    if (mediumErrors.length > 15) {
      md += `\n_*... and ${mediumErrors.length - 15} more medium-priority errors_*\n\n`;
    }
  }

  // Batch fix recommendations
  if (batchFixes.length > 0) {
    md += `## 💡 Batch Fix Opportunities

Fix these groups of errors together for maximum efficiency:

| Category | Count | Suggested Action |
|----------|-------|------------------|
`;
    for (const fix of batchFixes.slice(0, 10)) {
      md += `| ${fix.category} | ${fix.count} | ${fix.suggestedAction.slice(0, 60)}${fix.suggestedAction.length > 60 ? '...' : ''} |\n`;
    }

    md += `\n### Detailed Batch Fixes

`;
    for (const fix of batchFixes) {
      md += `#### ${fix.category} (${fix.count} errors)

**Action:** ${fix.suggestedAction}

**Files affected:**
`;
      for (const file of fix.files.slice(0, 5)) {
        md += `- \`${file}\`\n`;
      }
      if (fix.files.length > 5) {
        md += `- _... and ${fix.files.length - 5} more files_\n`;
      }
      md += `\n`;
    }
  }

  // Time estimate
  md += `## ⏱️ Estimated Fix Time

| Approach | Estimated Time |
|----------|---------------|
| **Batch fix (recommended)** | ${Math.max(15, Math.floor(totalErrors / 5))}-${Math.max(30, Math.floor(totalErrors / 2))} minutes |
| One-by-one iterative | ${Math.floor(totalErrors * 1.5)}-${Math.floor(totalErrors * 3)} minutes |

**Recommendation:** Use the batch fix approach - fix all errors of the same category together, then rebuild.

---

## Next Steps

1. ✅ Review critical errors above
2. ✅ Apply batch fixes for common error categories
3. ✅ Re-run this scanner: \`npm run scan:errors\`
4. ✅ Repeat until all errors are resolved

---

*Report generated by scan-build-errors.ts*
`;
  return md;
}

/**
 * Build lock error handler
 */
function isBuildLockError(output: string): boolean {
  return output.includes("Unable to acquire lock") ||
         output.includes("another instance of next build running");
}

/**
 * Kill running Next.js build processes
 */
function killBuildProcesses(): string {
  try {
    // Try to kill node processes that might be running builds
    execSync("taskkill /F /IM node.exe /T 2>nul", { windowsHide: true });
    return "Attempted to terminate node processes. Please wait a moment and try again.";
  } catch {
    return "Could not terminate processes automatically.";
  }
}

/**
 * Main function
 */
function main() {
  console.log("🔍 Scanning build errors...");
  console.log("⏳ Running build (this may take a minute)...\n");

  try {
    // Run build and capture output
    const buildOutput = execSync("npm run build", {
      cwd: PROJECT_DIR,
      encoding: "utf-8",
      stdio: "pipe",
      timeout: 180000 // 3 minutes
    });

    console.log("✅ Build successful! No errors found.");
    writeFileSync(REPORT_FILE, `# Build Error Scan Report\n\n✅ **Build Successful!**\n\nNo errors found. Your build completed successfully at ${new Date().toLocaleString()}.`);
    return;

  } catch (error: any) {
    const output = (error.stdout || "") + (error.stderr || "");

    // Check for build lock error
    if (isBuildLockError(output)) {
      console.error("⚠️ BUILD LOCK DETECTED");
      console.error("\nAnother build process is already running.");
      console.error("\nOptions:");
      console.error("  1. Wait for other build to complete, then run again");
      console.error("  2. Kill other build processes:");
      console.error("     - Find the terminal/process running the build");
      console.error("     - Or run: taskkill /F /IM node.exe /T");
      console.error("\n" + killBuildProcesses());
      process.exit(2);
      return;
    }

    console.log("📊 Parsing build output...\n");

    // Parse errors
    const errors = parseBuildOutput(output);
    const batchFixes = findBatchFixes(errors);

    console.log(`✨ Found ${errors.length} errors`);
    console.log(`   🔴 Critical: ${errors.filter(e => e.type === 'critical').length}`);
    console.log(`   🟠 High: ${errors.filter(e => e.type === 'high').length}`);
    console.log(`   🟡 Medium: ${errors.filter(e => e.type === 'medium').length}`);

    // Generate report
    const report = generateMarkdownReport(errors, batchFixes);
    writeFileSync(REPORT_FILE, report);

    console.log(`\n📝 Report saved to: ${REPORT_FILE}`);
    console.log(`🔗 Open the file to see detailed error analysis\n`);

    // Print summary to console
    if (batchFixes.length > 0) {
      console.log("💡 Top batch fix opportunities:");
      for (const fix of batchFixes.slice(0, 5)) {
        console.log(`   ${fix.category}: ${fix.count} errors`);
      }
    }

    process.exit(1);
  }
}

main();
