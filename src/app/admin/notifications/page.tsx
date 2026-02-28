"use client";

import { logger } from "@/lib/logger";
/**
 * PLATFORM ADMIN - NOTIFICATIONS CENTER
 *
 * Create and send platform-wide alerts and announcements to schools.
 * Target specific schools or user types.
 */


import { useState, useEffect, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Plus,
  Search,
  Filter,
  Send,
  Trash2,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  Info,
  Mail,
  Users,
  GraduationCap,
  XCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

// Notification types matching the API
type NotificationType = "announcement" | "alert" | "reminder" | "system" | "welcome";
type NotificationStatus = "draft" | "scheduled" | "sending" | "sent" | "failed" | "cancelled";
type TargetAudience = "all" | "students" | "teachers" | "parents" | "counselors" | "school_admins" | "admins" | "specific";
type Priority = "low" | "normal" | "high" | "urgent";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: string | null;
  targetAudience: TargetAudience;
  priority: Priority;
  status: NotificationStatus;
  scheduledFor: string | null;
  sentAt: string | null;
  senderId: string;
  senderName: string;
  senderRole: string;
  actionUrl: string | null;
  actionLabel: string | null;
  expiresAt: string | null;
  totalRecipients: number;
  deliveredCount: number | null;
  readCount: number | null;
  failedCount: number | null;
  pendingCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface CreateNotificationForm {
  title: string;
  message: string;
  type: NotificationType;
  targetAudience: TargetAudience;
  priority: Priority;
  scheduledFor: string;
  actionUrl: string;
  actionLabel: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateNotificationForm>({
    title: "",
    message: "",
    type: "announcement",
    targetAudience: "all",
    priority: "normal",
    scheduledFor: "",
    actionUrl: "",
    actionLabel: "",
  });

  // Success/error message
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [filterType, filterStatus, searchQuery]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/admin/notifications?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const result: NotificationsResponse = await response.json();
      setNotifications(result.data.notifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      logger.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Create notification
      const createResponse = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          message: formData.message.trim(),
          type: formData.type,
          targetAudience: formData.targetAudience,
          priority: formData.priority,
          ...(formData.scheduledFor && { scheduledFor: new Date(formData.scheduledFor).toISOString() }),
          ...(formData.actionUrl && { actionUrl: formData.actionUrl }),
          ...(formData.actionLabel && { actionLabel: formData.actionLabel }),
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Failed to create notification");
      }

      const createResult = await createResponse.json();

      // If no schedule, send immediately
      if (!formData.scheduledFor) {
        const sendResponse = await fetch("/api/admin/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notificationId: createResult.data.id,
          }),
        });

        if (!sendResponse.ok) {
          const errorData = await sendResponse.json();
          throw new Error(errorData.error || "Failed to send notification");
        }
      }

      // Show success message
      setToastMessage({
        type: "success",
        message: formData.scheduledFor
          ? "Notification scheduled successfully"
          : "Notification sent successfully",
      });

      // Reset form and close modal
      setFormData({
        title: "",
        message: "",
        type: "announcement",
        targetAudience: "all",
        priority: "normal",
        scheduledFor: "",
        actionUrl: "",
        actionLabel: "",
      });
      setShowCreateModal(false);

      // Refresh notifications
      await fetchNotifications();

      // Hide toast after 3 seconds
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setToastMessage({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create notification",
      });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete notification");
        }
        throw new Error(`Failed to delete notification (${response.status})`);
      }

      // Refresh notifications
      await fetchNotifications();

      setToastMessage({
        type: "success",
        message: "Notification deleted successfully",
      });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      setToastMessage({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete notification",
      });
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleSendNotification = async (notificationId: string) => {
    try {
      setSubmitting(true);

      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send notification");
        }
        throw new Error(`Failed to send notification (${response.status})`);
      }

      // Refresh notifications
      await fetchNotifications();

      setToastMessage({
        type: "success",
        message: "Notification sent successfully",
      });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      setToastMessage({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to send notification",
      });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    const matchesType = filterType === "all" || notification.targetAudience === filterType;
    const matchesStatus = filterStatus === "all" || notification.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  // Stats
  const stats = {
    total: notifications.length,
    sent: notifications.filter((n) => n.status === "sent").length,
    scheduled: notifications.filter((n) => n.status === "scheduled").length,
    drafts: notifications.filter((n) => n.status === "draft").length,
    avgOpenRate:
      notifications
        .filter((n) => n.deliveredCount && n.readCount)
        .reduce((sum, n) => sum + ((n.readCount || 0) / (n.deliveredCount || 1)) * 100, 0) /
      notifications.filter((n) => n.deliveredCount && n.readCount).length || 0,
  };

  const typeIcons = {
    all: "All Audiences",
    schools: "Schools",
    students: "Students",
    teachers: "Teachers",
    admins: "Admins",
    parents: "Parents",
    counselors: "Counselors",
    school_admins: "School Admins",
  };

  const typeBadges = {
    all: { label: "All Types", color: "bg-gray-50 text-gray-700 border-gray-200" },
    announcement: { label: "Announcement", color: "bg-blue-50 text-blue-700 border-blue-200" },
    alert: { label: "Alert", color: "bg-red-50 text-red-700 border-red-200" },
    reminder: { label: "Reminder", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    system: { label: "System", color: "bg-purple-50 text-purple-700 border-purple-200" },
    welcome: { label: "Welcome", color: "bg-green-50 text-green-700 border-green-200" },
    info: { label: "Info", color: "bg-blue-50 text-blue-700 border-blue-200" },
    warning: { label: "Warning", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    urgent: { label: "Urgent", color: "bg-red-50 text-red-700 border-red-200" },
    success: { label: "Success", color: "bg-green-50 text-green-700 border-green-200" },
  };

  const priorityIcons = {
    low: <Clock className="w-4 h-4 text-gray-400" />,
    normal: <Mail className="w-4 h-4 text-blue-400" />,
    high: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    urgent: <AlertTriangle className="w-4 h-4 text-red-600" />,
  };

  // Map API types to UI display
  const getDisplayType = (type: NotificationType) => {
    const typeMap: Record<NotificationType, keyof typeof typeBadges> = {
      announcement: "announcement",
      alert: "alert",
      reminder: "reminder",
      system: "system",
      welcome: "welcome",
    };
    return typeMap[type] || "announcement";
  };

  // Map API audiences to UI display
  const getAudienceLabel = (audience: TargetAudience) => {
    const labelMap: Record<TargetAudience, string> = {
      all: "All Users",
      students: "Students",
      teachers: "Teachers",
      parents: "Parents",
      counselors: "Counselors",
      school_admins: "School Admins",
      admins: "Admins",
      specific: "Specific Users",
    };
    return labelMap[audience] || audience;
  };

  return (
    <div className="space-y-8">
      {/* Toast Message */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            toastMessage.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Notifications Center
          </h1>
          <p className="text-gray-600">
            Send alerts and announcements to schools and users
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Notification
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Total Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                <p className="text-xs text-gray-500 mt-1">All notifications</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Send className="w-4 h-4" />
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            ) : (
              <>
                <div className="text-3xl font-bold text-green-600">{stats.sent}</div>
                <p className="text-xs text-gray-500 mt-1">Successfully sent</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            ) : (
              <>
                <div className="text-3xl font-bold text-yellow-600">{stats.scheduled}</div>
                <p className="text-xs text-gray-500 mt-1">Pending delivery</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Avg Open Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            ) : (
              <>
                <div className="text-3xl font-bold text-blue-600">{stats.avgOpenRate.toFixed(1)}%</div>
                <p className="text-xs text-gray-500 mt-1">Engagement rate</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications by title or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
              >
                <option value="all">All Audiences</option>
                <option value="all">All Users</option>
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
                <option value="school_admins">School Admins</option>
                <option value="parents">Parents</option>
                <option value="counselors">Counselors</option>
                <option value="admins">Admins</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Drafts</option>
                <option value="sending">Sending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                Showing {filteredNotifications.length} of {notifications.length} notifications
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchNotifications()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4 mr-2" />}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {loading && notifications.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Notification</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Audience</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Scheduled/Sent</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Delivery</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotifications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <Bell className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">No notifications found</p>
                            <p className="text-gray-500 text-sm">Try adjusting your filters or create a new notification</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredNotifications.map((notification) => {
                      const displayType = getDisplayType(notification.type);
                      const typeBadge = typeBadges[displayType] || typeBadges.announcement;
                      const typeIcon = priorityIcons[notification.priority] || priorityIcons.normal;

                      // Calculate open rate
                      const openRate =
                        notification.deliveredCount && notification.deliveredCount > 0
                          ? ((notification.readCount || 0) / notification.deliveredCount) * 100
                          : null;

                      return (
                        <tr key={notification.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-start gap-3">
                              {typeIcon}
                              <div>
                                <p className="font-medium text-gray-900">{notification.title}</p>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="outline" className={typeBadge.color}>
                              {typeBadge.label}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-gray-400" />
                              {getAudienceLabel(notification.targetAudience)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              variant="outline"
                              className={
                                notification.status === "sent"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : notification.status === "scheduled"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : notification.status === "draft"
                                  ? "bg-gray-50 text-gray-700 border-gray-200"
                                  : notification.status === "sending"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }
                            >
                              {notification.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-gray-900">
                              {notification.sentAt
                                ? new Date(notification.sentAt).toLocaleDateString()
                                : notification.scheduledFor
                                ? new Date(notification.scheduledFor).toLocaleDateString()
                                : "N/A"}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col items-start gap-1">
                              {notification.deliveredCount !== null && notification.deliveredCount !== undefined && (
                                <span className="text-sm text-gray-600">
                                  {notification.deliveredCount} / {notification.totalRecipients} delivered
                                </span>
                              )}
                              {openRate !== null && (
                                <span className="text-sm text-gray-500">
                                  ({openRate.toFixed(1)}% opened)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                                title="View details"
                                onClick={() => window.location.href = `/admin/notifications/${notification.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {(notification.status === "draft" || notification.status === "scheduled") && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                                    title="Send now"
                                    onClick={() => handleSendNotification(notification.id)}
                                    disabled={submitting}
                                  >
                                    {submitting ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Send className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                    title="Delete notification"
                                    onClick={() => handleDeleteNotification(notification.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Create New Notification</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreateModal(false)}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleCreateNotification} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter notification title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter notification message..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as NotificationType })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="alert">Alert</option>
                    <option value="reminder">Reminder</option>
                    <option value="system">System</option>
                    <option value="welcome">Welcome</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as TargetAudience })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
                >
                  <option value="all">All Users</option>
                  <option value="students">Students Only</option>
                  <option value="teachers">Teachers Only</option>
                  <option value="school_admins">School Admins Only</option>
                  <option value="parents">Parents Only</option>
                  <option value="counselors">Counselors Only</option>
                  <option value="admins">Platform Admins Only</option>
                </select>
              </div>

              {/* Schedule For */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule For (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to send immediately
                </p>
              </div>

              {/* Action URL (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={formData.actionUrl}
                  onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              {/* Action Label (Optional) */}
              {formData.actionUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Button Label
                  </label>
                  <input
                    type="text"
                    placeholder="Learn More"
                    value={formData.actionLabel}
                    onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                  className="text-white"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {formData.scheduledFor ? "Scheduling..." : "Sending..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {formData.scheduledFor ? "Schedule Notification" : "Send Notification"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
