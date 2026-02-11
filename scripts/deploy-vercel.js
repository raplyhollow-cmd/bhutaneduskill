#!/usr/bin/env node
/**
 * Deploy to Vercel - Simplified version
 *
 * This script builds your project and gives you deployment commands
 */

const { execSync } = require("child_process");

console.log("🚀 Career Compass - Deploy to Vercel\n");

// Step 1: Build
console.log("\n📦 Step 1: Building project...\n");
const buildResult = execSync("npm run build", {
  cwd: __dirname,
  stdio: "inherit",
  shell: true
});

if (buildResult.status !== 0) {
  console.error("\n❌ Build failed!");
  console.error("   Run 'npm run build' locally to check errors");
  process.exit(1);
}
console.log("✅ Build completed!\n");

// Step 2: Display deployment commands
console.log("\n📋 Step 2: Add these environment variables in Vercel:\n");

const envVars = [
  { name: "DATABASE_URL", value: "postgresql://neondb_owner:npg_zEGrNB2cl7wk@ep-soft-rain-aigc3qom-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" },
  { name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", value: "pk_live_... (get from Clerk Dashboard)" },
  { name: "CLERK_SECRET_KEY", value: "sk_live_... (get from Clerk Dashboard)" },
  { name: "NEXT_PUBLIC_APP_URL", value: "https://your-project.vercel.app" }
];

console.log("\nRequired Environment Variables:\n");
envVars.forEach((v) => {
  console.log(`   ${v.name}=`);
  console.log(v.value || "[your value here]");
  console.log("");
});

console.log("\n📋 Vercel Deployment Commands:\n");
console.log("   # Install Vercel CLI (once):");
console.log("   npm i -g vercel");
console.log("");
console.log("   # Login to Vercel:");
console.log("   vercel login");
console.log("");
console.log("   # Deploy to preview:");
console.log("   vercel --prod");
console.log("");
console.log("   # Deploy to production:");
console.log("   vercel --prod --yes");
console.log("");

console.log("\n📋 After deployment, your app will be live at:");
console.log("   https://your-project.vercel.app\n");

console.log("\n💡 Documentation:");
console.log("   https://vercel.com/docs/deployments");
console.log("");
console.log("\n✅ You're ready to deploy!\n");

// Success message
if (buildResult.status === 0) {
  console.log("\n✅ All checks passed! You can now deploy.");
} else {
  console.log("\n⚠️  Fix build errors before deploying.");
}
