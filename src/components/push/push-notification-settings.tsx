/**
 * PUSH NOTIFICATION SETTINGS COMPONENT
 *
 * A comprehensive UI component for managing push notification preferences.
 * Allows users to:
 * - Enable/disable all push notifications
 * - Configure per-type preferences
 * - Set quiet hours
 * - Manage device subscriptions
 *
 * @example
 * ```tsx
 * import { PushNotificationSettings } from "@/components/push/push-notification-settings";
 *
 * <PushNotificationSettings />
 * ```
 */

"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  Moon,
  Sun,
  Smartphone,
  Monitor,
  Tablet,
  Trash2,
  RefreshCw,
  Check,
  X,
  Clock,
  FileText,
  Award,
  Calendar,
  AlertTriangle,
  MessageSquare,
  CreditCard,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotification, usePushNotificationStatus } from "@/hooks/use-push-notification";

// ============================================================================
// TYPES
// ============================================================================

interface PushSettings {
  enabled: boolean;
  homeworkEnabled: boolean;
  announcementEnabled: boolean;
  gradeEnabled: boolean;
  attendanceEnabled: boolean;
  reminderEnabled: boolean;
  alertEnabled: boolean;
  messageEnabled: boolean;
  feeEnabled: boolean;
  timetableEnabled: boolean;
  examEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  quietHoursOnlyOnMobile: boolean;
}

interface SubscriptionInfo {
  id: string;
  endpointDisplay: string;
  deviceType: string | null;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

// ============================================================================
// NOTIFICATION TYPE CONFIG
// ============================================================================

const NOTIFICATION_TYPES = [
  {
    key: "homeworkEnabled",
    label: "Homework",
    description: "New homework assignments and due date reminders",
    icon: FileText,
    color: "rgb(59, 130, 246)",
  },
  {
    key: "announcementEnabled",
    label: "Announcements",
    description: "School-wide announcements and news",
    icon: Bell,
    color: "rgb(139, 92, 246)",
  },
  {
    key: "gradeEnabled",
    label: "Grades",
    description: "New grades and assessment results",
    icon: Award,
    color: "rgb(34, 197, 94)",
  },
  {
    key: "attendanceEnabled",
    label: "Attendance",
    description: "Daily attendance marking and alerts",
    icon: Check,
    color: "rgb(249, 115, 22)",
  },
  {
    key: "reminderEnabled",
    label: "Reminders",
    description: "General reminders and upcoming events",
    icon: Calendar,
    color: "rgb(168, 85, 247)",
  },
  {
    key: "alertEnabled",
    label: "Alerts",
    description: "Urgent alerts and important notifications",
    icon: AlertTriangle,
    color: "rgb(239, 68, 68)",
  },
  {
    key: "messageEnabled",
    label: "Messages",
    description: "New messages from teachers and counselors",
    icon: MessageSquare,
    color: "rgb(6, 182, 212)",
  },
  {
    key: "feeEnabled",
    label: "Fee Reminders",
    description: "Fee payment due dates and reminders",
    icon: CreditCard,
    color: "rgb(236, 72, 153)",
  },
  {
    key: "timetableEnabled",
    label: "Timetable",
    description: "Class schedule changes and updates",
    icon: BookOpen,
    color: "rgb(99, 102, 241)",
  },
  {
    key: "examEnabled",
    label: "Exams",
    description: "Exam schedules and result notifications",
    icon: GraduationCap,
    color: "rgb(244, 63, 94)",
  },
] as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface PushNotificationSettingsProps {
  className?: string;
}

export function PushNotificationSettings({ className }: PushNotificationSettingsProps) {
  const [settings, setSettings] = useState<PushSettings | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const pushStatus = usePushNotificationStatus();
  const { subscribe, unsubscribe } = usePushNotification({ autoSubscribe: false });

  // Fetch settings and subscriptions on mount
  useEffect(() => {
    fetchSettings();
    fetchSubscriptions();
  }, []);

  // Fetch notification settings
  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/push/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");

      const data = await response.json();
      setSettings(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's subscriptions
  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/push/subscribe");
      if (!response.ok) return;

      const data = await response.json();
      setSubscriptions(data.data || []);
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
    }
  };

  // Update a single setting
  const updateSetting = useCallback(
    async (key: keyof PushSettings, value: boolean | string) => {
      if (!settings) return;

      setSettings((prev) => ({ ...prev!, [key]: value }));

      // Debounced save
      await saveSettings({ ...settings, [key]: value });
    },
    [settings]
  );

  // Save settings to server
  const saveSettings = async (newSettings: PushSettings) => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const response = await fetch("/api/push/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      setSaveStatus("error");
      setError(err instanceof Error ? err.message : "Failed to save settings");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle enable/disable all
  const toggleAll = async (enabled: boolean) => {
    if (!settings) return;

    const newSettings = {
      ...settings,
      enabled,
      // When disabling all, turn off individual types too
      ...(enabled
        ? {}
        : {
            homeworkEnabled: false,
            announcementEnabled: false,
            gradeEnabled: false,
            attendanceEnabled: false,
            reminderEnabled: false,
            alertEnabled: false, // Keep alerts on actually
            messageEnabled: false,
            feeEnabled: false,
            timetableEnabled: false,
            examEnabled: false,
          }),
    };

    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  // Handle subscribe/unsubscribe
  const handleSubscribe = async () => {
    await subscribe();
    await fetchSubscriptions();
  };

  const handleUnsubscribe = async () => {
    await unsubscribe();
    await fetchSubscriptions();
  };

  // Get device icon
  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType) {
      case "mobile":
        return Smartphone;
      case "tablet":
        return Tablet;
      default:
        return Monitor;
    }
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className={className}>
        <div className="text-center py-12 text-gray-500">
          <BellOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Failed to load notification settings</p>
          <Button variant="outline" className="mt-4" onClick={fetchSettings}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Save Status Toast */}
      <AnimatePresence>
        {saveStatus !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
            style={{
              backgroundColor: saveStatus === "success" ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)",
              color: "white",
            }}
          >
            {saveStatus === "success" ? (
              <>
                <Check className="w-5 h-5" />
                <span>Settings saved</span>
              </>
            ) : (
              <>
                <X className="w-5 h-5" />
                <span>Failed to save</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Settings Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgb(59, 130, 246, 0.1)" }}
            >
              {settings.enabled ? (
                <Bell className="w-5 h-5" style={{ color: "rgb(59, 130, 246)" }} />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Push Notifications</h3>
              <p className="text-sm text-gray-500">
                {settings.enabled
                  ? "Notifications are enabled"
                  : "Notifications are disabled"}
              </p>
            </div>
          </div>

          {/* Master Toggle */}
          <button
            onClick={() => toggleAll(!settings.enabled)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              settings.enabled ? "bg-blue-600" : "bg-gray-200"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                settings.enabled ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {/* Subscription Status */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Device Status</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {pushStatus.isSubscribed
                  ? "This device is subscribed to notifications"
                  : "This device is not receiving push notifications"}
              </p>
            </div>
            <div className="flex gap-2">
              {pushStatus.isSubscribed ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnsubscribe}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <BellOff className="w-4 h-4 mr-2" />
                  Unsubscribe
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSubscribe}
                  disabled={!pushStatus.isSupported || pushStatus.isDenied}
                  style={{ background: "rgb(59, 130, 246)", color: "white" }}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Subscribe
                </Button>
              )}
            </div>
          </div>

          {/* Active Subscriptions List */}
          {subscriptions.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Active Devices</p>
              {subscriptions.map((sub) => {
                const DeviceIcon = getDeviceIcon(sub.deviceType);
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <DeviceIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {sub.deviceType || "Unknown Device"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(sub.lastUsedAt || sub.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {sub.isActive && (
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notification Type Preferences */}
        <div className="p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Notification Types</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {NOTIFICATION_TYPES.map((type) => {
              const Icon = type.icon;
              const isEnabled = settings.enabled && settings[type.key];
              const isAlert = type.key === "alertEnabled";

              return (
                <div
                  key={type.key}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    isEnabled ? "bg-gray-50 border-gray-200" : "bg-gray-100/50 border-gray-200 opacity-60"
                  )}
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${type.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: type.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{type.label}</p>
                      <button
                        onClick={() => updateSetting(type.key, !settings[type.key])}
                        disabled={isAlert || !settings.enabled}
                        className={cn(
                          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                          isEnabled ? "bg-blue-600" : "bg-gray-300",
                          (isAlert || !settings.enabled) && "cursor-not-allowed opacity-50"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                            isEnabled ? "translate-x-5" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-gray-600" />
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Quiet Hours</h4>
                <p className="text-xs text-gray-500">
                  {settings.quietHoursEnabled
                    ? `Notifications muted from ${settings.quietHoursStart} to ${settings.quietHoursEnd}`
                    : "Always receive notifications"}
                </p>
              </div>
            </div>
            <button
              onClick={() => updateSetting("quietHoursEnabled", !settings.quietHoursEnabled)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                settings.quietHoursEnabled ? "bg-blue-600" : "bg-gray-200"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  settings.quietHoursEnabled ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <AnimatePresence>
            {settings.quietHoursEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={settings.quietHoursStart || "22:00"}
                    onChange={(e) => updateSetting("quietHoursStart", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">End Time</label>
                  <input
                    type="time"
                    value={settings.quietHoursEnd || "07:00"}
                    onChange={(e) => updateSetting("quietHoursEnd", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="quietHoursOnlyOnMobile"
                    checked={settings.quietHoursOnlyOnMobile}
                    onChange={(e) =>
                      updateSetting("quietHoursOnlyOnMobile", e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="quietHoursOnlyOnMobile" className="text-xs text-gray-600">
                    Only apply quiet hours on mobile devices
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex gap-3">
          <InfoIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">About Push Notifications</p>
            <p className="text-blue-700">
              Push notifications allow you to receive updates even when you're not actively
              using the app. You can manage which types of notifications you receive and set
              quiet hours to avoid disturbances.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// ============================================================================
// LIGHTWEIGHT VARIANT
// ============================================================================

interface PushNotificationToggleProps {
  className?: string;
}

export function PushNotificationToggle({ className }: PushNotificationToggleProps) {
  const pushStatus = usePushNotificationStatus();
  const { subscribe, unsubscribe, isLoading } = usePushNotification({ autoSubscribe: false });

  const handleToggle = async () => {
    if (pushStatus.isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading || !pushStatus.isSupported}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
        pushStatus.isSubscribed
          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
        (isLoading || !pushStatus.isSupported) && "opacity-50 cursor-not-allowed"
      )}
    >
      {isLoading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : pushStatus.isSubscribed ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      {pushStatus.isSubscribed ? "Notifications On" : "Notifications Off"}
    </button>
  );
}
