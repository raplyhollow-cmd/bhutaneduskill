"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  User,
  Globe,
  Moon,
  Sun,
  Mail,
  Shield,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    reminderEnabled: true,
    reminderDay: "sunday",
    reminderTime: "10:00",
    language: "english",
    timezone: "Asia/Thimphu",
    darkMode: false,
  });

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus("saving");

    // Simulate API call
    setTimeout(() => {
      setSaveStatus("saved");
      setIsLoading(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and notifications</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Information
          </CardTitle>
          <CardDescription>Manage your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input value={user?.firstName || ""} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500 mt-1">Managed by Clerk</p>
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={user?.lastName || ""} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500 mt-1">Managed by Clerk</p>
            </div>
          </div>
          <div>
            <Label>Email Address</Label>
            <Input
              value={user?.emailAddresses?.[0]?.emailAddress || ""}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">Contact support to change email</p>
          </div>
          <Button variant="outline" asChild>
            <a href="https://account.clerk.com" target="_blank" rel="noopener noreferrer">
              Manage Account on Clerk
              <Shield className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive updates via email</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, emailNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Progress Digest</p>
              <p className="text-sm text-gray-500">Get a weekly summary of your progress</p>
            </div>
            <Switch
              checked={settings.weeklyDigest}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, weeklyDigest: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Study Reminders</p>
              <p className="text-sm text-gray-500">Gentle reminders to keep learning</p>
            </div>
            <Switch
              checked={settings.reminderEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, reminderEnabled: checked })
              }
            />
          </div>

          {settings.reminderEnabled && (
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label>Day</Label>
                <select
                  value={settings.reminderDay}
                  onChange={(e) => setSettings({ ...settings, reminderDay: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="sunday">Sunday</option>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                </select>
              </div>
              <div>
                <Label>Time</Label>
                <input
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => setSettings({ ...settings, reminderTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-5 h-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5" />
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-gray-500">Switch between light and dark themes</p>
              </div>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
            />
          </div>

          <div>
            <Label>Language</Label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="english">English</option>
              <option value="dzongkha">Dzongkha (རྫོང་ཁ)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">More languages coming soon</p>
          </div>

          <div>
            <Label>Timezone</Label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="Asia/Thimphu">Asia/Thimphu (Bhutan)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (India)</option>
              <option value="Asia/Dhaka">Asia/Dhaka (Bangladesh)</option>
              <option value="Asia/Kathmandu">Asia/Kathmandu (Nepal)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Privacy & Data
          </CardTitle>
          <CardDescription>Control your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Profile Visibility</p>
              <p className="text-sm text-gray-500">Your profile is visible only to you</p>
            </div>
            <Badge variant="secondary">Private</Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Data Collection</p>
              <p className="text-sm text-gray-500">We collect minimal data for personalization</p>
            </div>
            <Badge variant="secondary">Minimal</Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Parental Consent</p>
              <p className="text-sm text-gray-500">Required for users under 18</p>
            </div>
            <Badge variant="outline">Compliant</Badge>
          </div>

          <Button variant="outline" className="w-full">
            Download My Data
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            "Saving..."
          ) : saveStatus === "saved" ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      {/* Danger Zone */}
      <Card className="border-2 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete All Data</p>
              <p className="text-sm text-gray-500">Permanently delete your profile and all data</p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
