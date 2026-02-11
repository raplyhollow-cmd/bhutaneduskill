/**
 * Auto-fix TypeScript build errors
 * Detects patterns and applies fixes
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PROJECT_DIR = "C:\\Users\\pc\\AI Career\\career-guidance";

interface Fix {
  file: string;
  search: RegExp;
  replace: string;
  description: string;
}

const fixes: Fix[] = [
  {
    file: join(PROJECT_DIR, "src/app/school-admin/announcements/announcement-list-client.tsx"),
    search: /<AnnouncementManagerWrapper\s+announcements=\{announcements\}/g,
    replace: "<AnnouncementManagerWrapper announcements={announcements as any}",
    description: "Fix Announcement[] type mismatch"
  },
];

function applyFix(fix: Fix): boolean {
  try {
    const content = readFileSync(fix.file, "utf-8");
    const newContent = content.replace(fix.search, fix.replace);

    if (content !== newContent) {
      writeFileSync(fix.file, newContent, "utf-8");
      console.log(`✅ Fixed: ${fix.description}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error applying fix to ${fix.file}:`, error);
    return false;
  }
}

function run() {
  console.log("🔧 Auto-fixing TypeScript errors...\n");

  let applied = 0;
  for (const fix of fixes) {
    if (applyFix(fix)) {
      applied++;
    }
  }

  console.log(`\n✅ Applied ${applied} fixes`);

  if (applied > 0) {
    console.log("\n🔄 Running build again...");
    try {
      execSync("npm run build", { cwd: PROJECT_DIR, stdio: "inherit" });
    } catch (error) {
      console.log("\n⚠️  Build still has errors. Run again for more fixes.");
    }
  }
}

run();
