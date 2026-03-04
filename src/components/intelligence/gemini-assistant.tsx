/**
 * GEMINI AI ASSISTANT
 *
 * AI Chat component that leverages the Gemini Layer to:
 * 1. Understand your data model (System Awareness)
 * 2. Autonomously query the unified API (Autonomous Querying)
 * 3. Provide self-healing suggestions (Self-Healing)
 *
 * Example questions:
 * - "How many students are in Class 10A?"
 * - "Show me teachers who teach Mathematics"
 * - "What subjects have no assigned teachers?"
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Sparkles, Database, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    queries?: Array<{ feature: string; operation: string; result?: any }>;
    error?: string;
  };
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

export function GeminiAssistant({ className }: { className?: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI assistant. I can help you query your data, find information, and diagnose issues. Try asking me about students, teachers, classes, or subjects!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/intelligence/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ask",
          question: input,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer || "I couldn't process that request.",
        timestamp: new Date(),
        metadata: {
          queries: data.queryHistory,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error("AI Assistant error:", error);

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date(),
        metadata: {
          error: error.message,
        },
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: "AI Assistant Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className={cn("flex flex-col h-[600px]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          Gemini Layer Active
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking and querying data...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about your data... (e.g., 'How many students in Class 10A?')"
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="icon"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <QuickAction
            label="Show all students"
            onClick={() => setInput("Show me all students")}
          />
          <QuickAction
            label="Teachers by subject"
            onClick={() => setInput("Which teachers teach Mathematics?")}
          />
          <QuickAction
            label="Unassigned subjects"
            onClick={() => setInput("Which subjects have no assigned teachers?")}
          />
        </div>
      </div>
    </Card>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg p-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {/* Query metadata */}
        {message.metadata?.queries && message.metadata.queries.length > 0 && (
          <div className="mt-2 space-y-1">
            <Badge variant="secondary" className="text-xs">
              <Database className="h-3 w-3 mr-1" />
              Data queried
            </Badge>
            {message.metadata.queries.map((query, idx) => (
              <div key={idx} className="text-xs opacity-70">
                Queried: {query.feature} ({query.operation})
              </div>
            ))}
          </div>
        )}

        {/* Error indicator */}
        {message.metadata?.error && (
          <div className="mt-2 flex items-center gap-1 text-xs text-red-300">
            <AlertCircle className="h-3 w-3" />
            Error occurred
          </div>
        )}

        <div className="text-xs opacity-50 mt-1" suppressHydrationWarning>
          {formatMessageTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="text-xs h-7"
    >
      {label}
    </Button>
  );
}

/**
 * Self-Healing Diagnostic Component
 * Shows error analysis with suggestions
 */
export function SelfHealingDiagnostic({
  error,
  context,
  onFix,
}: {
  error: Error;
  context: {
    feature: string;
    operation: string;
    testData?: any;
  };
  onFix?: (suggestion: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSuggestions() {
      setLoading(true);
      try {
        const response = await fetch("/api/intelligence/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "analyze-error",
            error: { message: error.message, stack: error.stack },
            context,
          }),
        });

        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (e) {
        console.error("Failed to load suggestions:", e);
      } finally {
        setLoading(false);
      }
    }

    loadSuggestions();
  }, [error, context]);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <h3 className="font-semibold">Self-Healing Diagnostic</h3>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium">Error:</p>
          <p className="text-sm text-destructive">{error.message}</p>
        </div>

        <div>
          <p className="text-sm font-medium">Context:</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Feature: {context.feature}</p>
            <p>Operation: {context.operation}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Suggestions:</p>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing error...
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <li
                  key={idx}
                  className="text-sm p-2 bg-muted rounded flex items-start justify-between gap-2"
                >
                  <span>{suggestion}</span>
                  {onFix && idx === 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-auto p-0 text-xs"
                      onClick={() => onFix(suggestion)}
                    >
                      Apply Fix
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No suggestions available. Check the error message above.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
