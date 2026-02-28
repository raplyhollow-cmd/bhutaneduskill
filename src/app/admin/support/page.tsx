"use client";

import { logger } from "@/lib/logger";
/**
 * PLATFORM ADMIN - SUPPORT TICKETS
 *
 * Manage and track all support tickets from schools and users.
 */


import { useState, useEffect, useRef } from "react";
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
  Archive,
  Trash2,
  MoreVertical,
  Eye,
  Star,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AddTicketModal } from "@/components/admin/add-ticket-modal";
import { EditTicketModal } from "@/components/admin/edit-ticket-modal";
import { getSupportTickets, getSupportStats, deleteSupportTicket, updateSupportTicket } from "./actions";

// Types
interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolution: string | null;
  satisfactionRating: number | null;
  responseCount: number;
  attachments: unknown[] | null;
  assignedToId: string | null;
  assignedToName: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Creator info
  createdById: string;
  createdByRole: string;
  creatorName: string | null;
  creatorEmail: string | null;
  // School info
  schoolId: string | null;
  schoolName: string | null;
  resolutionTime: number | null;
  resolvedAt: Date | string | null;
  closedAt: Date | string | null;
  lastResponseAt: Date | string | null;
  satisfactionFeedback: string | null;
  schoolCode?: string | null;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  waiting: number;
  resolved: number;
  closed: number;
  critical: number;
  high: number;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

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
  const categoryMap: Record<string, { label: string; color: string }> = {
    bug: { label: "Bug", color: "bg-red-100 text-red-700 border-red-200" },
    feature_request: { label: "Feature", color: "bg-blue-100 text-blue-700 border-blue-200" },
    question: { label: "Question", color: "bg-purple-100 text-purple-700 border-purple-200" },
    billing: { label: "Billing", color: "bg-green-100 text-green-700 border-green-200" },
    technical: { label: "Technical", color: "bg-orange-100 text-orange-700 border-orange-200" },
    account: { label: "Account", color: "bg-gray-100 text-gray-700 border-gray-200" },
  };

  const cat = categoryMap[category];
  return cat ? (
    <Badge variant="outline" className={cat.color}>
      {cat.label}
    </Badge>
  ) : (
    <Badge variant="outline">{category}</Badge>
  );
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    waiting: 0,
    resolved: 0,
    closed: 0,
    critical: 0,
    high: 0,
  });
  const [categories, setCategories] = useState<Category[]>([
    { id: "all", name: "All", count: 0 },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const hasFetched = useRef(false);

  const fetchData = async (filters?: {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }) => {
    setIsLoading(true);
    try {
      const [ticketsResult, statsResult] = await Promise.all([
        getSupportTickets(filters),
        getSupportStats(),
      ]);

      if (ticketsResult.success && ticketsResult.data) {
        setTickets(ticketsResult.data as unknown as Ticket[]);
      }

      if (statsResult.success && statsResult.data) {
        const { stats: newStats, categories: newCategories } = statsResult.data;
        setStats(newStats as TicketStats);
        setCategories([
          { id: "all", name: "All", count: newStats.total as number },
          ...(newCategories as Category[]),
        ]);
      }
    } catch (error) {
      logger.error("Error fetching support data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchData();
  }, []);

  // Filter tickets based on selections
  const filteredTickets = tickets.filter((ticket) => {
    if (selectedCategory !== "all" && ticket.category !== selectedCategory) return false;
    if (selectedStatus && ticket.status !== selectedStatus) return false;
    if (selectedPriority && ticket.priority !== selectedPriority) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.subject.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.ticketNumber.toLowerCase().includes(query) ||
        ticket.schoolName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;

    try {
      const result = await deleteSupportTicket(ticketId);
      if (result.error) {
        alert(result.error);
      } else {
        fetchData();
      }
    } catch (error) {
      logger.error("Error deleting ticket:", error);
      alert("Failed to delete ticket");
    }
  };

  const handleQuickStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const result = await updateSupportTicket(ticketId, { status: newStatus as "open" | "in_progress" | "waiting" | "resolved" | "closed" });
      if (result.error) {
        alert(result.error);
      } else {
        fetchData();
      }
    } catch (error) {
      logger.error("Error updating ticket status:", error);
      alert("Failed to update ticket status");
    }
  };

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
            onClick={() => setIsAddModalOpen(true)}
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
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
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
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
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
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
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
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
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
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedCategory === category.id
                    ? "border-pink-500 bg-pink-50 text-pink-700"
                    : "border-gray-200 hover:border-pink-300"
                }`}
              >
                <span className="font-medium">{category.name}</span>
                <Badge
                  variant="outline"
                  className={`ml-2 ${
                    selectedCategory === category.id
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting">Waiting</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
            >
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
            {stats.open + stats.inProgress} tickets require attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No tickets found. Create a new ticket to get started.
            </div>
          ) : (
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
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        ticket.status === "open" ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="max-w-md">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-gray-500">{ticket.ticketNumber}</span>
                            {ticket.attachments && ticket.attachments.length > 0 && (
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
                            {ticket.schoolName
                              ? ticket.schoolName.substring(0, 2).toUpperCase()
                              : ticket.creatorName?.substring(0, 2).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {ticket.schoolName || "Unknown School"}
                            </p>
                            <p className="text-xs text-gray-500">by {ticket.creatorName || "Unknown"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">{getCategoryBadge(ticket.category)}</td>
                      <td className="py-4 px-4 text-center">{getPriorityBadge(ticket.priority)}</td>
                      <td className="py-4 px-4 text-center">
                        <select
                          value={ticket.status}
                          onChange={(e) => handleQuickStatusChange(ticket.id, e.target.value)}
                          className="text-xs bg-transparent border-none cursor-pointer hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="waiting">Waiting</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {ticket.assignedToName ? (
                          <Badge variant="outline" className="text-xs">
                            {ticket.assignedToName}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {ticket.responseCount || 0}
                          </span>
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
                            onClick={() => router.push(`/admin/support/${ticket.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                            onClick={() => setEditingTicket(ticket)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDeleteTicket(ticket.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddTicketModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchData();
          setIsAddModalOpen(false);
        }}
      />

      <EditTicketModal
        open={!!editingTicket}
        ticket={editingTicket}
        onClose={() => setEditingTicket(null)}
        onSuccess={() => {
          fetchData();
          setEditingTicket(null);
        }}
      />
    </div>
  );
}
