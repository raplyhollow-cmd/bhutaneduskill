/**
 * TRANSPORT DELAY NOTIFICATIONS API
 *
 * Handles transport delay notifications
 * - GET: Fetch notifications (with filtering)
 * - POST: Create new notification
 * - PATCH: Mark as read
 * - DELETE: Delete notification
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, transportRoutes, transportAllocations } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";

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

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const currentUser = await db
      .select({
        id: users.id,
        type: users.type,
        role: users.role,
        schoolId: users.schoolId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!currentUser) {
      return { error: "User not found", status: 404 };
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
      const allocation = await db
        .select({ routeId: transportAllocations.routeId })
        .from(transportAllocations)
        .where(
          and(
            eq(transportAllocations.studentId, currentUser.id),
            eq(transportAllocations.isActive, true)
          )
        )
        .limit(1)
        .then(rows => rows[0] || null);

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

    return {
      notifications,
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
    };
  }
);

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

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const currentUser = await db
      .select({
        id: users.id,
        type: users.type,
        role: users.role,
        schoolId: users.schoolId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!currentUser) {
      return { error: "User not found", status: 404 };
    }

    const body: CreateNotificationBody = await request.json();
    const { routeId, message, delayMinutes, estimatedArrival, expiresAt } = body;

    // Validate required fields
    if (!routeId || !message || delayMinutes === undefined) {
      return { error: "Missing required fields: routeId, message, delayMinutes", status: 400 };
    }

    // Verify route exists
    const route = await db
      .select()
      .from(transportRoutes)
      .where(eq(transportRoutes.id, routeId))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!route) {
      return { error: "Route not found", status: 404 };
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
    const affectedAllocations = await db
      .select()
      .from(transportAllocations)
      .where(
        and(
          eq(transportAllocations.routeId, routeId),
          eq(transportAllocations.isActive, true)
        )
      );

    return {
      notification,
      affectedStudents: affectedAllocations.length,
    };
  },
  ['admin', 'school-admin']
);

// ============================================================================
// PATCH - Mark notification as read
// ============================================================================

interface UpdateNotificationBody {
  notificationId: string;
  read?: boolean;
}

export const PATCH = createApiRoute(
  async (request: NextRequest, auth) => {
    const body: UpdateNotificationBody = await request.json();
    const { notificationId, read = true } = body;

    const notification = notificationsStore.get(notificationId);

    if (!notification) {
      return { error: "Notification not found", status: 404 };
    }

    // Update notification
    const updated: DelayNotification = {
      ...notification,
      read,
    };

    notificationsStore.set(notificationId, updated);

    return { notification: updated };
  }
);

// ============================================================================
// DELETE - Delete notification
// ============================================================================

export const DELETE = createApiRoute(
  async (request: NextRequest, auth) => {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");
    const routeId = searchParams.get("routeId");
    const allExpired = searchParams.get("allExpired") === "true";

    // Delete specific notification
    if (notificationId) {
      const deleted = notificationsStore.delete(notificationId);
      if (!deleted) {
        return { error: "Notification not found", status: 404 };
      }

      logger.info("Transport notification deleted", { notificationId });

      return {
        message: "Notification deleted successfully",
      };
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

      return {
        message: `${count} notification(s) deleted`,
      };
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

      return {
        message: `${count} expired notification(s) deleted`,
      };
    }

    return { error: "Specify notification id, routeId, or allExpired parameter", status: 400 };
  },
  ['admin', 'school-admin']
);
