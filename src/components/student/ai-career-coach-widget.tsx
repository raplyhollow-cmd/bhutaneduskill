"use client";

/**
 * AI Career Coach Widget
 *
 * A chat-based interface for real-time career guidance.
 * Uses the existing /api/ai/career-coach endpoint.
 *
 * Features:
 * - Expandable chat interface (click to expand)
 * - Full right side on desktop when expanded
 * - Full screen on mobile when expanded
 * - Quick prompts based on student context
 * - Conversation history persisted in localStorage
 * - Typing indicators during API calls
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
  ChevronRight,
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

/**
 * Format message timestamp consistently to avoid hydration mismatches
 */
function formatMessageTime(timestamp: Date | string): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

export function AICareerCoachWidget({ className = "" }: AICareerCoachWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const history = parsed.map((msg: { role: string; content: string; timestamp: string }) => ({
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

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

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
      // IMPORTANT: Send ONLY previous messages as history, not the current one
      // The API will add the new message to the chat context
      const historyForAPI = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/ai/career-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          conversationHistory: historyForAPI,
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

  // ============================================================================
  // EXPANDED STATE (Full screen on mobile, right side panel on desktop)
  // ============================================================================
  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />

        {/* Panel - Full screen on mobile, right side on desktop */}
        <div className="relative w-full md:w-[500px] lg:w-[600px] h-full ml-auto bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold">AI Career Coach</h2>
                  <p className="text-sm text-white/80">Your personal guide to career success</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <MessageList messages={messages} isLoading={isLoading} />
          </ScrollArea>

          {/* Quick Prompts */}
          {messages.length === 0 && !isLoading && (
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-600 mb-3">Quick questions to get started:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEFAULT_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt.id}
                    variant="outline"
                    className="justify-start text-left h-auto py-3 px-4"
                    onClick={() => handleQuickPrompt(prompt)}
                  >
                    <span className="mr-2 text-lg">{prompt.icon}</span>
                    <span className="text-sm">{prompt.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t bg-gray-50 space-y-3">
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
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
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
                className="w-full text-gray-500 hover:text-gray-700"
              >
                Clear conversation history
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // COLLAPSED STATE (Bubble Card)
  // ============================================================================
  return (
    <div
      className="relative group cursor-pointer transition-all duration-300"
      onClick={() => setIsExpanded(true)}
    >
      {/* Bubble Card */}
      <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-0.5">AI Career Coach</h3>
            <p className="text-sm text-white/80">Ask me anything about your future</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>

        {/* Sample prompts preview */}
        <div className="mt-4 flex flex-wrap gap-2">
          {DEFAULT_PROMPTS.slice(0, 3).map((prompt) => (
            <span
              key={prompt.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-xs"
            >
              <span>{prompt.icon}</span>
              <span className="truncate max-w-[100px]">{prompt.text}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Chat indicator */}
      {messages.length > 0 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white" />
      )}
    </div>
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
          suppressHydrationWarning
        >
          {formatMessageTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
