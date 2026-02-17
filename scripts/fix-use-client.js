const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const directories = [
  'src/app/admin',
  'src/app/student',
  'src/app/teacher',
  'src/app/parent',
  'src/app/counselor',
  'src/app/school-admin',
  'src/app/ministry',
  'src/components'
];

function findFilesWithUseClient() {
  const files = [];

  for (const dir of directories) {
    const dirPath = path.resolve(__dirname, '..', dir);

    if (!fs.existsSync(dirPath)) {
      console.log(`Skipping ${dir} - directory not found`);
      continue;
    }

    try {
      const result = execSync(
        `find "${dirPath}" -type f \\( -name "*.tsx" -o -name "*.ts" \\)`,
        { encoding: 'utf-8' }
      );

      const filePaths = result.split('\n').filter(Boolean);

      for (const filePath of filePaths) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');

          // Check if file contains "use client" anywhere in the file
          let hasUseClient = false;
          let useClientLine = -1;
          let firstLineIsUseClient = false;

          for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            if (trimmed === '"use client"' || trimmed === "'use client'") {
              hasUseClient = true;
              useClientLine = i;
              if (i === 0) {
                firstLineIsUseClient = true;
              }
              break;
            }
          }

          // Only add files that have "use client" but NOT on the first line
          if (hasUseClient && !firstLineIsUseClient) {
            files.push({
              path: filePath,
              useClientLine: useClientLine
            });
          }
        } catch (readError) {
          // Skip files that can't be read
        }
      }
    } catch (error) {
      console.error(`Error processing ${dir}:`, error.message);
    }
  }

  return files;
}

function fixFile(filePath, useClientLine) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Extract the "use client" line (preserve exact format)
  const useClientLineContent = lines[useClientLine];

  // Remove the "use client" line from its current position
  const linesWithoutUseClient = lines.filter((_, i) => i !== useClientLine);

  // Find where to insert: after any blank lines at the start, or at position 0
  let insertPosition = 0;
  while (insertPosition < linesWithoutUseClient.length && linesWithoutUseClient[insertPosition].trim() === '') {
    insertPosition++;
  }

  // Insert "use client" at the correct position (which will be 0 after trimming blanks)
  linesWithoutUseClient.splice(insertPosition, 0, useClientLineContent);

  // Join back and write
  const newContent = linesWithoutUseClient.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf-8');

  return true;
}

// Main execution
console.log('Scanning for files with "use client" not on first line...\n');

const filesToFix = findFilesWithUseClient();

console.log(`Found ${filesToFix.length} files that need fixing:\n`);

for (const file of filesToFix) {
  console.log(`  - ${file.path} (line ${file.useClientLine + 1})`);
}

if (filesToFix.length === 0) {
  console.log('\nNo files need fixing!');
  process.exit(0);
}

console.log('\nFixing files...\n');

let fixedCount = 0;
for (const file of filesToFix) {
  try {
    fixFile(file.path, file.useClientLine);
    console.log(`✓ Fixed: ${file.path}`);
    fixedCount++;
  } catch (error) {
    console.error(`✗ Failed to fix ${file.path}:`, error.message);
  }
}

console.log(`\nSuccessfully fixed ${fixedCount} out of ${filesToFix.length} files.`);
