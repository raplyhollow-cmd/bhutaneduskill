"use client";

import { logger } from "@/lib/logger";
/**
 * COUNSELOR - COUNSELING SCHEDULE
 *
 * Features:
 * - View and manage counseling sessions
 * - Schedule new sessions with students
 * - View upcoming and past sessions
 * - Session types (One-on-One, Group, Assessment Review)
 * - Calendar view integration
 * - Session reminders and notes
 *
 * INTEGRATED: Now uses real data from /api/counselor/sessions
 */


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Plus,
  Search,
  Video,
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Eye,
  Edit,
  Trash2,
  Mail,
  Bell,
  MapPin,
  Loader2,
  X,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// TYPES
// ============================================================================

interface CounselingSession {
  id: string;
  counselorId: string;
  studentId: string | null;
  type: "individual" | "group" | "family";
  status: "scheduled" | "completed" | "cancelled" | "no-show" | "in_progress";
  sessionDate: string;
  startTime: string;
  endTime: string;
  location: string;
  topic: string | null;
  notes: string | null;
  outcome: string | null;
  isRecurring: boolean;
  schoolId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface SessionStats {
  upcomingSessions: number;
  completedToday: number;
  totalHours: number;
  groupSessions: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const sessionTypeOptions = [
  { value: "all", label: "All Types" },
  { value: "individual", label: "Individual" },
  { value: "group", label: "Group Session" },
  { value: "family", label: "Family" },
];

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "scheduled", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function CounselorSchedulePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("scheduled");
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  // Data states
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchSessionsData();
  }, []);

  const fetchSessionsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/counselor/sessions");
      if (!response.ok) {
        throw new Error("Failed to fetch sessions data");
      }

      const data = await response.json();
      setSessions(data.sessions || []);
      setStats(data.stats || null);
    } catch (err) {
      logger.error("Error fetching sessions:", err);
      setError("Failed to load sessions. Please try again.");
      setSessions([]);
      setStats({
        upcomingSessions: 0,
        completedToday: 0,
        totalHours: 0,
        groupSessions: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      (session.topic && session.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      session.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === "all" || session.type === selectedType;
    const matchesStatus = selectedStatus === "all" || session.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Sort by date (upcoming first, then past)
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    const aIsUpcoming = a.status === "scheduled" || a.status === "in_progress";
    const bIsUpcoming = b.status === "scheduled" || b.status === "in_progress";
    if (aIsUpcoming && !bIsUpcoming) return -1;
    if (!aIsUpcoming && bIsUpcoming) return 1;
    return new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime();
  });

  const getSessionTypeBadge = (type: string) => {
    const styles = {
      individual: "bg-blue-100 text-blue-700 border-blue-200",
      group: "bg-green-100 text-green-700 border-green-200",
      family: "bg-purple-100 text-purple-700 border-purple-200",
    };
    const labels = {
      individual: "Individual",
      group: "Group",
      family: "Family",
    };
    return { className: styles[type as keyof typeof styles] || styles.individual, label: labels[type as keyof typeof labels] || type };
  };

  const getSessionStatusBadge = (status: string) => {
    const styles = {
      scheduled: "bg-yellow-100 text-yellow-700 border-yellow-200",
      in_progress: "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
      "no-show": "bg-gray-100 text-gray-700 border-gray-200",
    };
    const labels = {
      scheduled: "Scheduled",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
      "no-show": "No Show",
    };
    return { className: styles[status as keyof typeof styles] || styles.scheduled, label: labels[status as keyof typeof labels] || status };
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case "individual":
        return <Users className="w-4 h-4" />;
      case "group":
        return <Users className="w-4 h-4" />;
      case "family":
        return <Users className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: "rgb(147 51 234)" }} />
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchSessionsData} style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Stats from API or calculated
  const upcomingSessions = stats?.upcomingSessions ?? sessions.filter((s) => s.status === "scheduled").length;
  const completedSessions = sessions.filter((s) => s.status === "completed").length;
  const today = new Date().toISOString().split('T')[0];
  const todaysSessions = sessions.filter((s) => {
    return s.sessionDate.startsWith(today) && (s.status === "scheduled" || s.status === "in_progress");
  }).length;
  const virtualSessions = sessions.filter((s) => s.location?.toLowerCase().includes("virtual")).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Counseling Schedule</h1>
          <p className="text-gray-600 mt-1">
            Manage upcoming and past counseling sessions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Calendar View
          </Button>
          <Button className="gap-2" style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }} onClick={() => setShowNewSessionModal(true)}>
            <Plus className="w-4 h-4" />
            Schedule Session
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{upcomingSessions}</p>
                <p className="text-sm text-gray-500">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedSessions}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{todaysSessions}</p>
                <p className="text-sm text-gray-500">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{virtualSessions}</p>
                <p className="text-sm text-gray-500">Virtual</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by topic or session ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {sessionTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="space-y-3">
        {sortedSessions.map((session) => {
          const typeBadge = getSessionTypeBadge(session.type);
          const statusBadge = getSessionStatusBadge(session.status);

          // Calculate duration from startTime and endTime
          const [startH, startM] = session.startTime.split(':').map(Number);
          const [endH, endM] = session.endTime.split(':').map(Number);
          const duration = (endH * 60 + endM) - (startH * 60 + startM);

          return (
            <Card key={session.id} className={session.status === "scheduled" || session.status === "in_progress" ? "border-purple-200" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Date & Time */}
                    <div className="text-center min-w-[70px]">
                      <p className="text-2xl font-bold" style={{ color: 'rgb(147 51 234)' }}>
                        {new Date(session.sessionDate).getDate()}
                      </p>
                      <p className="text-xs text-gray-500 uppercase">
                        {new Date(session.sessionDate).toLocaleDateString("en-US", { month: "short" })}
                      </p>
                    </div>

                    {/* Session Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{session.topic || "Counseling Session"}</h3>
                        <Badge className={typeBadge.className} variant="outline">
                          {typeBadge.label}
                        </Badge>
                        <Badge className={statusBadge.className} variant="outline">
                          {statusBadge.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{session.studentId ? `Student: ${session.studentId.slice(0, 8)}...` : "No student assigned"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{session.startTime}</span>
                          <span className="text-gray-400">•</span>
                          <span>{duration} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {session.location?.toLowerCase().includes("virtual") ? (
                            <Video className="w-4 h-4" />
                          ) : (
                            <MapPin className="w-4 h-4" />
                          )}
                          <span>{session.location || "TBD"}</span>
                        </div>
                      </div>

                      {session.notes && (
                        <p className="text-sm text-gray-500 mt-2">{session.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {(session.status === "scheduled" || session.status === "in_progress") && (
                      <>
                        {session.studentId && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/counselor/students/${session.studentId}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {session.location?.toLowerCase().includes("virtual") && (
                          <Button size="sm" className="gap-2" style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}>
                            <Video className="w-4 h-4" />
                            Join
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {session.status === "completed" && (
                      <>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/counselor/sessions/${session.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/counselor/schedule?student=${session.studentId || ""}`}>
                            <Plus className="w-4 h-4 mr-1" />
                            Follow-up
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedSessions.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or schedule a new session</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setSelectedType("all");
                setSelectedStatus("all");
              }}>
                Clear Filters
              </Button>
              <Button style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }} onClick={() => setShowNewSessionModal(true)}>
                Schedule Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Session Modal - Simplified for real implementation */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Schedule New Session</CardTitle>
                  <CardDescription>Set up a counseling session with a student</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowNewSessionModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Use the Sessions page to create new sessions with full functionality.
                </p>
                <Button
                  className="mt-3"
                  variant="outline"
                  size="sm"
                  asChild
                  onClick={() => setShowNewSessionModal(false)}
                >
                  <Link href="/counselor/sessions">Go to Sessions Page</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
