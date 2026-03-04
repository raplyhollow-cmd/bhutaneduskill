/**
 * Student Insights Page
 *
 * Dedicated page to view all AI-generated insights, alerts, and recommendations
 */

"use client";

import { InsightList, type Insight } from "@/components/intelligence/insight-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Filter, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentInsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [filteredInsights, setFilteredInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "alerts" | "achievements">("all");

  const { userId } = useAuth();

  useEffect(() => {
    async function fetchInsights() {
      try {
        const response = await fetch("/api/student/insights");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setInsights(data.insights || []);
        setFilteredInsights(data.insights || []);
      } catch (error) {
        console.error("Failed to fetch insights:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInsights();
  }, [userId]);

  useEffect(() => {
    let filtered = insights;

    switch (activeFilter) {
      case "unread":
        filtered = insights.filter((i) => !i.isRead);
        break;
      case "alerts":
        filtered = insights.filter((i) => i.type === "alert" || i.type === "suggestion");
        break;
      case "achievements":
        filtered = insights.filter((i) => i.type === "achievement");
        break;
    }

    setFilteredInsights(filtered);
  }, [activeFilter, insights]);

  async function handleDismiss(id: string) {
    try {
      const response = await fetch("/api/student/insights", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId: id, action: "dismiss" }),
      });

      if (response.ok) {
        setInsights((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error("Failed to dismiss:", err);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      const response = await fetch("/api/student/insights", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId: id, action: "read" }),
      });

      if (response.ok) {
        setInsights((prev) =>
          prev.map((i) => (i.id === id ? { ...i, isRead: true } : i))
        );
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  async function handleMarkAllRead() {
    for (const insight of insights.filter((i) => !i.isRead)) {
      await handleMarkRead(insight.id);
    }
  }

  const unreadCount = insights.filter((i) => !i.isRead).length;

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-orange-500" />
            Your Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Personalized recommendations and alerts based on your progress
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Total Insights</p>
            <p className="text-2xl font-bold">{insights.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Unread</p>
            <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Alerts</p>
            <p className="text-2xl font-bold text-red-600">
              {insights.filter((i) => i.type === "alert").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Achievements</p>
            <p className="text-2xl font-bold text-green-600">
              {insights.filter((i) => i.type === "achievement").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All ({insights.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts ({insights.filter((i) => i.type === "alert" || i.type === "suggestion").length})
          </TabsTrigger>
          <TabsTrigger value="achievements">
            Achievements ({insights.filter((i) => i.type === "achievement").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter} className="mt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <InsightList
              insights={filteredInsights}
              onDismiss={handleDismiss}
              onMarkRead={handleMarkRead}
              emptyMessage={
                activeFilter === "all"
                  ? "No insights yet. Complete assessments to receive personalized recommendations!"
                  : `No ${activeFilter} insights at the moment.`
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}