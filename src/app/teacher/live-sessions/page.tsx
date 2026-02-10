/**
 * TEACHER LIVE SESSIONS PAGE
 * Schedule and manage live video sessions (Zoom, Google Meet)
 */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Link as LinkIcon,
  Play,
  Copy,
  Settings,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
} from "lucide-react";

interface LiveSession {
  id: string;
  title: string;
  description?: string;
  subject: string;
  classId: string;
  className: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  platform: "zoom" | "google_meet" | "teams" | "in_app";
  meetingLink?: string;
  meetingPassword?: string;
  status: "scheduled" | "live" | "completed" | "cancelled";
  maxParticipants?: number;
  currentParticipants?: number;
  isRecorded: boolean;
  recordingUrl?: string;
  recurringDays?: string[];
}

const platforms = [
  { value: "zoom", label: "Zoom", icon: "Video", color: "blue" },
  { value: "google_meet", label: "Google Meet", icon: "Video", color: "green" },
  { value: "teams", label: "Microsoft Teams", icon: "Video", color: "purple" },
  { value: "in_app", label: "In-App Video", icon: "Video", color: "orange" },
];

export default function TeacherLiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Form state for creating session
  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    subject: "",
    classId: "",
    scheduledDate: "",
    startTime: "",
    endTime: "",
    platform: "google_meet" as const,
    isRecorded: false,
  });

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);

        const response = await fetch("/api/teacher/live-sessions");
        if (response.ok) {
          const data = await response.json();
          setSessions(data.sessions || []);
        } else {
          // Mock data
          setSessions([
            {
              id: "ls1",
              title: "Mathematics - Quadratic Equations",
              description: "Live lesson on solving quadratic equations",
              subject: "Mathematics",
              classId: "c1",
              className: "Class 10 A",
              scheduledDate: new Date().toISOString().split("T")[0],
              startTime: "14:00",
              endTime: "15:00",
              duration: 60,
              platform: "google_meet",
              meetingLink: "https://meet.google.com/abc-defg-hij",
              status: "scheduled",
              maxParticipants: 42,
              currentParticipants: 0,
              isRecorded: true,
              recurringDays: ["Monday", "Wednesday"],
            },
            {
              id: "ls2",
              title: "Physics - Newton's Laws",
              description: "Interactive session on Newton's three laws",
              subject: "Physics",
              classId: "c3",
              className: "Class 9 A",
              scheduledDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
              startTime: "10:00",
              endTime: "11:00",
              duration: 60,
              platform: "zoom",
              meetingLink: "https://zoom.us/j/123456789",
              meetingPassword: "abc123",
              status: "scheduled",
              maxParticipants: 40,
              currentParticipants: 0,
              isRecorded: true,
            },
            {
              id: "ls3",
              title: "Mathematics - Trigonometry Basics",
              subject: "Mathematics",
              classId: "c2",
              className: "Class 10 B",
              scheduledDate: new Date(Date.now() - 86400000).toISOString().split("T")[0],
              startTime: "09:00",
              endTime: "10:00",
              duration: 60,
              platform: "google_meet",
              meetingLink: "https://meet.google.com/xyz-uvwx-yz",
              status: "completed",
              maxParticipants: 38,
              currentParticipants: 35,
              isRecorded: true,
              recordingUrl: "https://drive.google.com/file/d/example",
            },
            {
              id: "ls4",
              title: "Career Guidance - Engineering Pathways",
              description: "Guest lecture from engineering professionals",
              subject: "Career Guidance",
              classId: "c1",
              className: "All Sections",
              scheduledDate: new Date(Date.now() + 172800000).toISOString().split("T")[0],
              startTime: "14:00",
              endTime: "15:30",
              duration: 90,
              platform: "teams",
              status: "scheduled",
              maxParticipants: 100,
              currentParticipants: 0,
              isRecorded: true,
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const filteredSessions = sessions.filter((s) => {
    if (filterStatus === "all") return true;
    return s.status === filterStatus;
  });

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case "zoom":
        return (
          <Badge className="bg-blue-600">
            <Video className="w-3 h-3 mr-1" />
            Zoom
          </Badge>
        );
      case "google_meet":
        return (
          <Badge className="bg-green-600">
            <Video className="w-3 h-3 mr-1" />
            Google Meet
          </Badge>
        );
      case "teams":
        return (
          <Badge className="bg-purple-600">
            <Video className="w-3 h-3 mr-1" />
            Teams
          </Badge>
        );
      case "in_app":
        return (
          <Badge className="bg-orange-600">
            <Video className="w-3 h-3 mr-1" />
            In-App
          </Badge>
        );
      default:
        return <Badge variant="outline">{platform}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return (
          <Badge className="bg-red-600 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white mr-1" />
            Live Now
          </Badge>
        );
      case "scheduled":
        return <Badge className="bg-blue-600">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-gray-600">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCreateSession = async () => {
    try {
      // Calculate duration
      const start = new Date(`2000-01-01T${newSession.startTime}`);
      const end = new Date(`2000-01-01T${newSession.endTime}`);
      const duration = Math.round((end.getTime() - start.getTime()) / 60000);

      const response = await fetch("/api/teacher/live-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newSession,
          duration,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessions([data.session, ...sessions]);
        setShowCreateModal(false);
        // Reset form
        setNewSession({
          title: "",
          description: "",
          subject: "",
          classId: "",
          scheduledDate: "",
          startTime: "",
          endTime: "",
          platform: "google_meet",
          isRecorded: false,
        });
      }
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  // Stats
  const totalSessions = sessions.length;
  const scheduledSessions = sessions.filter((s) => s.status === "scheduled").length;
  const completedSessions = sessions.filter((s) => s.status === "completed").length;
  const totalParticipants = sessions.reduce((sum, s) => sum + (s.currentParticipants || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Sessions</h1>
          <p className="text-gray-600">Schedule and manage online classes</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
                <p className="text-sm text-gray-600">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{scheduledSessions}</p>
                <p className="text-sm text-gray-600">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedSessions}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalParticipants}</p>
                <p className="text-sm text-gray-600">Total Attendees</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={filterStatus === "scheduled" ? "default" : "outline"}
                onClick={() => setFilterStatus("scheduled")}
              >
                Scheduled
              </Button>
              <Button
                size="sm"
                variant={filterStatus === "live" ? "default" : "outline"}
                onClick={() => setFilterStatus("live")}
              >
                Live
              </Button>
              <Button
                size="sm"
                variant={filterStatus === "completed" ? "default" : "outline"}
                onClick={() => setFilterStatus("completed")}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6 flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading sessions...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 py-12 text-center">
            <Video className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No sessions found</p>
            <p className="text-sm text-gray-500 mt-2">Schedule your first live session to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSessions.map((session) => (
            <Card
              key={session.id}
              className={`hover:shadow-md transition-shadow ${
                session.status === "live" ? "border-red-200 bg-red-50/30" : ""
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                      session.status === "live"
                        ? "bg-red-100"
                        : session.status === "scheduled"
                        ? "bg-blue-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <Video className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{session.title}</h3>
                          {getStatusBadge(session.status)}
                        </div>
                        <p className="text-sm text-gray-600">{session.className}</p>
                      </div>
                      {getPlatformBadge(session.platform)}
                    </div>

                    {session.description && (
                      <p className="text-sm text-gray-600 mb-2">{session.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(session.scheduledDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {session.startTime} - {session.endTime} ({session.duration} min)
                        </span>
                      </div>
                      {session.maxParticipants && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>
                            {session.currentParticipants || 0}/{session.maxParticipants}
                          </span>
                        </div>
                      )}
                    </div>

                    {session.recurringDays && session.recurringDays.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          Recurring: {session.recurringDays.join(", ")}
                        </Badge>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {session.status === "scheduled" || session.status === "live" ? (
                        <>
                          <Button
                            size="sm"
                            style={{
                              background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
                            }}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            {session.status === "live" ? "Join Now" : "Start Session"}
                          </Button>
                          {session.meetingLink && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyMeetingLink(session.meetingLink!)}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              {copiedLink === session.meetingLink ? "Copied!" : "Copy Link"}
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </>
                      ) : session.status === "completed" ? (
                        <>
                          {session.recordingUrl && (
                            <Button size="sm" variant="outline">
                              <Video className="w-4 h-4 mr-1" />
                              View Recording
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setNewSession({
                                ...newSession,
                                title: session.title,
                                description: session.description,
                                subject: session.subject,
                                classId: session.classId,
                              });
                              setShowCreateModal(true);
                            }}
                          >
                            Schedule Again
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Schedule Live Session</CardTitle>
              <CardDescription>Create a new video session for your class</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Title *
                </label>
                <Input
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  placeholder="e.g., Mathematics - Quadratic Equations"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input
                  value={newSession.description}
                  onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                  placeholder="Brief description of the session"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <Input
                    value={newSession.subject}
                    onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <Select
                    value={newSession.classId}
                    onValueChange={(value) => setNewSession({ ...newSession, classId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="c1">Class 10 A</SelectItem>
                      <SelectItem value="c2">Class 10 B</SelectItem>
                      <SelectItem value="c3">Class 9 A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <Input
                  type="date"
                  value={newSession.scheduledDate}
                  onChange={(e) => setNewSession({ ...newSession, scheduledDate: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <Input
                    type="time"
                    value={newSession.startTime}
                    onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <Input
                    type="time"
                    value={newSession.endTime}
                    onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <Select
                  value={newSession.platform}
                  onValueChange={(value: any) => setNewSession({ ...newSession, platform: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google_meet">Google Meet</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                    <SelectItem value="in_app">In-App Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="record"
                  checked={newSession.isRecorded}
                  onChange={(e) => setNewSession({ ...newSession, isRecorded: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="record" className="text-sm text-gray-700">
                  Record this session
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
                  onClick={handleCreateSession}
                  disabled={!newSession.title || !newSession.scheduledDate || !newSession.startTime}
                >
                  Schedule Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tips Card */}
      <Card
        className="border-blue-200 bg-blue-50"
        style={{ background: "linear-gradient(to bottom right, rgb(239 246 255), rgb(219 234 254))" }}
      >
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            Tips for Successful Live Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>Test your microphone and camera before the session starts</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>Send the meeting link to students at least 24 hours in advance</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>Prepare your materials and have a backup plan in case of technical issues</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>Record sessions for students who cannot attend live</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
