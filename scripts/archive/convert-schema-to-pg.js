const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../src/lib/db/schema.ts');
let content = fs.readFileSync(schemaPath, 'utf8');

// 1. Change imports
content = content.replace(
  /import \{ sqliteTable, text, integer \} from "drizzle-orm\/sqlite-core"/,
  'import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core"'
);

// 2. Replace sqliteTable with pgTable
content = content.replace(/sqliteTable/g, 'pgTable');

// 3. Replace SQLite booleans with PostgreSQL booleans
// Pattern: integer("field_name", { mode: "boolean" }).default(true/false)
content = content.replace(
  /integer\("([^"]+)", \{ mode: "boolean" \}\)\.default\((true|false)\)/g,
  'boolean("$1").default($2)'
);

// 4. Replace SQLite timestamps with PostgreSQL timestamps
// Pattern: integer("field_name", { mode: "timestamp" })
content = content.replace(
  /integer\("([^"]+)", \{ mode: "timestamp" \}\)/g,
  'timestamp("$1", { withTimezone: true })'
);

// 5. Handle nullable timestamps
content = content.replace(
  /integer\("([^"]+)", \{ mode: "timestamp" \}\)\.notNull\(\)/g,
  'timestamp("$1", { withTimezone: true }).notNull()'
);

fs.writeFileSync(schemaPath, content);
console.log('Schema converted to PostgreSQL');
