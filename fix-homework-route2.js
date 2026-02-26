const fs = require('fs');
const path = require('path');

// Read the current file
const filePath = 'D:\\VS STUDIO PROJECT\\bhutaneduskill\\src\\app\\api\\teacher\\homework\\[id]\\route.ts';
let fileContent = fs.readFileSync(filePath, 'utf8');

// Pattern 1: Update GET handler - line 37
fileContent = fileContent.replace(
  'const { user: currentUser, userId } = auth;',
  'const { user: currentUser } = auth;\n    const userId = auth.userId;'
);

// Pattern 2: Update PATCH handler - line 82
fileContent = fileContent.replace(
  'const { user: currentUser, userId } = request.auth!;',
  'const { user: currentUser } = auth;\n    const userId = auth.userId;'
);

// Pattern 3: Update DELETE handler - line 134
fileContent = fileContent.replace(
  'const { user: currentUser, userId } = request.auth!;',
  'const { user: currentUser } = auth;\n    const userId = auth.userId;'
);

// Pattern 4: Update POST handler - line 174
fileContent = fileContent.replace(
  'const { user: currentUser, userId } = request.auth!;',
  'const { user: currentUser } = auth;\n    const userId = auth.userId;'
);

// Pattern 5: Add auth parameter to PATCH handler - line 81
fileContent = fileContent.replace(
  'async (request: NextRequest, context?: Params) => {',
  'async (request: NextRequest, auth, context?: Params) => {'
);

// Pattern 6: Add auth parameter to DELETE handler - line 133
fileContent = fileContent.replace(
  'async (request: NextRequest, context?: Params) => {',
  'async (request: NextRequest, auth, context?: Params) => {'
);

// Pattern 7: Add auth parameter to POST handler - line 173
fileContent = fileContent.replace(
  'async (request: NextRequest, context?: Params) => {',
  'async (request: NextRequest, auth, context?: Params) => {'
);

// Write the fixed content
fs.writeFileSync(filePath, fileContent);

console.log('Fixed homework route file with comprehensive patterns');