/**
 * REALTIME SERVER
 *
 * Server-side Pusher functions for broadcasting events.
 * Use this in API routes and server actions to send real-time updates.
 *
 * @example
 * ```tsx
 * import { broadcastToSchool } from "@/lib/realtime-server";
 *
 * export async function POST(req: Request) {
 *   const newStudent = await createStudent(data);
 *   await broadcastToSchool(schoolId, 'student.created', newStudent);
 *   return Response.json(newStudent);
 * }
 * ```
 */

import Pusher from "pusher";
import { RealtimeEvents } from "./realtime";

// ============================================================================
// CONFIGURATION
// ============================================================================

const PUSHER_APP_ID = process.env.PUSHER_APP_ID;
const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_SECRET = process.env.PUSHER_SECRET;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2";
const PUSHER_USE_TLS = process.env.PUSHER_USE_TLS !== "false"; // Default to true

// ============================================================================
// PUSHER SERVER INSTANCE
// ============================================================================

/**
 * Server-side Pusher instance for broadcasting events
 * Only initialized if credentials are configured
 */
let pusherInstance: Pusher | null = null;

function getPusher(): Pusher | null {
  if (pusherInstance) {
    return pusherInstance;
  }

  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET) {
    // Not configured - return null (silent fail for development)
    return null;
  }

  pusherInstance = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: PUSHER_USE_TLS,
  });

  return pusherInstance;
}

// ============================================================================
// BROADCASTING FUNCTIONS
// ============================================================================

/**
 * Broadcast an event to a school-wide channel
 *
 * @param schoolId - The school's ID
 * @param event - Event name (use RealtimeEvents constants)
 * @param data - Event payload
 *
 * @example
 * ```tsx
 * await broadcastToSchool(schoolId, RealtimeEvents.STUDENT_CREATED, studentData);
 * ```
 */
export async function broadcastToSchool(
  schoolId: string,
  event: string,
  data: unknown
): Promise<boolean> {
  const pusher = getPusher();
  if (!pusher) return false;

  try {
    await pusher.trigger(`private-school-${schoolId}`, event, data);
    return true;
  } catch (error) {
    console.error(`Failed to broadcast to school ${schoolId}:`, error);
    return false;
  }
}

/**
 * Broadcast an event to a class channel
 *
 * @param classId - The class's ID
 * @param event - Event name
 * @param data - Event payload
 */
export async function broadcastToClass(
  classId: string,
  event: string,
  data: unknown
): Promise<boolean> {
  const pusher = getPusher();
  if (!pusher) return false;

  try {
    await pusher.trigger(`private-class-${classId}`, event, data);
    return true;
  } catch (error) {
    console.error(`Failed to broadcast to class ${classId}:`, error);
    return false;
  }
}

/**
 * Broadcast an event to a specific user
 *
 * @param userId - The user's database ID
 * @param event - Event name
 * @param data - Event payload
 */
export async function broadcastToUser(
  userId: string,
  event: string,
  data: unknown
): Promise<boolean> {
  const pusher = getPusher();
  if (!pusher) return false;

  try {
    await pusher.trigger(`private-user-${userId}`, event, data);
    return true;
  } catch (error) {
    console.error(`Failed to broadcast to user ${userId}:`, error);
    return false;
  }
}

/**
 * Broadcast to multiple channels at once
 *
 * @param channels - Array of channel names (with 'private-' prefix)
 * @param event - Event name
 * @param data - Event payload
 */
export async function broadcastToChannels(
  channels: string[],
  event: string,
  data: unknown
): Promise<boolean> {
  const pusher = getPusher();
  if (!pusher) return false;

  try {
    await pusher.trigger(channels, event, data);
    return true;
  } catch (error) {
    console.error(`Failed to broadcast to channels:`, error);
    return false;
  }
}

/**
 * Broadcast to a presence channel (e.g., class online users)
 *
 * @param channelName - Presence channel name (without 'presence-' prefix)
 * @param event - Event name
 * @param data - Event payload
 */
export async function broadcastToPresence(
  channelName: string,
  event: string,
  data: unknown
): Promise<boolean> {
  const pusher = getPusher();
  if (!pusher) return false;

  try {
    await pusher.trigger(`presence-${channelName}`, event, data);
    return true;
  } catch (error) {
    console.error(`Failed to broadcast to presence channel ${channelName}:`, error);
    return false;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS FOR COMMON EVENTS
// ============================================================================

/**
 * Notify that a student was created
 */
export async function notifyStudentCreated(schoolId: string, studentData: unknown): Promise<boolean> {
  return broadcastToSchool(schoolId, RealtimeEvents.STUDENT_CREATED, studentData);
}

/**
 * Notify that a student was updated
 */
export async function notifyStudentUpdated(schoolId: string, studentData: unknown): Promise<boolean> {
  return broadcastToSchool(schoolId, RealtimeEvents.STUDENT_UPDATED, studentData);
}

/**
 * Notify that a student was approved
 */
export async function notifyStudentApproved(schoolId: string, studentData: unknown): Promise<boolean> {
  return broadcastToSchool(schoolId, RealtimeEvents.STUDENT_APPROVED, studentData);
}

/**
 * Notify that homework was created for a class
 */
export async function notifyHomeworkCreated(classId: string, homeworkData: unknown): Promise<boolean> {
  return broadcastToClass(classId, RealtimeEvents.HOMEWORK_CREATED, homeworkData);
}

/**
 * Notify that homework was graded (to the student)
 */
export async function notifyHomeworkGraded(studentId: string, homeworkData: unknown): Promise<boolean> {
  return broadcastToUser(studentId, RealtimeEvents.HOMEWORK_GRADED, homeworkData);
}

/**
 * Send a notification to a user
 */
export async function sendNotification(userId: string, notification: {
  title: string;
  message: string;
  type?: string;
}): Promise<boolean> {
  return broadcastToUser(userId, RealtimeEvents.NOTIFICATION_SENT, notification);
}

/**
 * Send a system-wide alert (to all users in a school)
 */
export async function sendSystemAlert(schoolId: string, alert: {
  title: string;
  message: string;
  severity?: "info" | "warning" | "error" | "success";
}): Promise<boolean> {
  return broadcastToSchool(schoolId, RealtimeEvents.SYSTEM_ALERT, alert);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if Pusher is properly configured on the server
 */
export function isPusherConfigured(): boolean {
  return !!(PUSHER_APP_ID && PUSHER_KEY && PUSHER_SECRET);
}

/**
 * Get Pusher configuration status (for debugging)
 */
export function getPusherConfigStatus(): {
  configured: boolean;
  hasAppId: boolean;
  hasKey: boolean;
  hasSecret: boolean;
  cluster: string;
  useTLS: boolean;
} {
  return {
    configured: isPusherConfigured(),
    hasAppId: !!PUSHER_APP_ID,
    hasKey: !!PUSHER_KEY,
    hasSecret: !!PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: PUSHER_USE_TLS,
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { Pusher };
