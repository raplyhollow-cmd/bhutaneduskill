/**
 * BEHAVIOR LOG CARD COMPONENT
 *
 * Displays teacher feedback (merit/demerit logs) for parents.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Star,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BehaviorLog {
  id: string;
  type: "merit" | "demerit";
  category: string;
  points: number;
  description: string;
  actionTaken?: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
  };
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
  };
}

interface BehaviorLogCardProps {
  childId?: string;
  limit?: number;
}

export function BehaviorLogCard({ childId, limit = 3 }: BehaviorLogCardProps) {
  const [logs, setLogs] = useState<BehaviorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [childId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/parent/behavior-logs");
      if (response.ok) {
        const data = await response.json();
        let filteredLogs = data.logs || [];

        // Filter by child if specified
        if (childId) {
          filteredLogs = filteredLogs.filter((log: BehaviorLog) => log.student?.id === childId);
        }

        // Limit results
        filteredLogs = filteredLogs.slice(0, expanded ? 20 : limit);

        setLogs(filteredLogs);
      }
    } catch (error) {
      console.error("Error fetching behavior logs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4" />
            Latest Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            Latest Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            No recent feedback from teachers
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            Latest Feedback
          </CardTitle>
          {logs.length > limit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-6 w-6 p-0"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className={cn(
              "p-3 rounded-lg border",
              log.type === "merit"
                ? "bg-green-50 border-green-200"
                : "bg-orange-50 border-orange-200"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  log.type === "merit"
                    ? "bg-green-100 text-green-600"
                    : "bg-orange-100 text-orange-600"
                )}
              >
                {log.type === "merit" ? (
                  <Star className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 line-clamp-2">
                  {log.description}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      log.type === "merit"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    )}
                  >
                    {log.type === "merit" ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {log.points > 0 ? "+" : ""}
                    {log.points} pts
                  </Badge>

                  <span className="text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>

                  {log.teacher && (
                    <span className="text-xs text-gray-500">
                      • {log.teacher.firstName} {log.teacher.lastName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
