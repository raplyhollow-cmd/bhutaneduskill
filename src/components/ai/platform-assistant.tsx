"use client";

/**
 * AI PLATFORM ASSISTANT - Role-Aware AI Assistant for All Portal Users
 *
 * This is a role-aware AI assistant that adapts to each user type:
 * - Student: Career guidance, study tips, homework help
 * - Teacher: Class management, teaching strategies, student insights
 * - Parent: Child progress, fee payment, communication
 * - Counselor: Student interventions, career guidance, wellness
 * - School Admin: School management, teacher management, reports
 * - Platform Admin: Technical questions, code locations, system status
 * - Ministry: National analytics, policy guidance, compliance
 *
 * Features:
 * - Role-specific system prompts and responses
 * - Quick action buttons based on user role
 * - Context-aware assistance based on current page
 * - Technical privilege control (non-admins denied technical answers)
 */


import { useState, useRef, useEffect } from "react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  Code2,
  Activity,
  Server,
  Database,
  FileText,
  Settings,
  Zap,
  CheckCircle,
  GraduationCap,
  Users,
  BookOpen,
  HeartPulse,
  Building2,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  codeSnippet?: {
    language: string;
    code: string;
  };
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
    icon: <GraduationCap className="w-4 h-4" />,
    gradient: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
    bgLight: "rgb(255 237 213)",
    textColor: "rgb(194 65 12)",
    welcome: (name: string) => `Hi ${name}! I'm your AI Learning Assistant. I can help you with:\n\n- Career exploration and guidance\n- Study tips and learning strategies\n- Homework and assignment help\n- College and program exploration\n- Skill development advice\n\nWhat would you like to explore today?`,
    suggestions: [
      "What careers suit me?",
      "How do I improve my grades?",
      "Show me RUB programs",
      "Help with study tips",
    ],
    quickActions: [
      { icon: <GraduationCap className="w-3 h-3" />, label: "Careers", message: "What careers suit me based on my interests?" },
      { icon: <BookOpen className="w-3 h-3" />, label: "Study", message: "Give me study tips for better grades" },
      { icon: <Database className="w-3 h-3" />, label: "RUB", message: "Show me RUB colleges and programs" },
      { icon: <Activity className="w-3 h-3" />, label: "Progress", message: "How can I track my academic progress?" },
    ],
  },
  teacher: {
    name: "Teacher",
    icon: <BookOpen className="w-4 h-4" />,
    gradient: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
    bgLight: "rgb(219 234 254)",
    textColor: "rgb(37 99 235)",
    welcome: (name: string) => `Hi ${name}! I'm your AI Teaching Assistant. I can help you with:\n\n- Class management and organization\n- Teaching strategies and methodologies\n- Student assessment interpretation\n- Homework assignment and tracking\n\nHow can I assist you today?`,
    suggestions: [
      "How do I create homework?",
      "View class performance",
      "Teaching strategies",
      "Student assessment insights",
    ],
    quickActions: [
      { icon: <Users className="w-3 h-3" />, label: "Class", message: "How do I manage my class effectively?" },
      { icon: <FileText className="w-3 h-3" />, label: "Homework", message: "Help me create a homework assignment" },
      { icon: <Activity className="w-3 h-3" />, label: "Insights", message: "Give me insights on my students' performance" },
      { icon: <BookOpen className="w-3 h-3" />, label: "Teach", message: "Suggest teaching strategies for my subject" },
    ],
  },
  parent: {
    name: "Parent",
    icon: <Users className="w-4 h-4" />,
    gradient: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)",
    bgLight: "rgb(229 231 235)",
    textColor: "rgb(75 85 99)",
    welcome: (name: string) => `Hi ${name}! I'm your AI Parent Assistant. I can help you with:\n\n- Monitoring your child's progress\n- Fee payment and management\n- Communication with teachers\n- Supporting your child's education\n\nHow can I help you today?`,
    suggestions: [
      "How is my child doing?",
      "Pay fees online",
      "View my child's homework",
      "Contact teacher",
    ],
    quickActions: [
      { icon: <Activity className="w-3 h-3" />, label: "Progress", message: "How is my child doing in school?" },
      { icon: <FileText className="w-3 h-3" />, label: "Fees", message: "How do I pay fees online?" },
      { icon: <BookOpen className="w-3 h-3" />, label: "Homework", message: "Show me my child's homework" },
      { icon: <Users className="w-3 h-3" />, label: "Contact", message: "How do I message the teacher?" },
    ],
  },
  counselor: {
    name: "Counselor",
    icon: <HeartPulse className="w-4 h-4" />,
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    bgLight: "rgb(237 233 254)",
    textColor: "rgb(147 51 234)",
    welcome: (name: string) => `Hi ${name}! I'm your AI Counseling Assistant. I can help you with:\n\n- Student career guidance\n- Assessment interpretation\n- Intervention planning\n- Student wellness support\n\nHow can I assist you today?`,
    suggestions: [
      "Interpret assessment results",
      "Schedule counseling session",
      "Career planning resources",
      "Student wellness check",
    ],
    quickActions: [
      { icon: <FileText className="w-3 h-3" />, label: "Assessments", message: "How do I interpret student assessment results?" },
      { icon: <GraduationCap className="w-3 h-3" />, label: "Career", message: "Help me with career planning for a student" },
      { icon: <HeartPulse className="w-3 h-3" />, label: "Wellness", message: "How can I support student mental health?" },
      { icon: <Users className="w-3 h-3" />, label: "Session", message: "Help me prepare for a counseling session" },
    ],
  },
  "school-admin": {
    name: "School Admin",
    icon: <Building2 className="w-4 h-4" />,
    gradient: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
    bgLight: "rgb(237 233 254)",
    textColor: "rgb(124 58 237)",
    welcome: (name: string) => `Hi ${name}! I'm your AI School Admin Assistant. I can help you with:\n\n- School management and administration\n- Staff management and coordination\n- Student enrollment and records\n- Reports and analytics\n\nHow can I assist you today?`,
    suggestions: [
      "Add new student",
      "View teacher performance",
      "Generate attendance report",
      "Manage fee structure",
    ],
    quickActions: [
      { icon: <Users className="w-3 h-3" />, label: "Students", message: "How do I add a new student?" },
      { icon: <Building2 className="w-3 h-3" />, label: "Teachers", message: "How do I manage teacher assignments?" },
      { icon: <FileText className="w-3 h-3" />, label: "Reports", message: "Generate an attendance report" },
      { icon: <Activity className="w-3 h-3" />, label: "Analytics", message: "Show me school performance analytics" },
    ],
  },
  admin: {
    name: "Platform Admin",
    icon: <Server className="w-4 h-4" />,
    gradient: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
    bgLight: "rgb(252 231 243)",
    textColor: "rgb(219 39 119)",
    welcome: (name: string) => `Hi ${name}! I'm your Platform Assistant. I can help you with:\n\n- System documentation and architecture\n- API endpoint guidance\n- Database schema queries\n- Code snippets and examples\n- System status and monitoring\n\nWhat can I help you with today?`,
    suggestions: [
      "Where is user auth?",
      "How do I add an API?",
      "What's the database schema?",
      "Show system status",
    ],
    quickActions: [
      { icon: <Code2 className="w-3 h-3" />, label: "Code", message: "Show me a code example for API routes" },
      { icon: <Database className="w-3 h-3" />, label: "Schema", message: "What's the database schema structure?" },
      { icon: <Server className="w-3 h-3" />, label: "API", message: "How do I create a new API endpoint?" },
      { icon: <Activity className="w-3 h-3" />, label: "Status", message: "Show system status" },
    ],
  },
  ministry: {
    name: "Ministry",
    icon: <Landmark className="w-4 h-4" />,
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    bgLight: "rgb(237 233 254)",
    textColor: "rgb(147 51 234)",
    welcome: (name: string) => `Hi ${name}! I'm your AI Ministry Assistant. I can help you with:\n\n- National education analytics\n- School performance monitoring\n- Policy development guidance\n- Education compliance tracking\n\nHow can I assist you today?`,
    suggestions: [
      "National assessment trends",
      "School performance overview",
      "Create education policy",
      "View compliance status",
    ],
    quickActions: [
      { icon: <Activity className="w-3 h-3" />, label: "Analytics", message: "Show me national education analytics" },
      { icon: <Building2 className="w-3 h-3" />, label: "Schools", message: "How do I monitor school performance?" },
      { icon: <FileText className="w-3 h-3" />, label: "Policy", message: "Help me create an education policy" },
      { icon: <CheckCircle className="w-3 h-3" />, label: "Compliance", message: "Show compliance status across schools" },
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(embedded);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isMinimized]);

  useEffect(() => {
    if (initialMessage && !embedded) {
      handleSend(initialMessage);
    }
  }, [initialMessage]);

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
      // Get current page for context
      const currentPage = window.location.pathname;

      // Call AI Platform Assistant API
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

      // Add AI response - API returns { data: { message, suggestions, files } }
      const responseData = data.data || data;
      const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: responseData.message || "Sorry, I couldn't generate a response.",
        timestamp: new Date(),
        suggestions: responseData.suggestions,
        codeSnippet: responseData.codeSnippet,
      };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      // Fallback response with helpful guidance
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

  // Floating chat bubble for non-embedded mode
  if (!embedded && !isExpanded) {
    return (
      <ErrorBoundary>
        <div className={cn("relative", className)}>
          <Button
            onClick={() => setIsExpanded(true)}
            size="lg"
            style={{
              background: roleConfig.gradient,
              border: 'none',
              boxShadow: `0 4px 14px ${roleConfig.textColor}40`
            }}
            className="rounded-full h-16 w-16 hover:scale-105 transition-transform animate-pulse-slow shadow-lg"
          >
            <Bot className="w-7 h-7 text-white" />
          </Button>
          <Badge
            className="absolute -top-1 -right-1 text-white px-2 py-0 text-xs shadow-md"
            style={{ backgroundColor: roleConfig.textColor }}
          >
            {roleConfig.name}
          </Badge>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Card
        className={cn(
          "shadow-xl bg-white",
          !embedded && "w-[calc(100vw-2rem)] h-[70dvh] md:w-96 md:max-w-[500px] md:h-[600px] flex flex-col",
          isMinimized && "h-14",
          className
        )}
        style={{ borderColor: roleConfig.textColor }}
      >
        {/* Header */}
        <CardHeader
          className="text-white p-4 space-y-0"
          style={{ background: roleConfig.gradient }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                {roleConfig.icon}
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {userRole === "admin" ? "Platform Assistant" : `${roleConfig.name} Assistant`}
                  <Zap className="w-4 h-4 text-yellow-300" />
                </CardTitle>
                <CardDescription className="text-white/80 text-xs">
                  Online • Ready to help
                </CardDescription>
              </div>
            </div>
            {!embedded && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px] bg-gray-50">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} roleColor={roleConfig.textColor} />
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: roleConfig.bgLight }}
                  >
                    <span style={{ color: roleConfig.textColor }}>{roleConfig.icon}</span>
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms", backgroundColor: roleConfig.textColor }}
                      />
                      <div
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms", backgroundColor: roleConfig.textColor }}
                      />
                      <div
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms", backgroundColor: roleConfig.textColor }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t space-y-3 bg-white">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={getPlaceholder(userRole)}
                  className="flex-1"
                  disabled={isLoading}
                  style={{ borderColor: roleConfig.textColor }}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  style={{ background: roleConfig.gradient }}
                  className="hover:opacity-90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Quick suggestions */}
              {messages[messages.length - 1]?.role === "assistant" &&
               messages[messages.length - 1]?.suggestions &&
               messages[messages.length - 1]?.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {messages[messages.length - 1].suggestions!.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSend(suggestion)}
                      className="text-xs h-7"
                      style={{ borderColor: roleConfig.textColor, color: roleConfig.textColor }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}

              {/* Quick actions always visible - role-based */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {roleConfig.quickActions.map((action, index) => (
                  <QuickActionButton
                    key={index}
                    icon={action.icon}
                    label={action.label}
                    onClick={() => handleSend(action.message)}
                    textColor={roleConfig.textColor}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </Card>
    </ErrorBoundary>
  );
}

/**
 * Get placeholder text based on role
 */
function getPlaceholder(role: string): string {
  const placeholders: Record<string, string> = {
    student: "Ask about careers, studies, homework...",
    teacher: "Ask about class management, teaching...",
    parent: "Ask about your child's progress...",
    counselor: "Ask about student guidance...",
    "school-admin": "Ask about school management...",
    admin: "Ask about the platform...",
    ministry: "Ask about national analytics...",
  };
  return placeholders[role] || "How can I help you?";
}

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  textColor?: string;
}

function QuickActionButton({ icon, label, onClick, textColor }: QuickActionButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-7 gap-1 text-xs"
      style={{ color: textColor || 'rgb(219 39 119)' }}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}

interface MessageBubbleProps {
  message: Message;
  roleColor?: string;
}

function MessageBubble({ message, roleColor = "rgb(219 39 119)" }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      {!isUser ? (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100"
          style={{ color: roleColor }}
        >
          <Bot className="w-4 h-4" style={{ color: roleColor }} />
        </div>
      ) : (
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-blue-600">You</span>
        </div>
      )}

      <div
        className={cn(
          "rounded-2xl px-4 py-3 max-w-[85%]",
          isUser
            ? "bg-blue-500 text-white rounded-tr-sm"
            : "bg-white text-gray-800 rounded-tl-sm shadow-sm"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {/* Code Snippet */}
        {message.codeSnippet && (
          <div className="mt-3 bg-gray-900 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-800">
              <span className="text-xs text-gray-400 flex items-center gap-2">
                <FileText className="w-3 h-3" />
                {message.codeSnippet.language}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(message.codeSnippet!.code)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="p-3 text-xs text-green-400 overflow-x-auto">
              <code>{message.codeSnippet.code}</code>
            </pre>
          </div>
        )}

        <span className={cn(
          "text-xs mt-1 block",
          isUser ? "text-blue-200" : "text-gray-400"
        )}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

/**
 * Fallback response generator for when AI is unavailable
 * Role-aware fallback responses
 */
function getFallbackResponse(query: string, role: string): string {
  const lowerQuery = query.toLowerCase();

  // Student fallback responses
  if (role === "student") {
    if (lowerQuery.includes("career") || lowerQuery.includes("become")) {
      return "I'd love to help you find the right career! To give you the best recommendations, I recommend taking our career assessments like RIASEC. This will help identify careers that match your personality and interests.\n\nWould you like to know more about available careers or how to prepare for them?";
    }
    if (lowerQuery.includes("study") || lowerQuery.includes("homework") || lowerQuery.includes("learn")) {
      return "For effective studying, try these tips:\n\n1. Create a consistent study schedule\n2. Break large topics into smaller chunks\n3. Use active recall - test yourself regularly\n4. Take short breaks every 25-30 minutes\n5. Get enough sleep and stay hydrated\n\nWould you like specific study tips for any subject?";
    }
    if (lowerQuery.includes("rub") || lowerQuery.includes("college") || lowerQuery.includes("university")) {
      return "Royal University of Bhutan offers many excellent programs! You can explore colleges and programs in the RUB section of your portal. Consider your interests, career goals, and academic performance when choosing.\n\nWhat field of study interests you most?";
    }
    return "I'm here to help you with your education journey! You can ask me about:\n\n- Career guidance and exploration\n- Study tips and homework help\n- RUB colleges and programs\n- Skill development\n\nWhat would you like to know?";
  }

  // Teacher fallback responses
  if (role === "teacher") {
    if (lowerQuery.includes("homework") || lowerQuery.includes("assignment")) {
      return "To create homework:\n\n1. Go to your Dashboard\n2. Click on 'Homework'\n3. Click 'Create Assignment'\n4. Fill in the details (title, description, due date)\n5. Select the class/section\n6. Click 'Assign'\n\nWould you like help with anything else?";
    }
    if (lowerQuery.includes("student") || lowerQuery.includes("class")) {
      return "You can view student progress by:\n\n1. Going to the 'Students' section\n2. Selecting a student to view their profile\n3. Checking their assessment results, grades, and attendance\n\nThis helps you understand each student's strengths and areas needing support.";
    }
    return "I'm here to assist you with teaching! You can ask about:\n\n- Creating homework and assignments\n- Managing your classes\n- Understanding student assessment results\n- Teaching strategies\n\nHow can I help?";
  }

  // Parent fallback responses
  if (role === "parent") {
    if (lowerQuery.includes("progress") || lowerQuery.includes("child") || lowerQuery.includes("how is")) {
      return "To view your child's progress:\n\n1. Go to your Dashboard\n2. Select your child (if you have multiple)\n3. Click on 'Progress' to see grades, attendance, and assessment results\n\nYou can also message teachers directly if you have specific concerns.";
    }
    if (lowerQuery.includes("fee") || lowerQuery.includes("pay")) {
      return "To pay fees:\n\n1. Go to the 'Fees' section\n2. View the fee structure and pending amounts\n3. Click 'Pay Now' and follow the payment instructions\n\nYou'll also receive receipts for all payments made.";
    }
    return "I'm here to help you support your child's education! You can ask about:\n\n- Your child's academic progress\n- Fee payment and status\n- Homework and assignments\n- Communicating with teachers\n\nWhat would you like to know?";
  }

  // Counselor fallback responses
  if (role === "counselor") {
    if (lowerQuery.includes("assessment") || lowerQuery.includes("riasec") || lowerQuery.includes("mbti")) {
      return "To interpret student assessments:\n\n1. Go to the student's profile\n2. View their completed assessments\n3. Review RIASEC for career interests (RIASEC codes match personality to careers)\n4. Check MBTI for personality type insights\n5. Use these to guide career discussions\n\nWould you like guidance on a specific assessment?";
    }
    if (lowerQuery.includes("session") || lowerQuery.includes("schedule")) {
      return "To schedule a counseling session:\n\n1. Go to 'Sessions' in your portal\n2. Click 'Schedule Session'\n3. Select student, date, time, and session type\n4. Add notes about the session purpose\n5. Save to send notification to student";
    }
    return "I'm here to support your counseling work! You can ask about:\n\n- Interpreting assessment results\n- Career planning guidance\n- Scheduling sessions\n- Student wellness support\n\nHow can I assist?";
  }

  // School Admin fallback responses
  if (role === "school-admin") {
    if (lowerQuery.includes("student") || lowerQuery.includes("add") || lowerQuery.includes("enroll")) {
      return "To add a new student:\n\n1. Go to 'Students' section\n2. Click 'Add Student'\n3. Fill in student details (name, class, contact info)\n4. Set up parent account if needed\n5. Save to create the record\n\nThe student will receive login credentials via email.";
    }
    if (lowerQuery.includes("teacher") || lowerQuery.includes("staff")) {
      return "To manage teachers:\n\n1. Go to 'Teachers' section\n2. View all teachers and their subjects\n3. Click 'Add Teacher' to create new accounts\n4. Assign classes and subjects to each teacher\n5. Track attendance and performance";
    }
    return "I'm here to help with school administration! You can ask about:\n\n- Adding students and teachers\n- Managing timetables\n- Generating reports\n- Fee structure management\n\nWhat do you need help with?";
  }

  // Ministry fallback responses
  if (role === "ministry") {
    if (lowerQuery.includes("analytics") || lowerQuery.includes("data") || lowerQuery.includes("statistics")) {
      return "To view national analytics:\n\n1. Go to 'Analytics' section\n2. Explore dashboards showing:\n   - Student performance across schools\n   - Assessment completion rates\n   - School enrollment trends\n   - Regional comparisons\n\nYou can export reports for further analysis.";
    }
    if (lowerQuery.includes("school") || lowerQuery.includes("performance")) {
      return "To monitor school performance:\n\n1. Go to 'Schools' section\n2. View all schools with key metrics\n3. Click on a school for detailed information\n4. Compare performance across districts\n\nThis helps identify schools needing support.";
    }
    return "I'm here to assist with ministry-level oversight! You can ask about:\n\n- National education analytics\n- School performance monitoring\n- Creating education policies\n- Compliance tracking\n\nHow can I help?";
  }

  // Platform Admin fallback responses (original ones)
  if (lowerQuery.includes("auth") || lowerQuery.includes("authentication")) {
    return `**Authentication Flow**

The platform uses Clerk for authentication. Key files:
- \`src/lib/auth-utils.ts\` - Contains requireAuth() helper
- \`src/middleware.ts\` - CORS and security headers
- \`src/app/api/auth/set-role/route.ts\` - Role assignment

**Pattern:**
\`\`\`typescript
import { requireAuth } from "@/lib/auth-utils";

const { userId, user } = await requireAuth(['admin']);
\`\`\`

**Database Field:** Use \`clerkUserId\` (NOT \`clerkId\`) when querying users.`;
  }

  if (lowerQuery.includes("api") || lowerQuery.includes("endpoint") || lowerQuery.includes("route")) {
    return `**Creating API Endpoints**

All API routes follow this pattern:

1. Create file in \`src/app/api/[feature]/route.ts\`
2. Use \`requireAuth()\` for authentication
3. Return \`ApiSuccess<T>\` or \`ApiErrorResponse\`

**Template:**
\`\`\`typescript
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

export async function GET(req: Request) {
  try {
    const { userId } = await requireAuth(['admin']);
    // Route logic here
    return Response.json({ success: true, data } satisfies ApiSuccess);
  } catch (error) {
    logger.apiError(error, { route: "/api/endpoint", method: "GET" });
    return Response.json(
      { success: false, error: "Message" } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
\`\`\``;
  }

  if (lowerQuery.includes("schema") || lowerQuery.includes("database") || lowerQuery.includes("db")) {
    return `**Database Schema**

Main schema file: \`src/lib/db/schema.ts\`

**Key Tables:**
- \`users\` - User accounts (use \`clerkUserId\` for Clerk lookups)
- \`schools\` - School/tenant information
- \`assessments\` - Assessment records
- \`careerMatches\` - Career matching results
- \`user_roles\` - RBAC permissions (snake_case)

**Important Fields:**
- \`users.clerkUserId\` - Clerk user ID
- \`users.schoolId\` - School linkage
- \`users.tenantId\` - Multi-tenant isolation

**Query Pattern:**
\`\`\`typescript
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";

const user = await db.query.users.findFirst({
  where: eq(users.clerkUserId, clerkId)
});
\`\`\``;
  }

  if (lowerQuery.includes("status") || lowerQuery.includes("health")) {
    return `**System Status**

Current Status: ✅ All Systems Operational

**Components:**
- Database: Neon PostgreSQL - Connected
- Auth: Clerk - Operational
- API Routes: Active
- AI Services: Available

**Recent Activity:**
- Last deployment: Build 23 (Feb 16, 2026)
- TypeScript errors: 0
- Active portals: 7

**Quick Actions:**
- Check logs: See \`src/lib/logger.ts\`
- View analytics: /admin/analytics
- System health: /api/health`;
  }

  return `I'm here to help with platform administration!

Here are some things I can assist with:

• **Authentication** - User auth flow, permissions, RBAC
• **API Development** - Creating endpoints, error handling
• **Database** - Schema queries, migrations, data models
• **Code Examples** - TypeScript patterns, best practices
• **System Status** - Health checks, monitoring, logs

Try asking about a specific topic, or use the quick action buttons below.`;
}
