/**
 * FEATURE GRAPH API
 *
 * Returns force-directed graph data for all features.
 * GET /api/admin/anatomy/feature-graph
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";
import { buildFeatureGraph } from "@/lib/anatomy/feature-graph-builder";

/**
 * GET handler - Returns graph data
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    try {
      const graphData = buildFeatureGraph();

      return successResponse({
        nodes: graphData.nodes,
        links: graphData.links,
        meta: {
          nodeCount: graphData.nodes.length,
          linkCount: graphData.links.length,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error("Feature graph API error:", err);
      return NextResponse.json(
        { error: "Failed to build feature graph" },
        { status: 500 }
      );
    }
  },
  ["admin"]
);
