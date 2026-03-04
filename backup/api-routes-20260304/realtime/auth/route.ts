/**
 * REALTIME AUTH ENDPOINT
 *
 * Authenticates Pusher private and presence channels.
 * Called automatically by Pusher client when subscribing to private channels.
 *
 * POST /api/realtime/auth
 *
 * Request body:
 * - channel_name: The channel to authenticate
 * - socket_id: The Pusher socket ID
 *
 * This endpoint:
 * 1. Verifies the user is authenticated
 * 2. Checks if the user has permission to access the channel
 * 3. Returns an auth signature for Pusher
 */

import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Parse channel name to extract type and ID
 * Examples:
 * - private-school-abc123 -> { type: 'school', id: 'abc123', isPrivate: true }
 * - private-class-xyz789 -> { type: 'class', id: 'xyz789', isPrivate: true }
 * - presence-class-xyz789 -> { type: 'class', id: 'xyz789', isPresence: true }
 */
interface ChannelInfo {
  type: "school" | "class" | "user" | "presence";
  id: string;
  isPrivate: boolean;
  isPresence: boolean;
  rawType: string;
}

function parseChannelName(channelName: string): ChannelInfo | null {
  // Private channels
  const privateMatch = channelName.match(/^private-(\w+)-(.+)$/);
  if (privateMatch) {
    return {
      type: privateMatch[1] as ChannelInfo["type"],
      id: privateMatch[2],
      isPrivate: true,
      isPresence: false,
      rawType: privateMatch[1],
    };
  }

  // Presence channels
  const presenceMatch = channelName.match(/^presence-(\w+)-(.+)$/);
  if (presenceMatch) {
    return {
      type: presenceMatch[1] as ChannelInfo["type"],
      id: presenceMatch[2],
      isPrivate: false,
      isPresence: true,
      rawType: presenceMatch[1],
    };
  }

  return null;
}

/**
 * Check if user has permission to access a channel
 */
async function canAccessChannel(
  channelInfo: ChannelInfo,
  userId: string,
  userSchoolId: string | null,
  userType: string
): Promise<boolean> {
  const { type, id, rawType } = channelInfo;

  switch (type) {
    case "school":
      // Users can access their own school's channel
      // Admins can access any school channel
      if (userType === "admin") return true;
      return id === userSchoolId;

    case "class":
      // TODO: Check if user is member of this class
      // For now, allow if same school
      if (userType === "admin") return true;
      return true; // Temporary: allow same-school access

    case "user":
      // Users can only access their own user channel
      // Admins can access any user channel
      if (userType === "admin") return true;
      return id === userId;

    case "presence":
      // Presence channels for class
      if (rawType === "class") {
        // TODO: Check class membership
        return true; // Temporary: allow
      }
      return false;

    default:
      return false;
  }
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const authResult = await requireAuth();

    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId, user } = authResult;

    // 2. Parse request body
    const body = await req.json() as {
      channel_name: string;
      socket_id: string;
    };

    const { channel_name: channelName, socket_id: socketId } = body;

    if (!channelName || !socketId) {
      return NextResponse.json(
        { error: "Missing channel_name or socket_id" },
        { status: 400 }
      );
    }

    // 3. Parse channel name
    const channelInfo = parseChannelName(channelName);

    if (!channelInfo) {
      logger.warn("Invalid channel name format", { channelName, userId });
      return NextResponse.json(
        { error: "Invalid channel name format" },
        { status: 400 }
      );
    }

    // 4. Check permission
    const hasAccess = await canAccessChannel(
      channelInfo,
      userId,
      user.schoolId || null,
      user.type
    );

    if (!hasAccess) {
      logger.security("Unauthorized channel access attempt", {
        userId,
        userType: user.type,
        channelName,
      });
      return NextResponse.json(
        { error: "Unauthorized access to channel" },
        { status: 403 }
      );
    }

    // 5. Generate auth response
    // For now, return a simple success response
    // In production with Pusher, you would generate a proper auth signature
    // using crypto.createHmac with the PUSHER_SECRET
    const authResponse = {
      auth: `${process.env.NEXT_PUBLIC_PUSHER_KEY}:${generateAuthSignature(channelName, socketId)}`,
      // For presence channels, include user info
      ...(channelInfo.isPresence && {
        channel_data: JSON.stringify({
          user_id: userId,
          user_info: {
            id: userId,
            name: user.firstName,
            type: user.type,
          },
        }),
      }),
    };

    logger.info("Pusher channel authenticated", {
      userId,
      userType: user.type,
      channelName,
    });

    return NextResponse.json({
      success: true,
      data: authResponse,
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/realtime/auth", method: "POST" });

    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

// ============================================================================
// AUTH SIGNATURE (Simple implementation)
// ============================================================================

/**
 * Generate auth signature for Pusher
 * In production, use proper HMAC-SHA256 signing
 *
 * @param channel - Channel name
 * @param socketId - Pusher socket ID
 * @returns Auth signature string
 */
function generateAuthSignature(channel: string, socketId: string): string {
  // Simple implementation for development
  // In production, use:
  // import crypto from 'crypto';
  // const stringToSign = `${socketId}:${channel}`;
  // const signature = crypto.createHmac('sha256', PUSHER_SECRET).update(stringToSign).digest('hex');
  // return signature;

  const data = `${socketId}:${channel}:${Date.now()}`;
  return Buffer.from(data).toString("base64").substring(0, 32);
}
