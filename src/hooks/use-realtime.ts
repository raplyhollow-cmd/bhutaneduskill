/**
 * USE REALTIME HOOK
 *
 * React hook for subscribing to Pusher channels and listening to events.
 * Handles automatic cleanup on unmount.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  realtime,
  cleanupChannel,
  getConnectionStatus,
  type RealtimeEventName,
} from "@/lib/realtime";

// ============================================================================
// TYPES
// ============================================================================

export interface UseRealtimeOptions {
  autoConnect?: boolean;
  onConnectionChange?: (status: "connected" | "disconnected" | "connecting" | "unavailable") => void;
  onError?: (error: Error) => void;
}

export interface UseRealtimeReturn {
  isConnected: boolean;
  isConnecting: boolean;
  bind: <T = unknown>(
    channelName: string,
    eventName: string,
    callback: (data: T) => void,
  ) => () => void;
  subscribe: (channelName: string) => unknown;
  unsubscribe: (channelName: string) => void;
  bindPresence: (
    channelName: string,
    events: {
      onMemberAdded?: (member: PresenceMember) => void;
      onMemberRemoved?: (member: PresenceMember) => void;
    },
  ) => () => void;
}

export interface PresenceMember {
  id: string;
  info: {
    id: string;
    name: string;
    type: string;
    [key: string]: unknown;
  };
}

// Type for the realtime connection
interface PusherConnection {
  state: string;
  bind: (event: string, callback: () => void) => void;
  unbind: (event: string, callback: () => void) => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const { autoConnect = true, onConnectionChange, onError } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const channelsRef = useRef<Map<string, unknown>>(new Map());

  // Track connection status
  useEffect(() => {
    if (!autoConnect) return;

    const connection = (realtime as unknown as { connection: PusherConnection }).connection;

    // Set initial state
    setIsConnecting(connection.state === "connecting");
    setIsConnected(connection.state === "connected");

    // Handle connection state changes
    const handleConnecting = () => {
      setIsConnecting(true);
      onConnectionChange?.("connecting");
    };

    const handleConnected = () => {
      setIsConnecting(false);
      setIsConnected(true);
      onConnectionChange?.("connected");
    };

    const handleDisconnected = () => {
      setIsConnecting(false);
      setIsConnected(false);
      onConnectionChange?.("disconnected");
    };

    const handleError = () => {
      setIsConnecting(false);
      setIsConnected(false);
      onError?.(new Error("Pusher connection error"));
    };

    // Bind to connection events
    connection.bind("connecting", handleConnecting);
    connection.bind("connected", handleConnected);
    connection.bind("disconnected", handleDisconnected);
    connection.bind("error", handleError);

    return () => {
      connection.unbind("connecting", handleConnecting);
      connection.unbind("connected", handleConnected);
      connection.unbind("disconnected", handleDisconnected);
      connection.unbind("error", handleError);
    };
  }, [autoConnect, onConnectionChange, onError]);

  /**
   * Subscribe to a channel
   */
  const subscribe = useCallback((channelName: string): unknown => {
    try {
      const channel = realtime.subscribe(channelName);
      channelsRef.current.set(channelName, channel);
      return channel;
    } catch (error) {
      onError?.(error as Error);
      return null;
    }
  }, [onError]);

  /**
   * Unsubscribe from a channel
   */
  const unsubscribe = useCallback((channelName: string): void => {
    try {
      const channel = channelsRef.current.get(channelName);
      if (channel) {
        cleanupChannel(channel);
        channelsRef.current.delete(channelName);
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }, [onError]);

  /**
   * Bind to an event on a channel
   */
  const bind = useCallback(
    <T = unknown>(
      channelName: string,
      eventName: string,
      callback: (data: T) => void,
    ): (() => void) => {
      let channel = channelsRef.current.get(channelName);

      if (!channel) {
        channel = subscribe(channelName);
      }

      if (!channel) {
        return () => {};
      }

      const ch = channel as { bind: (event: string, cb: (data: T) => void) => void; unbind: (event: string, cb: (data: T) => void) => void };
      ch.bind(eventName, callback);

      return () => {
        ch.unbind(eventName, callback);
      };
    },
    [subscribe, onError]
  );

  /**
   * Bind to presence channel member events
   */
  const bindPresence = useCallback(
    (
      channelName: string,
      events: {
        onMemberAdded?: (member: PresenceMember) => void;
        onMemberRemoved?: (member: PresenceMember) => void;
      },
    ): (() => void) => {
      const channel = subscribe(channelName);
      if (!channel) return () => {};

      const { onMemberAdded, onMemberRemoved } = events;
      const ch = channel as { bind: (event: string, cb: (data: unknown) => void) => void; unbind: (event: string, cb: (data: unknown) => void) => void };

      if (onMemberAdded) {
        ch.bind("pusher:member_added", onMemberAdded);
      }
      if (onMemberRemoved) {
        ch.bind("pusher:member_removed", onMemberRemoved);
      }

      return () => {
        if (onMemberAdded) {
          ch.unbind("pusher:member_added", onMemberAdded);
        }
        if (onMemberRemoved) {
          ch.unbind("pusher:member_removed", onMemberRemoved);
        }
      };
    },
    [subscribe]
  );

  // Cleanup all channels on unmount
  useEffect(() => {
    return () => {
      channelsRef.current.forEach((channel) => {
        cleanupChannel(channel);
      });
      channelsRef.current.clear();
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    bind,
    subscribe,
    unsubscribe,
    bindPresence,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

export function useSchoolEvents(
  schoolId: string | null,
  events: Partial<Record<RealtimeEventName, (data: unknown) => void>>
) {
  const { bind } = useRealtime();

  useEffect(() => {
    if (!schoolId) return;

    const channelName = `private-school-${schoolId}`;
    const cleanups: Array<() => void> = [];

    Object.entries(events).forEach(([eventName, callback]) => {
      if (callback) {
        cleanups.push(bind(channelName, eventName, callback));
      }
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [schoolId, bind, events]);
}

export function useClassEvents(
  classId: string | null,
  events: Partial<Record<RealtimeEventName, (data: unknown) => void>>
) {
  const { bind } = useRealtime();

  useEffect(() => {
    if (!classId) return;

    const channelName = `private-class-${classId}`;
    const cleanups: Array<() => void> = [];

    Object.entries(events).forEach(([eventName, callback]) => {
      if (callback) {
        cleanups.push(bind(channelName, eventName, callback));
      }
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [classId, bind, events]);
}

export function useUserEvents(
  userId: string | null,
  events: Partial<Record<RealtimeEventName, (data: unknown) => void>>
) {
  const { bind } = useRealtime();

  useEffect(() => {
    if (!userId) return;

    const channelName = `private-user-${userId}`;
    const cleanups: Array<() => void> = [];

    Object.entries(events).forEach(([eventName, callback]) => {
      if (callback) {
        cleanups.push(bind(channelName, eventName, callback));
      }
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [userId, bind, events]);
}

export function useClassPresence(classId: string | null) {
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const [count, setCount] = useState(0);
  const { subscribe } = useRealtime();

  useEffect(() => {
    if (!classId) return;

    const channelName = `presence-class-${classId}`;
    const channel = subscribe(channelName);

    if (!channel) return;

    // Type for presence channel members
    interface MembersInfo {
      count: number;
      members: Record<string, PresenceMember>;
    }

    // Handle subscription succeeded
    const handleSubscribed = () => {
      const presenceChannel = channel as unknown as { members: MembersInfo };
      const allMembers = presenceChannel.members.members;
      setMembers(Object.values(allMembers));
      setCount(presenceChannel.members.count);
    };

    // Handle member added
    const handleMemberAdded = (member: PresenceMember) => {
      setMembers((prev) => [...prev, member]);
      setCount((prev) => prev + 1);
    };

    // Handle member removed
    const handleMemberRemoved = (member: PresenceMember) => {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setCount((prev) => prev - 1);
    };

    const ch = channel as { bind: (event: string, cb: (data: unknown) => void) => void; unbind: (event: string, cb: (data: unknown) => void) => void };
    ch.bind("pusher:subscription_succeeded", handleSubscribed);
    ch.bind("pusher:member_added", handleMemberAdded);
    ch.bind("pusher:member_removed", handleMemberRemoved);

    return () => {
      ch.unbind("pusher:subscription_succeeded", handleSubscribed);
      ch.unbind("pusher:member_added", handleMemberAdded);
      ch.unbind("pusher:member_removed", handleMemberRemoved);
      cleanupChannel(channel);
    };
  }, [classId, subscribe]);

  return { members, count };
}

// ============================================================================
// AUTO-REFRESH HOOKS
// ============================================================================

/**
 * Hook that triggers a refetch when specific realtime events occur.
 * Use this to keep dashboard data up-to-date.
 *
 * @param schoolId - The school ID for school-wide events
 * @param classId - Optional class ID for class-specific events
 * @param refetchFn - Function to call when data should be refreshed
 * @param events - Array of event names that should trigger refresh
 *
 * @example
 * ```tsx
 * const { refresh, isRefreshing } = useAutoRefresh(
 *   schoolId,
 *   classId,
 *   async () => {
 *     const data = await fetchDashboardData();
 *     setDashboardData(data);
 *   },
 *   [RealtimeEvents.DASHBOARD_STATS_UPDATED, RealtimeEvents.HOMEWORK_SUBMITTED]
 * );
 * ```
 */
export function useAutoRefresh(
  schoolId: string | null,
  classId: string | null,
  refetchFn: () => Promise<void> | void,
  events: string[] = []
): {
  refresh: () => Promise<void> | void;
  isRefreshing: boolean;
  lastUpdate: Date | null;
} {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    if (isRefreshing) return; // Prevent concurrent refreshes
    setIsRefreshing(true);
    try {
      await refetchFn();
      setLastUpdate(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchFn, isRefreshing]);

  // Listen for school-wide events
  useEffect(() => {
    if (!schoolId || events.length === 0) return;

    const channelName = `private-school-${schoolId}`;
    const cleanups: Array<() => void> = [];

    // Get the bind function from useRealtime
    const { bind } = useRealtime();

    events.forEach((eventName) => {
      const unbind = bind(channelName, eventName, () => {
        // Debounce rapid refreshes
        setTimeout(() => {
          refresh();
        }, 100);
      });
      cleanups.push(unbind);
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [schoolId, events, refresh]);

  // Listen for class-specific events
  useEffect(() => {
    if (!classId || events.length === 0) return;

    const channelName = `private-class-${classId}`;
    const cleanups: Array<() => void> = [];

    // Get the bind function from useRealtime
    const { bind } = useRealtime();

    events.forEach((eventName) => {
      const unbind = bind(channelName, eventName, () => {
        // Debounce rapid refreshes
        setTimeout(() => {
          refresh();
        }, 100);
      });
      cleanups.push(unbind);
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [classId, events, refresh]);

  return { refresh, isRefreshing, lastUpdate };
}

/**
 * Hook for student dashboard auto-refresh.
 * Listens for events that affect student data.
 */
export function useStudentDashboardRefresh(
  schoolId: string | null,
  userId: string | null,
  refetchFn: () => Promise<void> | void
) {
  return useAutoRefresh(
    schoolId,
    null, // Students don't need class-specific refresh
    refetchFn,
    [
      "homework.graded",
      "attendance.checked_in",
      "notification.sent",
    ]
  );
}

/**
 * Hook for teacher dashboard auto-refresh.
 * Listens for homework submissions, attendance updates.
 */
export function useTeacherDashboardRefresh(
  classIds: string[] | null,
  refetchFn: () => Promise<void> | void
) {
  const [refreshCount, setRefreshCount] = useState(0);

  // We'll listen to multiple class channels
  useEffect(() => {
    if (!classIds || classIds.length === 0) return;

    const { bind } = useRealtime();
    const cleanups: Array<() => void> = [];

    classIds.forEach((classId) => {
      const channelName = `private-class-${classId}`;

      // Listen for homework submissions
      const unbind1 = bind(channelName, "homework.submitted", () => {
        setTimeout(() => {
          refetchFn();
          setRefreshCount((c) => c + 1);
        }, 100);
      });

      // Listen for dashboard stats updates
      const unbind2 = bind(channelName, "dashboard.stats_updated", () => {
        setTimeout(() => {
          refetchFn();
          setRefreshCount((c) => c + 1);
        }, 100);
      });

      // Listen for attendance updates
      const unbind3 = bind(channelName, "attendance.updated", () => {
        setTimeout(() => {
          refetchFn();
          setRefreshCount((c) => c + 1);
        }, 100);
      });

      cleanups.push(unbind1, unbind2, unbind3);
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [classIds, refetchFn]);

  return { refreshCount };
}

// ============================================================================
// EXPORT EVENT CONSTANTS
// ============================================================================

export { RealtimeEvents } from "@/lib/realtime";
export type { RealtimeEventName } from "@/lib/realtime";
