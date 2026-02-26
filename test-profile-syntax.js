// Simple test to check if the route file compiles
const { execSync } = require('child_process');

try {
  // Run TypeScript check on just the profile route file
  const output = execSync('npx tsc --noEmit src/app/api/teacher/profile/route.ts --isolatedModules --noEmit --skipLibCheck', {
    encoding: 'utf-8',
    cwd: process.cwd()
  });

  console.log('✅ TypeScript syntax check passed for teacher/profile route');
} catch (error) {
  console.error('❌ TypeScript syntax check failed:');
  console.error(error.message);
  process.exit(1);
}