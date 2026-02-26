const fs = require('fs');

// Read the current file
const filePath = 'src/app/api/teacher/homework/[id]/route.ts';
const fileContent = fs.readFileSync(filePath, 'utf8');

// Simple string replacements
let updatedContent = fileContent;

// 1. Add getAuth import
updatedContent = updatedContent.replace(
  'import { createApiRoute } from "@/lib/api/route-handler";',
  'import { createApiRoute, getAuth } from "@/lib/api/route-handler";'
);

// 2. Replace auth destructuring with getAuth pattern in GET handler
updatedContent = updatedContent.replace(
  'const { user: currentUser } = auth;\n    const userId = auth.userId;',
  'const auth = getAuth(request);\n    if (!auth) {\n      return errorResponse("Unauthorized", 401);\n    }\n\n    const { userId, user } = auth;'
);

// 3. Replace auth destructuring with getAuth pattern in PATCH handler
updatedContent = updatedContent.replace(
  'const { user: currentUser } = auth;\n    const userId = auth.userId;',
  'const auth = getAuth(request);\n    if (!auth) {\n      return errorResponse("Unauthorized", 401);\n    }\n\n    const { userId, user } = auth;'
);

// 4. Replace auth destructuring with getAuth pattern in DELETE handler
updatedContent = updatedContent.replace(
  'const { user: currentUser } = auth;\n    const userId = auth.userId;',
  'const auth = getAuth(request);\n    if (!auth) {\n      return errorResponse("Unauthorized", 401);\n    }\n\n    const { userId, user } = auth;'
);

// 5. Replace auth destructuring with getAuth pattern in POST handler
updatedContent = updatedContent.replace(
  'const { user: currentUser } = auth;\n    const userId = auth.userId;',
  'const auth = getAuth(request);\n    if (!auth) {\n      return errorResponse("Unauthorized", 401);\n    }\n\n    const { userId, user } = auth;'
);

// 6. Fix parameter access - use request.params instead of context
updatedContent = updatedContent.replace(/const resolvedParams = await context\!\.params;/g, 'const resolvedParams = await (request as any).params;');
updatedContent = updatedContent.replace(/const id = resolvedParams\.id;/g, 'const id = (request as any).params.id;');

// 7. Update function signatures to remove auth and context parameters
updatedContent = updatedContent.replace(
  /async \(request: NextRequest, auth, context\?\) => \{/g,
  'async (request: NextRequest) => {'
);

// Write the updated content
fs.writeFileSync(filePath, updatedContent);

console.log('Updated homework route key parts');