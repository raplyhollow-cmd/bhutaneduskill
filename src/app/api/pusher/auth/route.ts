/**
 * PUSHER AUTHENTICATION ENDPOINT
 *
 * POST /api/pusher/auth - Authorize Pusher channel connections
 *
 * Required for private and presence channels in real-time features
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { channel_name, socket_id } = body;

    // Validate the request
    if (!channel_name || !socket_id) {
      return NextResponse.json(
        { error: "Missing channel_name or socket_id" },
        { status: 400 }
      );
    }

    // For now, we'll return a simple auth response
    // In production, you would generate a proper Pusher signature here
    // using your Pusher app key and secret
    logger.info("Pusher auth request", { userId, channel_name });

    return NextResponse.json({
      auth: `${process.env.NEXT_PUBLIC_PUSHER_KEY}:${userId}`,
    });
  } catch (error) {
    logger.error("Pusher auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
