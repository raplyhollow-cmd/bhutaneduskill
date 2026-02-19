import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

// Clerk webhook secret - set in Clerk Dashboard → Webhooks → Endpoint → Signing Secret
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

/**
 * Clerk Webhook Endpoint
 *
 * Handles real-time user synchronization events from Clerk:
 * - user.created: Create placeholder user in database
 * - user.updated: Sync email/name changes
 * - user.deleted: Soft delete user
 *
 * Setup:
 * 1. Go to Clerk Dashboard → Webhooks
 * 2. Add endpoint: https://your-domain.com/api/clerk/webhook
 * 3. Select events: user.created, user.updated, user.deleted
 * 4. Copy Signing Secret to CLERK_WEBHOOK_SECRET env variable
 */
export async function POST(req: NextRequest) {
  // Verify webhook secret is configured
  if (!WEBHOOK_SECRET) {
    logger.error("CLERK_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured", status: 500 },
      { status: 500 }
    );
  }

  // Get headers for webhook verification
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  // Verify required headers are present
  if (!svixId || !svixTimestamp || !svixSignature) {
    logger.error("Missing webhook headers", {
      hasId: !!svixId,
      hasTimestamp: !!svixTimestamp,
      hasSignature: !!svixSignature,
    });
    return NextResponse.json(
      { error: "Missing webhook headers", status: 400 },
      { status: 400 }
    );
  }

  // Get raw body for signature verification
  const rawBody = await req.text();

  // Verify webhook signature using Svix
  let evt: any;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    evt = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (error) {
    logger.error("Webhook signature verification failed", error);
    return NextResponse.json(
      { error: "Invalid webhook signature", status: 401 },
      { status: 401 }
    );
  }

  // Extract event type and data
  const eventType = evt?.type;
  const eventData = evt?.data;

  if (!eventType || !eventData) {
    logger.error("Invalid webhook payload", { eventType, hasData: !!eventData });
    return NextResponse.json(
      { error: "Invalid webhook payload", status: 400 },
      { status: 400 }
    );
  }

  logger.info("Clerk webhook received", { eventType, clerkUserId: eventData.id });

  try {
    switch (eventType) {
      case "user.created":
        await handleUserCreated(eventData);
        break;

      case "user.updated":
        await handleUserUpdated(eventData);
        break;

      case "user.deleted":
        await handleUserDeleted(eventData);
        break;

      default:
        logger.debug("Unhandled webhook event", { eventType });
    }

    return NextResponse.json(
      { data: { message: "Webhook processed" }, status: 200 },
      { status: 200 }
    );
  } catch (error) {
    logger.apiError(error, {
      route: "/api/clerk/webhook",
      method: "POST",
      eventType,
      clerkUserId: eventData?.id,
    });
    return NextResponse.json(
      { error: "Failed to process webhook", status: 500 },
      { status: 500 }
    );
  }
}

/**
 * Handle user.created event
 * Creates a placeholder user with type: 'pending'
 * The user will complete setup through the setup wizard
 */
async function handleUserCreated(data: any) {
  const clerkUserId = data.id;
  const firstName = data.first_name || "";
  const lastName = data.last_name || "";
  const email = data.email_addresses?.[0]?.email_address || "";
  const imageUrl = data.image_url || null;

  // Check if user already exists (shouldn't happen for created event)
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (existing.length > 0) {
    logger.info("User already exists, skipping creation", { clerkUserId });
    return;
  }

  // Create placeholder user with pending type
  const userId = `user-${nanoid()}`;
  const name = `${firstName} ${lastName}`.trim() || email.split("@")[0] || "User";

  await db.insert(users).values({
    id: userId,
    clerkUserId: clerkUserId,
    type: "pending", // Will be set during setup wizard
    role: "pending",
    name: name,
    firstName: firstName,
    lastName: lastName,
    email: email,
    phone: "", // Will be filled during setup
    grade: 0, // Default value
    section: "",
    country: "Bhutan", // Default country
    enrollmentDate: new Date().toISOString(),
    profileImage: imageUrl,
    isActive: true,
    emailVerified: data.email_addresses?.[0]?.verification?.status === "verified" || false,
    onboardingComplete: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  logger.info("Created placeholder user from webhook", { userId, clerkUserId, email });
}

/**
 * Handle user.updated event
 * Syncs email, name, and profile image changes
 */
async function handleUserUpdated(data: any) {
  const clerkUserId = data.id;

  // Check if user exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (existing.length === 0) {
    logger.warn("User not found for update event", { clerkUserId });
    // Create user if doesn't exist (edge case)
    await handleUserCreated(data);
    return;
  }

  const user = existing[0];
  const firstName = data.first_name || user.firstName;
  const lastName = data.last_name || user.lastName;
  const email = data.email_addresses?.[0]?.email_address || user.email;
  const imageUrl = data.image_url || user.profileImage;
  const isEmailVerified = data.email_addresses?.[0]?.verification?.status === "verified" || false;

  // Build update object with only changed fields
  const updates: Record<string, any> = {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    email,
    emailVerified: isEmailVerified,
    updatedAt: new Date(),
  };

  // Only update profile image if changed
  if (imageUrl && imageUrl !== user.profileImage) {
    updates.profileImage = imageUrl;
  }

  await db
    .update(users)
    .set(updates)
    .where(eq(users.clerkUserId, clerkUserId));

  logger.info("Updated user from webhook", { clerkUserId, updatedFields: Object.keys(updates) });
}

/**
 * Handle user.deleted event
 * Soft deletes user by setting isActive: false
 */
async function handleUserDeleted(data: any) {
  const clerkUserId = data.id;

  // Check if user exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (existing.length === 0) {
    logger.warn("User not found for delete event", { clerkUserId });
    return;
  }

  // Soft delete - set isActive to false
  await db
    .update(users)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(users.clerkUserId, clerkUserId));

  logger.info("Soft deleted user from webhook", { clerkUserId });
}

/**
 * GET endpoint for webhook verification
 * Returns 200 to confirm endpoint is active
 */
export async function GET() {
  return NextResponse.json(
    {
      data: {
        message: "Clerk webhook endpoint is active",
        events: ["user.created", "user.updated", "user.deleted"],
      },
      status: 200
    },
    { status: 200 }
  );
}
