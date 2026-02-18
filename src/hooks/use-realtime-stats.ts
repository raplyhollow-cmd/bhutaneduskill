/**
 * USE REAL-TIME STATS HOOK
 *
 * Provides real-time data updates using TanStack Query polling
 * Configurable refresh interval (default: 10 seconds)
 *
 * Usage:
 *   const { data, isLoading, isLive } = useRealtimeStats();
 *   const { data, isLoading, isLive } = useRealtimeStats(5000); // 5 seconds
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface RealtimeStatsOptions {
  refreshInterval?: number; // milliseconds
  staleTime?: number; // milliseconds
  enabled?: boolean;
}

interface RealtimeStatsResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  isLive: boolean;
  lastUpdate: Date | null;
}

/**
 * Real-time stats hook with polling
 *
 * @param queryKey - Unique key for the query
 * @param queryFn - Async function to fetch data
 * @param options - Configuration options
 */
export function useRealtimeStats<T = unknown>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: RealtimeStatsOptions = {}
): RealtimeStatsResult<T> {
  const {
    refreshInterval = 10000, // 10 seconds default
    staleTime = 5000,
    enabled = true,
  } = options;

  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn,
    refetchInterval: enabled ? refreshInterval : false,
    staleTime,
    enabled,
  });

  // Update live state and last update time
  useEffect(() => {
    if (data) {
      setIsLive(true);
      setLastUpdate(new Date());
    }
  }, [data]);

  return {
    data,
    isLoading,
    error: error as Error | null,
    isLive,
    lastUpdate,
  };
}

/**
 * Simplified version for admin dashboard stats
 *
 * Usage:
 *   const { data, isLoading, isLive } = useAdminStats();
 */
export function useAdminStats() {
  return useRealtimeStats(
    ["admin", "stats"],
    async () => {
      const res = await fetch("/api/admin/stats/realtime");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    {
      refreshInterval: 10000, // 10 seconds
      staleTime: 5000,
    }
  );
}

/**
 * Real-time hook for school-specific stats
 */
export function useSchoolStats(schoolId: string) {
  return useRealtimeStats(
    ["admin", "schools", schoolId, "stats"],
    async () => {
      const res = await fetch(`/api/admin/schools/${schoolId}/stats`);
      if (!res.ok) throw new Error("Failed to fetch school stats");
      return res.json();
    },
    {
      refreshInterval: 15000, // 15 seconds for school stats
      staleTime: 10000,
    }
  );
}

/**
 * Real-time hook for system status
 */
export function useSystemStatus() {
  return useRealtimeStats(
    ["admin", "system-status"],
    async () => {
      const res = await fetch("/api/admin/system-status");
      if (!res.ok) throw new Error("Failed to fetch system status");
      return res.json();
    },
    {
      refreshInterval: 30000, // 30 seconds for system status
      staleTime: 15000,
    }
  );
}
