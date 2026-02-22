"use client";

import { useState } from "react";
import {
  Settings,
  Bell,
  Mail,
  Shield,
  Users,
  Database,
  Key,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MinistrySettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const colors = {
    primary: "rgb(168 85 247)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6" style={{ color: colors.primary }} />
            <h1 className="text-3xl font-bold text-gray-900">Ministry Settings</h1>
          </div>
          <p className="text-gray-600 mt-1">Configure your Ministry portal preferences</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          style={{ background: colors.gradient }}
          className="text-white"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" />
              <CardTitle>Notification Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Daily Briefing Email</label>
              <Select defaultValue="enabled">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">Enabled - 8:00 AM daily</SelectItem>
                  <SelectItem value="digest">Weekly Digest Only</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Receive daily national education briefing</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Critical Alerts</label>
              <Select defaultValue="immediate">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="hourly">Hourly Digest</SelectItem>
                  <SelectItem value="daily">Daily Summary</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">How to receive urgent GNH or workforce alerts</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Report Notifications</label>
              <Select defaultValue="ready">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ready">When Ready</SelectItem>
                  <SelectItem value="scheduled">Scheduled Only</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Get notified when scheduled reports are ready</p>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <CardTitle>Data & Privacy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Data Aggregation Level</label>
              <Select defaultValue="dzongkhag">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">National Only</SelectItem>
                  <SelectItem value="dzongkhag">By Dzongkhag</SelectItem>
                  <SelectItem value="school">By School</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Minimum aggregation level for all analytics</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Student Data Retention</label>
              <Select defaultValue="7years">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3years">3 Years After Graduation</SelectItem>
                  <SelectItem value="5years">5 Years After Graduation</SelectItem>
                  <SelectItem value="7years">7 Years After Graduation</SelectItem>
                  <SelectItem value="forever">Retain Indefinitely</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">How long to retain student records</p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Anonymize GNH Data</p>
                  <p className="text-xs text-gray-500">Strip personal identifiers from wellbeing data</p>
                </div>
                <div className="w-12 h-6 bg-purple-600 rounded-full p-1 cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* EMIS Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              <CardTitle>EMIS Integration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Sync Frequency</label>
              <Select defaultValue="daily">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="daily">Daily (22:00)</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="manual">Manual Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">How often to sync with national EMIS database</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">API Key</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="password"
                  value="sk-xxxxxxxxxxxx"
                  disabled
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                />
                <Button variant="outline" size="sm">Regenerate</Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">API key for EMIS system integration</p>
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <CardTitle>User Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-900">Ministry Users</p>
                <span className="text-sm text-purple-600 font-medium">12 active</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">Users with Ministry portal access</p>
              <Button variant="outline" size="sm" className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-900">Role Permissions</p>
                <span className="text-sm text-purple-600 font-medium">6 roles</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">Configure RBAC roles and permissions</p>
              <Button variant="outline" size="sm" className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                Configure Roles
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-600" />
            <CardTitle>Account Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Last Password Change</p>
              <p className="text-sm text-gray-600">30 days ago</p>
              <Button variant="outline" size="sm" className="mt-2">Change Password</Button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Two-Factor Authentication</p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Enabled
              </p>
              <Button variant="outline" size="sm" className="mt-2">Configure</Button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Active Sessions</p>
              <p className="text-sm text-gray-600">2 sessions</p>
              <Button variant="outline" size="sm" className="mt-2">Manage Sessions</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
