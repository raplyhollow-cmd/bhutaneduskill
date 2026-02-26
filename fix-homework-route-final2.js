const fs = require('fs');

// Read the file
const filePath = 'src/app/api/teacher/homework/[id]/route.ts';
const fileContent = fs.readFileSync(filePath, 'utf8');

// Add the necessary imports at the top
const imports = `import { successResponse, errorResponse } from "@/lib/api/response-helpers";\n`;

// Insert the imports after the existing imports
let updatedContent = fileContent.replace(
  /(import \{ createApiRoute \} from "@/lib\/api\/route-handler";)/,
  `$1\n${imports}`
);

// Update all return statements to use successResponse and errorResponse
// Pattern 1: Error returns
updatedContent = updatedContent.replace(
  /return \{ error: "Homework not found" \};/g,
  'return errorResponse("Homework not found", 404);'
);

updatedContent = updatedContent.replace(
  /return \{ error: "Forbidden" \};/g,
  'return errorResponse("Forbidden", 403);'
);

updatedContent = updatedContent.replace(
  /return \{ error: "Cannot delete homework with submissions" \};/g,
  'return errorResponse("Cannot delete homework with submissions", 400);'
);

updatedContent = updatedContent.replace(
  /return \{ error: "Invalid action" \};/g,
  'return errorResponse("Invalid action", 400);'
);

// Pattern 2: Success returns
updatedContent = updatedContent.replace(
  /return \{ homework: homeworkData, stats \};/,
  'return successResponse({ homework: homeworkData, stats });'
);

updatedContent = updatedContent.replace(
  /return \{ homework: updatedHomework \};/,
  'return successResponse({ homework: updatedHomework });'
);

updatedContent = updatedContent.replace(
  /return \{ success: true \};/,
  'return successResponse({ success: true });'
);

updatedContent = updatedContent.replace(
  /return \{ homework: publishedHomework \};/g,
  'return successResponse({ homework: publishedHomework });'
);

updatedContent = updatedContent.replace(
  /return \{ homework: unpublishedHomework \};/g,
  'return successResponse({ homework: unpublishedHomework });'
);

updatedContent = updatedContent.replace(
  /return \{ homework: duplicatedHomework \};/g,
  'return successResponse({ homework: duplicatedHomework });'
);

// Write the updated content
fs.writeFileSync(filePath, updatedContent);

console.log('Fixed homework route with proper response helpers');