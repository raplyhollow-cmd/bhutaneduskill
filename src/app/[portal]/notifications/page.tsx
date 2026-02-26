/**
 * NOTIFICATIONS PAGE
 *
 * Full-page view of all notifications with filtering and management.
 * Accessible via /notifications (portal-specific routes: /student/notifications, etc.)
 *
 * @example
 * - Student: /student/notifications
 * - Teacher: /teacher/notifications
 * - Parent: /parent/notifications
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Filter, Check, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications, type NotificationType, type NotificationPriority } from "@/lib/hooks/use-notifications";

// ============================================================================
// TYPES
// ============================================================================

type FilterType = "all" | "unread" | "read";
type TypeFilter = NotificationType | "all";

// ============================================================================
// COMPONENTS
// ============================================================================

interface NotificationCardProps {
  notification: ReturnType<typeof useNotifications>["notifications"][number];
  onRead: (id: string) => void;
}

function NotificationCard({ notification, onRead }: NotificationCardProps) {
  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.deliveryId);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case "homework": return "bg-blue-100 text-blue-700";
      case "grade": return "bg-green-100 text-green-700";
      case "attendance": return "bg-purple-100 text-purple-700";
      case "alert": return "bg-red-100 text-red-700";
      case "reminder": return "bg-orange-100 text-orange-700";
      case "announcement": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityBorder = (priority: NotificationPriority) => {
    switch (priority) {
      case "urgent": return "border-l-4 border-l-red-500";
      case "high": return "border-l-4 border-l-orange-500";
      case "normal": return "border-l-4 border-l-blue-500";
      case "low": return "border-l-4 border-l-gray-300";
      default: return "";
    }
  };

  const timeAgo = (date: Date | null) => {
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
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer transition-all hover:shadow-md",
        getPriorityBorder(notification.priority),
        !notification.isRead && "bg-blue-50/30"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-4">
        {/* Type Badge */}
        <div className="flex-shrink-0">
          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getTypeColor(notification.type))}>
            {notification.type}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className={cn("font-semibold text-gray-900", !notification.isRead && "text-blue-900")}>
                {notification.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            </div>
            {!notification.isRead && (
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span>{timeAgo(notification.deliveredAt)}</span>
            {notification.actionUrl && (
              <span className="text-blue-600 hover:underline">View details</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function NotificationsPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const {
    unreadCount,
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications({
    pollingInterval: 30000,
    enableToasts: false,
    limit: 50,
  });

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread" && n.isRead) return false;
    if (filter === "read" && !n.isRead) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "No new notifications"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={refresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-gray-400" />

            {/* Status filter */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(["all", "unread", "read"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    filter === f
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="announcement">Announcements</option>
              <option value="alert">Alerts</option>
              <option value="reminder">Reminders</option>
              <option value="homework">Homework</option>
              <option value="grade">Grades</option>
              <option value="attendance">Attendance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Bell className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">No notifications</p>
            <p className="text-sm">
              {filter === "unread" || typeFilter !== "all"
                ? "No notifications match your filters."
                : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.deliveryId}
                notification={notification}
                onRead={markAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
