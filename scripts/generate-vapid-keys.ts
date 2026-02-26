/**
 * VAPID KEYS GENERATION SCRIPT
 *
 * This script generates VAPID (Voluntary Application Server Identification)
 * keys for Web Push API. These keys are used to authenticate push messages
 * sent from your server to push services.
 *
 * Usage:
 *   npm run generate:vapid-keys
 *   npx tsx scripts/generate-vapid-keys.ts
 *
 * After generating keys, add them to your .env file:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
 *   VAPID_PRIVATE_KEY=your_private_key_here
 *
 * Or for production (Vercel):
 *   Add to Environment Variables in Vercel dashboard
 */

import webpush from "web-push";

// ============================================================================
// GENERATE KEYS
// ============================================================================

function generateVapidKeys() {
  console.log("Generating VAPID keys for Web Push API...\n");

  // Generate VAPID keys
  const vapidKeys = webpush.generateVAPIDKeys();

  console.log("VAPID keys generated successfully!\n");
  console.log("=" .repeat(64));
  console.log("PUBLIC KEY (add to .env as NEXT_PUBLIC_VAPID_PUBLIC_KEY):");
  console.log(vapidKeys.publicKey);
  console.log("\n" + "=".repeat(64));
  console.log("PRIVATE KEY (add to .env as VAPID_PRIVATE_KEY):");
  console.log(vapidKeys.privateKey);
  console.log("=".repeat(64) + "\n");

  console.log("\nAdd these to your .env file:\n");
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`);

  console.log("\nFor Vercel deployment, add these as environment variables:");
  console.log("- NEXT_PUBLIC_VAPID_PUBLIC_KEY (public)");
  console.log("- VAPID_PRIVATE_KEY (private)\n");

  console.log("\nYou can now use push notifications!");
}

// ============================================================================
// RUN
// ============================================================================

generateVapidKeys();
