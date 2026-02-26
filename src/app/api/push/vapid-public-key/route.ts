/**
 * VAPID PUBLIC KEY API
 *
 * GET /api/push/vapid-public-key - Return VAPID public key for push subscription
 *
 * This endpoint returns the VAPID public key needed for clients to subscribe
 * to push notifications. The key should be set in NEXT_PUBLIC_VAPID_PUBLIC_KEY
 * environment variable.
 */

import { NextResponse } from "next/server";

// ============================================================================
// GET - VAPID Public Key
// ============================================================================

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return NextResponse.json(
      {
        error: "VAPID keys not configured",
        message: "Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      publicKey,
      // Also return the application server URL for reference
      applicationServerUrl: process.env.NEXT_PUBLIC_APP_URL || window?.location?.origin || "http://localhost:3003",
    },
  });
}
