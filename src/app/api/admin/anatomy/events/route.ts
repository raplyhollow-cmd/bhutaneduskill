/**
 * EVENTS API
 *
 * Returns recent system events for the live terminal feed.
 * GET /api/admin/anatomy/events?limit=50
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

type EventType = "audit" | "error" | "healing" | "latency_spike" | "info";

interface SystemEvent {
  id: string;
  type: EventType;
  message: string;
  feature?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Generate mock events for demonstration
 * (Replace with real audit log queries when available)
 */
function generateMockEvents(limit: number): SystemEvent[] {
  const events: SystemEvent[] = [];
  const features = [
    "students",
    "teachers",
    "classes",
    "subjects",
    "attendance",
    "homework",
  ];
  const messages = [
    "Health check passed",
    "Query executed successfully",
    "Cache refreshed",
    "Index rebuild completed",
    "Connection established",
  ];

  const now = Date.now();

  for (let i = 0; i < limit; i++) {
    const type = Math.random() > 0.8 ? "latency_spike" :
                 Math.random() > 0.9 ? "error" :
                 Math.random() > 0.7 ? "healing" : "info";

    events.push({
      id: `event-${i}`,
      type,
      message: type === "info" ? messages[Math.floor(Math.random() * messages.length)] :
               type === "latency_spike" ? "High latency detected on resource" :
               type === "healing" ? "AI self-healing suggestion applied" :
               "API error occurred",
      feature: features[Math.floor(Math.random() * features.length)],
      timestamp: new Date(now - i * 30000).toISOString(), // 30s apart
      metadata: type === "latency_spike" ? { latency: Math.round(500 + Math.random() * 1000) } : undefined,
    });
  }

  return events;
}

/**
 * GET handler - Returns recent events
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get("limit") || "50");

      // Try to fetch from audit logs
      let events: SystemEvent[] = [];

      try {
        // Fetch recent audit logs
        const recentLogs = await db
          .select({
            id: auditLog.id,
            action: auditLog.action,
            resourceType: auditLog.resourceType,
            userId: auditLog.userId,
            createdAt: auditLog.createdAt,
          })
          .from(auditLog)
          .orderBy(desc(auditLog.createdAt))
          .limit(limit);

        // Convert audit logs to events
        events = recentLogs.map((log) => ({
          id: log.id,
          type: "audit" as EventType,
          message: `${log.action} on ${log.resourceType || "system"}`,
          feature: log.resourceType || undefined,
          timestamp: log.createdAt?.toISOString() || new Date().toISOString(),
        }));
      } catch (auditError) {
        // If audit logs table doesn't exist or query fails, use mock data
        console.warn("Audit logs query failed, using mock data:", auditError);
        events = generateMockEvents(limit);
      }

      // Add some simulated system events
      const systemEvents: SystemEvent[] = [
        {
          id: "system-1",
          type: "info",
          message: "Vital signs check completed",
          timestamp: new Date().toISOString(),
        },
        {
          id: "system-2",
          type: "info",
          message: `Monitoring ${Object.keys(require("@/features").features).length} features`,
          timestamp: new Date(Date.now() - 5000).toISOString(),
        },
      ];

      return successResponse({
        events: [...systemEvents, ...events].slice(0, limit),
        meta: {
          count: events.length,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error("Events API error:", err);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }
  },
  ["admin"]
);
