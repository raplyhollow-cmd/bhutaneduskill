const fs = require('fs');

// Read the file as text
const filePath = 'src/app/api/teacher/homework/[id]/route.ts';
const fileContent = fs.readFileSync(filePath, 'utf8');

// Remove any potential BOM or special characters
let cleanContent = fileContent.replace(/^\uFEFF/, ''); // Remove BOM
cleanContent = cleanContent.replace(/\r\n/g, '\n'); // Normalize line endings

// Fix any potential extra spaces or tabs that might be causing issues
cleanContent = cleanContent.replace(/\s+$/gm, ''); // Remove trailing whitespace
cleanContent = cleanContent.trim();

// Write back the cleaned content
fs.writeFileSync(filePath, cleanContent);

console.log('Fixed file encoding and formatting');