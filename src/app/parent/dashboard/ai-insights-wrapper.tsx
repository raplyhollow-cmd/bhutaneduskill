"use client";

/**
 * PARENT AI INSIGHTS WRAPPER
 *
 * Client component that fetches AI insights from the API.
 */

import { useEffect, useState, useRef } from "react";
import { AIInsightCard } from "@/components/ai/ai-insight-card";
import { logger } from "@/lib/logger";
import type { ChildData } from "./_actions";

interface ParentAIInsightsProps {
  childData: ChildData;
}

interface AIInsight {
  type: "warning" | "success" | "info" | "tip";
  title: string;
  message: string;
  actions?: Array<{ label: string; href: string }>;
}

export function ParentAIInsights({ childData }: ParentAIInsightsProps) {
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchAIInsights = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/ai/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userRole: "parent",
            contextData: {
              childName: `${childData.firstName} ${childData.lastName}`,
              attendance: childData.attendance,
              pendingHomework: childData.homeworkPending,
              classGrade: childData.classGrade,
              section: childData.section,
              careerInterests: childData.careerInterests,
              feePending: childData.feeStatus.amountPending,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAiInsights(data.insights || []);
        } else {
          setAiInsights(getFallbackInsights());
        }
      } catch (err) {
        logger.error("[Parent Dashboard] Failed to load AI insights:", err);
        setAiInsights(getFallbackInsights());
      } finally {
        setIsLoading(false);
      }
    };

    fetchAIInsights();
  }, [childData]);

  const getFallbackInsights = (): AIInsight[] => {
    const insights: AIInsight[] = [];
    const childName = `${childData.firstName} ${childData.lastName}`;

    // Attendance insight
    if (childData.attendance < 75) {
      insights.push({
        type: "warning",
        title: "Low Attendance Alert",
        message: `${childName}'s attendance is ${childData.attendance}%. Please ensure they attend school regularly.`,
      });
    } else if (childData.attendance >= 90) {
      insights.push({
        type: "success",
        title: "Excellent Attendance",
        message: `${childName} has ${childData.attendance}% attendance. Great job maintaining consistent attendance!`,
      });
    }

    // Homework insight
    if (childData.homeworkPending > 3) {
      insights.push({
        type: "warning",
        title: "Pending Homework",
        message: `${childName} has ${childData.homeworkPending} homework assignments pending. Encourage them to complete their work on time.`,
      });
    }

    // Fee insight
    if (childData.feeStatus.amountPending > 0) {
      insights.push({
        type: "warning",
        title: "Fee Payment Due",
        message: `Nu. ${childData.feeStatus.amountPending} is pending for fee payment. Please complete the payment to avoid any late fees.`,
      });
    }

    // Career interests insight
    if (childData.careerInterests.length > 0) {
      insights.push({
        type: "info",
        title: "Career Interests",
        message: `${childName} has shown interest in ${childData.careerInterests.slice(0, 3).join(", ")}. Support them in exploring these career paths!`,
      });
    }

    // Default insight
    if (insights.length === 0) {
      insights.push({
        type: "info",
        title: "Progress Update",
        message: `${childName} is doing well. Keep track of their attendance and homework to ensure continued success.`,
      });
    }

    return insights.slice(0, 4);
  };

  const insightsToShow = aiInsights.length > 0 ? aiInsights : getFallbackInsights();

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">AI Insights for {childData.firstName}</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          </>
        ) : (
          insightsToShow.map((insight, index) => (
            <AIInsightCard
              key={index}
              type={insight.type}
              title={insight.title}
              message={insight.message}
              actions={insight.actions}
            />
          ))
        )}
      </div>
    </div>
  );
}
