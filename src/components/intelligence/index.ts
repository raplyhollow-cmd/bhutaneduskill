/**
 * INTELLIGENCE COMPONENTS - EXPORTS
 *
 * Central export point for all AI/Intelligence components.
 * Includes both traditional AI features and the new Gemini Layer.
 */

// Gemini Layer - Metadata-Driven AI
export {
  GeminiAssistant,
  SelfHealingDiagnostic,
} from "./gemini-assistant";

// Re-export from unified components
export {
  notify,
  NotificationBell,
  DashboardStats,
  QuickActions,
  ActivityFeed,
  useNotifications,
  NotificationProvider,
} from "@/components/unified/Notifications";
