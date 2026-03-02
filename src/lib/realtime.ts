/**
 * REALTIME CLIENT
 *
 * Pusher client wrapper for real-time WebSocket connections.
 * Handles channel subscriptions and event broadcasting.
 *
 * Server-side broadcast functions are in @/lib/realtime-server.ts
 */

import Pusher from "pusher-js";

// ============================================================================
// CONFIGURATION
// ============================================================================

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2";

// Enable Pusher logging in development
const ENABLE_DEBUG = process.env.NODE_ENV === "development";

// ============================================================================
// CLIENT INSTANCE
// ============================================================================

/**
 * Global Pusher client instance
 * Initialized on first import, reused across the application
 */
export const realtime = new Pusher(PUSHER_KEY || "missing-key", {
  cluster: PUSHER_CLUSTER,
  enabledTransports: ["ws", "wss"],
  disableStats: true,
});

// Enable debug logging in development
if (ENABLE_DEBUG && PUSHER_KEY) {
  Pusher.logToConsole = true;
}

// ============================================================================
// CHANNEL HELPERS
// ============================================================================

/**
 * Subscribe to a channel by name
 */
export function broadcastChannel(channelName: string) {
  return realtime.subscribe(channelName);
}

/**
 * Subscribe to a private channel (requires authentication)
 */
export function privateChannel(channelName: string) {
  return realtime.subscribe(`private-${channelName}`);
}

/**
 * Subscribe to a presence channel (requires authentication, shows online users)
 */
export function presenceChannel(channelName: string) {
  return realtime.subscribe(`presence-${channelName}`);
}

// ============================================================================
// CHANNEL NAME GENERATORS
// ============================================================================

/**
 * Generate a school-wide channel name
 */
export function schoolChannel(schoolId: string): string {
  return `private-school-${schoolId}`;
}

/**
 * Generate a class-level channel name
 */
export function classChannel(classId: string): string {
  return `private-class-${classId}`;
}

/**
 * Generate a user-specific channel name
 */
export function userChannel(userId: string): string {
  return `private-user-${userId}`;
}

/**
 * Generate a presence channel for a class
 */
export function classPresenceChannel(classId: string): string {
  return `presence-class-${classId}`;
}

// ============================================================================
// EVENT NAME CONSTANTS
// ============================================================================

/**
 * Standard event names used across the application
 */
export const RealtimeEvents = {
  // Student events
  STUDENT_CREATED: "student.created",
  STUDENT_UPDATED: "student.updated",
  STUDENT_DELETED: "student.deleted",
  STUDENT_APPROVED: "student.approved",

  // Teacher events
  TEACHER_CREATED: "teacher.created",
  TEACHER_UPDATED: "teacher.updated",

  // Class events
  CLASS_CREATED: "class.created",
  CLASS_UPDATED: "class.updated",
  CLASS_DELETED: "class.deleted",

  // Homework events
  HOMEWORK_CREATED: "homework.created",
  HOMEWORK_UPDATED: "homework.updated",
  HOMEWORK_SUBMITTED: "homework.submitted",
  HOMEWORK_GRADED: "homework.graded",

  // Announcement events
  ANNOUNCEMENT_CREATED: "announcement.created",
  ANNOUNCEMENT_UPDATED: "announcement.updated",

  // Notification events
  NOTIFICATION_SENT: "notification.sent",
  NOTIFICATION_READ: "notification.read",

  // Dashboard events - for live data refresh
  DASHBOARD_STATS_UPDATED: "dashboard.stats_updated",
  ATTENDANCE_UPDATED: "attendance.updated",
  ATTENDANCE_CHECKED_IN: "attendance.checked_in",

  // System events
  SYSTEM_ALERT: "system.alert",
  MAINTENANCE_MODE: "system.maintenance",
} as const;

export type RealtimeEventName = typeof RealtimeEvents[keyof typeof RealtimeEvents];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Unbind all events and unsubscribe from a channel
 * Note: Pusher channels use unbind() without arguments to unbind all events
 */
export function cleanupChannel(channel: unknown): void {
  const ch = channel as { unbind: () => void; unsubscribe: () => void };
  ch.unbind(); // Unbind all events (no arguments = unbind all)
  ch.unsubscribe();
}

/**
 * Disconnect from Pusher
 */
export function disconnect(): void {
  realtime.disconnect();
}

/**
 * Reconnect to Pusher
 */
export function reconnect(): void {
  realtime.connect();
}

// ============================================================================
// CONNECTION STATUS
// ============================================================================

/**
 * Get current connection status
 */
export function getConnectionStatus(): "connected" | "disconnected" | "connecting" | "unavailable" {
  const connection = (realtime as unknown as { connection: { state: string } }).connection;
  return (connection.state as "connected" | "disconnected" | "connecting") || "unavailable";
}

/**
 * Check if connected to Pusher
 */
export function isConnected(): boolean {
  return getConnectionStatus() === "connected";
}
