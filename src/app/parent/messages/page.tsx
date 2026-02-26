/**
 * PARENT MESSAGES PAGE
 *
 * A clean, mobile-first chat interface for parents to communicate with teachers.
 *
 * Features:
 * - Thread list showing all conversations
 * - Chat view for individual conversations
 * - Real-time message sending
 * - Read receipt indicators
 * - Unread message badges
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Search,
  MoreVertical,
  Paperclip,
  Clock,
  Check,
  CheckCheck,
  User,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { portal } from "@/styles/design-tokens";

// ============================================================================
// TYPES
// ============================================================================

interface MessageThread {
  id: string;
  conversationId: string;
  teacherId: string;
  teacherName: string;
  teacherImage: string | null;
  studentId: string;
  studentName: string;
  studentGrade: number | null;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
  subject: string | null;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "parent" | "teacher";
  senderName: string;
  senderImage: string | null;
  content: string;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  readAt: string | null;
  createdAt: string;
  isEdited: boolean;
  isFromMe: boolean;
}

interface ConversationData {
  conversation: {
    id: string;
    teacherId: string;
    studentId: string;
    subject: string | null;
    unreadCount: number;
  };
  messages: Message[];
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface ThreadItemProps {
  thread: MessageThread;
  isActive: boolean;
  onClick: () => void;
}

function ThreadItem({ thread, isActive, onClick }: ThreadItemProps) {
  const timeAgo = thread.lastMessageAt
    ? new Date(thread.lastMessageAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 border-b border-gray-100 cursor-pointer transition-colors",
        "hover:bg-gray-50",
        isActive && "bg-blue-50 hover:bg-blue-50"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Teacher Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
            {thread.teacherImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thread.teacherImage}
                alt={thread.teacherName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{thread.teacherName.charAt(0)}</span>
            )}
          </div>
          {thread.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
            </span>
          )}
        </div>

        {/* Thread Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{thread.teacherName}</h3>
            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{timeAgo}</span>
          </div>

          {/* Student context */}
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <GraduationCap className="w-3 h-3" />
            <span>Re: {thread.studentName}</span>
            {thread.studentGrade && (
              <span className="text-gray-400">• Class {thread.studentGrade}</span>
            )}
          </div>

          {/* Last message preview */}
          <p className="text-sm text-gray-600 truncate">{thread.lastMessage || "No messages yet"}</p>
        </div>
      </div>
    </div>
  );
}

interface ChatBubbleProps {
  message: Message;
  isFromMe: boolean;
}

function ChatBubble({ message, isFromMe }: ChatBubbleProps) {
  const isRead = message.readAt !== null;

  return (
    <div className={cn("flex w-full mb-4", isFromMe ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[80%] gap-2", isFromMe ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar */}
        {!isFromMe && (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm flex-shrink-0 mt-1">
            {message.senderImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={message.senderImage}
                alt={message.senderName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              message.senderName.charAt(0)
            )}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "px-4 py-2 rounded-2xl",
            isFromMe
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-gray-100 text-gray-900 rounded-bl-sm"
          )}
        >
          {!isFromMe && (
            <p className="text-xs font-medium text-gray-600 mb-1">{message.senderName}</p>
          )}
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {/* Attachment */}
          {message.attachmentUrl && (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.attachmentUrl}
                alt="Attachment"
                className="rounded-lg max-w-full h-auto"
              />
            </div>
          )}

          {/* Timestamp and read status */}
          <div
            className={cn(
              "flex items-center gap-1 mt-1 text-xs",
              isFromMe ? "text-blue-100" : "text-gray-500"
            )}
          >
            <Clock className="w-3 h-3" />
            <span>
              {new Date(message.createdAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            {isFromMe && (
              <span className="ml-1">
                {isRead ? (
                  <CheckCheck className="w-3 h-3 text-blue-200" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: Array<{ id: string; name: string; grade?: number | null }>;
  onSelectStudent: (studentId: string) => void;
}

function NewConversationModal({
  isOpen,
  onClose,
  children,
  onSelectStudent,
}: NewConversationModalProps) {
  const [search, setSearch] = useState("");
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([]);

  const filteredChildren = children.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">New Message</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-4">
          <Input
            placeholder="Search children..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredChildren.map((child) => (
              <button
                key={child.id}
                onClick={() => onSelectStudent(child.id)}
                className="w-full p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
                    {child.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{child.name}</p>
                    <p className="text-sm text-gray-500">
                      {child.grade ? `Class ${child.grade}` : "Student"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ParentMessagesPage() {
  const router = useRouter();
  const [view, setView] = useState<"list" | "chat">("list");
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [children, setChildren] = useState<Array<{ id: string; name: string; grade?: number | null }>>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/parent/messages");
      if (res.ok) {
        const data = await res.json();
        setThreads(data.data?.threads || []);
      }
    } catch (error) {
      console.error("Failed to fetch threads:", error);
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(`/api/parent/messages/${conversationId}`);
      if (res.ok) {
        const data: ConversationData = await res.json();
        setMessages(data.data?.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  }, []);

  // Fetch children (for new conversation)
  const fetchChildren = useCallback(async () => {
    try {
      const res = await fetch("/api/parent/children");
      if (res.ok) {
        const data = await res.json();
        setChildren(data.data?.children || []);
      }
    } catch (error) {
      console.error("Failed to fetch children:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    Promise.all([fetchThreads(), fetchChildren()]).finally(() => {
      setIsLoading(false);
    });

    // Set up polling for real-time updates (every 10 seconds)
    pollingRef.current = setInterval(() => {
      if (view === "list") {
        fetchThreads();
      } else if (selectedThread) {
        fetchMessages(selectedThread.conversationId);
        fetchThreads(); // Also update thread list for unread counts
      }
    }, 10000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [view, selectedThread, fetchThreads, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle thread selection
  const handleSelectThread = (thread: MessageThread) => {
    setSelectedThread(thread);
    setView("chat");
    fetchMessages(thread.conversationId);
  };

  // Handle back to list
  const handleBackToList = () => {
    setView("list");
    setSelectedThread(null);
    setMessages([]);
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || isSending) {
      return;
    }

    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      // Optimistically add message to UI
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId: selectedThread.conversationId,
        senderId: "me",
        senderRole: "parent",
        senderName: "You",
        senderImage: null,
        content: messageContent,
        attachmentUrl: null,
        attachmentType: null,
        attachmentName: null,
        readAt: null,
        createdAt: new Date().toISOString(),
        isEdited: false,
        isFromMe: true,
      };
      setMessages((prev) => [...prev, optimisticMessage]);

      const res = await fetch("/api/parent/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedThread.teacherId,
          studentId: selectedThread.studentId,
          content: messageContent,
        }),
      });

      if (!res.ok) {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
        throw new Error("Failed to send message");
      }

      // Refresh messages to get the real message
      await fetchMessages(selectedThread.conversationId);
      await fetchThreads();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle keyboard send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Thread List View
  if (view === "list") {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600">
              {threads.length === 0
                ? "No conversations yet"
                : `${threads.length} conversation${threads.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <Button
            onClick={() => setShowNewChat(true)}
            className="gap-2"
            style={{
              background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
            }}
          >
            <MessageSquare className="w-4 h-4" />
            New Message
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
          />
        </div>

        {/* Thread List */}
        <Card>
          <CardContent className="p-0">
            {threads.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-600 mb-4">
                  Start a conversation with your child's teachers
                </p>
                <Button
                  onClick={() => setShowNewChat(true)}
                  style={{
                    background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
                  }}
                >
                  Start a conversation
                </Button>
              </div>
            ) : (
              threads.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isActive={false}
                  onClick={() => handleSelectThread(thread)}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* New Conversation Modal */}
        <NewConversationModal
          isOpen={showNewChat}
          onClose={() => setShowNewChat(false)}
          children={children}
          onSelectStudent={(studentId) => {
            // Navigate to teacher selection for this student
            setShowNewChat(false);
            // For now, we'll need a teacher selection flow
            // This is a simplified version
          }}
        />
      </div>
    );
  }

  // Chat View
  return (
    <div className="max-w-2xl mx-auto">
      {/* Chat Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={handleBackToList}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
            {selectedThread?.teacherName.charAt(0)}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{selectedThread?.teacherName}</h2>
            <p className="text-sm text-gray-500">
              Re: {selectedThread?.studentName}
              {selectedThread?.studentGrade && ` • Class ${selectedThread.studentGrade}`}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Chat Messages */}
      <Card className="mb-4">
        <CardContent className="p-4 h-[500px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} isFromMe={message.isFromMe} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Message Input */}
      <div className="flex items-end gap-2">
        <Button variant="outline" size="icon" className="flex-shrink-0">
          <Paperclip className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="min-h-[44px]"
          />
        </div>
        <Button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || isSending}
          className="flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
          }}
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
