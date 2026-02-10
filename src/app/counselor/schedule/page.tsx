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
  Video,
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Mail,
  Bell,
  MapPin,
} from "lucide-react";
import Link from "next/link";

// Mock session data
const mockSessions = [
  {
    id: "SES001",
    studentId: "STU001",
    studentName: "Tashi Dorji",
    studentGrade: 12,
    studentEmail: "tashi.dorji@school.edu.bt",
    type: "one_on_one",
    topic: "Career Planning Review",
    date: "2024-02-15",
    time: "10:00 AM",
    duration: 30,
    status: "upcoming",
    location: "Counseling Office A",
    notes: "Review university options and application timeline",
    reminder: "1 hour before",
    createdAt: "2024-02-08",
  },
  {
    id: "SES002",
    studentId: "STU004",
    studentName: "Dorji Wangchuk",
    studentGrade: 12,
    studentEmail: "dorji.wangchuk@school.edu.bt",
    type: "assessment_review",
    topic: "RIASEC Results Discussion",
    date: "2024-02-16",
    time: "2:00 PM",
    duration: 45,
    status: "upcoming",
    location: "Virtual - Google Meet",
    notes: "Discuss Holland Code results and career matches",
    reminder: "1 day before",
    createdAt: "2024-02-08",
  },
  {
    id: "SES003",
    studentId: "STU005",
    studentName: "Sonam Yangdon",
    studentGrade: 10,
    studentEmail: "sonam.yangdon@school.edu.bt",
    type: "group",
    topic: "Career Exploration Workshop",
    date: "2024-02-14",
    time: "9:00 AM",
    duration: 60,
    status: "completed",
    location: "School Auditorium",
    notes: "Group session on healthcare careers",
    reminder: "1 day before",
    createdAt: "2024-02-01",
    attended: true,
  },
  {
    id: "SES004",
    studentId: "STU007",
    studentName: "Tshering Yangdon",
    studentGrade: 12,
    studentEmail: "tshering.yangdon@school.edu.bt",
    type: "one_on_one",
    topic: "Application Guidance",
    date: "2024-02-10",
    time: "11:00 AM",
    duration: 30,
    status: "completed",
    location: "Counseling Office B",
    notes: "Help with university application forms",
    reminder: "1 hour before",
    createdAt: "2024-02-05",
    attended: true,
  },
  {
    id: "SES005",
    studentId: "STU002",
    studentName: "Karma Wangmo",
    studentGrade: 10,
    studentEmail: "karma.wangmo@school.edu.bt",
    type: "one_on_one",
    topic: "Initial Consultation",
    date: "2024-02-12",
    time: "3:00 PM",
    duration: 30,
    status: "cancelled",
    location: "Counseling Office A",
    notes: "Student requested rescheduling",
    reminder: null,
    createdAt: "2024-02-05",
    attended: false,
  },
  {
    id: "SES006",
    studentId: "STU006",
    studentName: "Karma Tshering",
    studentGrade: 11,
    studentEmail: "karma.tshering@school.edu.bt",
    type: "assessment_review",
    topic: "MBTI Results Review",
    date: "2024-02-17",
    time: "10:30 AM",
    duration: 30,
    status: "upcoming",
    location: "Virtual - Google Meet",
    notes: "Review personality type results",
    reminder: "1 day before",
    createdAt: "2024-02-09",
  },
  {
    id: "SES007",
    studentId: "STU001",
    studentName: "Tashi Dorji",
    studentGrade: 12,
    studentEmail: "tashi.dorji@school.edu.bt",
    type: "one_on_one",
    topic: "Follow-up Session",
    date: "2024-02-08",
    time: "9:00 AM",
    duration: 30,
    status: "completed",
    location: "Counseling Office A",
    notes: "Check on progress with application process",
    reminder: "1 hour before",
    createdAt: "2024-02-01",
    attended: true,
  },
  {
    id: "SES008",
    studentId: "STU008",
    studentName: "Dorji Tshering",
    studentGrade: 9,
    studentEmail: "dorji.tshering@school.edu.bt",
    type: "one_on_one",
    topic: "Initial Assessment",
    date: "2024-02-20",
    time: "2:30 PM",
    duration: 45,
    status: "upcoming",
    location: "Counseling Office B",
    notes: "First session - career assessment introduction",
    reminder: "1 day before",
    createdAt: "2024-02-10",
  },
];

const sessionTypeOptions = [
  { value: "all", label: "All Types" },
  { value: "one_on_one", label: "One-on-One" },
  { value: "group", label: "Group Session" },
  { value: "assessment_review", label: "Assessment Review" },
];

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function CounselorSchedulePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("upcoming");
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  // Filter sessions
  const filteredSessions = mockSessions.filter((session) => {
    const matchesSearch =
      session.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.topic.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === "all" || session.type === selectedType;
    const matchesStatus = selectedStatus === "all" || session.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Sort by date (upcoming first, then past)
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (a.status === "upcoming" && b.status !== "upcoming") return -1;
    if (a.status !== "upcoming" && b.status === "upcoming") return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const getSessionTypeBadge = (type: string) => {
    const styles = {
      one_on_one: "bg-blue-100 text-blue-700 border-blue-200",
      group: "bg-green-100 text-green-700 border-green-200",
      assessment_review: "bg-purple-100 text-purple-700 border-purple-200",
    };
    const labels = {
      one_on_one: "One-on-One",
      group: "Group",
      assessment_review: "Assessment Review",
    };
    return { className: styles[type as keyof typeof styles] || styles.one_on_one, label: labels[type as keyof typeof labels] || type };
  };

  const getSessionStatusBadge = (status: string) => {
    const styles = {
      upcoming: "bg-yellow-100 text-yellow-700 border-yellow-200",
      completed: "bg-green-100 text-green-700 border-green-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    };
    const labels = {
      upcoming: "Upcoming",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return { className: styles[status as keyof typeof styles] || styles.upcoming, label: labels[status as keyof typeof labels] || status };
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case "one_on_one":
        return <Users className="w-4 h-4" />;
      case "group":
        return <Users className="w-4 h-4" />;
      case "assessment_review":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  // Stats
  const upcomingSessions = mockSessions.filter((s) => s.status === "upcoming").length;
  const completedSessions = mockSessions.filter((s) => s.status === "completed").length;
  const todaysSessions = mockSessions.filter((s) => {
    const today = new Date().toISOString().split('T')[0];
    return s.date === today && s.status === "upcoming";
  }).length;

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
                <p className="text-2xl font-bold text-gray-900">
                  {mockSessions.filter((s) => s.location.includes("Virtual")).length}
                </p>
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
                  placeholder="Search by student name or topic..."
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

          return (
            <Card key={session.id} className={session.status === "upcoming" ? "border-purple-200" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Date & Time */}
                    <div className="text-center min-w-[70px]">
                      <p className="text-2xl font-bold" style={{ color: 'rgb(147 51 234)' }}>
                        {new Date(session.date).getDate()}
                      </p>
                      <p className="text-xs text-gray-500 uppercase">
                        {new Date(session.date).toLocaleDateString("en-US", { month: "short" })}
                      </p>
                    </div>

                    {/* Session Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{session.topic}</h3>
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
                          <span>{session.studentName}</span>
                          <span className="text-gray-400">•</span>
                          <span>Grade {session.studentGrade}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{session.time}</span>
                          <span className="text-gray-400">•</span>
                          <span>{session.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {session.location.includes("Virtual") ? (
                            <Video className="w-4 h-4" />
                          ) : (
                            <MapPin className="w-4 h-4" />
                          )}
                          <span>{session.location}</span>
                        </div>
                      </div>

                      {session.notes && (
                        <p className="text-sm text-gray-500 mt-2">{session.notes}</p>
                      )}

                      {session.reminder && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <Bell className="w-3 h-3" />
                          <span>Reminder: {session.reminder}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {session.status === "upcoming" && (
                      <>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/counselor/students/${session.studentId}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {session.location.includes("Virtual") && (
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
                          <Link href={`/counselor/schedule?student=${session.studentId}`}>
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
      {sortedSessions.length === 0 && (
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

      {/* New Session Modal */}
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
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Select student</option>
                    <option>Tashi Dorji (Grade 12)</option>
                    <option>Karma Wangmo (Grade 10)</option>
                    <option>Pema Lhamo (Grade 11)</option>
                    <option>Dorji Wangchuk (Grade 12)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Type *</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>One-on-One</option>
                    <option>Group Session</option>
                    <option>Assessment Review</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <Input type="time" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>15</option>
                    <option>30</option>
                    <option selected>45</option>
                    <option>60</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Counseling Office A</option>
                    <option>Counseling Office B</option>
                    <option>Virtual - Google Meet</option>
                    <option>Virtual - Zoom</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                <Input placeholder="e.g., Career Planning Review" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Session agenda or notes..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reminder</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>No reminder</option>
                  <option>1 hour before</option>
                  <option>1 day before</option>
                  <option>2 days before</option>
                </select>
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Mail className="w-4 h-4 text-blue-600" />
                <label className="flex items-center gap-2 text-sm text-blue-900">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span>Send email invitation to student</span>
                </label>
              </div>
            </CardContent>
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowNewSessionModal(false)}>
                Cancel
              </Button>
              <Button style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}>
                Schedule Session
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
