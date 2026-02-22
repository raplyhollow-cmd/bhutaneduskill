"use client";

/**
 * AI CHAT SIDEBAR - Right sidebar that pushes content
 *
 * This is a Facebook Messenger style sidebar that:
 * - Slides in from the right
 * - Pushes existing content to the left (no overlay on desktop)
 * - Contains the AI chat interface
 * - Toggle button to open/close
 */

import { useState, useRef, useEffect } from "react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Send,
  X,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export interface PlatformAssistantProps {
  userId?: string;
  userName?: string;
  userRole?: "student" | "teacher" | "parent" | "counselor" | "school-admin" | "admin" | "ministry";
  embedded?: boolean;
  initialMessage?: string;
  onMessageSent?: (message: string) => void;
  className?: string;
}

// Role configurations
const ROLE_CONFIG = {
  student: {
    name: "Student",
    gradient: "linear-gradient(135deg, #0084FF 0%, #0056D6 100%)",
    welcome: (name: string) => `Hi ${name}! 👋\n\nI'm your AI Learning Assistant. I can help you with:\n\n• Career exploration and guidance\n• Study tips and learning strategies\n• Homework and assignment help\n• College and program exploration\n\nWhat would you like to explore?`,
    suggestions: [
      "What careers suit me?",
      "How do I improve my grades?",
      "Show me RUB programs",
      "Study tips for exams",
    ],
  },
  teacher: {
    name: "Teacher",
    gradient: "linear-gradient(135deg, #0084FF 0%, #0056D6 100%)",
    welcome: (name: string) => `Hi ${name}! 👋\n\nI'm your AI Teaching Assistant. I can help you with:\n\n• Class management tips\n• Teaching strategies\n• Student assessment insights\n• Homework assignment help\n\nHow can I assist you today?`,
    suggestions: [
      "How do I create homework?",
      "View class performance",
      "Teaching strategies",
      "Student insights",
    ],
  },
  parent: {
    name: "Parent",
    gradient: "linear-gradient(135deg, #0084FF 0%, #0056D6 100%)",
    welcome: (name: string) => `Hi ${name}! 👋\n\nI'm your AI Parent Assistant. I can help you with:\n\n• Your child's progress\n• Fee payment guidance\n• Teacher communication\n• Education support\n\nHow can I help you today?`,
    suggestions: [
      "How is my child doing?",
      "Pay fees online",
      "View homework",
      "Contact teacher",
    ],
  },
  counselor: {
    name: "Counselor",
    gradient: "linear-gradient(135deg, #0084FF 0%, #0056D6 100%)",
    welcome: (name: string) => `Hi ${name}! 👋\n\nI'm your AI Counseling Assistant. I can help you with:\n\n• Student career guidance\n• Assessment interpretation\n• Intervention planning\n• Student wellness support\n\nHow can I assist you today?`,
    suggestions: [
      "Interpret assessments",
      "Career planning",
      "Student wellness",
      "Session prep",
    ],
  },
  "school-admin": {
    name: "School Admin",
    gradient: "linear-gradient(135deg, #0084FF 0%, #0056D6 100%)",
    welcome: (name: string) => `Hi ${name}! 👋\n\nI'm your AI School Admin Assistant. I can help you with:\n\n• School management\n• Staff coordination\n• Student enrollment\n• Reports and analytics\n\nHow can I assist you today?`,
    suggestions: [
      "Add new student",
      "Teacher performance",
      "Attendance report",
      "Fee structure",
    ],
  },
  admin: {
    name: "Platform Admin",
    gradient: "linear-gradient(135deg, #E1306C 0%, #C13584 100%)",
    welcome: (name: string) => `Hi ${name}! 👋\n\nI'm your Platform Assistant. I can help you with:\n\n• System documentation\n• API guidance\n• Database queries\n• Code examples\n• System status\n\nWhat can I help you with?`,
    suggestions: [
      "Where is user auth?",
      "How do I add an API?",
      "Database schema?",
      "System status",
    ],
  },
  ministry: {
    name: "Ministry",
    gradient: "linear-gradient(135deg, #0084FF 0%, #0056D6 100%)",
    welcome: (name: string) => `Hi ${name}! 👋\n\nI'm your AI Ministry Assistant. I can help you with:\n\n• National analytics\n• School monitoring\n• Policy guidance\n• Compliance tracking\n\nHow can I assist you today?`,
    suggestions: [
      "National analytics",
      "School performance",
      "Create policy",
      "Compliance status",
    ],
  },
} as const;

export function PlatformAssistant({
  userId,
  userName = "User",
  userRole = "student",
  embedded = false,
  initialMessage,
  onMessageSent,
  className,
}: PlatformAssistantProps) {
  const roleConfig = ROLE_CONFIG[userRole] || ROLE_CONFIG.student;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: roleConfig.welcome(userName),
      timestamp: new Date(),
      suggestions: [...roleConfig.suggestions],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when sidebar opens
  useEffect(() => {
    if (sidebarOpen) {
      inputRef.current?.focus();
    }
  }, [sidebarOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialMessage && !embedded && sidebarOpen) {
      handleSend(initialMessage);
    }
  }, [initialMessage, sidebarOpen]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSend(overrideInput?: string) {
    const messageToSend = overrideInput || input;
    if (!messageToSend.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Notify parent
    onMessageSent?.(messageToSend);

    try {
      const currentPage = window.location.pathname;

      const response = await fetch("/api/ai/platform-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          currentPage,
          conversationHistory: messages.slice(-5),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const responseData = data.data || data;
      const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: responseData.message || "Sorry, I couldn't generate a response.",
        timestamp: new Date(),
        suggestions: responseData.suggestions,
      };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      // Fallback response
      const fallbackMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: getFallbackResponse(messageToSend, userRole),
        timestamp: new Date(),
        suggestions: [...roleConfig.suggestions],
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <ErrorBoundary>
      {/* Chat toggle button - Bottom right */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={cn("fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center", className)}
          style={{ background: roleConfig.gradient }}
          aria-label="Open AI assistant"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
        </button>
      )}

      {/* Sidebar that slides in from right - Higher z-index than slide-in forms */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full bg-white shadow-2xl z-[60] transition-transform duration-300 ease-in-out border-l border-gray-200",
          sidebarOpen ? "translate-x-0" : "translate-x-full",
          "w-full md:w-96 lg:w-[420px] flex flex-col"
        )}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-4 text-white shrink-0"
          style={{ background: roleConfig.gradient }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
            </div>
            <div>
              <p className="font-semibold text-sm">
                {userRole === "admin" ? "Platform Assistant" : `${roleConfig.name} Assistant`}
              </p>
              <p className="text-xs text-white/80">Online • Active now</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3 min-h-0">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 bg-white border-t border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 h-10 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ background: input.trim() ? roleConfig.gradient : "#E4E6EB" }}
            >
              <Send className="w-4 h-4" style={{ color: input.trim() ? "white" : "#65676B" }} />
            </button>
          </div>

          {/* Quick suggestions */}
          {messages[messages.length - 1]?.role === "assistant" &&
           messages[messages.length - 1]?.suggestions &&
           messages[messages.length - 1]?.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {messages[messages.length - 1].suggestions!.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(suggestion)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs hover:bg-blue-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for mobile only */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[55] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </ErrorBoundary>
  );
}

/**
 * Facebook Messenger style message bubble
 */
interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
    <div className={cn("flex gap-2 max-w-[85%]", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-blue-600" />
        </div>
      )}
      <div className={cn("rounded-2xl px-4 py-2.5", isUser ? "bg-blue-500 text-white rounded-br-sm" : "bg-white text-gray-800 rounded-bl-sm shadow-sm")}>
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <span className={cn("text-[10px] mt-1 block", isUser ? "text-blue-200" : "text-gray-400")}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  </div>
  );
}

/**
 * Fallback response generator
 */
function getFallbackResponse(query: string, role: string): string {
  const lowerQuery = query.toLowerCase();

  if (role === "student") {
    if (lowerQuery.includes("career") || lowerQuery.includes("become")) {
      return "I'd love to help you find the right career! Take our career assessments like RIASEC to get personalized recommendations based on your personality and interests.\n\nWould you like to know more about available careers?";
    }
    if (lowerQuery.includes("study") || lowerQuery.includes("homework")) {
      return "Here are some effective study tips:\n\n1. Create a consistent study schedule\n2. Break topics into smaller chunks\n3. Use active recall - test yourself\n4. Take short breaks every 25-30 minutes\n5. Get enough sleep\n\nWant specific tips for a subject?";
    }
    if (lowerQuery.includes("rub") || lowerQuery.includes("college")) {
      return "Royal University of Bhutan offers many programs! Explore colleges and programs in the RUB section. Consider your interests and career goals when choosing.\n\nWhat field interests you?";
    }
  }

  if (role === "teacher") {
    if (lowerQuery.includes("homework")) {
      return "To create homework:\n\n1. Go to Dashboard → Homework\n2. Click 'Create Assignment'\n3. Add title, description, due date\n4. Select class/section\n5. Click 'Assign'\n\nNeed help with anything else?";
    }
    if (lowerQuery.includes("student")) {
      return "View student progress by:\n\n1. Go to 'Students' section\n2. Select a student\n3. Check their grades, attendance, assessments\n\nThis helps you understand each student's strengths.";
    }
  }

  if (role === "school-admin") {
    if (lowerQuery.includes("student") || lowerQuery.includes("add")) {
      return "To add a new student:\n\n1. Go to 'Students' section\n2. Click 'Add Student'\n3. Fill in details (name, class, contact)\n4. Set up parent account if needed\n5. Save\n\nThe student will receive login credentials.";
    }
  }

  if (role === "admin") {
    if (lowerQuery.includes("auth")) {
      return "The platform uses Clerk for authentication.\n\nKey files:\n• src/lib/auth-utils.ts - requireAuth() helper\n• src/middleware.ts - CORS and security\n• src/app/api/auth/set-role - Role assignment\n\nPattern:\n```typescript\nconst { userId } = await requireAuth(['admin']);\n```";
    }
    if (lowerQuery.includes("api")) {
      return "Creating API Endpoints:\n\n1. Create file in src/app/api/[feature]/route.ts\n2. Use requireAuth() for auth\n3. Return ApiSuccess<T> or ApiErrorResponse\n\nSee src/app/api/_template for template.";
    }
    if (lowerQuery.includes("schema") || lowerQuery.includes("database")) {
      return "Database Schema:\n\n• Main file: src/lib/db/schema.ts\n• Key tables: users, schools, assessments, careerMatches\n• Use clerkUserId (NOT clerkId) for queries\n• Use schoolId for school linkage";
    }
    if (lowerQuery.includes("status")) {
      return "System Status: ✅ All Operational\n\n• Database: Neon PostgreSQL - Connected\n• Auth: Clerk - Operational\n• API Routes: Active\n• AI Services: Available";
    }
    return "I'm your Platform Assistant! I can help with:\n\n• Authentication & RBAC\n• API development\n• Database queries\n• Code examples\n• System status\n\nWhat do you need help with?";
  }

  return "I'm here to help! Try asking me something specific, or tap one of the suggestion buttons above.";
}
