/**
 * Comprehensive db.query migration fix
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

// Map table names to their imports (for references like riasecResults -> riasecResults)
const TABLE_MAP = {
  'assessmentTypes': 'assessmentTypes',
  'assessments': 'assessments',
  'riasecResults': 'riasecResults',
  'mbtiResults': 'mbtiResults',
  'discResults': 'discResults',
  'workValuesResults': 'workValuesResults',
  'learningStylesResults': 'learningStylesResults',
  'users': 'users',
  'students': 'students',
  'teachers': 'teachers',
  'classes': 'classes',
  'schools': 'schools',
  'enrollments': 'enrollments',
  'announcements': 'announcements',
  'events': 'events',
  'counselingSessions': 'counselingSessions',
  'redFlags': 'redFlags',
  'wellnessLogs': 'wellnessLogs',
  'books': 'books',
  'members': 'members',
  'reservations': 'reservations',
  'inventoryItems': 'inventoryItems',
  'transactions': 'transactions',
  'vehicles': 'vehicles',
  'routes': 'routes',
  'allocations': 'allocations',
  'leaveRequests': 'leaveRequests',
  'hostelBeds': 'hostelBeds',
  'documents': 'documents',
  'fees': 'fees',
  'homework': 'homework',
  'submissions': 'submissions',
  'behaviorLogs': 'behaviorLogs',
  'attendance': 'attendance',
  'applications': 'applications',
  'partners': 'partners',
  'commissions': 'commissions',
  'roles': 'roles',
  'permissions': 'permissions',
  'notifications': 'notifications',
  'messages': 'messages',
  'files': 'files',
  'marketingTestimonials': 'marketingTestimonials',
  'careers': 'careers',
  'savedCareers': 'savedCareers',
  'careerApprovals': 'careerApprovals',
  'careerPlans': 'careerPlans',
  'rubApplications': 'rubApplications',
  'counselorNotes': 'counselorNotes',
  'journalEntries': 'journalEntries',
  'aiInsights': 'aiInsights',
  'invoiceItems': 'invoiceItems',
  'invoices': 'invoices',
  'payments': 'payments',
  'receipts': 'receipts',
};

function fixFindManyWithOrderBy(match, tableName, orderByClause, limitVal) {
  const table = TABLE_MAP[tableName] || tableName;

  // Parse the orderBy clause
  const orderMatch = orderByClause.match(/(\w+)\((\w+)\\.(\w+)\)/);
  let orderClause = '';
  if (orderMatch) {
    const [, func, , col] = orderMatch;
    const funcMap = { 'desc': 'desc', 'asc': 'asc' };
    orderClause = `.orderBy(${funcMap[func.toLowerCase()]}(${table}.${col}))`;
  }

  let limitClause = limitVal ? `.limit(${limitVal})` : '';

  return `await db.select().from(${table})${orderClause}${limitClause}`;
}

function fixFindManyWithWhere(match, tableName, conditions, orderByClause, limitVal) {
  const table = TABLE_MAP[tableName] || tableName;

  let orderClause = '';
  if (orderByClause && !orderByClause.includes('DISABLED')) {
    const orderMatch = orderByClause.match(/(\w+)\((\w+)\\.(\w+)\)/);
    if (orderMatch) {
      const [, func, , col] = orderMatch;
      orderClause = `.orderBy(${func.toLowerCase()}(${table}.${col}))`;
    }
  }

  let limitClause = limitVal && !limitVal.includes('DISABLED') ? `.limit(${limitVal})` : '';

  return `await db.select().from(${table}).where(${conditions})${orderClause}${limitClause}`;
}

function migrateFile(content) {
  // Fix broken DISABLED patterns first
  content = content.replace(/\/\* DISABLED: \/\* DISABLED: db\.query\.(\w+)\.findMany\(\{\s*where:\s*([^,]+),\s*orderBy:\s*\[([^\]]+)\]\s*-[^)]*\)\s*-[^)]*\]\s*limit:\s*(\d+),?\s*\}\);/g,
    (match, table, conditions, orderByFull, limit) => {
      const orderByClean = orderByFull.replace(/ - db\.query not supported by neon-http[^*]*\*\//g, '').trim();
      return fixFindManyWithWhere(match, table, conditions, orderByClean, limit);
    }
  );

  content = content.replace(/\/\* DISABLED: \/\* DISABLED: db\.query\.(\w+)\.findMany\(\{\s*where:\s*([^,]+),\s*orderBy:\s*\[([^\]]+)\]\s*-[^)]*\)\s*-[^)]*\]\s*limit:\s*(\d+),?\s*\}\);/g,
    (match, table, conditions, orderByFull, limit) => {
      return `await db.select().from(${TABLE_MAP[table] || table}).where(${conditions}).limit(${limit})`;
    }
  );

  content = content.replace(/\/\* DISABLED: \/\* DISABLED: db\.query\.(\w+)\.findMany\(\{\s*orderBy:\s*\[([^\]]+)\]\s*-[^)]*\)\s*-[^)]*\]\s*limit:\s*(\d+),?\s*\}\);/g,
    (match, table, orderByFull, limit) => {
      const tableRef = TABLE_MAP[table] || table;
      return `await db.select().from(${tableRef}).limit(${limit})`;
    }
  );

  content = content.replace(/\/\* DISABLED: \/\* DISABLED: db\.query\.(\w+)\.findMany\(\{\s*where:\s*([^,]+),\s*orderBy:\s*\[([^\]]+)\]\s*-[^)]*\)\s*-[^)]*\]\s*\}\);/g,
    (match, table, conditions, orderByFull) => {
      const tableRef = TABLE_MAP[table] || table;
      return `await db.select().from(${tableRef}).where(${conditions})`;
    }
  );

  content = content.replace(/\/\* DISABLED: \/\* DISABLED: db\.query\.(\w+)\.findMany\(\{\s*orderBy:\s*\[([^\]]+)\]\s*-[^)]*\)\s*-[^)]*\]\s*\}\);/g,
    (match, table, orderByFull) => {
      const tableRef = TABLE_MAP[table] || table;
      return `await db.select().from(${tableRef})`;
    }
  );

  // Clean up any remaining DISABLED comments
  content = content.replace(/\/\* DISABLED: db\.query\.\w+\.\w+\([^)]*\) - db\.query not supported by neon-http \*\//g, '');
  content = content.replace(/ - db\.query not supported by neon-http \*\/ - db\.query not supported by neon-http \*\//g, '');
  content = content.replace(/ - db\.query not supported by neon-http \*\//g, '');

  // Fix remaining simple db.query patterns
  content = content.replace(/await db\.query\.(\w+)\.findFirst\(\{[\s\S]*?where:\s*eq\(([^)]+)\)\s*(?:,\s*with:\s*\{[^}]*\})?\s*\}\)/g,
    (match, table, eqClause) => `await db.select().from(${TABLE_MAP[table] || table}).where(${eqClause}).limit(1)`
  );

  content = content.replace(/await db\.query\.(\w+)\.findFirst\(\)/g,
    (match, table) => `await db.select().from(${TABLE_MAP[table] || table}).limit(1)`
  );

  content = content.replace(/await db\.query\.(\w+)\.findMany\(\)/g,
    (match, table) => `await db.select().from(${TABLE_MAP[table] || table})`
  );

  // Fix arrays in where clause
  content = content.replace(/where:\s*\[([^\]]+)\]/g, 'where: $1');

  return content;
}

function processFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const newContent = migrateFile(content);

  if (newContent !== content) {
    writeFileSync(filePath, newContent, 'utf-8');
    return true;
  }
  return false;
}

function findFiles(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      findFiles(fullPath, files);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const content = readFileSync(fullPath, 'utf-8');
      if (content.includes('db.query') || content.includes('DISABLED')) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

const srcDir = join(ROOT_DIR, 'src');
const files = findFiles(srcDir);

console.log(`Processing ${files.length} files...\n`);

let fixed = 0;
for (const file of files) {
  try {
    if (processFile(file)) {
      fixed++;
      console.log(`✓ ${file.replace(ROOT_DIR, '')}`);
    }
  } catch (err) {
    console.log(`✗ ${file}: ${err.message}`);
  }
}

console.log(`\nFixed ${fixed} of ${files.length} files`);
