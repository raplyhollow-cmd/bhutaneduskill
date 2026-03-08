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
      const response = await fetch("/api/resources/notifications/actions?action=unread-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setUnreadCount(data.data?.unreadCount || 0);
      setUrgentCount(data.data?.urgentCount || 0);

      return data.data?.unreadCount || 0;
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to fetch unread count:", err);
      }
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

      // Use unified API - POST to action endpoint with data
      const response = await fetch("/api/resources/notifications/actions?action=my-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit,
          status: unreadOnly ? "unread" : "all",
          page: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // API returns { success: true, data: { notifications: [], unreadCount: 0, pagination: {} } }
      const responseData = data.data || {};
      setNotifications(responseData.notifications || []);
      setUnreadCount(responseData.unreadCount || 0);

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
      // Use unified API - POST to mark-read action
      const response = await fetch("/api/resources/notifications/actions?action=mark-read", {
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
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to mark notification as read:", err);
      }
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      // Use unified API - POST to mark-read action
      const response = await fetch("/api/resources/notifications/actions?action=mark-read", {
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
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to mark all as read:", err);
      }
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

  // Store options in refs to avoid recreating the effect
  const optionsRef = useRef({ pollingInterval, enableToasts, limit, unreadOnly });
  optionsRef.current = { pollingInterval, enableToasts, limit, unreadOnly };

  useEffect(() => {
    // Inline fetch logic to avoid dependency on external functions
    const fetchCount = async () => {
      try {
      const response = await fetch("/api/resources/notifications/actions?action=unread-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
        if (response.ok) {
          const data = await response.json();
          const count = data.data?.unreadCount || 0;
          const urgent = data.data?.urgentCount || 0;
          setUnreadCount(count);
          setUrgentCount(urgent);
          return count;
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch unread count:", err);
        }
      }
      return 0;
    };

    const fetchList = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          limit: optionsRef.current.limit.toString(),
          status: optionsRef.current.unreadOnly ? "unread" : "all",
        });

        // Use unified API - POST to action endpoint with data
      const response = await fetch("/api/resources/notifications/actions?action=my-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit,
          status: unreadOnly ? "unread" : "all",
          page: 1,
        }),
      });
        if (response.ok) {
          const data = await response.json();
          const responseData = data.data || {};
          setNotifications(responseData.notifications || []);
          setUnreadCount(responseData.unreadCount || 0);
        }
      } catch (err) {
        // Only log in development - auth failures during normal operation are expected
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch notifications:", err);
        }
        setError("Failed to fetch notifications");
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchList();
    fetchCount().then((count) => {
      previousUnreadCount.current = count;
    });

    // Set up polling
    const intervalId = setInterval(async () => {
      const newCount = await fetchCount();

      // Detect new notifications
      if (
        optionsRef.current.enableToasts &&
        !hasShownInitialToast.current &&
        newCount > previousUnreadCount.current
      ) {
        const diff = newCount - previousUnreadCount.current;
        // Show toast directly without using the callback
        if (typeof window !== "undefined" && diff > 0) {
          const { toast: toastFn } = require("@/components/ui/toast");
          toastFn({
            title: diff === 1 ? "New notification" : "New notifications",
            description: `You have ${diff} new notification${diff > 1 ? "s" : ""}.`,
            variant: "info",
            duration: 4000,
          });
        }
      }

      hasShownInitialToast.current = true;
      previousUnreadCount.current = newCount;

      // Refresh notification list periodically
      await fetchList();
    }, pollingInterval);

    return () => clearInterval(intervalId);
  }, [pollingInterval]); // Only depend on the stable pollingInterval

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

  // Use ref to track latest polling interval
  const pollingIntervalRef = useRef(pollingInterval);
  pollingIntervalRef.current = pollingInterval;

  useEffect(() => {
    // Inline fetch to avoid dependency issues
    const fetchCount = async () => {
      try {
        const response = await fetch("/api/resources/notifications/actions?action=unread-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.data?.unreadCount || 0);
          setUrgentCount(data.data?.urgentCount || 0);
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch unread count:", err);
        }
      }
    };

    fetchCount();
    const intervalId = setInterval(fetchCount, pollingIntervalRef.current);
    return () => clearInterval(intervalId);
  }, []); // Empty deps - effect runs once on mount

  // Provide a refresh function
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/resources/notifications/actions?action=unread-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data?.unreadCount || 0);
        setUrgentCount(data.data?.urgentCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  return { unreadCount, urgentCount, refresh };
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
