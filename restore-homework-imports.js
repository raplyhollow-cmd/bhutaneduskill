const fs = require('fs');

// Read the current file
const filePath = 'src/app/api/teacher/homework/[id]/route.ts';
const fileContent = fs.readFileSync(filePath, 'utf8');

// Add the missing imports at the beginning
const imports = `import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
`;

// Insert the imports at the beginning of the file
let updatedContent = imports + fileContent;

// Write the updated content
fs.writeFileSync(filePath, updatedContent);

console.log('Restored missing imports to homework route');