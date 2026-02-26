const fs = require('fs');

// Read the current file
const filePath = 'D:\\VS STUDIO PROJECT\\bhutaneduskill\\src\\app\\api\\teacher\\homework\\[id]\\route.ts';
let fileContent = fs.readFileSync(filePath, 'utf8');

// Fix 1: Add missing closing brace after GET handler
fileContent = fileContent.replace(
  '    return { homework: homeworkData, stats };\n  }\n});',
  '    return { homework: homeworkData, stats };\n  }\n});'
);

// Fix 2: Fix PATCH handler
fileContent = fileContent.replace(
  '    return { homework: updatedHomework };\n  }\n});',
  '    return { homework: updatedHomework };\n  }\n});'
);

// Fix 3: Fix DELETE handler
fileContent = fileContent.replace(
  '    return { success: true };\n  }\n});',
  '    return { success: true };\n  }\n});'
);

// Fix 4: Fix POST handler
fileContent = fileContent.replace(
  '    return { error: "Invalid action" };\n  }\n});',
  '    return { error: "Invalid action" };\n  }\n});'
);

// Write the fixed content
fs.writeFileSync(filePath, fileContent);

console.log('Fixed homework route syntax');