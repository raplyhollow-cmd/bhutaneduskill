/**
 * TEACHER DASHBOARD CLIENT WRAPPER
 *
 * Adds live data refresh capabilities to the teacher dashboard.
 * Listens for homework submissions and attendance updates.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { TeacherDashboardPage } from "./dashboard-server";
import { useRealtime } from "@/hooks/use-realtime";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTeacherDashboardData } from "./_actions";
import type { TeacherDashboardData } from "./_actions";

interface TeacherDashboardClientProps {
  initialData: TeacherDashboardData | null;
}

export function TeacherDashboardClient({ initialData }: TeacherDashboardClientProps) {
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUpdated, setShowUpdated] = useState(false);
  const { isConnected, bind } = useRealtime();

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const newData = await getTeacherDashboardData();
      setDashboardData(newData);

      // Show updated indicator
      setShowUpdated(true);
      setTimeout(() => setShowUpdated(false), 2000);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  // Extract class IDs for live refresh
  const classIds = dashboardData?.classes?.map((c) => c.id) || [];

  // Set up live refresh listeners for each class
  useEffect(() => {
    if (classIds.length === 0) return;

    const cleanups: Array<() => void> = [];

    classIds.forEach((classId) => {
      const channelName = `private-class-${classId}`;

      // Listen for homework submissions
      const unbind1 = bind(channelName, "homework.submitted", () => {
        handleRefresh();
      });

      // Listen for dashboard stats updates
      const unbind2 = bind(channelName, "dashboard.stats_updated", () => {
        handleRefresh();
      });

      // Listen for attendance updates
      const unbind3 = bind(channelName, "attendance.updated", () => {
        handleRefresh();
      });

      cleanups.push(unbind1, unbind2, unbind3);
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [classIds, bind, handleRefresh]);

  return (
    <div className="relative">
      {/* Live Update Indicator */}
      {showUpdated && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-down">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Dashboard updated</span>
        </div>
      )}

      {/* Connection Status Indicator */}
      {isConnected ? (
        <div className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-2 text-xs">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
          <span>Live</span>
        </div>
      ) : null}

      {/* Manual Refresh Button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Render the server component with current data */}
      <TeacherDashboardPage dashboardData={dashboardData} />
    </div>
  );
}
