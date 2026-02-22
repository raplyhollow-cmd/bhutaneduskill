"use client";

/**
 * AI Career Coach Widget
 *
 * A chat-based interface for real-time career guidance.
 * Uses the existing /api/ai/career-coach endpoint.
 *
 * Features:
 * - Collapsible chat interface
 * - Quick prompts based on student context
 * - Conversation history persisted in localStorage
 * - Typing indicators during API calls
 * - Mobile responsive (full-screen modal on mobile)
 */

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  Send,
  Minimize2,
  Maximize2,
  X,
  MessageCircle,
  Loader2,
} from "lucide-react";
import type { ChatMessage, QuickPrompt } from "@/types/student";

const STORAGE_KEY = "career-coach-history";

const DEFAULT_PROMPTS: QuickPrompt[] = [
  {
    id: "careers",
    text: "What careers match my profile?",
    icon: "💼",
  },
  {
    id: "improve",
    text: "How can I improve my grades?",
    icon: "📈",
  },
  {
    id: "rub",
    text: "Tell me about RUB colleges",
    icon: "🎓",
  },
  {
    id: "subjects",
    text: "What subjects should I focus on?",
    icon: "📚",
  },
];

interface AICareerCoachWidgetProps {
  className?: string;
}

export function AICareerCoachWidget({ className = "" }: AICareerCoachWidgetProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load conversation history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const history = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(history);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Save to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (content?: string) => {
    const messageText = content || inputValue.trim();
    if (!messageText || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/career-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: data.message || data.response || "I'm here to help with your career questions!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus input after response
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleQuickPrompt = (prompt: QuickPrompt) => {
    handleSendMessage(prompt.text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // If minimized, show floating button
  if (isMinimized) {
    return (
      <Button
        onClick={() => setIsMinimized(false)}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 ${className}`}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  // On mobile, show as full-screen modal
  if (isMobile && isOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-ceramic-bg p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-ceramic-primary">AI Career Coach</h2>
              <p className="text-xs text-ceramic-dimmed">Ask me anything about your future</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(true);
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 mb-4 pr-4">
          <MessageList messages={messages} isLoading={isLoading} />
        </ScrollArea>

        <div className="space-y-3">
          {messages.length === 0 && !isLoading && (
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_PROMPTS.map((prompt) => (
                <Button
                  key={prompt.id}
                  variant="outline"
                  className="justify-start text-left h-auto py-3 px-4"
                  onClick={() => handleQuickPrompt(prompt)}
                >
                  <span className="mr-2">{prompt.icon}</span>
                  <span className="text-sm">{prompt.text}</span>
                </Button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about careers, colleges, subjects..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              size="icon"
              className="bg-gradient-to-r from-orange-500 to-orange-600"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>

          {messages.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="w-full text-ceramic-dimmed"
            >
              Clear conversation history
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Desktop: embedded card
  return (
    <Card variant="ceramic" className={`flex flex-col h-[450px] ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                AI Career Coach
                <Badge variant="ceramic-info" className="text-[10px]">Online</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Ask me about careers, colleges, and more
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0 gap-3 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <MessageList messages={messages} isLoading={isLoading} />
        </ScrollArea>

        {messages.length === 0 && !isLoading && (
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_PROMPTS.slice(0, 4).map((prompt) => (
              <Button
                key={prompt.id}
                variant="outline"
                className="justify-start text-left h-auto py-2 px-3 text-xs"
                onClick={() => handleQuickPrompt(prompt)}
              >
                <span className="mr-1">{prompt.icon}</span>
                <span className="truncate">{prompt.text}</span>
              </Button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything..."
            disabled={isLoading}
            className="h-9 text-sm"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputValue.trim()}
            size="icon"
            className="h-9 w-9 bg-gradient-to-r from-orange-500 to-orange-600 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MESSAGE LIST COMPONENT
// ============================================================================

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-orange-600" />
        </div>
        <p className="text-sm text-ceramic-secondary mb-1">
          Welcome to your AI Career Coach!
        </p>
        <p className="text-xs text-ceramic-dimmed">
          Ask me about careers, colleges, subjects, or how to reach your goals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? "bg-ceramic-gray-200"
            : "bg-gradient-to-r from-orange-500 to-orange-600"
        }`}
      >
        {isUser ? (
          <span className="text-sm font-medium text-ceramic-primary">
            {message.content.charAt(0).toUpperCase()}
          </span>
        ) : (
          <Sparkles className="h-4 w-4 text-white" />
        )}
      </div>

      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 ${
          isUser
            ? "bg-ceramic-gray-100 text-ceramic-primary"
            : "bg-orange-50 text-ceramic-primary border border-orange-100"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={`text-[10px] mt-1 ${
            isUser ? "text-ceramic-dimmed" : "text-orange-400"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
