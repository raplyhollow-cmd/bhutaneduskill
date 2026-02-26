"use client";

/**
 * AI CAREER COACH - The Tempting Feature
 *
 * This is the feature that will make students, teachers, and parents LOVE using the platform.
 * It's conversational, helpful, available 24/7, and provides personalized guidance.
 *
 * While helping users, it captures valuable data:
 * - Career interests
 * - Concerns and fears
 * - Decision patterns
 * - Engagement levels
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
  Sparkles,
  Lightbulb,
  BookOpen,
  TrendingUp,
  GraduationCap,
  Heart,
  X,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { portal } from "@/styles/design-tokens";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  resources?: Array<{
    type: string;
    title: string;
    url: string;
  }>;
}

export interface AICareerCoachProps {
  userId?: string;
  userName?: string;
  embedded?: boolean;
  initialMessage?: string;
  onMessageSent?: (message: string) => void;
  className?: string;
}

export function AICareerCoach({
  userId,
  userName = "Student",
  embedded = false,
  initialMessage,
  onMessageSent,
  className,
}: AICareerCoachProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi ${userName}! 👋 I'm your AI Career Coach. I can help you explore careers, understand your strengths, and plan your future. What's on your mind today?`,
      timestamp: new Date(),
      suggestions: [
        "What careers match my personality?",
        "What should I study after Class 12?",
        "How can I improve my skills?",
      ],
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
      // Call AI Career Coach API
      const response = await fetch("/api/ai/career-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          conversationHistory: messages.slice(-5), // Send last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add AI response
      const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        suggestions: data.suggestions,
        resources: data.resources,
      };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      // Fallback response
      const fallbackMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "I'm here to help! Could you tell me more about what you're interested in? For example, what subjects do you enjoy in school?",
        timestamp: new Date(),
        suggestions: [
          "Tell me about careers in technology",
          "How do I know what career is right for me?",
          "What skills do I need for my dream job?",
        ],
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
              background: portal.student.gradient,
              border: 'none',
              boxShadow: '0 4px 14px rgba(0, 0, 0.15)'
            }}
            className="rounded-full h-16 w-16 hover:scale-105 transition-transform animate-pulse-slow shadow-lg"
          >
            <Bot className="w-7 h-7 text-white" />
          </Button>
          <Badge className="absolute -top-1 -right-1 text-white px-2 py-0 text-xs shadow-md" style={{ backgroundColor: 'rgb(239 68 68)' }}>
            Career
          </Badge>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Card
        className={cn(
          "shadow-xl border-orange-200 bg-white",
          !embedded && "w-[calc(100vw-2rem)] h-[70dvh] md:w-96 md:max-w-[500px] md:h-[600px] flex flex-col",
          isMinimized && "h-14",
          className
        )}
      >
        {/* Header */}
        <CardHeader
        className="text-white p-4 space-y-0"
        style={{ background: `linear-gradient(to right, ${portal.student.primary}, ${portal.student.primaryDark})` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                AI Career Coach
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </CardTitle>
              <CardDescription className="text-orange-100 text-xs">
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
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-orange-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="p-4 border-t space-y-3">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your career..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="bg-orange-600 hover:bg-orange-700"
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
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
    </ErrorBoundary>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      {!isUser ? (
        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-orange-600" />
        </div>
      ) : (
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-blue-600">You</span>
        </div>
      )}

      <div
        className={cn(
          "rounded-2xl px-4 py-3 max-w-[80%]",
          isUser
            ? "bg-blue-500 text-white rounded-tr-sm"
            : "bg-gray-100 text-gray-800 rounded-tl-sm"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {/* Resources */}
        {message.resources && message.resources.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                className="flex items-center gap-2 text-sm p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                {resource.type === "assessment" && <Sparkles className="w-4 h-4 text-orange-500" />}
                {resource.type === "career" && <TrendingUp className="w-4 h-4 text-blue-500" />}
                {resource.type === "article" && <BookOpen className="w-4 h-4 text-gray-500" />}
                <span className="flex-1">{resource.title}</span>
                <span className="text-xs text-gray-400">→</span>
              </a>
            ))}
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

// ============================================================================
// AI CAREER COACH API ENDPOINT
// ============================================================================

export async function POST(request: Request) {
  // This would be in /api/ai/career-coach/route.ts
  const body = await request.json();
  const { message, conversationHistory } = body;

  // Generate AI response
  const response = {
    message: "AI response here",
    suggestions: ["Suggestion 1", "Suggestion 2"],
    resources: [
      { type: "assessment", title: "Take Assessment", url: "/assessments" },
    ],
  };

  return Response.json(response);
}
