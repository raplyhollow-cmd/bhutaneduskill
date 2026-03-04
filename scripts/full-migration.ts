/**
 * FULL MIGRATION SCRIPT
 *
 * This script migrates the entire codebase from manual APIs/Components
 * to the Unified Architecture system.
 *
 * WARNING: This will DELETE old files!
 *
 * Run: npx tsx scripts/full-migration.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// ============================================================================
// CONFIGURATION
// ============================================================================

interface TableMetadata {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    isPrimary: boolean;
  }>;
}

// Tables from schema.ts that need feature definitions
const TABLES_TO_MIGRATE: string[] = [
  // Core tables
  'users', 'schools', 'students', 'teachers', 'classes', 'subjects',
  'departments', 'batches', 'sections',

  // Academic
  'attendance', 'homework', 'lessons', 'exams', 'results', 'assessments',
  'grades', 'submissions', 'rubrics',

  // Skills & Career
  'skills', 'student_skills', 'careers', 'career_matches',
  'learning_paths', 'roadmaps',

  // Behavior & Interventions
  'behavior_records', 'interventions', 'counselor_notes',
  'treatment_plans',

  // Transport
  'transport', 'transport_allocations', 'transport_routes',

  // Library
  'library_books', 'library_loans', 'library_fines',

  // Fees & Billing
  'fees', 'fee_payments', 'invoices', 'plans', 'subscriptions',

  // Communications
  'announcements', 'notifications', 'messages', 'communication',

  // Reports & Analytics
  'reports', 'analytics', 'audit_logs',

  // Teaching Resources
  'teaching_resources', 'resource_shares',

  // Meetings & Sessions
  'meetings', 'sessions', 'appointments',

  // Timetable
  'timetables', 'timetable_slots', 'schedule_exceptions',

  // Ministry
  'workforce_data', 'gnh_indicators', 'skill_gaps',
];

// Old API routes to DELETE
const OLD_API_ROUTES = [
  'src/app/api/students',
  'src/app/api/teachers',
  'src/app/api/classes',
  'src/app/api/subjects',
  'src/app/api/attendance',
  'src/app/api/homework',
  'src/app/api/lessons',
  'src/app/api/exams',
  'src/app/api/results',
  'src/app/api/assessments',
  'src/app/api/skills',
  'src/app/api/careers',
  'src/app/api/behavior',
  'src/app/api/interventions',
  'src/app/api/transport',
  'src/app/api/library',
  'src/app/api/fees',
  'src/app/api/announcements',
  'src/app/api/reports',
  'src/app/api/teaching-resources',
  'src/app/api/meetings',
  'src/app/api/timetables',
  'src/app/api/ministry',
  // Add more as needed...
];

// Old components to DELETE (will be replaced by unified)
const OLD_COMPONENTS = [
  'src/components/students',
  'src/components/teachers',
  'src/components/classes',
  'src/components/subjects',
  'src/components/attendance',
  'src/components/homework',
  'src/components/lessons',
  'src/components/exams',
  'src/components/forms',
  'src/components/tables',
  'src/components/modals',
  // Add more as needed...
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m',
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function deleteDirectory(dirPath: string): boolean {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      return true;
    }
    return false;
  } catch (error) {
    log(`Failed to delete ${dirPath}: ${error}`, 'error');
    return false;
  }
}

function deleteFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    log(`Failed to delete ${filePath}: ${error}`, 'error');
    return false;
  }
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function toCamelCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toLowerCase());
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

function singularize(str: string): string {
  // Simple pluralization rules
  if (str.endsWith('ies')) return str.slice(0, -3) + 'y';
  if (str.endsWith('ses')) return str.slice(0, -2);
  if (str.endsWith('s')) return str.slice(0, -1);
  return str;
}

// ============================================================================
// FEATURE DEFINITION GENERATOR
// ============================================================================

function generateFeatureDefinition(tableName: string): string {
  const featureName = singularize(toCamelCase(tableName));
  const title = toPascalCase(singularize(tableName));
  const titlePlural = toPascalCase(tableName);

  return `/**
 * ${title} Feature Definition
 *
 * Auto-generated by migration script
 * Generated: ${new Date().toISOString()}
 */

import { defineFeature } from "@/lib/features/define-feature";

export const ${title}Feature = defineFeature({
  name: "${tableName}",
  tableName: "${tableName}",

  schema: {
    id: {
      type: "text",
      required: true,
      primary: true,
      label: "ID",
    },
    name: {
      type: "text",
      required: true,
      label: "Name",
      sortable: true,
    },
    createdAt: {
      type: "timestamp",
      label: "Created At",
      sortable: true,
    },
    updatedAt: {
      type: "timestamp",
      label: "Updated At",
      sortable: true,
    },
  },

  permissions: {
    read: ["school-admin", "teacher", "ministry"],
    create: ["school-admin"],
    update: ["school-admin"],
    delete: ["school-admin"],
  },

  ui: {
    title: "${title}",
    titlePlural: "${titlePlural}",
    basePath: "/admin/${tableName}",
    icon: "FileText",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "createdAt", label: "Created", sortable: true },
    ],
  },

  listConfig: {
    defaultSort: { field: "createdAt", order: "desc" },
    pageSize: 20,
    searchable: true,
  },
});
`;
}

// ============================================================================
// PAGE GENERATOR
// ============================================================================

function generateListPage(featureName: string, tableName: string): string {
  const Title = toPascalCase(singularize(featureName));
  const titlePlural = toPascalCase(tableName);

  return `"use client";

import { FeatureListPage } from "@/components/unified";
import { ${Title}Feature } from "@/features";

export default function ${titlePlural}Page() {
  return (
    <FeatureListPage
      feature={${Title}Feature}
      title="${titlePlural}"
      onCreate={() => window.location.href = "/admin/${tableName}/new"}
      onEdit={(id) => window.location.href = \`/admin/${tableName}/\${id}/edit\`}
    />
  );
}
`;
}

function generateNewPage(featureName: string, tableName: string): string {
  const Title = toPascalCase(singularize(featureName));

  return `"use client";

import { FeatureForm } from "@/components/unified";
import { ${Title}Feature } from "@/features";
import { useRouter } from "next/navigation";

export default function New${toPascalCase(singularize(tableName))}Page() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(\`/api/resources/${tableName}\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(\`/admin/${tableName}\`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New ${toPascalCase(singularize(tableName))}</h1>
      <FeatureForm
        schema={${Title}Feature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
`;
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

async function step1_deleteOldAPIs() {
  log('\n=== STEP 1: Deleting Old API Routes ===', 'info');

  let deletedCount = 0;

  for (const route of OLD_API_ROUTES) {
    const fullPath = path.join(ROOT, route);
    if (deleteDirectory(fullPath)) {
      log(`  ✓ Deleted: ${route}`, 'success');
      deletedCount++;
    }
  }

  log(`  Deleted ${deletedCount} API route directories`, 'success');
}

async function step2_deleteOldComponents() {
  log('\n=== STEP 2: Deleting Old Components ===', 'info');

  let deletedCount = 0;

  for (const component of OLD_COMPONENTS) {
    const fullPath = path.join(ROOT, component);
    if (deleteDirectory(fullPath)) {
      log(`  ✓ Deleted: ${component}`, 'success');
      deletedCount++;
    }
  }

  log(`  Deleted ${deletedCount} component directories`, 'success');
}

async function step3_generateFeatureDefinitions() {
  log('\n=== STEP 3: Generating Feature Definitions ===', 'info');

  const featuresDir = path.join(ROOT, 'src/features');
  ensureDir(featuresDir);

  let generatedCount = 0;

  for (const table of TABLES_TO_MIGRATE) {
    const featurePath = path.join(featuresDir, `${singularize(toCamelCase(table))}.feature.tsx`);

    // Skip if already exists
    if (fs.existsSync(featurePath)) {
      log(`  ⊙ Skipping existing: ${table}`, 'warning');
      continue;
    }

    const content = generateFeatureDefinition(table);
    fs.writeFileSync(featurePath, content);
    log(`  ✓ Generated: ${table}`, 'success');
    generatedCount++;
  }

  // Update index.ts
  const indexPath = path.join(featuresDir, 'index.ts');
  let indexContent = '// Auto-generated feature exports\n\n';
  indexContent += '// Feature definitions\n';

  for (const table of TABLES_TO_MIGRATE) {
    const FeatureName = toPascalCase(singularize(table));
    const fileName = singularize(toCamelCase(table));
    indexContent += `export { ${FeatureName}Feature } from "./${fileName}.feature";\n`;
  }

  indexContent += '\n// Features map\nexport const features = {\n';
  for (const table of TABLES_TO_MIGRATE) {
    const FeatureName = toPascalCase(singularize(table));
    const camelName = singularize(toCamelCase(table));
    indexContent += `  ${table}: ${FeatureName}Feature,\n`;
  }
  indexContent += '};\n';

  fs.writeFileSync(indexPath, indexContent);
  log(`  ✓ Updated features/index.ts`, 'success');

  log(`  Generated ${generatedCount} feature definitions`, 'success');
}

async function step4_generateUnifiedPages() {
  log('\n=== STEP 4: Generating Unified Pages ===', 'info');

  let pagesGenerated = 0;

  // Generate pages for each table
  for (const table of TABLES_TO_MIGRATE) {
    const pageDir = path.join(ROOT, `src/app/admin/${table}`);
    ensureDir(pageDir);

    // List page
    const listPagePath = path.join(pageDir, 'page.tsx');
    if (!fs.existsSync(listPagePath)) {
      const listPage = generateListPage(table, table);
      fs.writeFileSync(listPagePath, listPage);
      log(`  ✓ Generated: /admin/${table}`, 'success');
      pagesGenerated++;
    }

    // New page
    const newPageDir = path.join(pageDir, 'new');
    ensureDir(newPageDir);
    const newPagePath = path.join(newPageDir, 'page.tsx');
    if (!fs.existsSync(newPagePath)) {
      const newPage = generateNewPage(table, table);
      fs.writeFileSync(newPagePath, newPage);
      pagesGenerated++;
    }
  }

  log(`  Generated ${pagesGenerated} pages`, 'success');
}

async function step5_updateRootLayout() {
  log('\n=== STEP 5: Updating Root Layout ===', 'info');

  const layoutPath = path.join(ROOT, 'src/app/layout.tsx');

  if (fs.existsSync(layoutPath)) {
    let content = fs.readFileSync(layoutPath, 'utf-8');

    // Add NotificationProvider if not present
    if (!content.includes('NotificationProvider')) {
      content = content.replace(
        /(<body[^>]*>)/,
        '$1\n    <NotificationProvider>'
      );
      content = content.replace(
        /(\s*<\/body>)/,
        '</NotificationProvider>$1'
      );
      fs.writeFileSync(layoutPath, content);
      log('  ✓ Added NotificationProvider to root layout', 'success');
    } else {
      log('  ⊙ NotificationProvider already in layout', 'info');
    }
  }
}

async function step6_cleanUpUnusedFiles() {
  log('\n=== STEP 6: Cleaning Up Unused Files ===', 'info');

  // Remove old test files that reference deleted components
  const patternsToRemove = [
    'src/components/forms',
    'src/components/tables',
    'src/components/modals',
    'src/components/data-tables',
    'src/app/api/resources/[resource]/generated', // If any
  ];

  let cleanedCount = 0;
  for (const pattern of patternsToRemove) {
    const fullPath = path.join(ROOT, pattern);
    if (deleteDirectory(fullPath)) {
      log(`  ✓ Removed: ${pattern}`, 'success');
      cleanedCount++;
    }
  }

  log(`  Cleaned ${cleanedCount} directories`, 'success');
}

async function step7_generateMigrationReport() {
  log('\n=== STEP 7: Migration Report ===', 'info');

  const report = {
    timestamp: new Date().toISOString(),
    tablesMigrated: TABLES_TO_MIGRATE.length,
    oldAPIsDeleted: OLD_API_ROUTES.length,
    oldComponentsDeleted: OLD_COMPONENTS.length,
    unifiedSystem: {
      featuresDirectory: 'src/features/',
      universalAPI: '/api/resources/[resource]',
      universalComponents: [
        'FeatureDataGrid',
        'FeatureForm',
        'FeatureListPage',
        'UniversalModal',
        'UnifiedSearch',
        'NotificationSystem',
      ],
    },
  };

  const reportPath = path.join(ROOT, 'MIGRATION_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`  ✓ Report saved to: MIGRATION_REPORT.json`, 'success');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'info');
  log('║     FULL MIGRATION TO UNIFIED ARCHITECTURE                 ║', 'info');
  log('║     This will DELETE old files and create new ones!        ║', 'info');
  log('╚════════════════════════════════════════════════════════════╝', 'info');

  log('\n⚠️  WARNING: This operation cannot be undone!', 'warning');
  log('    Old APIs and components will be DELETED.', 'warning');

  // Parse command line args
  const args = process.argv.slice(2);
  const confirm = args.includes('--yes') || args.includes('-y');

  if (!confirm) {
    log('\nTo proceed, run with --yes flag:', 'info');
    log('  npx tsx scripts/full-migration.ts --yes', 'info');
    process.exit(1);
  }

  try {
    await step1_deleteOldAPIs();
    await step2_deleteOldComponents();
    await step3_generateFeatureDefinitions();
    await step4_generateUnifiedPages();
    await step5_updateRootLayout();
    await step6_cleanUpUnusedFiles();
    await step7_generateMigrationReport();

    log('\n✅ MIGRATION COMPLETE!', 'success');
    log('\nNext steps:', 'info');
    log('  1. Run: npm run build', 'info');
    log('  2. Run: npm run test:e2e', 'info');
    log('  3. Review MIGRATION_REPORT.json', 'info');

  } catch (error) {
    log(`\n❌ MIGRATION FAILED: ${error}`, 'error');
    process.exit(1);
  }
}

main();
