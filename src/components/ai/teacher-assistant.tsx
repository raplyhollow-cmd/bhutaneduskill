"use client";

/**
 * AI TEACHER ASSISTANT
 *
 * Dedicated AI assistant for teachers with teacher-focused features:
 * - Class management guidance
 * - Teaching strategies
 * - Student insights
 * - Homework assignment help
 *
 * Uses the same Platform Assistant API but with teacher-specific branding
 */

import { useState, useRef, useEffect } from "react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  BookOpen,
  Users,
  FileText,
  Activity,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export interface TeacherAssistantProps {
  userName?: string;
  embedded?: boolean;
  className?: string;
}

// Teacher-specific configuration
const TEACHER_CONFIG = {
  name: "Teacher Assistant",
  icon: <GraduationCap className="w-4 h-4" />,
  gradient: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
  bgLight: "rgb(219 234 254)",
  textColor: "rgb(37 99 235)",
  welcome: (name: string) => `Hi ${name}! 👋 I'm your AI Teaching Assistant. I can help you with:\n\n- Class management and organization\n- Teaching strategies and methodologies\n- Student assessment interpretation\n- Homework assignment and tracking\n\nHow can I assist you today?`,
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
};

export function TeacherAssistant({
  userName = "Teacher",
  embedded = false,
  className,
}: TeacherAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: TEACHER_CONFIG.welcome(userName),
      timestamp: new Date(),
      suggestions: [...TEACHER_CONFIG.suggestions],
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

    try {
      // Get current page for context
      const currentPage = window.location.pathname;

      // Call AI Platform Assistant API with teacher role
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

      // Add AI response
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
        content: getTeacherFallbackResponse(messageToSend),
        timestamp: new Date(),
        suggestions: [...TEACHER_CONFIG.suggestions],
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
              background: TEACHER_CONFIG.gradient,
              border: 'none',
              boxShadow: `0 4px 14px ${TEACHER_CONFIG.textColor}40`
            }}
            className="rounded-full h-16 w-16 hover:scale-105 transition-transform animate-pulse-slow shadow-lg"
          >
            {TEACHER_CONFIG.icon}
          </Button>
          <Badge
            className="absolute -top-1 -right-1 text-white px-2 py-0 text-xs shadow-md"
            style={{ backgroundColor: TEACHER_CONFIG.textColor }}
          >
            {TEACHER_CONFIG.name}
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
        style={{ borderColor: TEACHER_CONFIG.textColor }}
      >
        {/* Header */}
        <CardHeader
          className="text-white p-4 space-y-0"
          style={{ background: TEACHER_CONFIG.gradient }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white">
                {TEACHER_CONFIG.icon}
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {TEACHER_CONFIG.name}
                </CardTitle>
                <CardDescription className="text-blue-100 text-xs">
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
                <MessageBubble key={message.id} message={message} roleColor={TEACHER_CONFIG.textColor} />
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: TEACHER_CONFIG.bgLight }}
                  >
                    <span style={{ color: TEACHER_CONFIG.textColor }}>{TEACHER_CONFIG.icon}</span>
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms", backgroundColor: TEACHER_CONFIG.textColor }}
                      />
                      <div
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms", backgroundColor: TEACHER_CONFIG.textColor }}
                      />
                      <div
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms", backgroundColor: TEACHER_CONFIG.textColor }}
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
                  placeholder="Ask about class management, teaching..."
                  className="flex-1"
                  disabled={isLoading}
                  style={{ borderColor: TEACHER_CONFIG.textColor }}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  style={{ background: TEACHER_CONFIG.gradient }}
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
                      style={{ borderColor: TEACHER_CONFIG.textColor, color: TEACHER_CONFIG.textColor }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}

              {/* Quick actions always visible */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {TEACHER_CONFIG.quickActions.map((action, index) => (
                  <QuickActionButton
                    key={index}
                    icon={action.icon}
                    label={action.label}
                    onClick={() => handleSend(action.message)}
                    textColor={TEACHER_CONFIG.textColor}
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
 * Teacher-specific fallback responses
 */
function getTeacherFallbackResponse(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes("homework") || lowerQuery.includes("assignment")) {
    return "To create homework:\n\n1. Go to your Dashboard\n2. Click on 'Homework'\n3. Click 'Create Assignment'\n4. Fill in the details (title, description, due date)\n5. Select the class/section\n6. Click 'Assign'\n\nWould you like help with anything else?";
  }

  if (lowerQuery.includes("student") || lowerQuery.includes("class")) {
    return "You can view student progress by:\n\n1. Going to the 'Students' section\n2. Selecting a student to view their profile\n3. Checking their assessment results, grades, and attendance\n\nThis helps you understand each student's strengths and areas needing support.";
  }

  if (lowerQuery.includes("teach") || lowerQuery.includes("strategy")) {
    return "Here are some effective teaching strategies:\n\n1. **Active Learning** - Engage students through discussions and activities\n2. **Formative Assessment** - Check understanding during lessons\n3. **Differentiated Instruction** - Tailor methods to different learning styles\n4. **Clear Learning Objectives** - Always state what students will learn\n\nWould you like specific strategies for your subject?";
  }

  return "I'm here to assist you with teaching! You can ask about:\n\n- Creating homework and assignments\n- Managing your classes\n- Understanding student assessment results\n- Teaching strategies\n\nHow can I help?";
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
      style={{ color: textColor || 'rgb(37 99 235)' }}
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

function MessageBubble({ message, roleColor = "rgb(37 99 235)" }: MessageBubbleProps) {
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
