/**
 * PLATFORM ADMIN - SUPPORT TICKETS
 *
 * Manage and track all support tickets from schools and users.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Send,
  Search,
  Filter,
  Plus,
  User,
  Building2,
  Calendar,
  Paperclip,
  Reply,
  Forward,
  Archive,
  Trash2,
  MoreVertical,
  Eye,
  Star,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

// Mock support tickets data
const tickets = [
  {
    id: "TKT-2024-001",
    subject: "Unable to access student attendance records",
    description:
      "When I try to view attendance for Class 10A, I get an error message. This has been happening since yesterday.",
    school: "Pelkhil School",
    schoolId: 1,
    createdBy: "Dorji Wangmo",
    creatorRole: "teacher",
    priority: "high",
    status: "open",
    category: "bug",
    assignedTo: null,
    createdAt: "2024-02-08T09:30:00",
    updatedAt: "2024-02-08T14:20:00",
    responses: 2,
    attachments: 1,
  },
  {
    id: "TKT-2024-002",
    subject: "Feature request: Bulk homework upload",
    description:
      "It would be very helpful if we could upload homework assignments in bulk using CSV or Excel files instead of creating them one by one.",
    school: "Druk School",
    schoolId: 2,
    createdBy: "Tashi Penjor",
    creatorRole: "school-admin",
    priority: "medium",
    status: "in_progress",
    category: "feature_request",
    assignedTo: "Support Team",
    createdAt: "2024-02-07T11:15:00",
    updatedAt: "2024-02-08T10:00:00",
    responses: 4,
    attachments: 0,
  },
  {
    id: "TKT-2024-003",
    subject: "Parent portal login issue",
    description:
      "Several parents are reporting that they cannot log in to the parent portal. They get an 'Invalid credentials' error even with correct passwords.",
    school: "Yangchenphug HSS",
    schoolId: 3,
    createdBy: "Karma Choden",
    creatorRole: "school-admin",
    priority: "critical",
    status: "open",
    category: "bug",
    assignedTo: "Tech Team",
    createdAt: "2024-02-08T08:00:00",
    updatedAt: "2024-02-08T08:00:00",
    responses: 1,
    attachments: 2,
  },
  {
    id: "TKT-2024-004",
    subject: "How to create custom assessments?",
    description:
      "I want to create a custom career assessment for our students based on local job market. Is this possible?",
    school: "Motithang HSS",
    schoolId: 4,
    createdBy: "Sonam Deki",
    creatorRole: "counselor",
    priority: "low",
    status: "waiting",
    category: "question",
    assignedTo: null,
    createdAt: "2024-02-06T15:45:00",
    updatedAt: "2024-02-07T09:30:00",
    responses: 2,
    attachments: 0,
  },
  {
    id: "TKT-2024-005",
    subject: "Payment invoice discrepancy",
    description:
      "The invoice we received shows Nu. 59,900 but our plan was supposed to be Nu. 49,900. Please clarify.",
    school: "Rinchen HSS",
    schoolId: 5,
    createdBy: "Pema Lhamo",
    creatorRole: "school-admin",
    priority: "high",
    status: "resolved",
    category: "billing",
    assignedTo: "Finance Team",
    createdAt: "2024-02-05T10:20:00",
    updatedAt: "2024-02-07T16:45:00",
    responses: 6,
    attachments: 1,
  },
  {
    id: "TKT-2024-006",
    subject: "Mobile app performance issues",
    description:
      "The mobile app is very slow when loading student profiles. Takes about 30 seconds to load a single profile.",
    school: "Pelkhil School",
    schoolId: 1,
    createdBy: "Jigme Tshering",
    creatorRole: "student",
    priority: "medium",
    status: "closed",
    category: "bug",
    assignedTo: "Dev Team",
    createdAt: "2024-02-03T14:00:00",
    updatedAt: "2024-02-06T11:30:00",
    responses: 5,
    attachments: 0,
  },
];

// Ticket stats
const ticketStats = {
  total: tickets.length,
  open: tickets.filter((t) => t.status === "open").length,
  inProgress: tickets.filter((t) => t.status === "in_progress").length,
  waiting: tickets.filter((t) => t.status === "waiting").length,
  resolved: tickets.filter((t) => t.status === "resolved").length,
  closed: tickets.filter((t) => t.status === "closed").length,
  critical: tickets.filter((t) => t.priority === "critical").length,
  high: tickets.filter((t) => t.priority === "high").length,
};

// Categories
const categories = [
  { id: "all", name: "All", count: tickets.length },
  { id: "bug", name: "Bug Report", count: tickets.filter((t) => t.category === "bug").length },
  { id: "feature_request", name: "Feature Request", count: tickets.filter((t) => t.category === "feature_request").length },
  { id: "question", name: "Question", count: tickets.filter((t) => t.category === "question").length },
  { id: "billing", name: "Billing", count: tickets.filter((t) => t.category === "billing").length },
];

// Support team members
const supportTeam = [
  { id: 1, name: "Support Team", role: "Team", avatar: null, activeTickets: 5 },
  { id: 2, name: "Tech Team", role: "Team", avatar: null, activeTickets: 3 },
  { id: 3, name: "Finance Team", role: "Team", avatar: null, activeTickets: 1 },
  { id: 4, name: "Dev Team", role: "Team", avatar: null, activeTickets: 2 },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "open":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <MessageSquare className="w-3 h-3 mr-1" />
          Open
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          In Progress
        </Badge>
      );
    case "waiting":
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Clock className="w-3 h-3 mr-1" />
          Waiting
        </Badge>
      );
    case "resolved":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Resolved
        </Badge>
      );
    case "closed":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
          <X className="w-3 h-3 mr-1" />
          Closed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "critical":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Critical
        </Badge>
      );
    case "high":
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          High
        </Badge>
      );
    case "medium":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Medium
        </Badge>
      );
    case "low":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
          <AlertCircle className="w-3 h-3 mr-1" />
          Low
        </Badge>
      );
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
}

function getCategoryBadge(category: string) {
  const categoryMap = {
    bug: { label: "Bug", color: "bg-red-100 text-red-700 border-red-200" },
    feature_request: { label: "Feature", color: "bg-blue-100 text-blue-700 border-blue-200" },
    question: { label: "Question", color: "bg-purple-100 text-purple-700 border-purple-200" },
    billing: { label: "Billing", color: "bg-green-100 text-green-700 border-green-200" },
  };

  const cat = categoryMap[category as keyof typeof categoryMap];
  return cat ? (
    <Badge variant="outline" className={cat.color}>
      {cat.label}
    </Badge>
  ) : (
    <Badge variant="outline">{category}</Badge>
  );
}

export default async function AdminSupportPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Support Tickets
          </h1>
          <p className="text-gray-600">
            Manage and respond to support requests from all schools
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
          <Button
            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            className="text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Ticket Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Total Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{ticketStats.total}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Open Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{ticketStats.open}</div>
            <p className="text-xs text-gray-500 mt-1">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{ticketStats.inProgress}</div>
            <p className="text-xs text-gray-500 mt-1">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{ticketStats.critical}</div>
            <p className="text-xs text-gray-500 mt-1">Urgent attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  category.id === "all"
                    ? "border-pink-500 bg-pink-50 text-pink-700"
                    : "border-gray-200 hover:border-pink-300"
                }`}
              >
                <span className="font-medium">{category.name}</span>
                <Badge
                  variant="outline"
                  className={`ml-2 ${
                    category.id === "all"
                      ? "bg-pink-100 text-pink-700 border-pink-300"
                      : "bg-gray-100 text-gray-600 border-gray-300"
                  }`}
                >
                  {category.count}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets by subject, description, or school..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
            <select className="px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none">
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting">Waiting</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select className="px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none">
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
          <CardDescription>
            {ticketStats.open + ticketStats.inProgress} tickets require attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Ticket</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">School</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Category</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Priority</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Assigned</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Responses</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Created</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      ticket.status === "open" ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="max-w-md">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-gray-500">{ticket.id}</span>
                          {ticket.attachments > 0 && (
                            <Paperclip className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                        <Link
                          href={`/admin/support/${ticket.id}`}
                          className="font-medium text-gray-900 hover:text-pink-600 transition-colors line-clamp-1"
                        >
                          {ticket.subject}
                        </Link>
                        <p className="text-sm text-gray-500 line-clamp-1">{ticket.description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
                          style={{
                            background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
                          }}
                        >
                          {ticket.school.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{ticket.school}</p>
                          <p className="text-xs text-gray-500">by {ticket.createdBy}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">{getCategoryBadge(ticket.category)}</td>
                    <td className="py-4 px-4 text-center">{getPriorityBadge(ticket.priority)}</td>
                    <td className="py-4 px-4 text-center">{getStatusBadge(ticket.status)}</td>
                    <td className="py-4 px-4 text-center">
                      {ticket.assignedTo ? (
                        <Badge variant="outline" className="text-xs">
                          {ticket.assignedTo}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{ticket.responses}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(ticket.createdAt).toLocaleDateString("en-BT", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                        >
                          <Reply className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-gray-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Team Assignment */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Support Team
            </CardTitle>
            <CardDescription>Active team members and their load</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {supportTeam.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{
                        background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
                      }}
                    >
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={member.activeTickets > 3 ? "bg-orange-50 text-orange-700 border-orange-200" : ""}
                  >
                    {member.activeTickets} active
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common support tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Send className="w-4 h-4 mr-3" />
              Send Bulk Response
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Archive className="w-4 h-4 mr-3" />
              Archive Resolved Tickets
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Forward className="w-4 h-4 mr-3" />
              Reassign Tickets
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Building2 className="w-4 h-4 mr-3" />
              View by School
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="w-4 h-4 mr-3" />
              Schedule Follow-ups
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Support Activity</CardTitle>
          <CardDescription>Latest updates from the support team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                ticket: "TKT-2024-003",
                action: "assigned to Tech Team",
                user: "Admin",
                time: "10 minutes ago",
              },
              {
                ticket: "TKT-2024-002",
                action: "status changed to In Progress",
                user: "Support Team",
                time: "1 hour ago",
              },
              {
                ticket: "TKT-2024-005",
                action: "marked as resolved",
                user: "Finance Team",
                time: "3 hours ago",
              },
              {
                ticket: "TKT-2024-001",
                action: "new response added",
                user: "Dorji Wangmo",
                time: "5 hours ago",
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-pink-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-gray-900">{activity.ticket}</span>{" "}
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-500">
                    by {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
