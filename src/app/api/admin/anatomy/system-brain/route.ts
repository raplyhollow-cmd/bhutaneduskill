/**
 * SYSTEM BRAIN API
 *
 * Returns detailed system architecture analysis.
 * GET /api/admin/anatomy/system-brain
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";
import { scanSystemBrain, getNodesByType, getNodeConnections, getCriticalIssues } from "@/lib/anatomy/system-bran-scanner";

/**
 * GET handler - Returns complete brain scan
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    try {
      const scan = scanSystemBrain();

      // Enrich with additional computed data
      const groupedNodes = getNodesByType(scan);
      const criticalIssues = getCriticalIssues(scan);

      // Add connection details for each node
      const enrichedNodes = scan.nodes.map(node => {
        const connections = getNodeConnections(node.id, scan);
        return {
          ...node,
          incomingCount: connections.incoming.length,
          outgoingCount: connections.outgoing.length,
          totalConnections: connections.incoming.length + connections.outgoing.length,
        };
      });

      return successResponse({
        timestamp: new Date().toISOString(),
        scan: {
          ...scan,
          nodes: enrichedNodes,
        },
        grouped: groupedNodes,
        criticalIssues,
        summary: {
          totalNodes: scan.health.total,
          healthyNodes: scan.health.healthy,
          orphanedNodes: scan.health.orphaned,
          missingNodes: scan.health.missing,
          totalConnections: scan.connections.length,
          healthScore: scan.health.score,
          criticalIssueCount: criticalIssues.length,
        },
      });
    } catch (err) {
      console.error("System brain API error:", err);
      return successResponse({
        error: err instanceof Error ? err.message : "Failed to scan system brain",
        scan: {
          nodes: [],
          connections: [],
          health: { total: 0, healthy: 0, orphaned: 0, missing: 0, score: 0 },
          issues: [],
        },
        grouped: {},
        criticalIssues: [],
        summary: {
          totalNodes: 0,
          healthyNodes: 0,
          orphanedNodes: 0,
          missingNodes: 0,
          totalConnections: 0,
          healthScore: 0,
          criticalIssueCount: 0,
        },
      });
    }
  },
  ["admin"] // Only admin can access
);
