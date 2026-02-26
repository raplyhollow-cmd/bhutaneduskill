/**
 * NOTIFICATION BELL COMPONENT
 *
 * Displays a bell icon with:
 * - Unread notification badge
 * - Dropdown with recent notifications
 * - Mark as read functionality
 * - Empty state
 * - Push notification subscription management
 *
 * @example
 * ```tsx
 * import { NotificationBell } from "@/components/ui/notification-bell";
 *
 * <NotificationBell />
 * ```
 */

"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, CheckCircle, AlertCircle, Info, Calendar, FileText, Award, User, BellOff, BellRing, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications, type NotificationItem, type NotificationPriority } from "@/lib/hooks/use-notifications";
import { usePushNotification, usePushNotificationStatus } from "@/hooks/use-push-notification";

// ============================================================================
// TYPES
// ============================================================================

interface NotificationBellProps {
  /**
   * Custom class name
   */
  className?: string;
  /**
   * Polling interval in milliseconds
   * @default 30000 (30 seconds)
   */
  pollingInterval?: number;
  /**
   * Maximum number of notifications to display in dropdown
   * @default 5
   */
  displayLimit?: number;
  /**
   * Enable toast notifications for new items
   * @default true
   */
  enableToasts?: boolean;
}

// ============================================================================
// NOTIFICATION ICONS
// ============================================================================

function getNotificationIcon(type: NotificationItem["type"], priority: NotificationPriority) {
  const iconSize = 16;
  const baseClass = "flex-shrink-0";

  switch (type) {
    case "homework":
      return <FileText className={baseClass} style={{ width: iconSize, height: iconSize }} />;
    case "grade":
      return <Award className={baseClass} style={{ width: iconSize, height: iconSize }} />;
    case "attendance":
      return <CheckCircle className={baseClass} style={{ width: iconSize, height: iconSize }} />;
    case "alert":
      return <AlertCircle className={baseClass} style={{ width: iconSize, height: iconSize }} />;
    case "reminder":
      return <Calendar className={baseClass} style={{ width: iconSize, height: iconSize }} />;
    case "announcement":
    default:
      return <Info className={baseClass} style={{ width: iconSize, height: iconSize }} />;
  }
}

function getPriorityColor(priority: NotificationPriority): string {
  switch (priority) {
    case "urgent":
      return "rgb(239, 68, 68)"; // red
    case "high":
      return "rgb(249, 115, 22)"; // orange
    case "normal":
      return "rgb(59, 130, 246)"; // blue
    case "low":
      return "rgb(107, 114, 128)"; // gray
    default:
      return "rgb(59, 130, 246)";
  }
}

// ============================================================================
// TIME AGO HELPER
// ============================================================================

function timeAgo(date: Date | null): string {
  if (!date) return "";

  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

// ============================================================================
// NOTIFICATION ITEM COMPONENT
// ============================================================================

interface NotificationItemProps {
  notification: NotificationItem;
  onRead: (deliveryId: string) => void;
}

function NotificationItemComponent({ notification, onRead }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.deliveryId);
    }
    // Navigate to actionUrl if exists
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "flex gap-3 p-3 cursor-pointer transition-colors",
        !notification.isRead && "bg-blue-50/50 hover:bg-blue-50",
        notification.isRead && "hover:bg-gray-50"
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: `${getPriorityColor(notification.priority)}20`,
          color: getPriorityColor(notification.priority),
        }}
      >
        {getNotificationIcon(notification.type, notification.priority)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium truncate",
              !notification.isRead ? "text-gray-900" : "text-gray-600"
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo(notification.deliveredAt)}</p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN NOTIFICATION BELL COMPONENT
// ============================================================================

export function NotificationBell({
  className,
  pollingInterval = 30000,
  displayLimit = 5,
  enableToasts = true,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  const {
    unreadCount,
    urgentCount,
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications({
    pollingInterval,
    enableToasts,
    limit: displayLimit,
    unreadOnly: false,
  });

  // Push notification status (lightweight check)
  const pushStatus = usePushNotificationStatus();

  // Show push notification prompt after first interaction
  useEffect(() => {
    if (pushStatus.canRequest && !showPushPrompt) {
      // Only show prompt after user has been on page for a while
      const timer = setTimeout(() => {
        const hasSeenPrompt = sessionStorage.getItem("push-prompt-seen");
        if (!hasSeenPrompt && pushStatus.canRequest) {
          setShowPushPrompt(true);
        }
      }, 30000); // Show after 30 seconds

      return () => clearTimeout(timer);
    }
  }, [pushStatus.canRequest, showPushPrompt]);

  // Handle push notification enable
  const handleEnablePush = useCallback(async () => {
    setShowPushPrompt(false);
    sessionStorage.setItem("push-prompt-seen", "true");

    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
      // If granted, the usePushNotification hook will handle subscription
    }
  }, []);

  // Handle push notification disable
  const handleDisablePush = useCallback(async () => {
    setShowPushPrompt(false);
    // This would open settings to manage notifications
  }, []);

  // Display notifications (limit shown in dropdown)
  const displayNotifications = notifications.slice(0, displayLimit);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Refresh when opening dropdown
  const handleToggle = () => {
    if (!isOpen) {
      refresh();
    }
    setIsOpen((prev) => !prev);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Bell Button */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gray-100 min-h-[44px] min-w-[44px]"
          onClick={handleToggle}
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          {pushStatus.isSubscribed ? (
            <BellRing className="w-5 h-5 text-blue-600" />
          ) : (
            <Bell className="w-5 h-5 text-gray-600" />
          )}

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{
                backgroundColor: urgentCount > 0 ? "rgb(239, 68, 68)" : "rgb(59, 130, 246)",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}

          {/* Urgent Indicator */}
          {urgentCount > 0 && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </Button>
      </motion.div>

      {/* Push Notification Prompt Banner */}
      <AnimatePresence>
        {showPushPrompt && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm">Enable Notifications</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Get notified about homework, grades, and important updates even when you're not on the page.
                  </p>
                </div>
                <button
                  onClick={() => setShowPushPrompt(false)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                  onClick={() => {
                    setShowPushPrompt(false);
                    sessionStorage.setItem("push-prompt-seen", "true");
                  }}
                >
                  Not now
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  style={{ background: "rgb(59, 130, 246)", color: "white" }}
                  onClick={handleEnablePush}
                >
                  Enable
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            {/* Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="info" size="sm">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={handleMarkAllAsRead}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-[400px] overflow-y-auto">
                {isLoading && notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <Bell className="w-5 h-5" />
                    </div>
                    <p className="text-sm">Loading notifications...</p>
                  </div>
                ) : displayNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Bell className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">No notifications</p>
                    <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    <AnimatePresence mode="popLayout">
                      {displayNotifications.map((notification) => (
                        <NotificationItemComponent
                          key={notification.deliveryId}
                          notification={notification}
                          onRead={markAsRead}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <>
                  {/* Push Notification Settings */}
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {pushStatus.isSubscribed ? (
                          <BellRing className="w-4 h-4 text-blue-600" />
                        ) : (
                          <BellOff className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-700">
                          {pushStatus.isSubscribed ? "Notifications enabled" : "Enable desktop notifications"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          if (pushStatus.isSubscribed) {
                            // Navigate to settings or show unsubscribe modal
                            window.location.href = "/settings/notifications";
                          } else if (pushStatus.canRequest) {
                            handleEnablePush();
                          }
                        }}
                      >
                        {pushStatus.isSubscribed ? "Manage" : "Enable"}
                      </Button>
                    </div>
                  </div>

                  <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                    <button
                      onClick={() => {
                        window.location.href = "/notifications";
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center"
                    >
                      View all notifications
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// LIGHTWEIGHT VARIANT (Badge Only)
// ============================================================================

interface NotificationBadgeProps {
  className?: string;
  pollingInterval?: number;
  onClick?: () => void;
}

export function NotificationBadge({
  className,
  pollingInterval = 30000,
  onClick,
}: NotificationBadgeProps) {
  const { unreadCount, urgentCount } = useNotifications({
    pollingInterval,
    enableToasts: true,
    limit: 1,
    unreadOnly: true,
  });

  return (
    <button
      className={cn("relative min-h-[44px] min-w-[44px]", className)}
      onClick={onClick}
      aria-label={`Notifications (${unreadCount} unread)`}
    >
      <Bell className="w-5 h-5 text-gray-600" />

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{
            backgroundColor: urgentCount > 0 ? "rgb(239, 68, 68)" : "rgb(59, 130, 246)",
          }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}

      {/* Urgent Indicator */}
      {urgentCount > 0 && (
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}
