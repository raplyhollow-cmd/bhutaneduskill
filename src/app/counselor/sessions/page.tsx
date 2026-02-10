/**
 * COUNSELOR - COUNSELING SESSIONS
 *
 * Features:
 * - Upcoming sessions calendar
 * - Session history
 * - Session notes
 * - Schedule new session
 * - Session types (individual, group, family)
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Plus,
  Search,
  Clock,
  Users,
  User,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  MessageSquare,
  X as XIcon,
} from "lucide-react";
import Link from "next/link";

// Mock session data
const mockSessions = [
  {
    id: "SES001",
    studentId: "STU001",
    studentName: "Tashi Dorji",
    grade: 12,
    type: "individual",
    status: "scheduled",
    date: "2024-02-15",
    startTime: "10:00",
    endTime: "10:45",
    location: "Counseling Office - Room 101",
    topic: "Career Planning Discussion",
    notes: "",
    isRecurring: false,
  },
  {
    id: "SES002",
    studentId: "STU002",
    studentName: "Karma Wangmo",
    grade: 10,
    type: "individual",
    status: "scheduled",
    date: "2024-02-15",
    startTime: "14:00",
    endTime: "14:45",
    location: "Counseling Office - Room 101",
    topic: "Attendance Review",
    notes: "Follow-up on attendance improvement plan",
    isRecurring: true,
    recurringPattern: "weekly",
  },
  {
    id: "SES003",
    studentId: "STU003",
    studentName: "Pema Lhamo",
    grade: 11,
    type: "individual",
    status: "completed",
    date: "2024-02-10",
    startTime: "11:00",
    endTime: "11:45",
    location: "Counseling Office - Room 101",
    topic: "Social Adjustment Check-in",
    notes: "Student reports positive interactions with peers. Joined debate club. Will continue monitoring.",
    isRecurring: false,
  },
  {
    id: "SES004",
    studentName: "Grade 10 Study Skills Group",
    participants: ["STU005", "STU006", "STU007", "STU008"],
    type: "group",
    status: "scheduled",
    date: "2024-02-16",
    startTime: "13:00",
    endTime: "14:00",
    location: "Library - Study Room B",
    topic: "Study Skills Workshop",
    notes: "Session on effective note-taking and time management",
    isRecurring: true,
    recurringPattern: "biweekly",
  },
  {
    id: "SES005",
    studentId: "STU009",
    studentName: "Dorji Wangchuk",
    grade: 12,
    type: "family",
    status: "scheduled",
    date: "2024-02-17",
    startTime: "15:00",
    endTime: "16:00",
    location: "Counseling Office - Room 102",
    topic: "Family Counseling - Career Decisions",
    notes: "Session with student and parents to discuss university options",
    isRecurring: false,
  },
  {
    id: "SES006",
    studentId: "STU010",
    studentName: "Sonam Yangdon",
    grade: 11,
    type: "individual",
    status: "completed",
    date: "2024-02-08",
    startTime: "09:00",
    endTime: "09:45",
    location: "Counseling Office - Room 101",
    topic: "Assessment Results Review",
    notes: "Reviewed RIASEC results. Student showed strong interest in healthcare careers. Discussed nursing program requirements.",
    isRecurring: false,
  },
  {
    id: "SES007",
    studentId: "STU011",
    studentName: "Karma Tshering",
    grade: 10,
    type: "individual",
    status: "cancelled",
    date: "2024-02-09",
    startTime: "10:30",
    endTime: "11:15",
    location: "Counseling Office - Room 101",
    topic: "Behavioral Support",
    notes: "Student absent from school",
    isRecurring: false,
  },
  {
    id: "SES008",
    studentName: "Peer Support Training Group",
    participants: ["STU001", "STU003", "STU010", "STU012"],
    type: "group",
    status: "completed",
    date: "2024-02-07",
    startTime: "14:00",
    endTime: "15:30",
    location: "Multipurpose Hall",
    topic: "Peer Counseling Skills",
    notes: "First session of peer support training. Good engagement from all participants.",
    isRecurring: true,
    recurringPattern: "weekly",
  },
];

// Calendar data for the current month
const generateCalendarDays = () => {
  const days = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();

  // Empty cells for days before the first day of the month
  for (let i = 0; i < startDay; i++) {
    days.push({ day: null, isToday: false });
  }

  // Days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const isToday = date.toDateString() === today.toDateString();
    days.push({ day, isToday, date });
  }

  return days;
};

const typeOptions = ["All", "Individual", "Group", "Family"];
const statusOptions = ["All", "Scheduled", "Completed", "Cancelled"];

export default function CounselorSessionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter sessions
  const filteredSessions = mockSessions.filter((session) => {
    const matchesSearch =
      (session.studentName && session.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (session.topic && session.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      session.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === "All" || session.type.toLowerCase() === selectedType.toLowerCase();
    const matchesStatus = selectedStatus === "All" || session.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type: string) => {
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

  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: "bg-yellow-100 text-yellow-700 border-yellow-200",
      completed: "bg-green-100 text-green-700 border-green-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    };
    const labels = {
      scheduled: "Scheduled",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return { className: styles[status as keyof typeof styles] || styles.scheduled, label: labels[status as keyof typeof labels] || status };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "individual":
        return <User className="w-4 h-4" />;
      case "group":
        return <Users className="w-4 h-4" />;
      case "family":
        return <Users className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  // Stats
  const upcomingSessions = mockSessions.filter((s) => s.status === "scheduled").length;
  const completedToday = mockSessions.filter((s) => s.status === "completed").length;
  const totalHours = mockSessions.filter((s) => s.status === "completed").reduce((acc, s) => {
    const [startH, startM] = s.startTime.split(":").map(Number);
    const [endH, endM] = s.endTime.split(":").map(Number);
    return acc + (endH * 60 + endM - startH * 60 - startM) / 60;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Counseling Sessions</h1>
          <p className="text-gray-600 mt-1">
            Manage and track counseling sessions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            onClick={() => setViewMode("calendar")}
            className="gap-2"
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            List
          </Button>
          <Button
            className="gap-2"
            style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}
            onClick={() => setShowScheduleModal(true)}
          >
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
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(168 85 247 / 0.2), rgb(147 51 234 / 0.2))' }}>
                <Calendar className="w-6 h-6" style={{ color: 'rgb(147 51 234)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{upcomingSessions}</p>
                <p className="text-sm text-gray-500">Upcoming Sessions</p>
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
                <p className="text-2xl font-bold text-gray-900">{completedToday}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
                <p className="text-sm text-gray-500">Hours This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {mockSessions.filter((s) => s.type === "group").length}
                </p>
                <p className="text-sm text-gray-500">Group Sessions</p>
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
                  placeholder="Search by student, topic, or ID..."
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
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type === "All" ? "All Types" : type}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Status" : status}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const typeBadge = getTypeBadge(session.type);
            const statusBadge = getStatusBadge(session.status);

            return (
              <Card key={session.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
              setSelectedSession(session);
              setShowDetailModal(true);
            }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(168 85 247 / 0.2), rgb(147 51 234 / 0.2))' }}>
                    {getTypeIcon(session.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {session.studentName || session.participants?.length + " participants"}
                      </h3>
                      <Badge className={typeBadge.className} variant="outline">
                        {typeBadge.label}
                      </Badge>
                      <Badge className={statusBadge.className} variant="outline">
                        {statusBadge.label}
                      </Badge>
                      {session.isRecurring && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200" variant="outline">
                          Recurring
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{session.topic}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(session.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.startTime} - {session.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {session.location}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>February 2024</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon-sm">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon-sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((dayInfo, idx) => {
                const hasSessions = dayInfo.date && mockSessions.some(
                  (s) => new Date(s.date).toDateString() === dayInfo.date.toDateString()
                );
                const isPast = dayInfo.date && dayInfo.date < new Date();
                const isToday = dayInfo.isToday;

                return (
                  <button
                    key={idx}
                    className={`min-h-[60px] p-2 rounded-lg text-left transition-colors ${
                      isToday ? "ring-2 ring-purple-500" : ""
                    } ${isPast ? "opacity-50" : ""} ${
                      hasSessions ? "bg-purple-50 hover:bg-purple-100" : "hover:bg-gray-50"
                    }`}
                  >
                    {dayInfo.day && (
                      <>
                        <span className={`text-sm ${isToday ? "font-bold text-purple-600" : "text-gray-700"}`}>
                          {dayInfo.day}
                        </span>
                        {hasSessions && (
                          <div className="mt-1 flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                          </div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredSessions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or schedule a new session</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setSelectedType("All");
              setSelectedStatus("All");
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Schedule Session Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Schedule New Session</CardTitle>
                  <CardDescription>Set up a counseling session</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowScheduleModal(false)}>
                  <XIcon className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Type *</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                    <option value="family">Family</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student(s) *</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select student(s)</option>
                    <option value="STU001">Tashi Dorji - Grade 12</option>
                    <option value="STU002">Karma Wangmo - Grade 10</option>
                    <option value="STU003">Pema Lhamo - Grade 11</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <div className="flex items-center gap-2">
                    <Input type="time" defaultValue="10:00" />
                    <span className="text-gray-500">to</span>
                    <Input type="time" defaultValue="10:45" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="room-101">Counseling Office - Room 101</option>
                  <option value="room-102">Counseling Office - Room 102</option>
                  <option value="library">Library - Study Room B</option>
                  <option value="hall">Multipurpose Hall</option>
                  <option value="virtual">Virtual/Online</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                <Input placeholder="e.g., Career Planning, Academic Support" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[80px]"
                  placeholder="Add any preparatory notes..."
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded border-gray-300 text-purple-600" />
                  <span>Recurring session</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded border-gray-300 text-purple-600" />
                  <span>Send reminder to student(s)</span>
                </label>
              </div>
            </CardContent>
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </Button>
              <Button
                style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Session
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Session Detail Modal */}
      {showDetailModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedSession.topic}</CardTitle>
                  <CardDescription>{selectedSession.id}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(false)}>
                  <XIcon className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getTypeBadge(selectedSession.type).className} variant="outline">
                  {getTypeBadge(selectedSession.type).label}
                </Badge>
                <Badge className={getStatusBadge(selectedSession.status).className} variant="outline">
                  {getStatusBadge(selectedSession.status).label}
                </Badge>
                {selectedSession.isRecurring && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200" variant="outline">
                    Recurring
                  </Badge>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Participant(s)</h4>
                <p className="text-gray-600">
                  {selectedSession.studentName || `${selectedSession.participants?.length} participants`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Date</h4>
                  <p className="text-gray-600">{new Date(selectedSession.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Time</h4>
                  <p className="text-gray-600">{selectedSession.startTime} - {selectedSession.endTime}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Location</h4>
                <p className="text-gray-600">{selectedSession.location}</p>
              </div>

              {selectedSession.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Session Notes</h4>
                  <p className="text-gray-600">{selectedSession.notes}</p>
                </div>
              )}

              {selectedSession.status === "scheduled" && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Session
                    </Button>
                  </div>
                </div>
              )}

              {selectedSession.status === "completed" && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Add Follow-up Note</h4>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[80px]"
                    placeholder="Add additional notes..."
                  />
                  <Button className="mt-2" style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Save Note
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
