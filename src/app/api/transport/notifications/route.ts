/**
 * TRANSPORT DELAY NOTIFICATIONS API
 *
 * Handles transport delay notifications
 * - GET: Fetch notifications (with filtering)
 * - POST: Create new notification
 * - PATCH: Mark as read
 * - DELETE: Delete notification
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, transportRoutes, transportAllocations } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

// Types for proper TypeScript safety
interface DelayNotification {
  id: string;
  routeId: string;
  message: string;
  delayMinutes: number;
  estimatedArrival: string;
  createdAt: string;
  read: boolean;
  expiresAt?: string;
  createdBy?: string;
}

// In-memory storage for notifications (consider moving to database table)
// For production, create a transport_notifications table
const notificationsStore = new Map<string, DelayNotification>();

// Helper: Check if notification is expired
const isExpired = (notification: DelayNotification): boolean => {
  if (!notification.expiresAt) return false;
  return new Date(notification.expiresAt) < new Date();
};

// ============================================================================
// GET - Fetch delay notifications
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, type: true, role: true, schoolId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get("routeId");
    const activeOnly = searchParams.get("active") === "true";
    const unreadOnly = searchParams.get("unread") === "true";

    let notifications: DelayNotification[] = [];

    // Filter notifications based on user role and parameters
    if (currentUser.role === "admin" || currentUser.role === "school-admin") {
      // Admins see all notifications for their school
      notifications = Array.from(notificationsStore.values()).filter((n) => {
        // Filter by route if specified
        if (routeId && n.routeId !== routeId) return false;
        // Filter expired
        if (activeOnly && isExpired(n)) return false;
        return true;
      });
    } else {
      // Students only see notifications for their assigned route
      const allocation = await db.query.transportAllocations.findFirst({
        where: and(
          eq(transportAllocations.studentId, currentUser.id),
          eq(transportAllocations.isActive, true)
        ),
        columns: { routeId: true },
      });

      if (allocation) {
        notifications = Array.from(notificationsStore.values()).filter((n) => {
          if (n.routeId !== allocation.routeId) return false;
          if (activeOnly && isExpired(n)) return false;
          if (unreadOnly && n.read) return false;
          return true;
        });
      }
    }

    // Sort by creation date (newest first)
    notifications.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      notifications,
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/notifications", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create delay notification
// ============================================================================

interface CreateNotificationBody {
  routeId: string;
  message: string;
  delayMinutes: number;
  estimatedArrival?: string;
  expiresAt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, type: true, role: true, schoolId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body: CreateNotificationBody = await request.json();
    const { routeId, message, delayMinutes, estimatedArrival, expiresAt } = body;

    // Validate required fields
    if (!routeId || !message || delayMinutes === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: routeId, message, delayMinutes" },
        { status: 400 }
      );
    }

    // Verify route exists
    const route = await db.query.transportRoutes.findFirst({
      where: eq(transportRoutes.id, routeId),
    });

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    // Create notification
    const notificationId = `notify-${nanoid()}`;
    const notification: DelayNotification = {
      id: notificationId,
      routeId,
      message,
      delayMinutes,
      estimatedArrival:
        estimatedArrival ||
        new Date(Date.now() + delayMinutes * 60000).toISOString(),
      createdAt: new Date().toISOString(),
      read: false,
      expiresAt:
        expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default 24 hours
      createdBy: userId,
    };

    notificationsStore.set(notificationId, notification);

    logger.info("Transport delay notification created", {
      notificationId,
      routeId,
      delayMinutes,
      createdBy: userId,
    });

    // Get affected students count
    const affectedAllocations = await db.query.transportAllocations.findMany({
      where: and(
        eq(transportAllocations.routeId, routeId),
        eq(transportAllocations.isActive, true)
      ),
    });

    return NextResponse.json({
      success: true,
      notification,
      affectedStudents: affectedAllocations.length,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/notifications", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Mark notification as read
// ============================================================================

interface UpdateNotificationBody {
  notificationId: string;
  read?: boolean;
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body: UpdateNotificationBody = await request.json();
    const { notificationId, read = true } = body;

    const notification = notificationsStore.get(notificationId);

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Update notification
    const updated: DelayNotification = {
      ...notification,
      read,
    };

    notificationsStore.set(notificationId, updated);

    return NextResponse.json({
      success: true,
      notification: updated,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/notifications", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete notification
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");
    const routeId = searchParams.get("routeId");
    const allExpired = searchParams.get("allExpired") === "true";

    // Delete specific notification
    if (notificationId) {
      const deleted = notificationsStore.delete(notificationId);
      if (!deleted) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }

      logger.info("Transport notification deleted", { notificationId });

      return NextResponse.json({
        success: true,
        message: "Notification deleted successfully",
      });
    }

    // Delete all notifications for a route
    if (routeId) {
      let count = 0;
      for (const [id, notification] of notificationsStore.entries()) {
        if (notification.routeId === routeId) {
          notificationsStore.delete(id);
          count++;
        }
      }

      logger.info("All notifications for route deleted", { routeId, count });

      return NextResponse.json({
        success: true,
        message: `${count} notification(s) deleted`,
      });
    }

    // Delete all expired notifications
    if (allExpired) {
      let count = 0;
      for (const [id, notification] of notificationsStore.entries()) {
        if (isExpired(notification)) {
          notificationsStore.delete(id);
          count++;
        }
      }

      logger.info("Expired notifications cleaned up", { count });

      return NextResponse.json({
        success: true,
        message: `${count} expired notification(s) deleted`,
      });
    }

    return NextResponse.json(
      { error: "Specify notification id, routeId, or allExpired parameter" },
      { status: 400 }
    );
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/notifications", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
