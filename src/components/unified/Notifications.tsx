/**
 * UNIVERSAL NOTIFICATION SYSTEM
 *
 * Provides toast notifications and in-app notifications
 * for all features in the unified system.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ToastProvider, useToast } from "@/components/ui/toast";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Bell,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Utility function to format relative time (replaces date-fns)
function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

// Types
export type NotificationType = "success" | "error" | "warning" | "info";
export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface AppNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  read?: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Toast Notification Helpers
 * These functions use a singleton toast manager for non-component usage
 */
let toastManager: ReturnType<typeof useToast> | null = null;

export function setToastManager(manager: ReturnType<typeof useToast>) {
  toastManager = manager;
}

export const notify = {
  success: (message: string, title?: string) => {
    if (!toastManager) {
      console.warn("Toast manager not initialized. Use NotifyProvider component.");
      return;
    }
    toastManager.success({ title: title || "Success", description: message });
  },

  error: (message: string, title?: string) => {
    if (!toastManager) {
      console.warn("Toast manager not initialized. Use NotifyProvider component.");
      return;
    }
    toastManager.error({ title: title || "Error", description: message });
  },

  warning: (message: string, title?: string) => {
    if (!toastManager) {
      console.warn("Toast manager not initialized. Use NotifyProvider component.");
      return;
    }
    toastManager.warning({ title: title || "Warning", description: message });
  },

  info: (message: string, title?: string) => {
    if (!toastManager) {
      console.warn("Toast manager not initialized. Use NotifyProvider component.");
      return;
    }
    toastManager.info({ title: title || "Info", description: message });
  },

  // Operation-specific notifications
  created: (resource: string, name: string) => {
    if (!toastManager) return;
    toastManager.success({
      title: `${resource} Created`,
      description: `${name} has been created successfully.`,
    });
  },

  updated: (resource: string, name: string) => {
    if (!toastManager) return;
    toastManager.success({
      title: `${resource} Updated`,
      description: `${name} has been updated successfully.`,
    });
  },

  deleted: (resource: string, name: string) => {
    if (!toastManager) return;
    toastManager.success({
      title: `${resource} Deleted`,
      description: `${name} has been deleted.`,
    });
  },
};

/**
 * Notification Bell with Dropdown
 */
export function NotificationBell({
  notifications = [],
  onMarkRead,
  onClear,
  className,
}: {
  notifications?: AppNotification[];
  onMarkRead?: (id: string) => void;
  onClear?: () => void;
  className?: string;
}) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("relative", className)}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="font-medium">Notifications</span>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={onClear}
            >
              Clear all
            </Button>
          )}
        </div>

        <Separator />

        {notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <ScrollArea className="h-80">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={onMarkRead}
              />
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Single Notification Item
 */
function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead?: (id: string) => void;
}) {
  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityBorder = () => {
    switch (notification.priority) {
      case "urgent":
        return "border-l-4 border-l-destructive";
      case "high":
        return "border-l-4 border-l-orange-500";
      case "medium":
        return "border-l-4 border-l-yellow-500";
      default:
        return "border-l-4 border-l-muted";
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 p-4 hover:bg-muted/50 cursor-pointer",
        getPriorityBorder(),
        !notification.read && "bg-muted/20"
      )}
      onClick={() => !notification.read && onRead?.(notification.id)}
    >
      <div className="mt-1">{getIcon()}</div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{notification.title}</p>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(notification.createdAt)}
          </p>
          {notification.action && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={(e) => {
                e.stopPropagation();
                notification.action?.onClick();
              }}
            >
              {notification.action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Auto-dismissing toast wrapper
 * Note: This requires the toast manager to be initialized via NotifyProvider
 */
export function autoToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: (data: T) => string;
    error: (error: Error) => string;
  }
): Promise<T> {
  if (!toastManager) {
    console.warn("Toast manager not initialized. Use NotifyProvider component.");
    return promise;
  }

  const id = toastManager.loading({ title: messages.loading });

  return promise
    .then((data) => {
      toastManager.dismiss(id);
      toastManager.success({ title: messages.success(data) });
      return data;
    })
    .catch((error) => {
      toastManager.dismiss(id);
      toastManager.error({ title: messages.error(error) });
      throw error;
    });
}

/**
 * Notification Hook
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((notification: Omit<AppNotification, "id" | "createdAt">) => {
    const newNotification: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50));

    // Auto-dismiss info notifications after 5 seconds
    if (notification.type === "info" && notification.priority === "low") {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
      }, 5000);
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clear,
    remove,
    unreadCount: notifications.filter((n) => !n.read).length,
  };
}

/**
 * Real-time Notification Provider
 * Initializes the toast manager for use with notify helpers
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();

  // Initialize toast manager singleton
  useEffect(() => {
    setToastManager(toast);
  }, [toast]);

  return <ToastProvider>{children}</ToastProvider>;
}

/**
 * Dashboard Stats Component
 */
export function DashboardStats({
  stats,
  loading,
}: {
  stats: Array<{
    label: string;
    value: string | number;
    change?: number;
    changeType?: "increase" | "decrease";
    icon?: React.ReactNode;
  }>;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-lg border bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div key={index} className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
              {stat.change !== undefined && (
                <p
                  className={cn(
                    "text-xs mt-1",
                    stat.changeType === "increase" && "text-green-600",
                    stat.changeType === "decrease" && "text-red-600"
                  )}
                >
                  {stat.changeType === "increase" ? "+" : ""}
                  {stat.change}% from last month
                </p>
              )}
            </div>
            {stat.icon && (
              <div className="text-muted-foreground">{stat.icon}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Quick Actions Dashboard Component
 */
export function QuickActions({
  actions,
}: {
  actions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "ghost" | "outline";
  }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || "outline"}
          className="h-auto flex-col gap-2 py-6"
          onClick={action.onClick}
        >
          {action.icon}
          <span className="text-sm">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}

/**
 * Activity Feed Component
 */
export function ActivityFeed({
  activities,
  loading,
}: {
  activities: Array<{
    id: string;
    user: string;
    action: string;
    target: string;
    timestamp: Date;
    icon?: React.ReactNode;
  }>;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-48" />
              <div className="h-3 bg-muted rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3">
          <div className="flex-shrink-0">
            {activity.icon || (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {activity.user.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{activity.user}</span>{" "}
              {activity.action}{" "}
              <span className="font-medium">{activity.target}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDistanceToNow(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Export all notification utilities
// Re-export toast types and components from ui/toast
export type { Toast, ToastAction, ToastVariant, ToastProviderProps } from "@/components/ui/toast";
