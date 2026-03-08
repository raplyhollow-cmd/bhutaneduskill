// @ts-nocheck
/**
 * LIVE TERMINAL FEED COMPONENT
 *
 * Displays scrolling log of system events.
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, AlertCircle, CheckCircle, Zap, Activity } from "lucide-react";

type EventType = "audit" | "error" | "healing" | "latency_spike" | "info";

interface TerminalEvent {
  id: string;
  type: EventType;
  message: string;
  feature?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface LiveTerminalFeedProps {
  className?: string;
}

export function LiveTerminalFeed({ className = "" }: LiveTerminalFeedProps) {
  const [events, setEvents] = useState<TerminalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  // Fetch events periodically
  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("/api/admin/anatomy/events?limit=50");
        const data = await response.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
    const interval = setInterval(fetchEvents, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  // Get event icon and color
  const getEventStyle = (type: EventType) => {
    switch (type) {
      case "audit":
        return { icon: Activity, color: "text-blue-400", bg: "bg-blue-500/20" };
      case "error":
        return { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/20" };
      case "healing":
        return { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/20" };
      case "latency_spike":
        return { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/20" };
      default:
        return { icon: Terminal, color: "text-gray-400", bg: "bg-gray-500/20" };
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className={`bg-gray-900 rounded-xl overflow-hidden border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 border-b border-gray-700">
        <Terminal className="w-4 h-4 text-green-400" />
        <h3 className="text-sm font-semibold text-white">System Events</h3>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      {/* Events List */}
      <div
        ref={scrollRef}
        className="h-96 overflow-y-auto p-4 space-y-2 font-mono text-sm"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-gray-500 text-center">No events yet</p>
        ) : (
          <AnimatePresence mode="popLayout">
            {events.map((event, index) => {
              const { icon: Icon, color, bg } = getEventStyle(event.type);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className={`flex items-start gap-3 p-2 rounded-lg ${bg} hover:bg-opacity-30 transition-colors`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 ${color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 break-words">{event.message}</p>
                    {event.feature && (
                      <span className="text-xs text-purple-400">
                        [{event.feature}]
                      </span>
                    )}
                    {event.metadata?.latency && (
                      <span className="text-xs text-yellow-400 ml-2">
                        // @ts-ignore
                        // @ts-expect-error
                        {event.metadata.latency}ms
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatTime(event.timestamp)}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-800/50 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Showing {events.length} recent events
        </p>
      </div>
    </div>
  );
}
