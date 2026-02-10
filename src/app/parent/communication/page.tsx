/**
 * PARENT COMMUNICATION PAGE
 *
 * Allows parents to:
 * - View messages from teachers and school administration
 * - Send messages to teachers
 * - View conversation history
 * - Check for important announcements
 * - Access parent-teacher meeting schedules
 *
 * Features:
 * - Message inbox with read/unread status
 * - Compose new messages
 * - Thread-based conversations
 * - Teacher contact information
 * - School announcements
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChildSelector, Child } from "@/components/parent/child-selector";
import {
  MessageSquare,
  Send,
  Inbox,
  Paperclip,
  Search,
  Filter,
  Star,
  StarOff,
  Archive,
  Trash2,
  Reply,
  Forward,
  Phone,
  Mail,
  Clock,
  Check,
  CheckCheck,
  User,
  Calendar,
  Bell,
  AlertCircle,
  ChevronDown,
  X,
  Plus,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string;
  subject: string;
  preview: string;
  sender: {
    name: string;
    role: "teacher" | "admin" | "counselor";
    avatar?: string;
  };
  recipientChildId: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  hasAttachment: boolean;
  threadId: string;
  replyCount: number;
}

interface Conversation {
  id: string;
  subject: string;
  participants: Array<{
    name: string;
    role: "parent" | "teacher" | "admin";
    avatar?: string;
  }>;
  messages: Array<{
    id: string;
    sender: string;
    content: string;
    timestamp: Date;
    isRead: boolean;
  }>;
  childId: string;
  lastUpdated: Date;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: "general" | "urgent" | "event" | "holiday" | "exam";
  priority: "low" | "medium" | "high";
  publishedAt: Date;
  expiryDate?: Date;
  publisher: string;
}

interface TeacherContact {
  id: string;
  name: string;
  subject: string;
  email: string;
  phone?: string;
  avatar?: string;
  availability: string;
}

// ============================================================================
// MOCK DATA - Will be replaced with API calls
// ============================================================================

const mockChildren: Child[] = [
  {
    id: "child1",
    name: "Tashi Dorji",
    grade: "Class 10",
    school: "Yangchenphug HSS",
  },
  {
    id: "child2",
    name: "Pema Lhamo",
    grade: "Class 8",
    school: "Motithang HSS",
  },
];

const mockMessages: Message[] = [
  {
    id: "msg1",
    subject: "Homework Submission Reminder",
    preview: "Please remind Tashi to submit the mathematics assignment by Friday...",
    sender: {
      name: "Ms. Karma Wangmo",
      role: "teacher",
    },
    recipientChildId: "child1",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false,
    isStarred: false,
    isImportant: true,
    hasAttachment: true,
    threadId: "thread1",
    replyCount: 0,
  },
  {
    id: "msg2",
    subject: "Parent-Teacher Meeting Schedule",
    preview: "We would like to schedule a meeting to discuss Pema's progress...",
    sender: {
      name: "Mr. Dorji Thinley",
      role: "teacher",
    },
    recipientChildId: "child2",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isRead: true,
    isStarred: true,
    isImportant: false,
    hasAttachment: false,
    threadId: "thread2",
    replyCount: 2,
  },
  {
    id: "msg3",
    subject: "Career Assessment Results",
    preview: "The career assessment results are now available for review...",
    sender: {
      name: "Ms. Tashi Deki",
      role: "counselor",
    },
    recipientChildId: "child1",
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    isRead: true,
    isStarred: false,
    isImportant: false,
    hasAttachment: true,
    threadId: "thread3",
    replyCount: 1,
  },
  {
    id: "msg4",
    subject: "School Holiday Notice",
    preview: "Please be informed that the school will remain closed on...",
    sender: {
      name: "School Administration",
      role: "admin",
    },
    recipientChildId: "child1",
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
    isRead: true,
    isStarred: false,
    isImportant: true,
    hasAttachment: false,
    threadId: "thread4",
    replyCount: 0,
  },
];

const mockConversations: Conversation[] = [
  {
    id: "conv1",
    subject: "Mathematics Progress Discussion",
    participants: [
      { name: "Ms. Karma Wangmo", role: "teacher" },
      { name: "Parent (You)", role: "parent" },
    ],
    messages: [
      {
        id: "m1",
        sender: "Ms. Karma Wangmo",
        content: "I wanted to discuss Tashi's progress in Mathematics. He has shown improvement in algebra but needs more practice with geometry.",
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
        isRead: true,
      },
      {
        id: "m2",
        sender: "Parent (You)",
        content: "Thank you for the update. I'll make sure he practices geometry at home.",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isRead: true,
      },
      {
        id: "m3",
        sender: "Ms. Karma Wangmo",
        content: "That's great to hear! I can provide some additional practice worksheets if needed.",
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        isRead: true,
      },
    ],
    childId: "child1",
    lastUpdated: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
];

const mockAnnouncements: Announcement[] = [
  {
    id: "ann1",
    title: "Mid-Term Examination Schedule",
    content: "The mid-term examinations for Class 6-12 will commence from March 15th. Detailed schedule has been shared with students.",
    category: "exam",
    priority: "high",
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    publisher: "Academic Office",
  },
  {
    id: "ann2",
    title: "Parent-Teacher Meeting",
    content: "Annual parent-teacher meeting will be held on February 20th from 9 AM to 4 PM. All parents are requested to attend.",
    category: "event",
    priority: "medium",
    publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    publisher: "School Administration",
  },
  {
    id: "ann3",
    title: "School Closure for Losar",
    content: "The school will remain closed from February 28th to March 2nd for Losar celebrations.",
    category: "holiday",
    priority: "medium",
    publishedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
    expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    publisher: "School Administration",
  },
];

const mockTeacherContacts: TeacherContact[] = [
  {
    id: "t1",
    name: "Ms. Karma Wangmo",
    subject: "Mathematics",
    email: "karma.wangmo@school.edu.bt",
    phone: "+975 17 123 456",
    availability: "Mon-Fri, 3:00 PM - 4:00 PM",
  },
  {
    id: "t2",
    name: "Mr. Dorji Thinley",
    subject: "English",
    email: "dorji.thinley@school.edu.bt",
    availability: "Mon-Wed, 2:30 PM - 3:30 PM",
  },
  {
    id: "t3",
    name: "Ms. Tashi Deki",
    subject: "Science",
    email: "tashi.deki@school.edu.bt",
    phone: "+975 17 234 567",
    availability: "Tue-Thu, 3:00 PM - 4:00 PM",
  },
  {
    id: "c1",
    name: "Ms. Sonam Choden",
    subject: "School Counselor",
    email: "sonam.choden@school.edu.bt",
    phone: "+975 17 345 678",
    availability: "Mon-Fri, 9:00 AM - 4:00 PM",
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function ParentCommunicationPage() {
  const [selectedChild, setSelectedChild] = useState<Child>(mockChildren[0]);
  const [activeTab, setActiveTab] = useState<"inbox" | "sent" | "announcements" | "contacts">("inbox");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "starred">("all");

  // Filter messages by selected child
  const childMessages = mockMessages.filter((m) => m.recipientChildId === selectedChild.id);
  const filteredMessages = childMessages.filter((m) => {
    const matchesSearch =
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sender.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "unread" && !m.isRead) ||
      (filterStatus === "starred" && m.isStarred);

    return matchesSearch && matchesFilter;
  });

  const unreadCount = childMessages.filter((m) => !m.isRead).length;
  const starredCount = childMessages.filter((m) => m.isStarred).length;

  const getRoleBadge = (role: string) => {
    const config = {
      teacher: { label: "Teacher", color: "bg-blue-100 text-blue-700" },
      admin: { label: "Admin", color: "bg-purple-100 text-purple-700" },
      counselor: { label: "Counselor", color: "bg-green-100 text-green-700" },
    };
    const { label, color } = config[role as keyof typeof config];
    return <Badge className={color}>{label}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const config = {
      general: { label: "General", color: "bg-gray-100 text-gray-700" },
      urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
      event: { label: "Event", color: "bg-blue-100 text-blue-700" },
      holiday: { label: "Holiday", color: "bg-green-100 text-green-700" },
      exam: { label: "Exam", color: "bg-orange-100 text-orange-700" },
    };
    const { label, color } = config[category as keyof typeof config];
    return <Badge className={color}>{label}</Badge>;
  };

  const toggleStar = (messageId: string) => {
    // In production, this would call an API to toggle star status
    console.log("Toggle star:", messageId);
  };

  const markAsRead = (messageId: string) => {
    // In production, this would call an API to mark message as read
    console.log("Mark as read:", messageId);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Communication
        </h1>
        <p className="text-gray-600">
          Messages and announcements for {selectedChild.name}
        </p>
      </div>

      {/* Child Selector */}
      <ChildSelector
        children={mockChildren}
        selectedChildId={selectedChild.id}
        onChildChange={setSelectedChild}
      />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 -mb-px">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors ${
              activeTab === "inbox"
                ? "border-gray-600 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Inbox className="w-4 h-4" />
            Inbox
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-700">{unreadCount}</Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors ${
              activeTab === "sent"
                ? "border-gray-600 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Send className="w-4 h-4" />
            Sent
          </button>
          <button
            onClick={() => setActiveTab("announcements")}
            className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors ${
              activeTab === "announcements"
                ? "border-gray-600 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Bell className="w-4 h-4" />
            Announcements
            {mockAnnouncements.filter((a) => a.priority === "high").length > 0 && (
              <Badge className="bg-red-100 text-red-700">
                {mockAnnouncements.filter((a) => a.priority === "high").length}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors ${
              activeTab === "contacts"
                ? "border-gray-600 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <User className="w-4 h-4" />
            Contacts
          </button>
        </nav>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 w-64"
            />
          </div>

          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="all">All Messages</option>
            <option value="unread">Unread Only</option>
            <option value="starred">Starred</option>
          </select>
        </div>

        <Button
          onClick={() => setShowCompose(true)}
          style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Compose
        </Button>
      </div>

      {/* Inbox Tab */}
      {activeTab === "inbox" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Message List */}
          <div className="lg:col-span-1 space-y-3">
            {filteredMessages.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No messages found</p>
                </CardContent>
              </Card>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => {
                    setSelectedMessage(message);
                    markAsRead(message.id);
                  }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedMessage?.id === message.id
                      ? "border-gray-500 bg-gray-50"
                      : message.isRead
                      ? "border-gray-200 bg-white hover:border-gray-300"
                      : "border-gray-300 bg-white shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
                        message.isRead ? "bg-gray-300" : ""
                      }`}
                      style={
                        !message.isRead
                          ? { background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }
                          : {}
                      }
                    >
                      {message.sender.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`font-medium truncate ${!message.isRead ? "text-gray-900" : "text-gray-600"}`}>
                          {message.sender.name}
                        </p>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${!message.isRead ? "font-medium text-gray-800" : "text-gray-600"}`}>
                        {message.subject}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-1">{message.preview}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {getRoleBadge(message.sender.role)}
                        {message.isImportant && (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                        {message.hasAttachment && (
                          <Paperclip className="w-3 h-3 text-gray-400" />
                        )}
                        {message.replyCount > 0 && (
                          <span className="text-xs text-gray-500">{message.replyCount} replies</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedMessage.subject}</CardTitle>
                      <CardDescription className="flex items-center gap-3 mt-2">
                        <span>From: {selectedMessage.sender.name}</span>
                        {getRoleBadge(selectedMessage.sender.role)}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {selectedMessage.timestamp.toLocaleString()}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStar(selectedMessage.id)}
                      >
                        {selectedMessage.isStarred ? (
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <Star className="w-5 h-5" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Reply className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Archive className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Message Content */}
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {selectedMessage.preview}
                      <br />
                      <br />
                      Dear Parent,
                      <br />
                      <br />
                      This is to inform you that the homework submission deadline is approaching. Please
                      remind {selectedChild.name} to complete and submit the mathematics assignment by
                      Friday, February 14th.
                      <br />
                      <br />
                      The assignment covers algebraic expressions and equations. Students can access the
                      assignment details through their student portal.
                      <br />
                      <br />
                      If you have any questions or concerns, please feel free to reach out.
                      <br />
                      <br />
                      Best regards,
                      <br />
                      {selectedMessage.sender.name}
                    </p>
                  </div>

                  {/* Attachments */}
                  {selectedMessage.hasAttachment && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <p className="text-sm font-medium mb-2">Attachments:</p>
                      <div className="flex items-center gap-3 p-2 bg-white rounded border cursor-pointer hover:bg-gray-50">
                        <Paperclip className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Math_Assignment_Details.pdf</span>
                        <Download className="w-4 h-4 text-gray-400 ml-auto" />
                      </div>
                    </div>
                  )}

                  {/* Reply Box */}
                  <div className="border rounded-lg p-4">
                    <textarea
                      placeholder="Write your reply..."
                      rows={4}
                      className="w-full border-0 focus:outline-none focus:ring-0 resize-none"
                    />
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Paperclip className="w-4 h-4 mr-2" />
                          Attach
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a message to read
                  </h3>
                  <p className="text-gray-500">
                    Choose a message from the list to view its contents
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Sent Tab */}
      {activeTab === "sent" && (
        <Card>
          <CardHeader>
            <CardTitle>Sent Messages</CardTitle>
            <CardDescription>Messages you have sent to teachers and school</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No sent messages yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowCompose(true)}
              >
                Compose a Message
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcements Tab */}
      {activeTab === "announcements" && (
        <div className="space-y-4">
          {mockAnnouncements.map((announcement) => (
            <Card
              key={announcement.id}
              className={announcement.priority === "high" ? "border-red-200 bg-red-50" : ""}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      {getCategoryBadge(announcement.category)}
                      {announcement.priority === "high" && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <CardDescription>
                      Published by {announcement.publisher} •{" "}
                      {formatTimestamp(announcement.publishedAt)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{announcement.content}</p>
                {announcement.expiryDate && (
                  <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Expires: {announcement.expiryDate.toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === "contacts" && (
        <Card>
          <CardHeader>
            <CardTitle>Teacher Contacts</CardTitle>
            <CardDescription>Contact information for {selectedChild.name}&apos;s teachers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {mockTeacherContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
                    >
                      {contact.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.subject}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{contact.availability}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Message
                    </Button>
                    {contact.phone && (
                      <Button variant="outline" size="sm" className="flex-1">
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Compose Message</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCompose(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">To</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400">
                  <option value="">Select recipient...</option>
                  {mockTeacherContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} - {contact.subject}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Enter subject..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  rows={6}
                  placeholder="Type your message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowCompose(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Back Link */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/parent">
            ← Back to Parent Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
