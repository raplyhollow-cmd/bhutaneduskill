/**
 * PUBLIC ENDPOINTS FOR FEATURES
 *
 * Provides unauthenticated access to specific feature endpoints.
 * Used by setup wizard, public search, etc.
 *
 * Routes:
 * GET    /api/resources/schools/public?search         → public search
 * POST   /api/resources/schools/public?validate-code → validate school code
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
  schools: "schools",
  school: "schools",
  classes: "classes",
  class: "classes",
  subjects: "subjects",
  subject: "subjects",
};

export async function GET(request: NextRequest, context: RouteContext) {
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
    const endpointName = url.searchParams.get("public");

    if (!endpointName) {
      return errorResponse("Missing 'public' query parameter", 400);
    }

    const endpoint = feature.public?.[endpointName];
    if (!endpoint) {
      return notFoundResponse(`Public endpoint "${endpointName}" not found`);
    }

    if (endpoint.method !== "GET") {
      return NextResponse.json(
        { error: `Public endpoint "${endpointName}" does not support GET` },
        { status: 405 }
      );
    }

    const params = Object.fromEntries(url.searchParams);
    return await endpoint.handler(params, request);
  } catch (error) {
    logger.error("Public endpoint GET error", { error });
    return errorResponse(error instanceof Error ? error.message : "Failed to fetch", 500);
  }
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
    const endpointName = url.searchParams.get("public");

    if (!endpointName) {
      return errorResponse("Missing 'public' query parameter", 400);
    }

    const endpoint = feature.public?.[endpointName];
    if (!endpoint) {
      return notFoundResponse(`Public endpoint "${endpointName}" not found`);
    }

    if (endpoint.method !== "POST") {
      return NextResponse.json(
        { error: `Public endpoint "${endpointName}" does not support POST` },
        { status: 405 }
      );
    }

    const data = await request.json();
    return await endpoint.handler(data, request);
  } catch (error) {
    logger.error("Public endpoint POST error", { error });
    return errorResponse(error instanceof Error ? error.message : "Failed to process", 500);
  }
}
