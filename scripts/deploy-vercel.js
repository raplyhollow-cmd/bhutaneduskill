#!/usr/bin/env node
/**
 * Deploy to Vercel with Environment Variables
 *
 * This script helps you deploy to Vercel by:
 * 1. Running the build
 * 2. Prompting for and setting environment variables
 */

const { execSync } = require("child_process");

console.log("🚀 Career Compass - Vercel Deployment Helper");
console.log("\nThis script will:");
console.log("1. Build the project");
console.log("2. Deploy to Vercel (preview)");
console.log("3. Prompt for environment variables");
console.log("\nPress Ctrl+C to cancel at any time.\n");

// Step 1: Build
console.log("\n📦 Step 1: Building project...");
const buildResult = execSync("npm run build", {
  cwd: __dirname,
  stdio: "inherit",
  shell: true
});

if (buildResult.status !== 0) {
  console.error("❌ Build failed!");
  process.exit(1);
}
console.log("✅ Build completed!\n");

// Step 2: Deploy to preview
console.log("\n🚀 Step 2: Deploying to Vercel (preview)...");
console.log("\n📝 IMPORTANT: Before deploying, add these environment variables in Vercel:");
console.log("\n   DATABASE_URL=postgresql://...");
console.log("   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...");
console.log("   CLERK_SECRET_KEY=sk_live_...");
console.log("   NEXT_PUBLIC_APP_URL=https://your-project.vercel.app");
console.log("\n💡 Type 'y' to continue, or Ctrl+C to cancel...\n");

// Deploy command
const deployCmd = "vercel --yes";
console.log(`\n📋 Running: vercel --yes\n`);

try {
  require("child_process").execSync(deployCmd, {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
    stdio: [process.stdin, process.stdout, process.stderr]
  });
} catch (error) {
  console.error("\n❌ Vercel CLI not found!");
  console.error("\n   Please install it first: npm i -g vercel");
  process.exit(1);
}

console.log("\n✅ Done! Check your Vercel dashboard for the deployment URL.\n");
