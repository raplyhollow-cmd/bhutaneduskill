"use client";

/**
 * InsightCard - Displays a single insight
 *
 * Shows alerts, suggestions, predictions, and achievements
 * with appropriate styling and actions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Award,
  Info,
  X,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export type InsightType = "alert" | "suggestion" | "prediction" | "achievement" | "info";

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  actionUrl?: string;
  actionLabel?: string;
  priority: number; // 0=low, 1=medium, 2=high, 3=urgent
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: Date;
}

interface InsightCardProps {
  insight: Insight;
  onDismiss?: (id: string) => void;
  onMarkRead?: (id: string) => void;
}

const INSIGHT_CONFIG = {
  alert: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    label: "Alert",
  },
  suggestion: {
    icon: Lightbulb,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    label: "Suggestion",
  },
  prediction: {
    icon: TrendingUp,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    label: "Prediction",
  },
  achievement: {
    icon: Award,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    label: "Achievement",
  },
  info: {
    icon: Info,
    color: "text-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
    borderColor: "border-gray-200 dark:border-gray-800",
    badgeClass: "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300",
    label: "Info",
  },
};

const PRIORITY_LABELS = {
  3: "Urgent",
  2: "High",
  1: "Medium",
  0: "Low",
};

export function InsightCard({ insight, onDismiss, onMarkRead }: InsightCardProps) {
  const [isDismissing, setIsDismissing] = useState(false);
  const config = INSIGHT_CONFIG[insight.type];
  const Icon = config.icon;

  const handleDismiss = async () => {
    setIsDismissing(true);
    await onDismiss?.(insight.id);
  };

  const handleMarkRead = async () => {
    await onMarkRead?.(insight.id);
  };

  return (
    <Card
      className={`transition-all duration-300 ${
        config.bgColor
      } ${config.borderColor} border ${
        isDismissing ? "opacity-50 scale-95" : ""
      } ${!insight.isRead && insight.type === "alert" ? "animate-pulse" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`mt-0.5 ${config.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base truncate">{insight.title}</CardTitle>
                {!insight.isRead && (
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                )}
                {insight.priority >= 2 && (
                  <Badge variant="outline" className="text-xs">
                    {PRIORITY_LABELS[insight.priority as keyof typeof PRIORITY_LABELS]}
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className={`mt-1 text-xs ${config.badgeClass}`}>
                {config.label}
              </Badge>
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={handleDismiss}
              disabled={isDismissing}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="text-sm">{insight.description}</CardDescription>

        {insight.actionUrl && (
          <div className="flex items-center justify-between">
            <Button asChild variant={insight.type === "alert" ? "default" : "outline"} size="sm">
              <Link href={insight.actionUrl}>
                {insight.actionLabel || "View Details"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>

            {!insight.isRead && onMarkRead && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={handleMarkRead}
              >
                Mark as read
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * InsightList - Displays multiple insights in a list
 */
interface InsightListProps {
  insights: Insight[];
  onDismiss?: (id: string) => void;
  onMarkRead?: (id: string) => void;
  emptyMessage?: string;
}

export function InsightList({
  insights,
  onDismiss,
  onMarkRead,
  emptyMessage = "No insights at the moment",
}: InsightListProps) {
  if (insights.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <InsightCard
          key={insight.id}
          insight={insight}
          onDismiss={onDismiss}
          onMarkRead={onMarkRead}
        />
      ))}
    </div>
  );
}