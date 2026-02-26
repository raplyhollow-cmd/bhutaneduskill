/**
 * USE NOTIFICATIONS HOOK
 *
 * Real-time notification polling hook with toast triggers.
 * Provides unread count, notification list, and mark-as-read functionality.
 *
 * @example
 * ```tsx
 * import { useNotifications } from "@/lib/hooks/use-notifications";
 *
 * function MyComponent() {
 *   const { unreadCount, notifications, markAsRead, markAllAsRead, isLoading } = useNotifications();
 *
 *   return (
 *     <NotificationBell count={unreadCount} />
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationItem {
  id: string;
  deliveryId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: string | null;
  priority: NotificationPriority;
  actionUrl: string | null;
  actionLabel: string | null;
  isRead: boolean;
  readAt: Date | null;
  deliveredAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export type NotificationType =
  | "announcement"
  | "alert"
  | "reminder"
  | "system"
  | "welcome"
  | "homework"
  | "grade"
  | "attendance";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface UseNotificationsOptions {
  /**
   * Polling interval in milliseconds
   * @default 30000 (30 seconds)
   */
  pollingInterval?: number;
  /**
   * Enable toast notifications for new items
   * @default true
   */
  enableToasts?: boolean;
  /**
   * Maximum number of notifications to fetch
   * @default 20
   */
  limit?: number;
  /**
   * Only fetch unread notifications
   * @default false
   */
  unreadOnly?: boolean;
}

export interface UseNotificationsReturn {
  /** Unread notification count */
  unreadCount: number;
  /** Urgent (high priority) unread count */
  urgentCount: number;
  /** List of notifications */
  notifications: NotificationItem[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Mark specific notification as read */
  markAsRead: (deliveryId: string) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
  /** Refresh notifications */
  refresh: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    pollingInterval = 30000,
    enableToasts = true,
    limit = 20,
    unreadOnly = false,
  } = options;

  const [unreadCount, setUnreadCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track previous unread count to detect new notifications
  const previousUnreadCount = useRef(0);
  const hasShownInitialToast = useRef(false);

  /**
   * Fetch unread notification count
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/my-notifications/unread-count");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setUnreadCount(data.data?.unreadCount || 0);
      setUrgentCount(data.data?.urgentCount || 0);

      return data.data?.unreadCount || 0;
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
      return 0;
    }
  }, []);

  /**
   * Fetch notifications
   */
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        status: unreadOnly ? "unread" : "all",
      });

      const response = await fetch(`/api/notifications/my-notifications?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch notifications";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [limit, unreadOnly]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (deliveryId: string) => {
    try {
      const response = await fetch("/api/notifications/my-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryIds: [deliveryId] }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.deliveryId === deliveryId ? { ...n, isRead: true, readAt: new Date() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/my-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }, []);

  /**
   * Refresh notifications
   */
  const refresh = useCallback(async () => {
    await fetchNotifications();
    await fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  /**
   * Show toast for new notifications
   */
  const showNewNotificationToast = useCallback((count: number) => {
    if (!enableToasts || count === 0) return;

    // Dynamic import to avoid SSR issues
    if (typeof window !== "undefined") {
      const { toast: toastFn } = require("@/components/ui/toast");
      toastFn({
        title: count === 1 ? "New notification" : "New notifications",
        description: `You have ${count} new notification${count > 1 ? "s" : ""}.`,
        variant: "info",
        duration: 4000,
      });
    }
  }, [enableToasts]);

  // ============================================================================
  // POLLING EFFECT
  // ============================================================================

  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    fetchUnreadCount().then((count) => {
      previousUnreadCount.current = count;
    });

    // Set up polling
    const intervalId = setInterval(async () => {
      const newCount = await fetchUnreadCount();

      // Detect new notifications
      if (
        enableToasts &&
        !hasShownInitialToast.current &&
        newCount > previousUnreadCount.current
      ) {
        const diff = newCount - previousUnreadCount.current;
        showNewNotificationToast(diff);
      }

      hasShownInitialToast.current = true;
      previousUnreadCount.current = newCount;

      // Refresh notification list periodically
      await fetchNotifications();
    }, pollingInterval);

    return () => clearInterval(intervalId);
  }, [pollingInterval, fetchNotifications, fetchUnreadCount, enableToasts, showNewNotificationToast]);

  return {
    unreadCount,
    urgentCount,
    notifications,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Hook that only fetches unread count (lightweight)
 * Useful for showing notification badge without loading full list
 */
export function useUnreadCount(options: { pollingInterval?: number } = {}) {
  const { pollingInterval = 30000 } = options;
  const [unreadCount, setUnreadCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/my-notifications/unread-count");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data?.unreadCount || 0);
        setUrgentCount(data.data?.urgentCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const intervalId = setInterval(fetchCount, pollingInterval);
    return () => clearInterval(intervalId);
  }, [pollingInterval, fetchCount]);

  return { unreadCount, urgentCount, refresh: fetchCount };
}

/**
 * Hook for real-time notification bell with minimal overhead
 */
export function useNotificationBell(options: { pollingInterval?: number } = {}) {
  const { unreadCount, urgentCount, refresh } = useUnreadCount(options);
  const [isOpen, setIsOpen] = useState(false);

  return {
    unreadCount,
    urgentCount,
    isOpen,
    setIsOpen,
    refresh,
  };
}
