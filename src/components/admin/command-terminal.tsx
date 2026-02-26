"use client";

/**
 * COMMAND TERMINAL COMPONENT
 *
 * Chat-style interface for AI command execution.
 * Features:
 * - Command input with suggestions
 * - Command history
 * - Confirmation dialog for critical actions
 * - Execution result display
 */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Send, Loader2, AlertTriangle, CheckCircle, X } from "lucide-react";

interface ParsedCommand {
  action: string;
  entityType: string;
  entityName?: string;
  parameters: Record<string, any>;
  explanation: string;
  confidence: number;
}

interface CommandResult {
  success: boolean;
  action: string;
  entityName: string;
  result: unknown;
  message: string;
}

interface CommandTerminalProps {
  onExecute?: (command: ParsedCommand) => Promise<CommandResult>;
}

interface Message {
  type: "user" | "ai" | "result" | "error";
  content: string;
  parsedCommand?: ParsedCommand;
  result?: CommandResult;
}

const quickCommands = [
  "Send payment reminder to all overdue schools",
  "Show me schools approaching seat limits",
  "Generate SITREP for today",
  "List all critical anomalies",
  "Send notification to Motithang HSS",
];

export function CommandTerminal({ onExecute }: CommandTerminalProps) {
  const [messages, setMessages] = useState<Message[]>([{
    type: "ai",
    content: "KAZE // AI SENTINEL online. Awaiting your command, Platform Admin.",
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<ParsedCommand | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    setMessages(prev => [...prev, { type: "user", content: userMessage }]);

    setIsLoading(true);

    try {
      // Parse command (in real implementation, call API)
      // For now, simulate parsing
      const parsed = await simulateCommandParse(userMessage);

      if (parsed.confidence < 0.5) {
        setMessages(prev => [...prev, {
          type: "ai",
          content: `I'm not sure I understood that command. "${parsed.explanation}"`,
        }]);
      } else {
        // Show parsed command for confirmation
        setPendingCommand(parsed);
        setMessages(prev => [...prev, {
          type: "ai",
          content: parsed.explanation,
          parsedCommand: parsed,
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        type: "error",
        content: `Error: ${error instanceof Error ? error.message : "Failed to process command"}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingCommand) return;

    setIsLoading(true);
    setPendingCommand(null);

    try {
      let result: CommandResult;

      if (onExecute) {
        result = await onExecute(pendingCommand);
      } else {
        // Simulate execution
        result = await simulateExecution(pendingCommand);
      }

      setMessages(prev => [...prev, {
        type: result.success ? "result" : "error",
        content: result.message,
        result,
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        type: "error",
        content: `Execution failed: ${error instanceof Error ? error.message : String(error)}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPendingCommand(null);
    setMessages(prev => [...prev, {
      type: "ai",
      content: "Command cancelled.",
    }]);
  };

  const handleQuickCommand = (command: string) => {
    setInput(command);
  };

  return (
    <div className="bg-[#050505] border border-cyan-500/20 rounded-2xl flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black tracking-[0.3em] text-cyan-500 uppercase">
            COMMAND TERMINAL
          </span>
        </div>
        {pendingCommand && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-ceramic-dimmed hover:text-white h-8"
              onClick={handleCancel}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-700 h-8"
              onClick={handleConfirm}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Execute
            </Button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
        {isLoading && !pendingCommand && (
          <div className="flex items-center gap-3 text-ceramic-dimmed">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Processing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Commands */}
      <div className="px-6 py-2 border-t border-white/5 flex flex-wrap gap-2">
        {quickCommands.slice(0, 3).map((cmd) => (
          <button
            key={cmd}
            className="text-[10px] text-ceramic-dimmed hover:text-cyan-500 transition-colors px-2 py-1"
            onClick={() => handleQuickCommand(cmd)}
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
          <span className="text-cyan-500 font-mono">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Type a command..."
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-ceramic-dimmed font-mono"
            disabled={isLoading || pendingCommand !== null}
          />
          <Button
            size="icon"
            className="w-8 h-8 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading || pendingCommand !== null}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.type === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[80%] rounded-xl px-4 py-3",
        isUser
          ? "bg-cyan-600/20 text-cyan-100"
          : message.type === "error"
          ? "bg-red-500/20 text-red-100 border border-red-500/30"
          : message.type === "result"
          ? "bg-emerald-500/20 text-emerald-100 border border-emerald-500/30"
          : "bg-white/5 text-slate-300"
      )}>
        {message.parsedCommand && (
          <div className="mb-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-cyan-500 mb-1">
              <AlertTriangle className="w-3 h-3" />
              Confirmation Required
            </div>
            <p className="text-sm">{message.parsedCommand.explanation}</p>
            <div className="mt-2 text-[10px] font-mono text-ceramic-dimmed">
              Action: {message.parsedCommand.action}<br/>
              Target: {message.parsedCommand.entityName || "Unknown"}<br/>
              Confidence: {Math.round(message.parsedCommand.confidence * 100)}%
            </div>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {message.result && (
          <div className="mt-2 pt-2 border-t border-white/10 text-[10px] font-mono">
            Result: {message.result.success ? "✓" : "✗"} {message.result.action}
          </div>
        )}
      </div>
    </div>
  );
}

// Simulated functions for demo (replace with actual API calls)
async function simulateCommandParse(command: string): Promise<ParsedCommand> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const lower = command.toLowerCase();

  if (lower.includes("payment reminder") || lower.includes("overdue")) {
    return {
      action: "send_payment_reminder",
      entityType: "school",
      entityName: "Motithang HSS",
      parameters: {},
      explanation: "I'll send a payment reminder to schools with overdue invoices.",
      confidence: 0.9,
    };
  }

  if (lower.includes("suspend")) {
    return {
      action: "suspend_access",
      entityType: "school",
      entityName: "XYZ School",
      parameters: {},
      explanation: "This will SUSPEND access for the specified school until payment is received.",
      confidence: 0.85,
    };
  }

  if (lower.includes("sitrep") || lower.includes("report")) {
    return {
      action: "generate_sitrep",
      entityType: "system",
      entityName: "System",
      parameters: {},
      explanation: "Generating today's Situation Report with 24h analysis...",
      confidence: 0.95,
    };
  }

  return {
    action: "unknown",
    entityType: "unknown",
    entityName: "Unknown",
    parameters: {},
    explanation: "I'm not sure what you want me to do. Try commands like 'Send payment reminder' or 'Show SITREP'.",
    confidence: 0.3,
  };
}

async function simulateExecution(command: ParsedCommand): Promise<CommandResult> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    success: true,
    action: command.action,
    entityName: command.entityName || "System",
    result: {},
    message: `Command "${command.action}" executed successfully on ${command.entityName || "target"}.`,
  };
}
