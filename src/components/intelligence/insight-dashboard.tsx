"use client";

/**
 * InsightDashboard - Widget for displaying insights on dashboards
 *
 * This component can be embedded in:
 * - Student dashboard (personalized insights)
 * - Teacher dashboard (at-risk alerts)
 * - School Admin dashboard (school-wide insights)
 * - Parent dashboard (child insights)
 *
 * Usage:
 *   <InsightDashboard portal="student" limit={5} />
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InsightList, type Insight } from "./insight-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ChevronRight, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

type PortalType = "student" | "teacher" | "school-admin" | "parent" | "counselor" | "admin" | "ministry";

interface InsightDashboardProps {
  portal: PortalType;
  limit?: number;
  showHeader?: boolean;
  showViewAll?: boolean;
  className?: string;
}

interface InsightsResponse {
  insights?: Insight[];
  unreadCount?: number;
  atRiskCount?: number;
  needsAttentionCount?: number;
  hasInsights?: boolean;
}

export function InsightDashboard({
  portal,
  limit = 5,
  showHeader = true,
  showViewAll = true,
  className = "",
}: InsightDashboardProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [atRiskCount, setAtRiskCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { userId } = useAuth();

  useEffect(() => {
    if (!userId) return;

    async function fetchInsights() {
      try {
        setIsLoading(true);
        const endpoint = portal === "student"
          ? "/api/student/insights"
          : portal === "teacher"
          ? "/api/teacher/insights"
          : portal === "school-admin"
          ? "/api/school-admin/insights"
          : portal === "parent"
          ? "/api/parent/insights"
          : null;

        if (!endpoint) {
          setInsights([]);
          return;
        }

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error("Failed to fetch insights");
        }

        const data: InsightsResponse = await response.json();

        setInsights((data.insights || []).slice(0, limit));
        setUnreadCount(data.unreadCount || 0);
        setAtRiskCount(data.atRiskCount || 0);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch insights:", err);
        setError("Could not load insights");
        setInsights([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInsights();
  }, [userId, portal, limit]);

  async function handleDismiss(id: string) {
    try {
      const response = await fetch(`/api/${portal}/insights`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId: id, action: "dismiss" }),
      });

      if (response.ok) {
        setInsights((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error("Failed to dismiss insight:", err);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      const response = await fetch(`/api/${portal}/insights`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId: id, action: "read" }),
      });

      if (response.ok) {
        setInsights((prev) =>
          prev.map((i) => (i.id === id ? { ...i, isRead: true } : i))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark insight as read:", err);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Insights
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Insights
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Get title and description based on portal
  const getTitle = () => {
    switch (portal) {
      case "student":
        return "Your Insights";
      case "teacher":
        return "Classroom Insights";
      case "school-admin":
        return "School Overview";
      case "parent":
        return "Child's Progress";
      default:
        return "Insights";
    }
  };

  const hasAlerts = insights.some((i) => i.type === "alert" && !i.isRead);

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-orange-500" />
              {getTitle()}
              {unreadCount > 0 && (
                <Badge variant="default" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
            {portal === "teacher" && atRiskCount > 0 && (
              <CardDescription className="flex items-center gap-1 mt-1 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="w-4 h-4" />
                {atRiskCount} student{atRiskCount > 1 ? "s" : ""} at risk
              </CardDescription>
            )}
          </div>
          {showViewAll && insights.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${portal}/insights`}>
                View all
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          )}
        </CardHeader>
      )}
      <CardContent>
        {hasAlerts && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">You have urgent items requiring attention</span>
          </div>
        )}
        <InsightList
          insights={insights}
          onDismiss={handleDismiss}
          onMarkRead={handleMarkRead}
          emptyMessage="No new insights at the moment. Check back later!"
        />
      </CardContent>
    </Card>
  );
}