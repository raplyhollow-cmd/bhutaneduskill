const fs = require('fs');

// Read the current file
const filePath = 'src/app/api/teacher/homework/[id]/route.ts';
const fileContent = fs.readFileSync(filePath, 'utf8');

// Fix function signatures - remove auth and context parameters
let updatedContent = fileContent;

// 1. Update GET handler signature
updatedContent = updatedContent.replace(
  /export const GET = createApiRoute\(\s*\['teacher', 'admin'\],\s*async \(request: NextRequest, auth, context\?\) => \{/,
  'export const GET = createApiRoute(\n  [\'teacher\', \'admin\'],\n  async (request: NextRequest) => {'
);

// 2. Update PATCH handler signature
updatedContent = updatedContent.replace(
  /export const PATCH = createApiRoute\(\s*\['teacher', 'admin'\],\s*async \(request: NextRequest, auth, context\?\) => \{/,
  'export const PATCH = createApiRoute(\n  [\'teacher\', \'admin\'],\n  async (request: NextRequest) => {'
);

// 3. Update DELETE handler signature
updatedContent = updatedContent.replace(
  /export const DELETE = createApiRoute\(\s*\['teacher', 'admin'\],\s*async \(request: NextRequest, auth, context\?\) => \{/,
  'export const DELETE = createApiRoute(\n  [\'teacher\', \'admin\'],\n  async (request: NextRequest) => {'
);

// 4. Update POST handler signature
updatedContent = updatedContent.replace(
  /export const POST = createApiRoute\(\s*\['teacher', 'admin'\],\s*async \(request: NextRequest, auth, context\?\) => \{/,
  'export const POST = createApiRoute(\n  [\'teacher\', \'admin\'],\n  async (request: NextRequest) => {'
);

// Write the updated content
fs.writeFileSync(filePath, updatedContent);

console.log('Fixed function signatures');