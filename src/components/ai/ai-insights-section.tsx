/**
 * AI Insights Section Component
 *
 * Fetches and displays AI-powered insights from /api/ai/insights
 * This is a client component that handles loading and error states.
 */

"use client";

import { useEffect, useState } from "react";
import { AIInsightCard, type AIInsightCardProps } from "./ai-insight-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";

export interface InsightData {
  type: "warning" | "success" | "info" | "tip";
  title: string;
  message: string;
  actions?: Array<{ label: string; href: string }>;
}

export interface AIInsightsResponse {
  success: boolean;
  insights: InsightData[];
  generatedAt?: string;
  error?: string;
}

export interface StudentContextData {
  id: string;
  name: string;
  grade?: string;
}

export interface SchoolContextData {
  id: string;
  name: string;
  code?: string;
  district?: string;
}

export interface CareerInterestData {
  category: string;
  career?: string;
  score?: number;
}

export interface ActivityData {
  id: string;
  type: string;
  title: string;
  timestamp?: string;
  status?: string;
}

export interface AIInsightsSectionProps {
  userRole: "admin" | "teacher" | "counselor" | "school-admin" | "parent" | "student";
  contextData?: {
    stats?: Record<string, number | string | boolean>;
    recentActivity?: ActivityData[];
    students?: StudentContextData[];
    schools?: SchoolContextData[];
    careerInterests?: CareerInterestData[];
  };
  maxInsights?: number;
  className?: string;
}

// Loading skeleton component
function InsightsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-2 border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Error component
function InsightsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900">Unable to load insights</p>
          <p className="text-xs text-amber-700 mt-1">{message}</p>
        </div>
        <button
          onClick={onRetry}
          className="text-xs font-medium text-amber-800 hover:text-amber-900 underline"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export function AIInsightsSection({
  userRole,
  contextData,
  maxInsights = 3,
  className = "",
}: AIInsightsSectionProps) {
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userRole,
          contextData,
        }),
      });

      const data: AIInsightsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch insights");
      }

      if (data.success && Array.isArray(data.insights)) {
        setInsights(data.insights.slice(0, maxInsights));
      } else {
        setInsights([]);
      }
    } catch (err) {
      console.error("Failed to fetch AI insights:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [userRole]); // Only re-fetch if userRole changes significantly

  if (isLoading) {
    return <InsightsSkeleton count={maxInsights} />;
  }

  if (error) {
    return <InsightsError message={error} onRetry={fetchInsights} />;
  }

  if (insights.length === 0) {
    return null; // Don't show anything if no insights
  }

  return (
    <ErrorBoundary>
      <div className={`grid md:grid-cols-${Math.min(insights.length, 3)} gap-4 ${className}`}>
        {insights.map((insight, index) => (
          <AIInsightCard
            key={`insight-${index}-${insight.type}`}
            type={insight.type}
            title={insight.title}
            message={insight.message}
            actions={insight.actions}
            dismissible={false} // Keep insights visible on dashboard
          />
        ))}
      </div>
    </ErrorBoundary>
  );
}
