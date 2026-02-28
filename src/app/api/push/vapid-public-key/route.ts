/**
 * VAPID PUBLIC KEY API
 *
 * GET /api/push/vapid-public-key - Return VAPID public key for push subscription
 *
 * This endpoint returns the VAPID public key needed for clients to subscribe
 * to push notifications. The key should be set in NEXT_PUBLIC_VAPID_PUBLIC_KEY
 * environment variable.
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET - VAPID Public Key
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest) => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      return errorResponse("VAPID keys not configured. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable", 500);
    }

    return successResponse({
      publicKey,
      // Also return the application server URL for reference
      applicationServerUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003",
    });
  }
);
