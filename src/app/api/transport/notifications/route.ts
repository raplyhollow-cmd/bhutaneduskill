/**
 * TRANSPORT NOTIFICATIONS API
 *
 * GET /api/transport/notifications
 * Returns transport-related notifications for the user
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get("routeId");

    // In a real implementation, this would query the notifications table
    const notifications = [
      {
        id: "notif_001",
        type: "delay",
        title: "Bus Delayed",
        message: "Bus BT-1-1234 is running 10 minutes late due to traffic",
        routeId: "route_001",
        vehicleId: "bus_001",
        severity: "medium",
        createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
        read: false,
      },
      {
        id: "notif_002",
        type: "schedule_change",
        title: "Schedule Change",
        message: "Tomorrow's pickup time will be 10 minutes earlier",
        routeId: "route_001",
        severity: "low",
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        read: true,
      },
    ];

    // Filter by routeId if provided
    const filtered = routeId
      ? notifications.filter(n => n.routeId === routeId)
      : notifications;

    return successResponse({
      success: true,
      notifications: filtered,
      unreadCount: filtered.filter(n => !n.read).length,
    });
  },
  ['student', 'parent', 'teacher', 'admin']
);
