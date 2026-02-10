/**
 * PLATFORM ADMIN - SETTINGS
 *
 * Platform-wide configuration, system settings, and preferences.
 */

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
} from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

// Mock settings data
const generalSettings = {
  platformName: "Career Compass",
  platformUrl: "https://careercompass.bt",
  supportEmail: "support@careercompass.bt",
  contactPhone: "+975 2 34567",
  timezone: "Asia/Thimphu",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12h",
  defaultLanguage: "en",
};

const securitySettings = {
  twoFactorAuth: true,
  sessionTimeout: 60,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
  loginAttempts: 5,
  lockoutDuration: 15,
};

const notificationSettings = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  newSchoolSignup: true,
  paymentReceived: true,
  systemAlerts: true,
  weeklyDigest: true,
  securityAlerts: true,
};

const featureFlags = {
  careerAssessments: true,
  schoolManagement: true,
  tuitionMarketplace: true,
  parentPortal: true,
  counselorTools: true,
  analyticsDashboard: true,
  mobileApp: false,
  apiAccess: true,
  whiteLabel: false,
};

const maintenanceSettings = {
  enableMaintenanceMode: false,
  maintenanceMessage: "We are currently performing scheduled maintenance. Please check back soon.",
  scheduledMaintenanceStart: null,
  scheduledMaintenanceEnd: null,
};

const integrations = [
  {
    id: "clerk",
    name: "Clerk",
    description: "Authentication & user management",
    status: "connected",
    icon: "shield",
  },
  {
    id: "neon",
    name: "Neon PostgreSQL",
    description: "Production database",
    status: "connected",
    icon: "database",
  },
  {
    id: "resend",
    name: "Resend",
    description: "Email service provider",
    status: "disconnected",
    icon: "mail",
  },
  {
    id: "posthog",
    name: "PostHog",
    description: "Analytics and product insights",
    status: "connected",
    icon: "bar-chart",
  },
  {
    id: "sentry",
    name: "Sentry",
    description: "Error tracking and monitoring",
    status: "connected",
    icon: "alert-circle",
  },
  {
    id: "upstash",
    name: "Upstash Redis",
    description: "Caching and rate limiting",
    status: "disconnected",
    icon: "database",
  },
  {
    id: "rma",
    name: "RMA Payment Gateway",
    description: "Bhutan payment processing",
    status: "connected",
    icon: "credit-card",
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

export default async function AdminSettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const storagePercent = Math.round((storageUsage.used / storageUsage.total) * 100);

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
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* General Settings */}
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
                defaultValue={generalSettings.platformName}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Platform URL</label>
              <input
                type="url"
                defaultValue={generalSettings.platformUrl}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Support Email</label>
              <input
                type="email"
                defaultValue={generalSettings.supportEmail}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Contact Phone</label>
              <input
                type="tel"
                defaultValue={generalSettings.contactPhone}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Timezone</label>
              <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none">
                <option>Asia/Thimphu</option>
                <option>Asia/Kolkata</option>
                <option>Asia/Dhaka</option>
                <option>UTC</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Default Language</label>
              <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none">
                <option value="en">English</option>
                <option value="dz">Dzongkha</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date Format</label>
              <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none">
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Time Format</label>
              <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none">
                <option>12-hour (AM/PM)</option>
                <option>24-hour</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
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
              <Switch defaultChecked={securitySettings.twoFactorAuth} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                <input
                  type="number"
                  defaultValue={securitySettings.sessionTimeout}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Max Login Attempts</label>
                <input
                  type="number"
                  defaultValue={securitySettings.loginAttempts}
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
                      defaultValue={securitySettings.passwordMinLength}
                      className="w-16 px-2 py-1 rounded border border-gray-300 text-center text-sm"
                    />
                    <span className="text-sm text-gray-500">characters</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Require Uppercase</span>
                  <Switch defaultChecked={securitySettings.passwordRequireUppercase} />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Require Numbers</span>
                  <Switch defaultChecked={securitySettings.passwordRequireNumbers} />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Require Special Characters</span>
                  <Switch defaultChecked={securitySettings.passwordRequireSpecialChars} />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline">
                <Key className="w-4 h-4 mr-2" />
                Reset API Keys
              </Button>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate Secrets
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
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
                <Switch defaultChecked={notificationSettings[setting.key as keyof typeof notificationSettings]} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
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
              { key: "careerAssessments", label: "Career Assessments", icon: "clipboard-list" },
              { key: "schoolManagement", label: "School Management", icon: "building-2" },
              { key: "tuitionMarketplace", label: "Tuition Marketplace", icon: "graduation-cap" },
              { key: "parentPortal", label: "Parent Portal", icon: "users" },
              { key: "counselorTools", label: "Counselor Tools", icon: "message-square" },
              { key: "analyticsDashboard", label: "Analytics Dashboard", icon: "bar-chart-3" },
              { key: "mobileApp", label: "Mobile App", icon: "smartphone" },
              { key: "apiAccess", label: "API Access", icon: "key" },
              { key: "whiteLabel", label: "White Label Options", icon: "palette" },
            ].map((feature) => (
              <div
                key={feature.key}
                className={`p-4 rounded-lg border-2 transition-all ${
                  featureFlags[feature.key as keyof typeof featureFlags]
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        featureFlags[feature.key as keyof typeof featureFlags]
                          ? "bg-green-100"
                          : "bg-gray-200"
                      }`}
                    >
                      <Monitor className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{feature.label}</p>
                      <p className="text-xs text-gray-500">
                        {featureFlags[feature.key as keyof typeof featureFlags]
                          ? "Feature is enabled"
                          : "Feature is disabled"}
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked={featureFlags[feature.key as keyof typeof featureFlags]} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
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
            <Switch defaultChecked={maintenanceSettings.enableMaintenanceMode} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Maintenance Message</label>
            <textarea
              defaultValue={maintenanceSettings.maintenanceMessage}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none resize-none"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Scheduled Start</label>
              <input
                type="datetime-local"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Scheduled End</label>
              <input
                type="datetime-local"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
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

      {/* Integrations */}
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
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className={`p-4 rounded-lg border-2 ${
                  integration.status === "connected"
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        integration.status === "connected"
                          ? "bg-green-100"
                          : "bg-gray-200"
                      }`}
                    >
                      {integration.id === "clerk" && <Shield className="w-5 h-5 text-gray-600" />}
                      {integration.id === "neon" && <Database className="w-5 h-5 text-gray-600" />}
                      {integration.id === "resend" && <Mail className="w-5 h-5 text-gray-600" />}
                      {integration.id === "posthog" && <Monitor className="w-5 h-5 text-gray-600" />}
                      {integration.id === "sentry" && <AlertCircle className="w-5 h-5 text-gray-600" />}
                      {integration.id === "upstash" && <Database className="w-5 h-5 text-gray-600" />}
                      {integration.id === "rma" && <Monitor className="w-5 h-5 text-gray-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{integration.name}</p>
                      <p className="text-xs text-gray-500">{integration.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {integration.status === "connected" ? (
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
                <div className="mt-3 flex gap-2">
                  {integration.status === "connected" ? (
                    <>
                      <Button variant="outline" size="sm" className="flex-1">
                        Configure
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="w-4 h-4 mr-1" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
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
            <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-100">
              Clear Caches
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="font-medium text-gray-900">Reset All Feature Flags</p>
              <p className="text-sm text-gray-500">Reset all feature flags to default values</p>
            </div>
            <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-100">
              Reset Flags
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="font-medium text-gray-900">Delete All Logs</p>
              <p className="text-sm text-gray-500">Permanently delete all system and activity logs</p>
            </div>
            <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-100">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
