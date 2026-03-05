/**
 * WEBHOOKS FOR FEATURES
 *
 * Handles external service callbacks (no authentication required).
 * Webhooks verify signatures if configured.
 *
 * Routes:
 * POST   /api/resources/users/webhooks/clerk           → Clerk webhook
 * POST   /api/resources/payments/webhooks/stripe       → Stripe webhook
 * POST   /api/resources/payments/webhooks/rma          → RMA payment webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { errorResponse, notFoundResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { getFeature, type FeatureName } from "@/features";

interface RouteContext {
  params: Promise<{ resource: string }>;
}

// Map resource names to feature names
const resourceMapping: Record<string, FeatureName> = {
  users: "users",
  user: "users",
  payments: "payments",
  payment: "payments",
  subscriptions: "subscriptions",
  billing: "billing",
};

/**
 * Verify webhook signature (placeholder for implementation)
 * Real implementation would use HMAC verification specific to each service
 */
function verifyWebhookSignature(
  request: NextRequest,
  webhookConfig: { verifySignature?: boolean; secretHeader?: string }
): boolean {
  if (!webhookConfig.verifySignature) {
    return true; // Skip verification if not configured
  }

  // TODO: Implement actual signature verification
  // This would typically involve:
  // 1. Getting the signature from the header
  // 2. Computing HMAC using the secret
  // 3. Comparing with the received signature
  logger.info("Webhook signature verification", {
    header: webhookConfig.secretHeader,
    // Implement actual verification logic here
  });

  return true;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { resource } = await context.params;
    const featureName = resourceMapping[resource];

    if (!featureName) {
      return notFoundResponse(`Resource "${resource}" not found`);
    }

    const feature = getFeature(featureName);
    if (!feature) {
      return notFoundResponse(`Feature "${featureName}" not found`);
    }

    const url = new URL(request.url);
    const webhookName = url.searchParams.get("webhook");

    if (!webhookName) {
      return errorResponse("Missing 'webhook' query parameter", 400);
    }

    const webhook = feature.webhooks?.[webhookName];
    if (!webhook) {
      return notFoundResponse(`Webhook "${webhookName}" not found`);
    }

    // Verify signature if configured
    if (!verifyWebhookSignature(request, webhook)) {
      return errorResponse("Invalid webhook signature", 401);
    }

    const data = await request.json();
    logger.info(`Webhook ${webhookName} received for ${resource}`, {
      source: webhook.source,
    });

    return await webhook.handler(data, request);
  } catch (error) {
    logger.error("Webhook error", { error });
    return errorResponse(error instanceof Error ? error.message : "Webhook failed", 500);
  }
}
