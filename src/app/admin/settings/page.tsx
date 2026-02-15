/**
 * PLATFORM ADMIN - SETTINGS
 *
 * Platform-wide configuration, system settings, and preferences.
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database,
  Mail,
  Globe,
  Palette,
  Users,
  Building2,
  Lock,
  Key,
  AlertCircle,
  CheckCircle,
  Save,
  RefreshCw,
  Trash2,
  Plus,
  X,
  Eye,
  EyeOff,
  Download,
  Upload,
  Monitor,
  Smartphone,
  Clock,
  Loader2,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

// Types
interface SettingsData {
  // General Settings
  platformName: string;
  platformUrl: string;
  supportEmail: string;
  contactPhone: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  defaultLanguage: string;

  // Security Settings
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  loginAttempts: number;
  lockoutDuration: number;

  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  newSchoolSignup: boolean;
  paymentReceived: boolean;
  systemAlerts: boolean;
  weeklyDigest: boolean;
  securityAlerts: boolean;

  // Feature Flags
  careerAssessments: boolean;
  schoolManagement: boolean;
  tuitionMarketplace: boolean;
  parentPortal: boolean;
  counselorTools: boolean;
  analyticsDashboard: boolean;
  mobileApp: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;

  // Maintenance Mode
  enableMaintenanceMode: boolean;
  maintenanceMessage: string;
  scheduledMaintenanceStart: string | null;
  scheduledMaintenanceEnd: string | null;

  // Tax Settings
  gstRate: number;
  taxInclusive: boolean;

  // Integration Status (read-only)
  integrations: {
    clerk: boolean;
    neon: boolean;
    resend: boolean;
    posthog: boolean;
    sentry: boolean;
    upstash: boolean;
    rma: boolean;
  };
}

// Default settings (fallback)
const defaultSettings: SettingsData = {
  platformName: "Bhutan EduSkill",
  platformUrl: "https://careercompass.bt",
  supportEmail: "support@careercompass.bt",
  contactPhone: "+975 2 34567",
  timezone: "Asia/Thimphu",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12h",
  defaultLanguage: "en",
  twoFactorAuth: true,
  sessionTimeout: 60,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
  loginAttempts: 5,
  lockoutDuration: 15,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  newSchoolSignup: true,
  paymentReceived: true,
  systemAlerts: true,
  weeklyDigest: true,
  securityAlerts: true,
  careerAssessments: true,
  schoolManagement: true,
  tuitionMarketplace: true,
  parentPortal: true,
  counselorTools: true,
  analyticsDashboard: true,
  mobileApp: false,
  apiAccess: true,
  whiteLabel: false,
  enableMaintenanceMode: false,
  maintenanceMessage: "We are currently performing scheduled maintenance. Please check back soon.",
  scheduledMaintenanceStart: null,
  scheduledMaintenanceEnd: null,
  gstRate: 7,
  taxInclusive: true,
  integrations: {
    clerk: true,
    neon: true,
    resend: false,
    posthog: true,
    sentry: true,
    upstash: false,
    rma: true,
  },
};

const integrations = [
  {
    id: "clerk",
    key: "clerk" as const,
    name: "Clerk",
    description: "Authentication & user management",
    icon: Shield,
  },
  {
    id: "neon",
    key: "neon" as const,
    name: "Neon PostgreSQL",
    description: "Production database",
    icon: Database,
  },
  {
    id: "resend",
    key: "resend" as const,
    name: "Resend",
    description: "Email service provider",
    icon: Mail,
  },
  {
    id: "posthog",
    key: "posthog" as const,
    name: "PostHog",
    description: "Analytics and product insights",
    icon: Monitor,
  },
  {
    id: "sentry",
    key: "sentry" as const,
    name: "Sentry",
    description: "Error tracking and monitoring",
    icon: AlertCircle,
  },
  {
    id: "upstash",
    key: "upstash" as const,
    name: "Upstash Redis",
    description: "Caching and rate limiting",
    icon: Database,
  },
  {
    id: "rma",
    key: "rma" as const,
    name: "RMA Payment Gateway",
    description: "Bhutan payment processing",
    icon: Key,
  },
];

const storageUsage = {
  total: 10737418240, // 10GB in bytes
  used: 5452595200, // ~5GB used
  breakdown: [
    { name: "Database", used: 3221225472, color: "rgb(236 72 153)" },
    { name: "Documents", used: 1073741824, color: "rgb(59 130 246)" },
    { name: "Images", used: 858993459, color: "rgb(139 92 246)" },
    { name: "Backups", used: 298634442, color: "rgb(107 114 128)" },
  ],
};

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general");
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);
  const originalSettings = useRef<SettingsData>(defaultSettings);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/settings");

      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }

      const data = await response.json();

      if (data.success && data.data) {
        const fetchedSettings = { ...defaultSettings, ...data.data };
        setSettings(fetchedSettings);
        originalSettings.current = fetchedSettings;
      }
    } catch (err: any) {
      console.error("Error fetching settings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      // Determine which category to save based on active tab
      const category = activeTab === "features" ? "features" :
                       activeTab === "maintenance" ? "maintenance" :
                       activeTab === "notifications" ? "notifications" :
                       activeTab === "security" ? "security" : "general";

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          settings: settings,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Settings saved",
          description: `${category.charAt(0).toUpperCase() + category.slice(1)} settings have been updated successfully.`,
          variant: "default",
        });
        setHasChanges(false);
        originalSettings.current = { ...settings };
      } else {
        throw new Error(data.error || "Failed to save settings");
      }
    } catch (err: any) {
      console.error("Error saving settings:", err);
      toast({
        title: "Save failed",
        description: err.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAll() {
    setSaving(true);
    setError(null);

    try {
      // Save all categories
      const categories = ["general", "security", "notifications", "features", "maintenance"];
      const promises = categories.map((category) =>
        fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            settings: settings,
          }),
        })
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every((r) => r.ok);

      if (allSuccess) {
        toast({
          title: "All settings saved",
          description: "Platform settings have been updated successfully.",
          variant: "default",
        });
        setHasChanges(false);
        originalSettings.current = { ...settings };
      } else {
        throw new Error("Some settings failed to save");
      }
    } catch (err: any) {
      console.error("Error saving settings:", err);
      toast({
        title: "Save failed",
        description: err.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function updateSetting<K extends keyof SettingsData>(key: K, value: SettingsData[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }

  async function handleDangerZoneAction(action: string) {
    if (!confirm(`Are you sure you want to perform this action? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Action completed",
          description: data.message || "The action was completed successfully.",
          variant: "default",
        });
      } else {
        throw new Error(data.error || "Failed to perform action");
      }
    } catch (err: any) {
      console.error("Error performing action:", err);
      toast({
        title: "Action failed",
        description: err.message || "Failed to perform action. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchSettings} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const storagePercent = Math.round((storageUsage.used / storageUsage.total) * 100);

  // Tab navigation
  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "features", label: "Features", icon: Globe },
    { id: "integrations", label: "Integrations", icon: Key },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Platform Settings
          </h1>
          <p className="text-gray-600">
            Configure platform-wide settings and preferences
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Settings
          </Button>
          <Button
            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            className="text-white"
            onClick={handleSaveAll}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes {hasChanges && "(Unsaved)"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "general" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              General Settings
            </CardTitle>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Platform Name</label>
                <input
                  type="text"
                  value={settings.platformName}
                  onChange={(e) => updateSetting("platformName", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Platform URL</label>
                <input
                  type="url"
                  value={settings.platformUrl}
                  onChange={(e) => updateSetting("platformUrl", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => updateSetting("supportEmail", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Contact Phone</label>
                <input
                  type="tel"
                  value={settings.contactPhone}
                  onChange={(e) => updateSetting("contactPhone", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => updateSetting("timezone", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                >
                  <option>Asia/Thimphu</option>
                  <option>Asia/Kolkata</option>
                  <option>Asia/Dhaka</option>
                  <option>UTC</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Default Language</label>
                <select
                  value={settings.defaultLanguage}
                  onChange={(e) => updateSetting("defaultLanguage", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                >
                  <option value="en">English</option>
                  <option value="dz">Dzongkha</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date Format</label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => updateSetting("dateFormat", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                >
                  <option>DD/MM/YYYY</option>
                  <option>MM/DD/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Time Format</label>
                <select
                  value={settings.timeFormat}
                  onChange={(e) => updateSetting("timeFormat", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                >
                  <option value="12h">12-hour (AM/PM)</option>
                  <option value="24h">24-hour</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                className="text-white"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save General Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "security" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Configure platform security policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Require 2FA for all admin accounts</p>
                  </div>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => updateSetting("twoFactorAuth", checked)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => updateSetting("sessionTimeout", parseInt(e.target.value) || 60)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Max Login Attempts</label>
                  <input
                    type="number"
                    value={settings.loginAttempts}
                    onChange={(e) => updateSetting("loginAttempts", parseInt(e.target.value) || 5)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="font-medium text-gray-900 mb-4">Password Requirements</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Minimum Length</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.passwordMinLength}
                        onChange={(e) => updateSetting("passwordMinLength", parseInt(e.target.value) || 8)}
                        className="w-16 px-2 py-1 rounded border border-gray-300 text-center text-sm"
                      />
                      <span className="text-sm text-gray-500">characters</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Require Uppercase</span>
                    <Switch
                      checked={settings.passwordRequireUppercase}
                      onCheckedChange={(checked) => updateSetting("passwordRequireUppercase", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Require Numbers</span>
                    <Switch
                      checked={settings.passwordRequireNumbers}
                      onCheckedChange={(checked) => updateSetting("passwordRequireNumbers", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Require Special Characters</span>
                    <Switch
                      checked={settings.passwordRequireSpecialChars}
                      onCheckedChange={(checked) => updateSetting("passwordRequireSpecialChars", checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleDangerZoneAction("reset_api_keys")}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Reset API Keys
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDangerZoneAction("regenerate_secrets")}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Secrets
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                className="text-white"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Security Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "notifications" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>Manage how and when notifications are sent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { key: "emailNotifications", label: "Email Notifications", description: "Receive notifications via email" },
                { key: "smsNotifications", label: "SMS Notifications", description: "Receive critical alerts via SMS" },
                { key: "pushNotifications", label: "Push Notifications", description: "Browser and mobile push notifications" },
                { key: "newSchoolSignup", label: "New School Signups", description: "When a new school registers" },
                { key: "paymentReceived", label: "Payment Received", description: "When payments are successfully processed" },
                { key: "systemAlerts", label: "System Alerts", description: "Critical system notifications" },
                { key: "weeklyDigest", label: "Weekly Digest", description: "Summary of weekly platform activity" },
                { key: "securityAlerts", label: "Security Alerts", description: "Security-related notifications" },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{setting.label}</p>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <Switch
                    checked={settings[setting.key as keyof SettingsData] as boolean}
                    onCheckedChange={(checked) => updateSetting(setting.key as keyof SettingsData, checked)}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                className="text-white"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Notification Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "features" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { key: "careerAssessments", label: "Career Assessments", icon: Monitor },
                  { key: "schoolManagement", label: "School Management", icon: Building2 },
                  { key: "tuitionMarketplace", label: "Tuition Marketplace", icon: Users },
                  { key: "parentPortal", label: "Parent Portal", icon: Users },
                  { key: "counselorTools", label: "Counselor Tools", icon: Monitor },
                  { key: "analyticsDashboard", label: "Analytics Dashboard", icon: Monitor },
                  { key: "mobileApp", label: "Mobile App", icon: Smartphone },
                  { key: "apiAccess", label: "API Access", icon: Key },
                  { key: "whiteLabel", label: "White Label Options", icon: Palette },
                ].map((feature) => {
                  const FeatureIcon = feature.icon;
                  const isEnabled = settings[feature.key as keyof SettingsData] as boolean;
                  return (
                    <div
                      key={feature.key}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isEnabled
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isEnabled
                                ? "bg-green-100"
                                : "bg-gray-200"
                            }`}
                          >
                            <FeatureIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{feature.label}</p>
                            <p className="text-xs text-gray-500">
                              {isEnabled ? "Feature is enabled" : "Feature is disabled"}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => updateSetting(feature.key as keyof SettingsData, checked)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Maintenance Mode
              </CardTitle>
              <CardDescription>Take the platform offline for maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Enable Maintenance Mode</p>
                  <p className="text-sm text-gray-500">
                    When enabled, only admins can access the platform
                  </p>
                </div>
                <Switch
                  checked={settings.enableMaintenanceMode}
                  onCheckedChange={(checked) => updateSetting("enableMaintenanceMode", checked)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Maintenance Message</label>
                <textarea
                  value={settings.maintenanceMessage}
                  onChange={(e) => updateSetting("maintenanceMessage", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
              className="text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Feature Settings"}
            </Button>
          </div>
        </>
      )}

      {activeTab === "integrations" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Integrations
              </CardTitle>
              <CardDescription>Connected services and third-party integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {integrations.map((integration) => {
                  const Icon = integration.icon;
                  const isConnected = settings.integrations[integration.key];
                  return (
                    <div
                      key={integration.id}
                      className={`p-4 rounded-lg border-2 ${
                        isConnected
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isConnected
                                ? "bg-green-100"
                                : "bg-gray-200"
                            }`}
                          >
                            <Icon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{integration.name}</p>
                            <p className="text-xs text-gray-500">{integration.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isConnected ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                              <X className="w-3 h-3 mr-1" />
                              Disconnected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Storage & Backups */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Storage Usage
                </CardTitle>
                <CardDescription>Platform storage breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">{storagePercent}%</div>
                  <p className="text-sm text-gray-500">
                    {formatBytes(storageUsage.used)} of {formatBytes(storageUsage.total)} used
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${storagePercent}%`,
                      background: "linear-gradient(90deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
                    }}
                  />
                </div>
                <div className="space-y-2">
                  {storageUsage.breakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-medium text-gray-900">{formatBytes(item.used)}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Cleanup Storage
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Backup & Restore
                </CardTitle>
                <CardDescription>Manage platform backups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900">Daily Backup</p>
                        <p className="text-xs text-gray-500">Last: Today, 2:00 AM</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900">Weekly Backup</p>
                        <p className="text-xs text-gray-500">Last: Sunday, 3:00 AM</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Upload className="w-4 h-4 mr-2" />
                    Restore
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Danger Zone - Always Visible */}
      <Card className="border-red-200">
        <CardHeader className="border-b border-red-100">
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="font-medium text-gray-900">Clear All Caches</p>
              <p className="text-sm text-gray-500">Clear all system caches (may affect performance temporarily)</p>
            </div>
            <Button
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-100"
              onClick={() => handleDangerZoneAction("clear_caches")}
            >
              Clear Caches
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="font-medium text-gray-900">Reset All Feature Flags</p>
              <p className="text-sm text-gray-500">Reset all feature flags to default values</p>
            </div>
            <Button
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-100"
              onClick={() => handleDangerZoneAction("reset_feature_flags")}
            >
              Reset Flags
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="font-medium text-gray-900">Delete All Logs</p>
              <p className="text-sm text-gray-500">Permanently delete all system and activity logs</p>
            </div>
            <Button
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-100"
              onClick={() => handleDangerZoneAction("delete_logs")}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
