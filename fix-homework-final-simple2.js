const fs = require('fs');

// Read the current file
const filePath = 'src/app/api/teacher/homework/[id]/route.ts';
const fileContent = fs.readFileSync(filePath, 'utf8');

// Pattern to replace the GET handler
const getPattern = /export const GET = createApiRoute\(\s*\['teacher', 'admin'\],\s*async \(request: NextRequest, auth, context\?\) => \{\s*const \{ user: currentUser \} = auth;\s*const userId = auth\.userId;/;
const getReplacement = `export const GET = createApiRoute(
  ['teacher', 'admin'],
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;`;

// Replace GET handler
let updatedContent = fileContent.replace(getPattern, getReplacement);

// Pattern to replace PATCH handler
const patchPattern = /export const PATCH = createApiRoute\(\s*\['teacher', 'admin'\],\s*async \(request: NextRequest, auth, context\?\) => \{\s*const \{ user: currentUser \} = auth;\s*const userId = auth\.userId;/;
const patchReplacement = `export const PATCH = createApiRoute(
  ['teacher', 'admin'],
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;`;

// Replace PATCH handler
updatedContent = updatedContent.replace(patchPattern, patchReplacement);

// Pattern to replace DELETE handler
const deletePattern = /export const DELETE = createApiRoute\(\s*\['teacher', 'admin'\],\s*async (request: NextRequest, auth, context\?\) => \{\s*const \{ user: currentUser \} = auth;\s*const userId = auth\.userId;/;
const deleteReplacement = `export const DELETE = createApiRoute(
  ['teacher', 'admin'],
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;`;

// Replace DELETE handler
updatedContent = updatedContent.replace(deletePattern, deleteReplacement);

// Pattern to replace POST handler
const postPattern = /export const POST = createApiRoute\(\s*\['teacher', 'admin'\],\s*async (request: NextRequest, auth, context\?\) => \{\s*const \{ user: currentUser \} = auth;\s*const userId = auth\.userId;/;
const postReplacement = `export const POST = createApiRoute(
  ['teacher', 'admin'],
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;`;

// Replace POST handler
updatedContent = updatedContent.replace(postPattern, postReplacement);

// Add the missing import for getAuth using simple string replacement
updatedContent = updatedContent.replace(
  'import { createApiRoute } from "@/lib/api/route-handler";',
  'import { createApiRoute, getAuth } from "@/lib/api/route-handler";'
);

// Fix parameter access in handlers - replace context with request.params
updatedContent = updatedContent.replace(/const resolvedParams = await context\!\.params;/g, 'const resolvedParams = await (request as any).params;');
updatedContent = updatedContent.replace(/const id = resolvedParams\.id;/g, 'const id = (request as any).params.id;');

// Write the updated content
fs.writeFileSync(filePath, updatedContent);

console.log('Updated homework route handlers to use correct auth pattern');