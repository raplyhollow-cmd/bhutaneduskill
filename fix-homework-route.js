const fs = require('fs');
const path = require('path');

// Read the current file
const filePath = 'D:\\VS STUDIO PROJECT\\bhutaneduskill\\src\\app\\api\\teacher\\homework\\[id]\\route.ts';
const fileContent = fs.readFileSync(filePath, 'utf8');

// Pattern 1: Update GET handler
let updatedContent = fileContent.replace(
  /const GET = createApiRoute\(\s*\['teacher', 'admin'\],\s*async \(request: NextRequest, auth, context\?\) => \{\s*const \{ user: currentUser, userId \} = auth;/,
  'const GET = createApiRoute(\n  [\'teacher\', \'admin\'],\n  async (request: NextRequest, auth, context?) => {\n    const { user: currentUser } = auth;\n    const userId = auth.userId;'
);

// Pattern 2: Update PUT handler to PATCH
updatedContent = updatedContent.replace(
  'export const PUT = createApiRoute(',
  'export const PATCH = createApiRoute('
);

updatedContent = updatedContent.replace(
  /const PATCH = createApiRoute\(\s*\['teacher', 'admin'\],\s*async \(request: NextRequest, context\?\) => \{\s*const \{ user: currentUser, userId \} = request\.auth\!;/,
  'const PATCH = createApiRoute(\n  [\'teacher\', \'admin\'],\n  async (request: NextRequest, auth, context?) => {\n    const { user: currentUser } = auth;\n    const userId = auth.userId;'
);

// Pattern 3: Update DELETE handler
updatedContent = updatedContent.replace(
  /const DELETE = createApiRoute\(\s*\['teacher', 'admin'\],\s*async \(request: NextRequest, context\?\) => \{\s*const \{ user: currentUser, userId \} = request\.auth\!;/,
  'const DELETE = createApiRoute(\n  [\'teacher\', \'admin\'],\n  async (request: NextRequest, auth, context?) => {\n    const { user: currentUser } = auth;\n    const userId = auth.userId;'
);

// Pattern 4: Update POST handler
updatedContent = updatedContent.replace(
  /const POST = createApiRoute\(\s*\['teacher', 'admin'\],\s*async \(request: NextRequest, context\?\) => \{\s*const \{ user: currentUser, userId \} = request\.auth\!;/,
  'const POST = createApiRoute(\n  [\'teacher\', \'admin\'],\n  async (request: NextRequest, auth, context?) => {\n    const { user: currentUser } = auth;\n    const userId = auth.userId;'
);

// Write the fixed content
fs.writeFileSync(filePath, updatedContent);

console.log('Fixed homework route file');