"use client";

/**
 * PARENT COMMUNICATION PAGE
 *
 * Allows parents to:
 * - Send and receive messages from teachers and school administration
 * - View conversation threads with full history
 * - Attach files to messages
 * - See read receipts for sent messages
 * - Manage notification preferences
 * - Search and filter message history
 * - Push notifications for new messages
 *
 * @project Bhutan EduSkill
 * @feat FEAT-008 - Parent Communication
 */


import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ChildSelector, Child } from "@/components/parent/child-selector";
import {
  MessageSquare,
  Send,
  Inbox,
  Paperclip,
  Search,
  Filter,
  Archive,
  Trash2,
  Reply,
  Clock,
  Check,
  CheckCheck,
  Bell,
  AlertCircle,
  X,
  Plus,
  Download,
  MoreVertical,
  Settings,
  Smile,
  Image,
  File,
  RefreshCw,
  Users,
  ChevronLeft,
  User,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string | null;
  content: string;
  messageType: "text" | "image" | "file" | "audio";
  attachments: MessageAttachment[] | null;
  replyTo: string | null;
  isDeleted: boolean;
  isEdited: boolean;
  editedAt: Date | null;
  readBy: Array<{
    userId: string;
    readAt: number;
  }> | null;
  createdAt: Date;
  updatedAt: Date;
  sender: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    type: string;
    email: string;
    profileImage: string | null;
  };
}

interface MessageAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface Conversation {
  id: string;
  schoolId: string | null;
  type: string;
  participants: string[] | null;
  name: string | null;
  description: string | null;
  avatar: string | null;
  createdBy: string | null;
  lastMessageAt: Date | null;
  isArchived: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: Message;
  unreadCount?: number;
  otherParticipants?: Array<{
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    type: string;
    email: string;
    profileImage: string | null;
  }>;
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
  firstName: string;
  lastName: string;
  type: string;
  email: string | null;
  profileImage: string | null;
  subject?: string;
  phone?: string;
  schoolId?: string | null;
}

interface NotificationPreferences {
  emailEnabled: boolean;
  emailMessages: boolean;
  emailAnnouncements: boolean;
  emailAlerts: boolean;
  inAppEnabled: boolean;
  inAppAnnouncements: boolean;
  inAppAlerts: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

type MessageFolder = "inbox" | "sent" | "archived";
type MessageFilter = "all" | "unread" | "starred" | "attachments";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchConversations(
  folder: MessageFolder,
  filter: MessageFilter
): Promise<{ conversations: Conversation[]; total: number }> {
  try {
    const params = new URLSearchParams({
      folder,
      ...(filter === "unread" ? { unreadOnly: "true" } : {}),
    });

    const response = await fetch(`/api/communication/messages?${params}`);
    if (!response.ok) throw new Error("Failed to fetch conversations");
    const data: ApiResponse<{ conversations: Conversation[]; total: number }> = await response.json();
    return data.data || { conversations: [], total: 0 };
  } catch (error) {
    logger.error("Error fetching conversations:", error);
    return { conversations: [], total: 0 };
  }
}

async function fetchMessages(conversationId: string): Promise<{ messages: Message[]; conversation: Conversation }> {
  try {
    const response = await fetch(`/api/communication/messages?conversationId=${conversationId}`);
    if (!response.ok) throw new Error("Failed to fetch messages");
    const data: ApiResponse<{ messages: Message[]; conversation: Conversation }> = await response.json();
    return data.data || { messages: [], conversation: {} as Conversation };
  } catch (error) {
    logger.error("Error fetching messages:", error);
    return { messages: [], conversation: {} as Conversation };
  }
}

async function sendMessage(data: {
  conversationId?: string;
  recipientId?: string;
  subject?: string;
  content: string;
  attachments?: MessageAttachment[];
  replyTo?: string;
}): Promise<{ message: Message; conversationId: string }> {
  try {
    const response = await fetch("/api/communication/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to send message");
    const result: ApiResponse<{ message: Message; conversationId: string }> = await response.json();
    return result.data!;
  } catch (error) {
    logger.error("Error sending message:", error);
    throw error;
  }
}

async function markMessagesRead(messageIds: string[], conversationId?: string, read: boolean = true): Promise<void> {
  try {
    await fetch("/api/communication/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageIds, conversationId, read }),
    });
  } catch (error) {
    logger.error("Error marking messages:", error);
  }
}

async function deleteMessage(messageId: string): Promise<void> {
  try {
    await fetch(`/api/communication/messages?messageId=${messageId}`, {
      method: "DELETE",
    });
  } catch (error) {
    logger.error("Error deleting message:", error);
  }
}

async function archiveConversation(conversationId: string): Promise<void> {
  try {
    await fetch(`/api/communication/messages?conversationId=${conversationId}`, {
      method: "DELETE",
    });
  } catch (error) {
    logger.error("Error archiving conversation:", error);
  }
}

async function fetchChildren(): Promise<Child[]> {
  try {
    const response = await fetch("/api/parent/children");
    if (!response.ok) return [];
    const data = await response.json();
    return data.children || [];
  } catch (error) {
    logger.error("Error fetching children:", error);
    return [];
  }
}

async function fetchContacts(search?: string, type?: string): Promise<TeacherContact[]> {
  try {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type) params.set("type", type);

    const response = await fetch(`/api/parent/contacts?${params}`);
    if (!response.ok) return [];
    const data: ApiResponse<{ contacts: TeacherContact[] }> = await response.json();
    return data.data?.contacts || [];
  } catch (error) {
    logger.error("Error fetching contacts:", error);
    return [];
  }
}

async function fetchAnnouncements(): Promise<Announcement[]> {
  try {
    const response = await fetch("/api/announcements");
    if (!response.ok) return [];
    const data = await response.json();
    return data.data || data.announcements || [];
  } catch (error) {
    logger.error("Error fetching announcements:", error);
    return [];
  }
}

async function uploadFile(file: File): Promise<MessageAttachment | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", "message");

    const response = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to upload file");
    const data: ApiResponse<{ file: { originalName: string; url: string; mimeType: string; size: number } }> = await response.json();
    return {
      name: data.data!.file.originalName,
      url: data.data!.file.url,
      type: data.data!.file.mimeType,
      size: data.data!.file.size,
    };
  } catch (error) {
    logger.error("Error uploading file:", error);
    return null;
  }
}

async function fetchNotificationPreferences(): Promise<NotificationPreferences | null> {
  try {
    const response = await fetch("/api/student/settings");
    if (!response.ok) return null;
    const data = await response.json();
    return data.data?.notifications || null;
  } catch (error) {
    logger.error("Error fetching notification preferences:", error);
    return null;
  }
}

async function updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
  try {
    await fetch("/api/student/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });
  } catch (error) {
    logger.error("Error updating notification preferences:", error);
  }
}

// Request push notification permission
async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

// Send a push notification (for new messages)
function sendPushNotification(title: string, body: string, icon?: string): void {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
    });
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function formatFullTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(type: string): React.ReactNode {
  if (type.startsWith("image/")) return <Image className="w-4 h-4" />;
  if (type.startsWith("video/")) return <File className="w-4 h-4" />;
  if (type.includes("pdf")) return <File className="w-4 h-4 text-red-500" />;
  return <File className="w-4 h-4" />;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleBadge(role: string): React.ReactNode {
  const config: Record<string, { label: string; color: string }> = {
    teacher: { label: "Teacher", color: "bg-blue-100 text-blue-700" },
    admin: { label: "Admin", color: "bg-purple-100 text-purple-700" },
    "school-admin": { label: "School Admin", color: "bg-indigo-100 text-indigo-700" },
    counselor: { label: "Counselor", color: "bg-green-100 text-green-700" },
    parent: { label: "Parent", color: "bg-gray-100 text-gray-700" },
  };
  const { label, color } = config[role] || { label: role, color: "bg-gray-100 text-gray-700" };
  return <Badge className={cn("text-xs", color)}>{label}</Badge>;
}

function getCategoryBadge(category: string): React.ReactNode {
  const config: Record<string, { label: string; color: string }> = {
    general: { label: "General", color: "bg-gray-100 text-gray-700" },
    urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
    event: { label: "Event", color: "bg-blue-100 text-blue-700" },
    holiday: { label: "Holiday", color: "bg-green-100 text-green-700" },
    exam: { label: "Exam", color: "bg-orange-100 text-orange-700" },
  };
  const { label, color } = config[category] || { label: category, color: "bg-gray-100 text-gray-700" };
  return <Badge className={cn("text-xs", color)}>{label}</Badge>;
}

// ============================================================================
// MESSAGE THREADED VIEW COMPONENT
// ============================================================================

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  conversation: Conversation | null;
  onReply: (message: Message) => void;
  onDelete: (messageId: string) => void;
  isOwnMessage: (senderId: string) => boolean;
}

function MessageThread({ messages, currentUserId, conversation, onReply, onDelete, isOwnMessage }: MessageThreadProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [expandedMessage, setExpandedMessage] = React.useState<string | null>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups: Record<string, Message[]> = {};
    messages.forEach((msg) => {
      const dateKey = new Date(msg.createdAt).toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
    });
    return groups;
  }, [messages]);

  // Get read status for a message
  const getReadStatus = (msg: Message): { isRead: boolean; readBy: string[] } => {
    if (!isOwnMessage(msg.senderId)) return { isRead: false, readBy: [] };

    const participants = conversation?.participants || [];
    const otherParticipants = participants.filter((p) => p !== currentUserId);
    const readByOther = msg.readBy?.filter((r) => otherParticipants.includes(r.userId)) || [];

    return {
      isRead: readByOther.length >= otherParticipants.length,
      readBy: readByOther.map((r) => r.userId),
    };
  };

  // Find replied message
  const findRepliedMessage = (replyToId: string): Message | undefined => {
    return messages.find((m) => m.id === replyToId);
  };

  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No messages yet</p>
        <p className="text-sm mt-1">Start the conversation by sending a message</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
        <div key={dateKey}>
          {/* Date divider */}
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-500 font-medium">
              {new Date(dateKey).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Messages for this date */}
          <div className="space-y-4">
            {dateMessages.map((msg) => {
              const isOwn = isOwnMessage(msg.senderId);
              const readStatus = getReadStatus(msg);
              const repliedMessage = msg.replyTo ? findRepliedMessage(msg.replyTo) : null;
              const isExpanded = expandedMessage === msg.id;

              return (
                <div key={msg.id} className={cn("flex gap-3", isOwn ? "flex-row-reverse" : "flex-row")}>
                  {/* Avatar */}
                  <Avatar size="sm" className="flex-shrink-0">
                    <AvatarImage src={msg.sender.profileImage || undefined} alt={msg.sender.name} />
                    <AvatarFallback
                      className={cn(
                        "text-white text-xs font-semibold",
                        isOwn ? "bg-gray-700" : ""
                      )}
                      style={
                        !isOwn ? { background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" } : {}
                      }
                    >
                      {getInitials(msg.sender.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message Content */}
                  <div className={cn("max-w-[75%] flex flex-col", isOwn ? "items-end" : "items-start")}>
                    {/* Sender Name (for received messages) */}
                    {!isOwn && (
                      <p className="text-xs font-medium text-gray-600 mb-1 ml-1">{msg.sender.name}</p>
                    )}

                    {/* Message Bubble */}
                    <div>
                      {/* Quoted/Replied Message */}
                      {repliedMessage && (
                        <div
                          className={cn(
                            "text-xs p-2 rounded-t-lg border-l-2 mb-1 max-w-[300px] opacity-75",
                            isOwn
                              ? "bg-gray-800 border-gray-600 text-gray-300 rounded-bl-lg"
                              : "bg-gray-100 border-gray-300 text-gray-600 rounded-br-lg"
                          )}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <Reply className="w-3 h-3" />
                            <span className="font-medium">{repliedMessage.sender.name}</span>
                          </div>
                          <p className="truncate">{repliedMessage.content}</p>
                        </div>
                      )}

                      {/* Main Message */}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3",
                          isOwn
                            ? "bg-gray-800 text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-900 rounded-bl-sm"
                        )}
                      >
                        {/* Content */}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {msg.attachments.map((att, i) => (
                              <a
                                key={i}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "flex items-center gap-3 p-2 rounded-lg text-sm transition-colors",
                                  isOwn ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-50 border border-gray-200"
                                )}
                              >
                                <div className="p-2 rounded bg-gray-200/50">{getFileIcon(att.type)}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{att.name}</p>
                                  <p className="text-xs opacity-70">{formatFileSize(att.size)}</p>
                                </div>
                                <Download className="w-4 h-4 flex-shrink-0" />
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Edited indicator */}
                        {msg.isEdited && msg.editedAt && (
                          <p className="text-xs opacity-60 mt-1">Edited {formatTimestamp(msg.editedAt)}</p>
                        )}
                      </div>
                    </div>

                    {/* Message Metadata */}
                    <div className={cn("flex items-center gap-2 mt-1 text-xs text-gray-500 px-1", isOwn ? "justify-end" : "justify-start")}>
                      <span className="flex items-center gap-1" title={formatFullTimestamp(msg.createdAt)}>
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(msg.createdAt)}
                      </span>

                      {/* Read Receipts (for sent messages) */}
                      {isOwn && conversation?.participants && conversation.participants.length > 1 && (
                        <button
                          className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                          onClick={() => setExpandedMessage(expandedMessage === msg.id ? null : msg.id)}
                          title={`Read by ${readStatus.readBy.length} of ${conversation.participants.length - 1}`}
                        >
                          {readStatus.isRead ? (
                            <CheckCheck className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Check className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-xs">{readStatus.readBy.length}</span>
                        </button>
                      )}

                      {/* Reply Button */}
                      <button
                        onClick={() => onReply(msg)}
                        className="hover:text-gray-700 transition-colors"
                        title="Reply to message"
                      >
                        <Reply className="w-3 h-3" />
                      </button>

                      {/* Delete Button (for own messages) */}
                      {isOwn && (
                        <button
                          onClick={() => onDelete(msg.id)}
                          className="hover:text-red-500 transition-colors"
                          title="Delete message"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Read Receipt Details (expanded) */}
                    {isExpanded && isOwn && (
                      <div
                        className={cn(
                          "mt-2 p-2 rounded-lg text-xs",
                          isOwn ? "bg-gray-100 text-gray-700" : "bg-gray-50 text-gray-600"
                        )}
                      >
                        <p className="font-medium mb-1">Read by:</p>
                        {readStatus.readBy.length === 0 ? (
                          <p className="opacity-70">Not yet read</p>
                        ) : (
                          <ul className="space-y-1">
                            {conversation?.otherParticipants?.map((p) => {
                              const hasRead = readStatus.readBy.includes(p.id);
                              const readAt = msg.readBy?.find((r) => r.userId === p.id)?.readAt;
                              return (
                                <li key={p.id} className="flex items-center gap-2">
                                  {hasRead ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-gray-400" />
                                  )}
                                  <span>{p.name}</span>
                                  {readAt && (
                                    <span className="opacity-60">
                                      {formatTimestamp(new Date(readAt))}
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ParentCommunicationPage() {
  // State
  const [children, setChildren] = React.useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = React.useState<Child | null>(null);
  const [activeTab, setActiveTab] = React.useState<"inbox" | "sent" | "archived" | "announcements" | "settings">("inbox");
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [notificationPrefs, setNotificationPrefs] = React.useState<NotificationPreferences | null>(null);
  const [contacts, setContacts] = React.useState<TeacherContact[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<string>("");
  const [notificationPermission, setNotificationPermission] = React.useState<NotificationPermission | "not-supported">("default");

  // UI State
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<MessageFilter>("all");
  const [showCompose, setShowCompose] = React.useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [replyTo, setReplyTo] = React.useState<Message | null>(null);
  const [messageHistoryOffset, setMessageHistoryOffset] = React.useState(0);
  const [hasMoreHistory, setHasMoreHistory] = React.useState(true);
  const [composeData, setComposeData] = React.useState({
    recipientId: "",
    subject: "",
    content: "",
    attachments: [] as MessageAttachment[],
  });

  // Polling for new messages
  const [isPolling, setIsPolling] = React.useState(false);
  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize notification permission
  React.useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission("not-supported");
    }
  }, []);

  // Fetch current user ID on mount
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.user?.id || "");
        }
      } catch (error) {
        logger.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch children on mount
  React.useEffect(() => {
    fetchChildren().then(setChildren);
  }, []);

  // Set initial selected child
  React.useEffect(() => {
    if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0]);
    }
  }, [children, selectedChild]);

  // Fetch contacts on mount
  React.useEffect(() => {
    fetchContacts().then(setContacts);
  }, []);

  // Fetch conversations when tab or filter changes
  React.useEffect(() => {
    if (activeTab !== "announcements" && activeTab !== "settings") {
      setIsLoading(true);
      const folder = activeTab === "archived" ? "archived" : activeTab;
      fetchConversations(folder, filterStatus).then((data) => {
        setConversations(data.conversations);
        setIsLoading(false);
      });
    }
  }, [activeTab, filterStatus]);

  // Fetch announcements when announcements tab is active
  React.useEffect(() => {
    if (activeTab === "announcements") {
      fetchAnnouncements().then(setAnnouncements);
    }
  }, [activeTab]);

  // Fetch messages when conversation is selected
  React.useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id).then((data) => {
        setMessages(data.messages);
        // Mark messages as read
        const unreadIds = data.messages
          .filter((m) => m.senderId !== currentUserId && !m.readBy?.some((r) => r.userId === currentUserId))
          .map((m) => m.id);
        if (unreadIds.length > 0) {
          markMessagesRead(unreadIds, selectedConversation.id, true);
        }
      });
      // Reset message history
      setMessageHistoryOffset(0);
      setHasMoreHistory(true);
    }
  }, [selectedConversation, currentUserId]);

  // Fetch notification preferences when settings tab is active
  React.useEffect(() => {
    if (activeTab === "settings") {
      fetchNotificationPreferences().then(setNotificationPrefs);
    }
  }, [activeTab]);

  // Setup polling for new messages
  React.useEffect(() => {
    if (selectedConversation && !isPolling) {
      setIsPolling(true);
      pollingIntervalRef.current = setInterval(async () => {
        const data = await fetchMessages(selectedConversation.id);
        const newMessages = data.messages.filter(
          (m) => !messages.find((existing) => existing.id === m.id)
        );

        if (newMessages.length > 0) {
          setMessages(data.messages);

          // Send push notification for new messages
          if (newMessages.some((m) => m.senderId !== currentUserId)) {
            const latestNew = newMessages[newMessages.length - 1];
            if (latestNew.senderId !== currentUserId) {
              sendPushNotification(
                `New message from ${latestNew.sender.name}`,
                latestNew.content.slice(0, 100) + (latestNew.content.length > 100 ? "..." : "")
              );
            }
          }
        }
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        setIsPolling(false);
      }
    };
  }, [selectedConversation, currentUserId, messages, isPolling]);

  // Filter conversations by search query
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const otherName = c.otherParticipants?.[0]?.name?.toLowerCase() || "";
      const lastMessage = c.lastMessage?.content?.toLowerCase() || "";
      return otherName.includes(query) || lastMessage.includes(query);
    });
  }, [conversations, searchQuery]);

  // Calculate unread count
  const unreadCount = React.useMemo(() => {
    return conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }, [conversations]);

  // Get current folder for API calls
  const getCurrentFolder = (): MessageFolder => {
    if (activeTab === "archived") return "archived";
    if (activeTab === "sent") return "sent";
    return "inbox";
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!composeData.content.trim()) return;

    setIsSending(true);
    try {
      if (replyTo) {
        // Send reply
        await sendMessage({
          conversationId: replyTo.conversationId,
          content: composeData.content,
          attachments: composeData.attachments,
          replyTo: replyTo.id,
        });
        // Refresh messages
        const data = await fetchMessages(replyTo.conversationId);
        setMessages(data.messages);
        setReplyTo(null);
      } else if (selectedConversation) {
        // Send to current conversation
        await sendMessage({
          conversationId: selectedConversation.id,
          content: composeData.content,
          attachments: composeData.attachments,
        });
        const data = await fetchMessages(selectedConversation.id);
        setMessages(data.messages);
      } else {
        // Start new conversation
        const result = await sendMessage({
          recipientId: composeData.recipientId,
          subject: composeData.subject,
          content: composeData.content,
          attachments: composeData.attachments,
        });

        // Refresh conversations list
        const folder = getCurrentFolder();
        const convData = await fetchConversations(folder, filterStatus);
        setConversations(convData.conversations);

        // Select the new conversation
        const newConv = convData.conversations.find((c) => c.id === result.conversationId);
        if (newConv) {
          setSelectedConversation(newConv);
          const msgData = await fetchMessages(newConv.id);
          setMessages(msgData.messages);
        }
      }

      // Reset form
      setComposeData({ recipientId: "", subject: "", content: "", attachments: [] });
      setShowCompose(false);
    } catch (error) {
      logger.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle file attachment
  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsLoading(true);
    const uploaded = await uploadFile(file);
    setIsLoading(false);

    if (uploaded) {
      setComposeData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, uploaded],
      }));
    }
  };

  // Handle removing attachment
  const handleRemoveAttachment = (index: number) => {
    setComposeData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  // Handle notification preference toggle
  const handleNotificationToggle = (key: keyof NotificationPreferences, value: boolean | string) => {
    if (!notificationPrefs) return;
    const updated = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(updated);
    updateNotificationPreferences(updated);
  };

  // Handle request notification permission
  const handleRequestNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationPermission("granted");
      sendPushNotification("Notifications Enabled", "You'll receive alerts for new messages");
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setReplyTo(null);
  };

  // Handle reply
  const handleReply = (msg: Message) => {
    setReplyTo(msg);
    setComposeData({
      recipientId: "",
      subject: "",
      content: "",
      attachments: [],
    });

    // Focus on reply input
    setTimeout(() => {
      document.getElementById("message-input")?.focus();
    }, 100);
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      await deleteMessage(messageId);
      if (selectedConversation) {
        const data = await fetchMessages(selectedConversation.id);
        setMessages(data.messages);
      }
    }
  };

  // Handle archive conversation
  const handleArchiveConversation = async (conversationId: string) => {
    await archiveConversation(conversationId);
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setSelectedConversation(null);
    setMessages([]);
  };

  // Handle load more message history
  const handleLoadMoreHistory = async () => {
    if (!selectedConversation || !hasMoreHistory) return;

    setIsLoading(true);
    // This would require API modification to support offset/pagination
    // For now, we'll just indicate no more history
    setHasMoreHistory(false);
    setIsLoading(false);
  };

  // Get other participant name
  const getOtherParticipantName = (conv: Conversation): string => {
    if (conv.name) return conv.name;
    return conv.otherParticipants?.[0]?.name || "Unknown";
  };

  // Check if message is from current user
  const isOwnMessage = (senderId: string): boolean => {
    return senderId === currentUserId;
  };

  // Filter contacts by search
  const filteredContacts = React.useMemo(() => {
    if (!composeData.recipientId || composeData.recipientId === "") return contacts;
    const query = composeData.recipientId.toLowerCase();
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(query) || c.email?.toLowerCase().includes(query)
    );
  }, [contacts, composeData.recipientId]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Communication</h1>
          <p className="text-gray-600">
            Messages and announcements for {selectedChild?.name || "your children"}
          </p>
        </div>
        <Button
          onClick={() => {
            setComposeData({ recipientId: "", subject: "", content: "", attachments: [] });
            setShowCompose(true);
          }}
          style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Compose
        </Button>
      </div>

      {/* Child Selector */}
      {children.length > 0 && (
        <ChildSelector
          children={children}
          selectedChildId={selectedChild?.id}
          onChildChange={setSelectedChild}
          variant="dropdown"
        />
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 -mb-px overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("inbox");
              setSelectedConversation(null);
            }}
            className={cn(
              "flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors whitespace-nowrap",
              activeTab === "inbox"
                ? "border-gray-600 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Inbox className="w-4 h-4" />
            Inbox
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-700">{unreadCount}</Badge>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("sent");
              setSelectedConversation(null);
            }}
            className={cn(
              "flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors whitespace-nowrap",
              activeTab === "sent"
                ? "border-gray-600 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Send className="w-4 h-4" />
            Sent
          </button>
          <button
            onClick={() => {
              setActiveTab("archived");
              setSelectedConversation(null);
            }}
            className={cn(
              "flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors whitespace-nowrap",
              activeTab === "archived"
                ? "border-gray-600 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Archive className="w-4 h-4" />
            Archived
          </button>
          <button
            onClick={() => setActiveTab("announcements")}
            className={cn(
              "flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors whitespace-nowrap",
              activeTab === "announcements"
                ? "border-gray-600 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Bell className="w-4 h-4" />
            Announcements
            {announcements.filter((a) => a.priority === "high").length > 0 && (
              <Badge className="bg-red-100 text-red-700">
                {announcements.filter((a) => a.priority === "high").length}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors whitespace-nowrap",
              activeTab === "settings"
                ? "border-gray-600 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </nav>
      </div>

      {/* Actions Bar */}
      {activeTab !== "settings" && activeTab !== "announcements" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            {/* Filter */}
            <Select value={filterStatus} onValueChange={(v: MessageFilter) => setFilterStatus(v)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="starred">Starred</SelectItem>
                <SelectItem value="attachments">With Attachments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsLoading(true);
              const folder = getCurrentFolder();
              fetchConversations(folder, filterStatus).then((data) => {
                setConversations(data.conversations);
                setIsLoading(false);
              });
            }}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      )}

      {/* ============================================================================
          INBOX / SENT / ARCHIVED TABS
      ============================================================================ */}
      {(activeTab === "inbox" || activeTab === "sent" || activeTab === "archived") && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <div className="lg:col-span-1 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg border bg-gray-50 animate-pulse h-24" />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No messages found</p>
                  <p className="text-sm mt-1">Try changing your filters or compose a new message</p>
                </CardContent>
              </Card>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all",
                    selectedConversation?.id === conv.id
                      ? "border-gray-500 bg-gray-50"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <Avatar size="sm">
                      <AvatarImage src={conv.otherParticipants?.[0]?.profileImage || undefined} />
                      <AvatarFallback
                        className={cn(
                          "text-white text-xs font-semibold",
                          (conv.unreadCount || 0) > 0 ? "" : "bg-gray-300"
                        )}
                        style={
                          (conv.unreadCount || 0) > 0
                            ? { background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }
                            : {}
                        }
                      >
                        {getInitials(getOtherParticipantName(conv))}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p
                          className={cn(
                            "font-medium truncate",
                            (conv.unreadCount || 0) > 0 ? "text-gray-900" : "text-gray-600"
                          )}
                        >
                          {getOtherParticipantName(conv)}
                        </p>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {conv.lastMessageAt && formatTimestamp(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-sm truncate",
                          (conv.unreadCount || 0) > 0 ? "font-medium text-gray-800" : "text-gray-600"
                        )}
                      >
                        {conv.lastMessage?.content || "No messages yet"}
                      </p>

                      {/* Badges and metadata */}
                      <div className="flex items-center gap-2 mt-2">
                        {conv.otherParticipants?.[0]?.type && getRoleBadge(conv.otherParticipants[0].type)}
                        {conv.lastMessage?.attachments && conv.lastMessage.attachments.length > 0 && (
                          <Paperclip className="w-3 h-3 text-gray-400" />
                        )}
                        {(conv.unreadCount || 0) > 0 && (
                          <Badge className="bg-red-100 text-red-700 text-xs">
                            {conv.unreadCount} unread
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="h-full flex flex-col">
                {/* Conversation Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={selectedConversation.otherParticipants?.[0]?.profileImage || undefined} />
                        <AvatarFallback
                          className="text-white font-semibold"
                          style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
                        >
                          {getInitials(getOtherParticipantName(selectedConversation))}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{getOtherParticipantName(selectedConversation)}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          {selectedConversation.otherParticipants?.[0]?.type &&
                            getRoleBadge(selectedConversation.otherParticipants[0].type)}
                          {selectedConversation.otherParticipants?.[0]?.email && (
                            <span className="text-xs">{selectedConversation.otherParticipants[0].email}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleArchiveConversation(selectedConversation.id)}>
                          <Archive className="w-4 h-4 mr-2" />
                          Archive Conversation
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this conversation?")) {
                              handleArchiveConversation(selectedConversation.id);
                            }
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Conversation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                {/* Messages - Threaded View */}
                <CardContent className="flex-1 overflow-y-auto p-4 min-h-[400px]">
                  {/* Load More History Button */}
                  {messageHistoryOffset > 0 && hasMoreHistory && (
                    <div className="text-center mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLoadMoreHistory}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ChevronLeft className="w-4 h-4 mr-2" />
                        )}
                        Load More Messages
                      </Button>
                    </div>
                  )}

                  <MessageThread
                    messages={messages}
                    currentUserId={currentUserId}
                    conversation={selectedConversation}
                    onReply={handleReply}
                    onDelete={handleDeleteMessage}
                    isOwnMessage={isOwnMessage}
                  />
                </CardContent>

                {/* Reply Box */}
                <div className="border-t p-4">
                  {replyTo && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Reply className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 truncate">
                          Replying to {replyTo.sender.name}: {replyTo.content.slice(0, 50)}...
                        </span>
                      </div>
                      <button
                        onClick={() => setReplyTo(null)}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="space-y-3">
                    <Textarea
                      id="message-input"
                      placeholder="Type your message..."
                      value={composeData.content}
                      onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                      rows={3}
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />

                    {/* Attachments Preview */}
                    {composeData.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {composeData.attachments.map((att, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
                          >
                            <span className="flex items-center gap-1.5">
                              {getFileIcon(att.type)}
                              <span className="max-w-[150px] truncate">{att.name}</span>
                              <span className="text-gray-400">({formatFileSize(att.size)})</span>
                            </span>
                            <button
                              onClick={() => handleRemoveAttachment(i)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label htmlFor="reply-file-upload" className="cursor-pointer">
                          <Button variant="ghost" size="sm" asChild disabled={isLoading}>
                            <span>
                              <Paperclip className="w-4 h-4 mr-2" />
                              Attach
                            </span>
                          </Button>
                          <input
                            id="reply-file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFileAttach}
                            disabled={isLoading}
                          />
                        </label>
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!composeData.content.trim() || isSending}
                        style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
                      >
                        {isSending ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500">
                    Choose a conversation from the list to view messages
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ============================================================================
          ANNOUNCEMENTS TAB
      ============================================================================ */}
      {activeTab === "announcements" && (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
                <p className="text-gray-500">
                  Check back later for school announcements and updates
                </p>
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => (
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
                  <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                  {announcement.expiryDate && (
                    <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Expires: {new Date(announcement.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ============================================================================
          NOTIFICATION SETTINGS TAB
      ============================================================================ */}
      {activeTab === "settings" && notificationPrefs && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Manage how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Push Notifications */}
            <div>
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Push Notifications
              </h3>
              <div className="space-y-4">
                {notificationPermission === "not-supported" ? (
                  <p className="text-sm text-gray-500">
                    Push notifications are not supported in your browser.
                  </p>
                ) : notificationPermission === "denied" ? (
                  <p className="text-sm text-red-600">
                    Push notifications are blocked. Please enable them in your browser settings.
                  </p>
                ) : notificationPermission === "default" ? (
                  <Button
                    variant="outline"
                    onClick={handleRequestNotificationPermission}
                    className="w-full sm:w-auto"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Enable Push Notifications
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Push notifications are enabled</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Email Notifications */}
            <div>
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Notifications
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.emailEnabled}
                    onCheckedChange={(checked) => handleNotificationToggle("emailEnabled", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Messages</p>
                    <p className="text-sm text-gray-500">New messages from teachers</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.emailMessages}
                    onCheckedChange={(checked) => handleNotificationToggle("emailMessages", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Announcements</p>
                    <p className="text-sm text-gray-500">School announcements and updates</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.emailAnnouncements}
                    onCheckedChange={(checked) => handleNotificationToggle("emailAnnouncements", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alerts</p>
                    <p className="text-sm text-gray-500">Important alerts and reminders</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.emailAlerts}
                    onCheckedChange={(checked) => handleNotificationToggle("emailAlerts", checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* In-App Notifications */}
            <div>
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                In-App Notifications
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-500">Show notifications in the app</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.inAppEnabled}
                    onCheckedChange={(checked) => handleNotificationToggle("inAppEnabled", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Announcements</p>
                    <p className="text-sm text-gray-500">School announcements</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.inAppAnnouncements}
                    onCheckedChange={(checked) => handleNotificationToggle("inAppAnnouncements", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alerts</p>
                    <p className="text-sm text-gray-500">Important alerts</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.inAppAlerts}
                    onCheckedChange={(checked) => handleNotificationToggle("inAppAlerts", checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Quiet Hours */}
            <div>
              <h3 className="font-medium mb-4">Quiet Hours</h3>
              <p className="text-sm text-gray-500 mb-4">
                Disable notifications during these hours
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <Input
                    type="time"
                    value={notificationPrefs.quietHoursStart}
                    onChange={(e) => handleNotificationToggle("quietHoursStart", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <Input
                    type="time"
                    value={notificationPrefs.quietHoursEnd}
                    onChange={(e) => handleNotificationToggle("quietHoursEnd", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================================
          COMPOSE MESSAGE DIALOG
      ============================================================================ */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>
              Send a message to a teacher or school administrator
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <Select
                value={composeData.recipientId}
                onValueChange={(value) => setComposeData({ ...composeData, recipientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No contacts available</div>
                  ) : (
                    contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        <div className="flex items-center gap-2">
                          <span>{contact.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {contact.type}
                          </Badge>
                          {contact.subject && (
                            <span className="text-xs text-gray-500">({contact.subject})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <Input
                placeholder="Enter subject..."
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <Textarea
                rows={6}
                placeholder="Type your message..."
                value={composeData.content}
                onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Attachments</label>
              <div className="flex items-center gap-2">
                <label htmlFor="compose-file-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild disabled={isLoading}>
                    <span>
                      <Paperclip className="w-4 h-4 mr-2" />
                      Attach File
                    </span>
                  </Button>
                  <input
                    id="compose-file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileAttach}
                    disabled={isLoading}
                  />
                </label>
                <span className="text-sm text-gray-500">
                  {composeData.attachments.length} file(s) attached
                </span>
              </div>
              {composeData.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {composeData.attachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded text-sm"
                    >
                      {getFileIcon(att.type)}
                      <span className="max-w-[150px] truncate">{att.name}</span>
                      <span className="text-gray-400">({formatFileSize(att.size)})</span>
                      <button
                        onClick={() => handleRemoveAttachment(i)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCompose(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!composeData.content.trim() || !composeData.recipientId || isSending}
                style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
              >
                {isSending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Back Link */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/parent">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Parent Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
