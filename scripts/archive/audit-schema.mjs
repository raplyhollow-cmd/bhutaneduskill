/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    COMPREHENSIVE SCHEMA AUDIT SCRIPT                     ║
 * ║                  Bhutan EduSkill - Drizzle Schema Auditor                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Compares Drizzle schema definitions with actual PostgreSQL database structure
 * Identifies:
 *   - Missing tables in database
 *   - Missing columns in database tables
 *   - Extra columns in database (not in schema)
 *   - Type mismatches (especially timestamp with/without timezone)
 *   - Missing indexes
 *   - Missing foreign keys
 *
 * Usage:
 *   node scripts/audit-schema.mjs                    # Console output
 *   node scripts/audit-schema.mjs --json             # JSON report only
 *   node scripts/audit-schema.mjs --sql              # Generate SQL fixes
 *   node scripts/audit-schema.mjs --full             # Everything
 *   node scripts/audit-schema.mjs --table=users      # Audit specific table
 *   node scripts/audit-schema.mjs --report-file=audit-report.json
 *
 * @version 1.0.0
 * @author Bhutan EduSkill Development Team
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  databaseUrl: process.env.DATABASE_URL,
  outputDir: resolve(__dirname, '../audit-reports'),
};

// ANSI Color codes for terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',

  // Styles
  bold: '\x1b[1m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
};

// PostgreSQL type mapping (Drizzle -> PostgreSQL)
const TYPE_MAPPING = {
  'text': 'text',
  'integer': 'integer',
  'boolean': 'boolean',
  'json': 'json',
  'jsonb': 'jsonb',
  'PgTimestamp': 'timestamp',
  'timestamp': 'timestamp',
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function colorize(text, color) {
  return `${COLORS[color] || ''}${text}${COLORS.reset}`;
}

function log(message, color = 'reset') {
  console.log(`${COLORS[color] || ''}${message}${COLORS.reset}`);
}

function error(message) {
  console.error(colorize(`❌ ${message}`, 'red'));
}

function success(message) {
  console.log(colorize(`✓ ${message}`, 'green'));
}

function warn(message) {
  console.log(colorize(`⚠ ${message}`, 'yellow'));
}

function info(message) {
  console.log(colorize(`ℹ ${message}`, 'cyan'));
}

function header(text) {
  const line = '═'.repeat(Math.min(text.length + 4, 80));
  console.log('\n' + colorize(line, 'cyan'));
  console.log(colorize(`  ${text}`, 'cyan'));
  console.log(colorize(line, 'cyan'));
}

function subHeader(text) {
  console.log('\n' + colorize(`─── ${text}`, 'blue'));
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    json: false,
    sql: false,
    full: false,
    table: null,
    reportFile: null,
  };

  for (const arg of args) {
    if (arg === '--json') options.json = true;
    if (arg === '--sql') options.sql = true;
    if (arg === '--full') options.full = true;
    if (arg.startsWith('--table=')) options.table = arg.split('=')[1];
    if (arg.startsWith('--report-file=')) options.reportFile = arg.split('=')[1];
  }

  return options;
}

// Convert camelCase to snake_case
function camelToSnake(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

// Convert snake_case to camelCase
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA PARSER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parse Drizzle schema file to extract table definitions
 * This is a simplified parser that extracts table names and column definitions
 */
function parseSchemaFile() {
  const schemaPath = resolve(__dirname, '../src/lib/db/schema.ts');
  let schemaContent;

  try {
    schemaContent = readFileSync(schemaPath, 'utf-8');
  } catch (e) {
    // Try to parse from all schema files
    return parseAllSchemaFiles();
  }

  const tables = {};

  // Pattern to match pgTable definitions
  // export const tableName = pgTable("table_name", {
  const tableRegex = /export\s+const\s+(\w+)\s*=\s*pgTable\s*\(\s*["']([^"']+)["']\s*,\s*\{([^}]+)\}/gs;

  let match;
  while ((match = tableRegex.exec(schemaContent)) !== null) {
    const [, varName, tableName, columnsBlock] = match;
    tables[tableName] = {
      varName,
      columns: parseColumns(columnsBlock),
      indexes: parseIndexes(schemaContent, varName),
    };
  }

  // Also check for re-exported tables from other schema files
  const reExportRegex = /export\s*\{([^}]+)\}\s*from\s*["']\.\/(\w+)-schema["']/g;
  const reExports = {};

  while ((match = reExportRegex.exec(schemaContent)) !== null) {
    const [, exports, schemaName] = match;
    const exportedTables = exports.split(',').map(e => e.trim());
    exportedTables.forEach(tableName => {
      reExports[tableName] = `${schemaName}-schema.ts`;
    });
  }

  return { tables, reExports };
}

/**
 * Parse individual schema files and aggregate all tables
 */
function parseAllSchemaFiles() {
  const { readdirSync, readFileSync } = require('fs');
  const schemaDir = resolve(__dirname, '../src/lib/db');
  const tables = {};
  const reExports = {};

  const schemaFiles = readdirSync(schemaDir)
    .filter(f => f.endsWith('-schema.ts') || f === 'schema.ts');

  for (const file of schemaFiles) {
    const content = readFileSync(resolve(schemaDir, file), 'utf-8');
    parseSchemaContent(content, tables, file);
  }

  return { tables, reExports };
}

/**
 * Parse schema content from a single file
 */
function parseSchemaContent(content, tables, sourceFile) {
  // Pattern to match pgTable definitions with multi-line support
  const tableRegex = /export\s+const\s+(\w+)\s*=\s*pgTable\s*\(\s*["']([^"']+)["']\s*,\s*\{([\s\S]*?)\n\}/gs;

  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    const [, varName, tableName, columnsBlock] = match;
    tables[tableName] = {
      varName,
      sourceFile,
      columns: parseColumns(columnsBlock),
      indexes: parseIndexes(content, varName),
    };
  }
}

/**
 * Parse column definitions from the columns block
 */
function parseColumns(columnsBlock) {
  const columns = {};

  // Match individual column definitions
  // columnName: type("db_name").modifiers()
  const columnRegex = /(\w+)\s*:\s*(\w+)\s*\(\s*["']([^"']+)["']\s*\)([^,\n]*)/g;

  let match;
  while ((match = columnRegex.exec(columnsBlock)) !== null) {
    const [, jsName, drizzleType, dbName, modifiers] = match;

    columns[dbName] = {
      jsName,
      drizzleType,
      dbName,
      modifiers: modifiers || '',
      isNullable: /\.nullable\(\)/.test(modifiers) || !/\.notNull\(\)/.test(modifiers),
      isNotNull: /\.notNull\(\)/.test(modifiers),
      isPrimary: /\.primaryKey\(\)/.test(modifiers),
      isUnique: /\.unique\(\)/.test(modifiers),
      hasDefault: /\.default\(/.test(modifiers),
      // Check for timestamp timezone specification
      timestampWithTz: /withTimezone:\s*true/.test(modifiers) || /withTimezone:\s*{/.test(modifiers),
      timestampWithoutTz: /withTimezone:\s*false/.test(modifiers) ||
        /timestamp\(["'][^"']*["']\)(?!.*withTimezone)/.test(drizzleType + modifiers),
    };
  }

  return columns;
}

/**
 * Parse index definitions from the schema content
 */
function parseIndexes(content, varName) {
  const indexes = [];

  // Match index definitions in the table's second parameter
  // Pattern: idxName: index("index_name").on(table.col1, table.col2)
  const indexRegex = new RegExp(`${varName}\\s*,\\s*\\(([\\s\\S]*?)\\)\\s*\\)\\s*\\}\\);`);

  const indexMatch = indexRegex.exec(content);
  if (indexMatch) {
    const indexBlock = indexMatch[1];
    const idxRegex = /(\w+)\s*:\s*index\s*\(\s*["']([^"']+)["']\s*\)\.on\(([^)]+)\)/g;

    let idxMatch;
    while ((idxMatch = idxRegex.exec(indexBlock)) !== null) {
      const [, jsName, indexName, columns] = idxMatch;
      indexes.push({
        jsName,
        indexName,
        columns: columns.split(',').map(c => c.trim().replace(/^table\./, '')),
      });
    }
  }

  return indexes;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

class SchemaAuditor {
  constructor(databaseUrl) {
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set in environment variables');
    }
    this.sql = neon(databaseUrl);
    this.results = {
      summary: {
        totalTables: 0,
        tablesFound: 0,
        tablesMissing: 0,
        totalColumns: 0,
        missingColumns: 0,
        extraColumns: 0,
        typeMismatches: 0,
        timestampMismatches: 0,
        missingIndexes: 0,
        issues: [],
      },
      tables: {},
      generatedSql: [],
    };
  }

  /**
   * Get all tables in the database
   */
  async getDatabaseTables() {
    const result = await this.sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    return new Set(result.map(r => r.table_name));
  }

  /**
   * Get all columns for a specific table
   */
  async getTableColumns(tableName) {
    const result = await this.sql`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        ordinal_position,
        character_maximum_length,
        numeric_precision,
        datetime_precision
      FROM information_schema.columns
      WHERE table_name = ${tableName}
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    return result;
  }

  /**
   * Get all indexes for a specific table
   */
  async getTableIndexes(tableName) {
    const result = await this.sql`
      SELECT
        i.indexname as index_name,
        i.indexdef as index_definition,
        array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns
      FROM pg_indexes i
      JOIN pg_index ix ON ix.indexrelid = i.indexname::regclass
      JOIN pg_attribute a ON a.attrelid = i.schemaname || '.' || i.tablename
        AND a.attnum = ANY(ix.indkey)
      WHERE i.schemaname = 'public'
        AND i.tablename = ${tableName}
      GROUP BY i.indexname, i.indexdef
    `;
    return result;
  }

  /**
   * Get foreign key constraints for a table
   */
  async getForeignKeys(tableName) {
    const result = await this.sql`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = ${tableName}
    `;
    return result;
  }

  /**
   * Run full audit comparing schema to database
   */
  async audit(schemaTables, options = {}) {
    header('SCHEMA AUDIT REPORT');
    info(`Database: ${CONFIG.databaseUrl?.split('@')[1]?.split('/')[0] || 'unknown'}`);
    info(`Started: ${new Date().toISOString()}`);

    const dbTables = await this.getDatabaseTables();

    // Filter tables if specific table requested
    const tablesToAudit = options.table
      ? { [options.table]: schemaTables[options.table] }
      : schemaTables;

    this.results.summary.totalTables = Object.keys(tablesToAudit).length;

    subHeader('Table Existence Check');
    const tablesFound = [];

    for (const [tableName, tableDef] of Object.entries(tablesToAudit)) {
      if (dbTables.has(tableName)) {
        tablesFound.push(tableName);
        success(`Table '${tableName}' exists in database`);
      } else {
        this.results.summary.tablesMissing++;
        this.results.summary.issues.push({
          type: 'missing_table',
          table: tableName,
          severity: 'critical',
          message: `Table '${tableName}' not found in database`,
        });
        error(`Table '${tableName}' NOT FOUND in database`);
        this.results.tables[tableName] = {
          status: 'missing',
          issues: [`Table does not exist in database`],
        };
      }
    }

    this.results.summary.tablesFound = tablesFound.length;

    // Check for tables in DB but not in schema
    const extraTables = [...dbTables].filter(t => !schemaTables[t]);
    if (extraTables.length > 0) {
      subHeader('Extra Tables in Database');
      for (const extraTable of extraTables) {
        warn(`Table '${extraTable}' exists in DB but not in schema exports`);
        this.results.summary.issues.push({
          type: 'extra_table',
          table: extraTable,
          severity: 'info',
          message: `Table '${extraTable}' in database but not exported from schema`,
        });
      }
    }

    // Column comparison for existing tables
    subHeader('Column Comparison');
    for (const tableName of tablesFound) {
      await this.auditTableColumns(tableName, schemaTables[tableName]);
    }

    // Index comparison
    if (options.full || options.sql) {
      subHeader('Index Comparison');
      for (const tableName of tablesFound) {
        await this.auditTableIndexes(tableName, schemaTables[tableName]);
      }
    }

    // Generate summary
    this.printSummary();

    return this.results;
  }

  /**
   * Audit columns for a single table
   */
  async auditTableColumns(tableName, tableDef) {
    const dbColumns = await this.getTableColumns(tableName);
    const schemaColumns = tableDef?.columns || {};

    const dbColumnNames = new Set(dbColumns.map(c => c.column_name));
    const schemaColumnNames = new Set(Object.keys(schemaColumns));

    this.results.tables[tableName] = {
      status: 'ok',
      issues: [],
      missingColumns: [],
      extraColumns: [],
      typeMismatches: [],
    };

    // Check for missing columns (in schema but not in DB)
    for (const [colName, colDef] of Object.entries(schemaColumns)) {
      if (!dbColumnNames.has(colName)) {
        this.results.summary.missingColumns++;
        this.results.tables[tableName].missingColumns.push(colName);
        this.results.tables[tableName].status = 'issues';
        this.results.summary.issues.push({
          type: 'missing_column',
          table: tableName,
          column: colName,
          severity: 'critical',
          message: `Column '${colName}' missing from table '${tableName}'`,
        });

        error(`[${tableName}] Missing column: ${colName}`);

        // Generate SQL for adding the column
        const sql = this.generateAddColumnSql(tableName, colName, colDef);
        this.results.generatedSql.push(sql);
      } else {
        // Column exists, check type
        const dbCol = dbColumns.find(c => c.column_name === colName);
        await this.checkColumnType(tableName, colName, colDef, dbCol);
      }
    }

    // Check for extra columns (in DB but not in schema)
    for (const colName of dbColumnNames) {
      if (!schemaColumnNames.has(colName)) {
        this.results.summary.extraColumns++;
        this.results.tables[tableName].extraColumns.push(colName);
        warn(`[${tableName}] Extra column in DB: ${colName} (not in schema)`);
        this.results.summary.issues.push({
          type: 'extra_column',
          table: tableName,
          column: colName,
          severity: 'warning',
          message: `Column '${colName}' exists in DB but not defined in schema`,
        });
      }
    }

    this.results.summary.totalColumns += Object.keys(schemaColumns).length;
  }

  /**
   * Check column type for mismatches
   */
  async checkColumnType(tableName, colName, colDef, dbCol) {
    if (!dbCol) return;

    const schemaType = this.mapDrizzleTypeToPg(colDef.drizzleType, colDef);
    const dbType = dbCol.data_type;

    // Special handling for timestamp timezone check
    if (schemaType.includes('timestamp') && dbType === 'timestamp without time zone') {
      if (colDef.timestampWithTz) {
        this.results.summary.timestampMismatches++;
        this.results.tables[tableName].typeMismatches.push({
          column: colName,
          expected: 'timestamp with time zone',
          actual: 'timestamp without time zone',
        });
        error(`[${tableName}] ${colName}: Expected 'timestamp with time zone', got 'timestamp without time zone'`);

        this.results.generatedSql.push(
          `ALTER TABLE "${tableName}" ALTER COLUMN "${colName}" TYPE timestamp with time zone;`
        );
      }
    } else if (schemaType.includes('timestamp') && dbType === 'timestamp with time zone') {
      if (colDef.timestampWithoutTz) {
        this.results.summary.timestampMismatches++;
        this.results.tables[tableName].typeMismatches.push({
          column: colName,
          expected: 'timestamp without time zone',
          actual: 'timestamp with time zone',
        });
        warn(`[${tableName}] ${colName}: Expected 'timestamp without time zone', got 'timestamp with time zone'`);

        this.results.generatedSql.push(
          `ALTER TABLE "${tableName}" ALTER COLUMN "${colName}" TYPE timestamp without time zone;`
        );
      }
    } else if (schemaType !== dbType && !this.isCompatibleType(schemaType, dbType)) {
      this.results.summary.typeMismatches++;
      this.results.tables[tableName].typeMismatches.push({
        column: colName,
        expected: schemaType,
        actual: dbType,
      });
      warn(`[${tableName}] ${colName}: Type mismatch - Schema: ${schemaType}, DB: ${dbType}`);
    } else {
      // Type matches
    }
  }

  /**
   * Map Drizzle type to PostgreSQL type
   */
  mapDrizzleTypeToPg(drizzleType, colDef) {
    const typeMap = {
      'text': 'text',
      'integer': 'integer',
      'boolean': 'boolean',
      'json': 'json',
      'jsonb': 'jsonb',
      'PgTimestamp': colDef?.timestampWithTz ? 'timestamp with time zone' : 'timestamp without time zone',
      'timestamp': colDef?.timestampWithTz ? 'timestamp with time zone' : 'timestamp without time zone',
    };

    return typeMap[drizzleType] || drizzleType.toLowerCase();
  }

  /**
   * Check if two types are compatible (e.g., text vs character varying)
   */
  isCompatibleType(type1, type2) {
    const compatiblePairs = [
      ['text', 'character varying'],
      ['character varying', 'text'],
      ['integer', 'integer'],
      ['boolean', 'boolean'],
      ['json', 'jsonb'],
      ['jsonb', 'json'],
    ];

    return compatiblePairs.some(([a, b]) =>
      (type1.includes(a) && type2.includes(b)) ||
      (type1.includes(b) && type2.includes(a))
    );
  }

  /**
   * Audit indexes for a table
   */
  async auditTableIndexes(tableName, tableDef) {
    const dbIndexes = await this.getTableIndexes(tableName);
    const schemaIndexes = tableDef?.indexes || [];

    const schemaIndexNames = new Set(schemaIndexes.map(i => i.indexName));
    const dbIndexNames = new Set(dbIndexes.map(i => i.index_name));

    // Check for missing indexes
    for (const idx of schemaIndexes) {
      if (!dbIndexNames.has(idx.indexName)) {
        this.results.summary.missingIndexes++;
        warn(`[${tableName}] Missing index: ${idx.indexName}`);

        // Generate SQL for creating index
        const columns = idx.columns.join(', ');
        this.results.generatedSql.push(
          `CREATE INDEX "${idx.indexName}" ON "${tableName}" (${columns});`
        );
      }
    }

    // Report extra indexes
    for (const idxName of dbIndexNames) {
      if (!schemaIndexNames.has(idxName) && !idxName.startsWith('pg_')) {
        info(`[${tableName}] Extra index in DB: ${idxName} (not in schema)`);
      }
    }
  }

  /**
   * Generate SQL for adding a column
   */
  generateAddColumnSql(tableName, colName, colDef) {
    const pgType = this.mapDrizzleTypeToPg(colDef.drizzleType, colDef);
    let sql = `ALTER TABLE "${tableName}" ADD COLUMN "${colName}" ${pgType}`;

    // Add NOT NULL constraint
    if (colDef.isNotNull) {
      sql += ' NOT NULL';
    } else if (!colDef.isNullable && !colDef.isNotNull) {
      // Default behavior if not specified
      sql += ' NULL';
    }

    // Add DEFAULT value if specified
    const defaultMatch = colDef.modifiers.match(/\.default\(([^)]+)\)/);
    if (defaultMatch) {
      sql += ` DEFAULT ${defaultMatch[1]}`;
    }

    return sql + ';';
  }

  /**
   * Print summary of audit results
   */
  printSummary() {
    subHeader('Audit Summary');

    const { summary } = this.results;

    console.log(`
  Tables Analyzed:     ${colorize(summary.tablesFound, 'green')} / ${summary.totalTables}
  Missing Tables:      ${colorize(summary.tablesMissing, summary.tablesMissing > 0 ? 'red' : 'green')}
  Missing Columns:     ${colorize(summary.missingColumns, summary.missingColumns > 0 ? 'red' : 'green')}
  Extra Columns:       ${colorize(summary.extraColumns, summary.extraColumns > 0 ? 'yellow' : 'green')}
  Type Mismatches:     ${colorize(summary.typeMismatches, summary.typeMismatches > 0 ? 'yellow' : 'green')}
  Timestamp Issues:    ${colorize(summary.timestampMismatches, summary.timestampMismatches > 0 ? 'red' : 'green')}
  Missing Indexes:     ${colorize(summary.missingIndexes, summary.missingIndexes > 0 ? 'yellow' : 'green')}
  Total Issues:        ${colorize(summary.issues.length, summary.issues.length > 0 ? 'red' : 'green')}
    `);

    // Severity breakdown
    const critical = summary.issues.filter(i => i.severity === 'critical').length;
    const warnings = summary.issues.filter(i => i.severity === 'warning').length;
    const info = summary.issues.filter(i => i.severity === 'info').length;

    console.log(`
  Severity Breakdown:
    Critical:  ${colorize(critical, critical > 0 ? 'red' : 'green')}
    Warnings:  ${colorize(warnings, warnings > 0 ? 'yellow' : 'green')}
    Info:      ${colorize(info, 'blue')}
    `);
  }

  /**
   * Get results as JSON
   */
  getJsonResults() {
    return JSON.stringify(this.results, null, 2);
  }

  /**
   * Get generated SQL
   */
  getGeneratedSql() {
    return this.results.generatedSql.join('\n');
  }

  /**
   * Save results to file
   */
  async saveReport(filepath) {
    const { writeFileSync, mkdirSync } = require('fs');
    const { dirname } = require('path');

    // Ensure directory exists
    try {
      mkdirSync(dirname(filepath), { recursive: true });
    } catch (e) {
      // Directory already exists
    }

    writeFileSync(filepath, this.getJsonResults());
    success(`Report saved to: ${filepath}`);
  }

  /**
   * Save SQL to file
   */
  async saveSql(filepath) {
    const { writeFileSync, mkdirSync } = require('fs');
    const { dirname } = require('path');

    try {
      mkdirSync(dirname(filepath), { recursive: true });
    } catch (e) {
      // Directory already exists
    }

    const sqlContent = `-- ════════════════════════════════════════════════════════════════════════════
--  GENERATED MIGRATION SQL - Bhutan EduSkill Schema Audit
--  Generated: ${new Date().toISOString()}
--  Use this SQL to fix identified schema issues
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

${this.getGeneratedSql()}

COMMIT;
`;

    writeFileSync(filepath, sqlContent);
    success(`SQL file saved to: ${filepath}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const options = parseArgs();

  try {
    // Parse schema
    header('Parsing Drizzle Schema');
    const { tables, reExports } = parseSchemaFile();

    const tableCount = Object.keys(tables).length;
    const reExportCount = Object.keys(reExports).length;
    info(`Found ${tableCount} tables in main schema files`);
    info(`Found ${reExportCount} re-exported tables from sub-schemas`);

    // Initialize auditor
    const auditor = new SchemaAuditor(CONFIG.databaseUrl);

    // Run audit
    await auditor.audit(tables, options);

    // Output results
    if (options.json) {
      console.log('\n' + auditor.getJsonResults());
    }

    if (options.sql || options.full) {
      const sql = auditor.getGeneratedSql();
      if (sql) {
        header('Generated SQL Migration');
        console.log(sql);
      } else {
        info('No SQL to generate - schema is in sync!');
      }
    }

    // Save to files if requested
    if (options.reportFile) {
      await auditor.saveReport(options.reportFile);
      const sqlFile = options.reportFile.replace('.json', '.sql');
      await auditor.saveSql(sqlFile);
    }

    // Exit with appropriate code
    const issueCount = auditor.results.summary.issues.filter(i => i.severity === 'critical').length;
    process.exit(issueCount > 0 ? 1 : 0);

  } catch (err) {
    error(err.message);
    console.error(err);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SchemaAuditor, parseSchemaFile };