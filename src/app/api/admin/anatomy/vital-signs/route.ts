/**
 * VITAL SIGNS API
 *
 * Pings each resource via the universal API and returns health metrics.
 * GET /api/admin/anatomy/vital-signs
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { getFeatureNames } from "@/lib/anatomy/feature-graph-builder";
import {
  calculateResourceVitalSigns,
  calculateSystemMetrics,
  calculateOverallHealth,
  getOverallStatus,
} from "@/lib/anatomy/vital-signs-calculator";

// Cache for request rate tracking
let requestTimestamps: number[] = [];

/**
 * Ping a single resource and measure latency
 */
async function pingResource(
  resourceName: string,
  baseUrl: string
): Promise<{ latency: number; success: boolean }> {
  const start = performance.now();

  try {
    const response = await fetch(`${baseUrl}/api/resources/${resourceName}?limit=1`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Abort after 5 seconds
      signal: AbortSignal.timeout(5000),
    });

    const latency = performance.now() - start;
    const success = response.ok;

    return { latency, success };
  } catch (err) {
    // Network error or timeout
    return { latency: performance.now() - start, success: false };
  }
}

/**
 * GET handler - Returns vital signs for all resources
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    try {
      const baseUrl = request.headers.get("host") || "localhost:3000";
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      const fullUrl = `${protocol}://${baseUrl}`;

      // Track request for system metrics
      const now = Date.now();
      requestTimestamps.push(now);
      // Keep only last minute
      requestTimestamps = requestTimestamps.filter((t) => now - t < 60000);
      const requestsPerMinute = requestTimestamps.length;

      // Get all feature names
      const resourceNames = getFeatureNames();

      // Ping each resource (sequentially to avoid overwhelming)
      const resources: any[] = [];
      let totalLatency = 0;
      let errorCount = 0;

      for (const name of resourceNames) {
        const { latency, success } = await pingResource(name, fullUrl);

        const vitalSigns = calculateResourceVitalSigns(
          name,
          Math.round(latency),
          success ? 0 : 1
        );

        resources.push(vitalSigns);
        totalLatency += latency;
        if (!success) errorCount++;
      }

      // Calculate overall health
      const overallHealth = calculateOverallHealth(resources);
      const overallStatus = getOverallStatus(overallHealth);

      // Calculate system metrics
      const systemMetrics = calculateSystemMetrics(requestsPerMinute);

      // Calculate synapse (AI healing) info
      const degradedResources = resources.filter(
        (r) => r.status === "degraded" || r.status === "critical"
      );

      return successResponse({
        timestamp: new Date().toISOString(),
        overall: {
          health: overallHealth,
          status: overallStatus,
          avgLatency: Math.round(totalLatency / resources.length),
          errorCount,
          totalResources: resources.length,
        },
        resources,
        system: {
          ...systemMetrics,
          activeResources: resources.filter((r) => r.latency > 0).length,
        },
        synapse: {
          healingSuggestions: degradedResources.length,
          needsAttention: degradedResources.length > 0,
          criticalIssues: resources.filter((r) => r.status === "critical").length,
        },
      });
    } catch (err) {
      console.error("Vital signs API error:", err);
      return errorResponse(
        err instanceof Error ? err.message : "Failed to fetch vital signs",
        500
      );
    }
  },
  ["admin"] // Only admin can access
);
