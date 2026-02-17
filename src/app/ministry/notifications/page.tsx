"use client";

/**
 * MINISTRY OF EDUCATION - NOTIFICATIONS CENTER
 *
 * Send platform-wide announcements to all schools across Bhutan.
 * Target specific districts, school types, or user roles.
 */


import { useState } from "react";
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
  Copy,
  FileText,
  Calendar,
  Wrench,
  Sparkles,
  Building2,
  MapPin,
  School,
  UserCheck,
  Home,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "urgent" | "success";
  priority: "normal" | "high" | "critical";
  targetAudience: {
    scope: "all" | "districts" | "schools" | "roles";
    districts?: string[];
    schoolTypes?: string[];
    roles?: string[];
  };
  scheduledFor?: Date;
  sentAt?: Date;
  status: "draft" | "scheduled" | "delivered" | "failed";
  deliveryCount?: number;
  expectedRecipients?: number;
  openRate?: number;
}

interface NotificationTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  title: string;
  message: string;
  type: "info" | "warning" | "urgent" | "success";
  targetAudience: string;
}

const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: "exam",
    name: "Exam Schedule",
    icon: <FileText className="w-4 h-4" />,
    title: "Examination Schedule Announcement",
    message: "The examination schedule for [Term/Year] has been finalized. Exams will begin from [Start Date]. Please ensure all students are prepared and examination halls are set up accordingly.",
    type: "urgent",
    targetAudience: "all",
  },
  {
    id: "holiday",
    name: "Holiday Notice",
    icon: <Calendar className="w-4 h-4" />,
    title: "Public Holiday Declaration",
    message: "This is to inform all schools that [Holiday Name] will be observed on [Date]. All schools and educational institutions will remain closed on this day.",
    type: "info",
    targetAudience: "all",
  },
  {
    id: "policy",
    name: "Policy Update",
    icon: <FileText className="w-4 h-4" />,
    title: "Important Policy Update",
    message: "The Ministry of Education has issued new guidelines regarding [Policy Area]. All schools are requested to review and implement these changes by [Compliance Date].",
    type: "warning",
    targetAudience: "schools",
  },
  {
    id: "maintenance",
    name: "System Maintenance",
    icon: <Wrench className="w-4 h-4" />,
    title: "Platform Maintenance Notice",
    message: "The Career Compass platform will undergo scheduled maintenance on [Date] from [Start Time] to [End Time]. Services may be temporarily unavailable during this period.",
    type: "warning",
    targetAudience: "all",
  },
  {
    id: "feature",
    name: "New Feature",
    icon: <Sparkles className="w-4 h-4" />,
    title: "New Feature Release",
    message: "We are excited to announce the launch of [Feature Name]! This new feature will help schools [Benefit]. Training materials are available in the resource center.",
    type: "success",
    targetAudience: "all",
  },
  {
    id: "conference",
    name: "Conference/Workshop",
    icon: <Users className="w-4 h-4" />,
    title: "Educational Conference Invitation",
    message: "The Ministry of Education is organizing a conference on '[Topic]' from [Date] at [Venue]. School administrators and teachers are encouraged to attend.",
    type: "info",
    targetAudience: "schools",
  },
  {
    id: "deadline",
    name: "Deadline Reminder",
    icon: <Clock className="w-4 h-4" />,
    title: "Submission Deadline Reminder",
    message: "This is a reminder that the deadline for submitting [Document/Report] is [Date]. Please ensure all submissions are completed before the cutoff time.",
    type: "urgent",
    targetAudience: "schools",
  },
  {
    id: "curriculum",
    name: "Curriculum Update",
    icon: <GraduationCap className="w-4 h-4" />,
    title: "Curriculum Changes",
    message: "Updates to the [Subject/Grade] curriculum have been released. Please review the attached materials and prepare for implementation in the upcoming academic term.",
    type: "info",
    targetAudience: "schools",
  },
];

const BHUTAN_DISTRICTS = [
  "Thimphu", "Paro", "Punakha", "Wangdue Phodrang", "Tsirang",
  "Dagana", "Chukha", "Samtse", "Sarpang", "Zhemgang",
  "Trongsa", "Bumthang", "Lhuentse", "Mongar", "Trashigang",
  "Trashiyangtse", "Pema Gatshel", "Gasa", "Samdrup Jongkhar"
];

const SCHOOL_TYPES = [
  "Middle Secondary School",
  "Higher Secondary School",
  "Primary School",
  "Junior High School",
  "Private School",
  "Institute"
];

export default function MinistryNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "BCSE 2025 Examination Schedule Released",
      message: "The BCSE examination schedule for 2025 has been finalized. Exams will commence on March 15th and conclude on April 5th. All schools must ensure students are registered by February 28th.",
      type: "urgent",
      priority: "critical",
      targetAudience: { scope: "all" },
      status: "delivered",
      sentAt: new Date("2025-02-10T09:00:00"),
      deliveryCount: 2456,
      expectedRecipients: 2456,
      openRate: 94.2,
    },
    {
      id: "2",
      title: "Teacher Training Registration Open",
      message: "Registration for the Digital Literacy Training Program is now open. Each school should nominate 2 teachers for this program. Training begins March 1st.",
      type: "info",
      priority: "normal",
      targetAudience: { scope: "roles", roles: ["teachers", "school-admins"] },
      status: "delivered",
      sentAt: new Date("2025-02-12T14:30:00"),
      deliveryCount: 5234,
      expectedRecipients: 5400,
      openRate: 78.5,
    },
    {
      id: "3",
      title: "Platform Maintenance - February 20",
      message: "Career Compass platform will undergo scheduled maintenance on February 20, 2025 from 11:00 PM to 2:00 AM BST. Services will be temporarily unavailable.",
      type: "warning",
      priority: "high",
      targetAudience: { scope: "all" },
      status: "scheduled",
      scheduledFor: new Date("2025-02-20T23:00:00"),
      expectedRecipients: 15000,
    },
    {
      id: "4",
      title: "New Career Guidance Resources Available",
      message: "We have added new career exploration modules covering emerging fields in Bhutan. Students can now access updated information on RUB programs and scholarship opportunities.",
      type: "success",
      priority: "normal",
      targetAudience: { scope: "roles", roles: ["students", "teachers", "parents"] },
      status: "delivered",
      sentAt: new Date("2025-02-14T10:00:00"),
      deliveryCount: 12450,
      expectedRecipients: 13500,
      openRate: 65.3,
    },
    {
      id: "5",
      title: "School Data Submission Deadline",
      message: "Reminder: Annual school data reports must be submitted by February 28, 2025. Late submissions will affect school performance evaluations.",
      type: "urgent",
      priority: "high",
      targetAudience: { scope: "roles", roles: ["school-admins"] },
      status: "delivered",
      sentAt: new Date("2025-02-13T08:00:00"),
      deliveryCount: 89,
      expectedRecipients: 92,
      openRate: 88.5,
    },
    {
      id: "6",
      title: "Thimphu District Schools Meeting",
      message: "A coordination meeting for all Thimphu district school principals will be held on February 25th at the Ministry of Education conference hall.",
      type: "info",
      priority: "normal",
      targetAudience: { scope: "districts", districts: ["Thimphu"] },
      status: "delivered",
      sentAt: new Date("2025-02-11T11:00:00"),
      deliveryCount: 45,
      expectedRecipients: 48,
      openRate: 82.0,
    },
  ]);

  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "urgent" | "success",
    priority: "normal" as "normal" | "high" | "critical",
    scope: "all" as "all" | "districts" | "schools" | "roles",
    districts: [] as string[],
    schoolTypes: [] as string[],
    roles: [] as string[],
    schedule: "now" as "now" | "later",
    scheduledDate: "",
  });

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    const matchesType = filterType === "all" || notification.type === filterType;
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
    failed: notifications.filter((n) => n.status === "failed").length,
    avgOpenRate: notifications
      .filter((n) => n.openRate !== undefined)
      .reduce((sum, n) => sum + (n.openRate || 0), 0) /
      notifications.filter((n) => n.openRate !== undefined).length,
    totalRecipients: notifications.reduce((sum, n) => sum + (n.deliveryCount || n.expectedRecipients || 0), 0),
  };

  const typeBadges = {
    all: { label: "All Types", color: "bg-gray-50 text-gray-700 border-gray-200" },
    info: { label: "Info", color: "bg-blue-50 text-blue-700 border-blue-200" },
    warning: { label: "Warning", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    urgent: { label: "Urgent", color: "bg-red-50 text-red-700 border-red-200" },
    success: { label: "Success", color: "bg-green-50 text-green-700 border-green-200" },
  };

  const priorityBadges = {
    normal: { label: "Normal", color: "bg-gray-50 text-gray-600 border-gray-200" },
    high: { label: "High", color: "bg-orange-50 text-orange-700 border-orange-200" },
    critical: { label: "Critical", color: "bg-red-50 text-red-700 border-red-200" },
  };

  const statusBadges = {
    delivered: { label: "Sent", color: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle className="w-3 h-3" /> },
    scheduled: { label: "Pending", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: <Clock className="w-3 h-3" /> },
    draft: { label: "Draft", color: "bg-gray-50 text-gray-700 border-gray-200", icon: <FileText className="w-3 h-3" /> },
    failed: { label: "Failed", color: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="w-3 h-3" /> },
  };

  const getAudienceLabel = (audience: Notification["targetAudience"]) => {
    if (audience.scope === "all") return "All Users";
    if (audience.scope === "districts") return `${audience.districts?.length || 0} District(s)`;
    if (audience.scope === "schools") return `${audience.schoolTypes?.length || 0} School Type(s)`;
    if (audience.scope === "roles") return audience.roles?.join(", ") || "";
    return "All";
  };

  const handleApplyTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      ...formData,
      title: template.title,
      message: template.message,
      type: template.type,
      scope: template.targetAudience === "all" ? "all" : "roles",
    });
    setShowTemplates(false);
    setShowCreateModal(true);
  };

  const handleDuplicateNotification = (notification: Notification) => {
    setFormData({
      ...formData,
      title: `Copy of ${notification.title}`,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      scope: notification.targetAudience.scope,
      districts: notification.targetAudience.districts || [],
      schoolTypes: notification.targetAudience.schoolTypes || [],
      roles: notification.targetAudience.roles || [],
    });
    setShowCreateModal(true);
  };

  const toggleDistrict = (district: string) => {
    setFormData(prev => ({
      ...prev,
      districts: prev.districts.includes(district)
        ? prev.districts.filter(d => d !== district)
        : [...prev.districts, district]
    }));
  };

  const toggleSchoolType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      schoolTypes: prev.schoolTypes.includes(type)
        ? prev.schoolTypes.filter(t => t !== type)
        : [...prev.schoolTypes, type]
    }));
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
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
            Send platform-wide announcements to all schools across Bhutan
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowTemplates(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Use Template
          </Button>
          <Button
            style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
            className="text-white"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Notification
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Recipients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats.totalRecipients >= 1000
                ? `${(stats.totalRecipients / 1000).toFixed(1)}K`
                : stats.totalRecipients}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total reached</p>
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
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none bg-white"
              >
                <option value="all">All Types</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="urgent">Urgent</option>
                <option value="success">Success</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="delivered">Delivered</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Drafts</option>
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
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Priority</th>
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
                    <td colSpan={8} className="text-center py-12">
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
                    const priorityBadge = priorityBadges[notification.priority];
                    const statusBadge = statusBadges[notification.status];

                    const typeIcon = {
                      info: <Info className="w-4 h-4 text-blue-600" />,
                      warning: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
                      urgent: <AlertTriangle className="w-4 h-4 text-red-600" />,
                      success: <CheckCircle className="w-4 h-4 text-green-600" />,
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
                          <Badge
                            variant="outline"
                            className={priorityBadge.color}
                          >
                            {priorityBadge.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Users className="w-4 h-4 text-gray-400" />
                            {getAudienceLabel(notification.targetAudience)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant="outline"
                            className={statusBadge.color}
                          >
                            <span className="flex items-center gap-1">
                              {statusBadge.icon}
                              {statusBadge.label}
                            </span>
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
                          <div className="text-sm">
                            {notification.deliveryCount !== undefined ? (
                              <div className="flex items-center gap-2">
                                <span className="text-green-600 font-medium">{notification.deliveryCount}</span>
                                <span className="text-gray-500">delivered</span>
                              </div>
                            ) : notification.expectedRecipients ? (
                              <span className="text-gray-500">{notification.expectedRecipients} expected</span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                            {notification.openRate !== undefined && (
                              <div className="text-xs text-gray-500 mt-1">
                                {notification.openRate.toFixed(1)}% opened
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                              title="Duplicate"
                              onClick={() => handleDuplicateNotification(notification)}
                            >
                              <Copy className="w-4 h-4" />
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

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Notification Templates</h2>
                <p className="text-sm text-gray-500 mt-1">Quick-start with pre-built announcement templates</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTemplates(false)}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {NOTIFICATION_TEMPLATES.map((template) => {
                  const typeBadge = typeBadges[template.type];
                  return (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:shadow-md hover:border-purple-300 transition-all"
                      onClick={() => handleApplyTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                              {template.icon}
                            </div>
                            <div>
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              <Badge variant="outline" className={typeBadge.color + " mt-1"}>
                                {typeBadge.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-900">{template.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-2">{template.message}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Users className="w-3 h-3" />
                            {template.targetAudience === "all" ? "All Users" : template.targetAudience}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Notification</h2>
                <p className="text-sm text-gray-500 mt-1">Send announcements to schools across Bhutan</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedTemplate(null);
                  setFormData({
                    title: "",
                    message: "",
                    type: "info",
                    priority: "normal",
                    scope: "all",
                    districts: [],
                    schoolTypes: [],
                    roles: [],
                    schedule: "now",
                    scheduledDate: "",
                  });
                }}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form className="space-y-6">
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
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Enter notification message..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">Use [Date], [Time], [Venue] as placeholders for dynamic content</p>
                </div>

                {/* Type & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none bg-white"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="urgent">Urgent</option>
                      <option value="success">Success</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none bg-white"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { value: "all", label: "All Users", icon: <Users className="w-4 h-4" /> },
                      { value: "districts", label: "Specific Districts", icon: <MapPin className="w-4 h-4" /> },
                      { value: "schools", label: "School Types", icon: <Building2 className="w-4 h-4" /> },
                      { value: "roles", label: "By Role", icon: <UserCheck className="w-4 h-4" /> },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, scope: option.value as any })}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-left transition-all ${
                          formData.scope === option.value
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        {option.icon}
                        <span className="font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Districts Selection */}
                  {formData.scope === "districts" && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-3">Select Districts</p>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        {BHUTAN_DISTRICTS.map((district) => (
                          <button
                            key={district}
                            type="button"
                            onClick={() => toggleDistrict(district)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                              formData.districts.includes(district)
                                ? "bg-purple-600 text-white"
                                : "bg-white border border-gray-300 hover:border-purple-400"
                            }`}
                          >
                            {district}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formData.districts.length} district(s) selected
                      </p>
                    </div>
                  )}

                  {/* School Types Selection */}
                  {formData.scope === "schools" && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-3">Select School Types</p>
                      <div className="flex flex-wrap gap-2">
                        {SCHOOL_TYPES.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => toggleSchoolType(type)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                              formData.schoolTypes.includes(type)
                                ? "bg-purple-600 text-white"
                                : "bg-white border border-gray-300 hover:border-purple-400"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formData.schoolTypes.length} type(s) selected
                      </p>
                    </div>
                  )}

                  {/* Roles Selection */}
                  {formData.scope === "roles" && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-3">Select Roles</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "students", label: "Students", icon: <GraduationCap className="w-4 h-4" /> },
                          { value: "teachers", label: "Teachers", icon: <Users className="w-4 h-4" /> },
                          { value: "school-admins", label: "School Admins", icon: <Building2 className="w-4 h-4" /> },
                          { value: "parents", label: "Parents", icon: <Home className="w-4 h-4" /> },
                        ].map((role) => (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => toggleRole(role.value)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                              formData.roles.includes(role.value)
                                ? "bg-purple-600 text-white"
                                : "bg-white border border-gray-300 hover:border-purple-400"
                            }`}
                          >
                            {role.icon}
                            {role.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formData.roles.length} role(s) selected
                      </p>
                    </div>
                  )}
                </div>

                {/* Schedule */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule
                  </label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="schedule"
                        checked={formData.schedule === "now"}
                        onChange={() => setFormData({ ...formData, schedule: "now" })}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Send Now</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="schedule"
                        checked={formData.schedule === "later"}
                        onChange={() => setFormData({ ...formData, schedule: "later" })}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Schedule for Later</span>
                    </label>
                  </div>
                  {formData.schedule === "later" && (
                    <input
                      type="datetime-local"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    />
                  )}
                </div>
              </form>
            </div>

            <div className="flex justify-between items-center p-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {selectedTemplate && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Using template: {selectedTemplate.name}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedTemplate(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
                  className="text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {formData.schedule === "now" ? "Send Now" : "Schedule"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
