"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  GraduationCap,
  Lightbulb,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

interface AIContext {
  userName?: string;
  userRole?: string;
  classGrade?: string;
  hollandCode?: string | null;
  mbtiType?: string | null;
  completedAssessments?: number;
}

interface ChatResponse {
  message: string;
  suggestions?: string[];
  resources?: Array<{
    type: "article" | "video" | "assessment" | "career";
    title: string;
    url: string;
  }>;
  fallback?: boolean;
}

// ============================================================================
// QUICK QUESTIONS FOR STUDENTS
// ============================================================================

const QUICK_QUESTIONS = [
  "What careers suit me?",
  "What should I study after Class 12?",
  "Tell me about RUB colleges",
  "How can I improve my skills?",
  "I'm confused about my future",
  "What subjects should I choose?",
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AICareerCoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<AIContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversation history and context on mount
  useEffect(() => {
    loadConversationHistory();
  }, []);

  const loadConversationHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/student/career-coach");
      if (response.ok) {
        const data = await response.json();
        setContext(data.data.context);
        if (data.data.conversationHistory && data.data.conversationHistory.length > 0) {
          setMessages(data.data.conversationHistory);
        } else {
          // Show welcome message for new users
          showWelcomeMessage(data.data.context);
        }
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setError("Failed to load conversation history");
    } finally {
      setIsLoading(false);
    }
  };

  const showWelcomeMessage = (ctx: AIContext) => {
    const firstName = ctx?.userName?.split(" ")[0] || "Student";
    const assessmentInfo =
      ctx?.completedAssessments && ctx.completedAssessments > 0
        ? `You've completed ${ctx.completedAssessments} assessment${ctx.completedAssessments === 1 ? "" : "s"}.`
        : "I recommend taking our career assessments to get personalized recommendations.";

    const welcomeMessage: ChatMessage = {
      role: "assistant",
      content: `Kuzuzangpo, ${firstName}! 👋\n\nI'm your AI Career Coach and I'm here to help you discover the right career path. I can help you with:\n\n• 🎯 Finding careers that match your personality\n• 📚 Planning what to study after Class 10/12\n• 🎓 Exploring RUB colleges and programs\n• 💪 Discovering and building your skills\n• 📝 Getting help with applications\n\n${assessmentInfo}\n\nWhat would you like to explore today?`,
      timestamp: Date.now(),
    };
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue;
    if (!text.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setError(null);
    setSuggestions([]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch("/api/student/career-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          conversationHistory: [...messages, userMessage].slice(-20),
          saveConversation: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          throw new Error(data.error || "Too many messages. Please wait a moment.");
        }
        throw new Error("Failed to get response from career coach");
      }

      const data = await response.json();
      const responseData: ChatResponse = data.data;

      // Add assistant message
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: responseData.message,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update suggestions if provided
      if (responseData.suggestions && responseData.suggestions.length > 0) {
        setSuggestions(responseData.suggestions);
      }

      // Show fallback warning if applicable
      if (responseData.fallback) {
        setError(
          "AI is currently unavailable. Showing basic recommendations. Please complete more assessments for better results."
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);

      // Add error message as assistant
      const errorMessageChat: ChatMessage = {
        role: "assistant",
        content: `I apologize, but I'm having trouble connecting right now. ${errorMessage}\n\nPlease try again in a moment.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessageChat]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
    setTimeout(() => handleSendMessage(question), 100);
  };

  // Loading state
  if (isLoading && messages.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Career Coach</h1>
            <p className="text-gray-600">Loading your personalized career guide...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">AI Career Coach</h1>
              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                Beta
              </Badge>
            </div>
            <p className="text-gray-600">
              Your personalized guide to career and education in Bhutan
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/student/careers">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Careers
          </Link>
        </Button>
      </div>

      {/* Context Badges */}
      {context && (
        <div className="flex flex-wrap gap-2">
          {context.hollandCode && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Holland Code: {context.hollandCode}
            </Badge>
          )}
          {context.mbtiType && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              MBTI: {context.mbtiType}
            </Badge>
          )}
          {context.completedAssessments !== undefined && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {context.completedAssessments} Assessment{context.completedAssessments === 1 ? "" : "s"} Completed
            </Badge>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col min-h-[400px] max-h-[600px]">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 max-w-[80%]",
                  message.role === "user"
                    ? "bg-orange-500 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                )}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
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

        {/* Suggestions */}
        {suggestions.length > 0 && !isLoading && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickQuestion(suggestion)}
                  className="text-xs"
                >
                  <Lightbulb className="w-3 h-3 mr-1" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about careers, education, or your future..."
              className="resize-none min-h-[60px] max-h-[120px]"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="self-end"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line. Max 20 messages per hour.
          </p>
        </div>
      </Card>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Quick Start
            </CardTitle>
            <CardDescription>Try these common questions to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {QUICK_QUESTIONS.slice(0, 6).map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleQuickQuestion(question)}
                  className="justify-start text-left h-auto py-3 px-4"
                >
                  <span className="truncate">{question}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Career Assessments</p>
                <p className="text-sm text-gray-600">Discover your strengths</p>
              </div>
            </div>
            <Button variant="link" className="px-0 mt-2" asChild>
              <Link href="/student/assessments">Take Assessment</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Career Matches</p>
                <p className="text-sm text-gray-600">View your results</p>
              </div>
            </div>
            <Button variant="link" className="px-0 mt-2" asChild>
              <Link href="/student/careers">View Careers</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">RUB Programs</p>
                <p className="text-sm text-gray-600">Explore colleges</p>
              </div>
            </div>
            <Button variant="link" className="px-0 mt-2" asChild>
              <Link href="/student/rub">Explore RUB</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
