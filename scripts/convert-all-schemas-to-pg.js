const fs = require('fs');
const path = require('path');

const schemaDir = path.join(__dirname, '../src/lib/db');
const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('-schema.ts') || f === 'schema.ts');

files.forEach(file => {
  const filePath = path.join(schemaDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Change imports from sqlite-core to pg-core
  if (content.includes('drizzle-orm/sqlite-core')) {
    content = content.replace(
      /import \{ ([^}]+) \} from "drizzle-orm\/sqlite-core"/,
      (match, imports) => {
        // Add boolean and timestamp if not already in imports
        let newImports = imports;
        if (!newImports.includes('boolean')) newImports += ', boolean';
        if (!newImports.includes('timestamp')) newImports += ', timestamp';
        if (!newImports.includes('pgEnum')) newImports += ', pgEnum';
        return `import { ${newImports} } from "drizzle-orm/pg-core"`;
      }
    );
    modified = true;
  }

  // 2. Replace sqliteTable with pgTable
  if (content.includes('sqliteTable')) {
    content = content.replace(/sqliteTable/g, 'pgTable');
    modified = true;
  }

  // 3. Replace SQLite booleans with PostgreSQL booleans
  if (content.includes('{ mode: "boolean" }')) {
    content = content.replace(
      /integer\("([^"]+)", \{ mode: "boolean" \}\)\.default\((true|false)\)/g,
      'boolean("$1").default($2)'
    );
    modified = true;
  }

  // 4. Replace SQLite timestamps with PostgreSQL timestamps
  if (content.includes('{ mode: "timestamp" }')) {
    content = content.replace(
      /integer\("([^"]+)", \{ mode: "timestamp" \}\)\.notNull\(\)/g,
      'timestamp("$1", { withTimezone: true }).notNull()'
    );
    content = content.replace(
      /integer\("([^"]+)", \{ mode: "timestamp" \}\)(?!\.notNull)/g,
      'timestamp("$1", { withTimezone: true })'
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Converted: ${file}`);
  } else {
    console.log(`Skipped: ${file} (already PostgreSQL or no changes needed)`);
  }
});

console.log('All schemas converted to PostgreSQL');
