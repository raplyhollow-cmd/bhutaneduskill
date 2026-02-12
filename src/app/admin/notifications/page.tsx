/**
 * PLATFORM ADMIN - NOTIFICATIONS CENTER
 *
 * Create and send platform-wide alerts and announcements to schools.
 * Target specific schools or user types.
 */

"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "urgent" | "success";
  targetAudience: "all" | "schools" | "students" | "teachers" | "admins" | "parents";
  scheduledFor?: Date;
  sentAt?: Date;
  status: "draft" | "scheduled" | "delivered";
  deliveryCount?: number;
  openRate?: number;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "BCSE Results Announced",
      message: "BCSE examination results have been released. Students can now access their results through the portal.",
      type: "success",
      targetAudience: "all",
      status: "delivered",
      sentAt: new Date("2025-03-15T10:00:00"),
      deliveryCount: 2456,
      openRate: 78.5,
    },
    {
      id: "2",
      title: "New Career Assessment Modules",
      message: "New RIASEC and MBTI assessment modules are now available. Please encourage students to complete their career assessments.",
      type: "info",
      targetAudience: "schools",
      status: "delivered",
      sentAt: new Date("2025-03-14T09:30:00"),
      deliveryCount: 12,
      openRate: 85.2,
    },
    {
      id: "3",
      title: "System Maintenance Scheduled",
      message: "Platform will undergo scheduled maintenance on March 20, 2025 from 11:00 PM to 2:00 AM BST. Please inform all users in advance.",
      type: "warning",
      targetAudience: "all",
      status: "scheduled",
      scheduledFor: new Date("2025-03-20T23:00:00"),
    },
    {
      id: "4",
      title: "Teacher Training Workshop",
      message: "Free AI-powered teaching tools workshop available for all teachers. Register by March 25, 2025.",
      type: "info",
      targetAudience: "teachers",
      status: "delivered",
      sentAt: new Date("2025-03-13T14:00:00"),
      deliveryCount: 89,
      openRate: 67.4,
    },
    {
      id: "5",
      title: "School Fee Payment Reminder",
      message: "Reminder to parents about upcoming school fee payment deadline. Please ensure fee collection is completed on time.",
      type: "urgent",
      targetAudience: "schools",
      status: "delivered",
      sentAt: new Date("2025-03-12T11:00:00"),
      deliveryCount: 12,
      openRate: 92.1,
    },
  ]);

  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    const matchesType = filterType === "all" || notification.targetAudience === filterType;
    const matchesStatus = filterStatus === "all" || notification.status === filterStatus;
    const matchesSearch = !searchQuery ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  // Stats
  const stats = {
    total: notifications.length,
    sent: notifications.filter((n) => n.status === "delivered").length,
    scheduled: notifications.filter((n) => n.status === "scheduled").length,
    drafts: notifications.filter((n) => n.status === "draft").length,
    avgOpenRate: notifications.reduce((sum, n) => sum + (n.openRate || 0), 0) / notifications.filter((n) => n.openRate !== undefined).length,
  };

  const typeIcons = {
    all: "All Audiences",
    schools: "Schools",
    students: "Students",
    teachers: "Teachers",
    admins: "Admins",
    parents: "Parents",
  };

  const typeBadges = {
    all: { label: "All Types", color: "bg-gray-50 text-gray-700 border-gray-200" },
    info: { label: "Info", color: "bg-blue-50 text-blue-700 border-blue-200" },
    warning: { label: "Warning", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    urgent: { label: "Urgent", color: "bg-red-50 text-red-700 border-red-200" },
    success: { label: "Success", color: "bg-green-50 text-green-700 border-green-200" },
  };

  return (
    <div className="space-y-8">
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
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">All notifications</p>
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
            <div className="text-3xl font-bold text-green-600">{stats.sent}</div>
            <p className="text-xs text-gray-500 mt-1">Successfully sent</p>
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
            <div className="text-3xl font-bold text-yellow-600">{stats.scheduled}</div>
            <p className="text-xs text-gray-500 mt-1">Pending delivery</p>
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
            <div className="text-3xl font-bold text-blue-600">{stats.avgOpenRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">Engagement rate</p>
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
                <option value="schools">Schools</option>
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
                <option value="admins">Admins</option>
                <option value="parents">Parents</option>
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
                <option value="delivered">Delivered</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Drafts</option>
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
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Sort
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                          <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((notification) => {
                    const typeBadge = typeBadges[notification.type as keyof typeof typeBadges] || typeBadges.info;
                    const typeIcon = {
                      info: <Info className="w-4 h-4" />,
                      warning: <AlertTriangle className="w-4 h-4" />,
                      urgent: <AlertTriangle className="w-4 h-4 text-red-600" />,
                      success: <CheckCircle className="w-4 h-4" />,
                    }[notification.type];

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
                          <Badge
                            variant="outline"
                            className={typeBadge.color}
                          >
                            {typeBadge.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            {typeIcons[notification.targetAudience]}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant="outline"
                            className={
                              notification.status === "delivered"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : notification.status === "scheduled"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
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
                          <div className="flex items-center gap-2">
                            {notification.deliveryCount !== undefined && (
                              <span className="text-sm text-gray-600">
                                {notification.deliveryCount} delivered
                              </span>
                            )}
                            {notification.openRate !== undefined && (
                              <span className="text-sm text-gray-500">
                                ({notification.openRate.toFixed(1)}% open)
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
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                              title="Edit notification"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {notification.status !== "delivered" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                title="Delete notification"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
        </CardContent>
      </Card>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New Notification</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreateModal(false)}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Enter notification title"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter notification message..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white">
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="urgent">Urgent</option>
                    <option value="success">Success</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <select className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white">
                    <option value="all">All Users</option>
                    <option value="schools">Schools Only</option>
                    <option value="students">Students Only</option>
                    <option value="teachers">Teachers Only</option>
                    <option value="admins">Admins Only</option>
                    <option value="parents">Parents Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule For (Optional)
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                  className="text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
