"use client";

import { logger } from "@/lib/logger";
/**
 * STUDENT SETTINGS PAGE
 *
 * Features:
 * - Profile editing (name, bio, contact info)
 * - Profile picture upload
 * - Notification preferences with database persistence
 * - Account management (links to Clerk)
 * - Preferences (theme, notifications)
 */


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Mail,
  Shield,
  Bell,
  Palette,
  LogOut,
  Save,
  Camera,
  Loader2,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";

// Types for our data structures
type UserProfile = {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string;
  bio: string;
  dateOfBirth: string;
  gender: string;
  grade: number;
  classGrade: number;
  section: string;
  rollNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  interests: string[];
  goals: string;
};

type NotificationSettings = {
  id: string;
  userId: string;
  emailEnabled: boolean;
  emailAnnouncements: boolean;
  emailAlerts: boolean;
  emailReminders: boolean;
  inAppEnabled: boolean;
  inAppAnnouncements: boolean;
  inAppAlerts: boolean;
  inAppReminders: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
};

type SettingsData = {
  profile: UserProfile;
  notifications: NotificationSettings;
};

export default function StudentSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Bhutan");
  const [interests, setInterests] = useState("");
  const [goals, setGoals] = useState("");

  // Notification state
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailAnnouncements, setEmailAnnouncements] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [inAppAnnouncements, setInAppAnnouncements] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [inAppReminders, setInAppReminders] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("07:00");

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/student/settings");
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }
        const data = await response.json();
        setSettings(data.data);

        // Populate form fields
        const profile = data.data.profile;
        const notifications = data.data.notifications;

        setFirstName(profile.firstName || "");
        setLastName(profile.lastName || "");
        setBio(profile.bio || "");
        setPhone(profile.phone || "");
        setDateOfBirth(profile.dateOfBirth || "");
        setGender(profile.gender || "");
        setAddress(profile.address || "");
        setCity(profile.city || "");
        setState(profile.state || "");
        setPostalCode(profile.postalCode || "");
        setCountry(profile.country || "Bhutan");
        setInterests(Array.isArray(profile.interests) ? profile.interests.join(", ") : "");
        setGoals(profile.goals || "");

        // Notification settings
        setEmailEnabled(notifications.emailEnabled ?? true);
        setEmailAnnouncements(notifications.emailAnnouncements ?? true);
        setEmailAlerts(notifications.emailAlerts ?? true);
        setEmailReminders(notifications.emailReminders ?? true);
        setInAppEnabled(notifications.inAppEnabled ?? true);
        setInAppAnnouncements(notifications.inAppAnnouncements ?? true);
        setInAppAlerts(notifications.inAppAlerts ?? true);
        setInAppReminders(notifications.inAppReminders ?? true);
        setQuietHoursStart(notifications.quietHoursStart || "22:00");
        setQuietHoursEnd(notifications.quietHoursEnd || "07:00");
      } catch (error) {
        logger.error("Failed to fetch settings:", error);
        setSaveError("Failed to load settings. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setSaveError("Please select an image file.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSaveError("Image must be less than 5MB.");
      return;
    }

    setIsSaving(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "profile");

      setUploadProgress(30);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();
      const imageUrl = data.file.url;

      setUploadProgress(90);

      // Update settings with new profile image
      await saveSettings({ profileImage: imageUrl });

      setUploadProgress(100);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      logger.error("Upload error:", error);
      setSaveError(error instanceof Error ? error.message : "Failed to upload profile picture");
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  // Save settings to database
  const saveSettings = async (additionalData: Record<string, unknown> = {}) => {
    const updateData = {
      firstName,
      lastName,
      phone,
      bio,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      postalCode,
      country,
      interests: interests.split(",").map((i) => i.trim()).filter(Boolean),
      goals,
      emailEnabled,
      emailAnnouncements,
      emailAlerts,
      emailReminders,
      inAppEnabled,
      inAppAnnouncements,
      inAppAlerts,
      inAppReminders,
      quietHoursStart,
      quietHoursEnd,
      ...additionalData,
    };

    const response = await fetch("/api/student/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to save settings");
    }

    return await response.json();
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await saveSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      logger.error("Save error:", error);
      setSaveError(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Get avatar URL or initials
  const getAvatarDisplay = () => {
    if (settings?.profile.profileImage) {
      return (
        <img
          src={settings.profile.profileImage}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      );
    }
    const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
    return (
      <span className="text-2xl font-semibold text-orange-600">
        {initials}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your profile and preferences
        </p>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-green-700 dark:text-green-300">Settings saved successfully!</p>
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <X className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300">{saveError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Profile Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden border-4 border-white dark:border-gray-700 shadow-sm">
                  {getAvatarDisplay()}
                </div>
                <label
                  htmlFor="profilePicture"
                  className="absolute bottom-0 right-0 p-2 bg-orange-600 text-white rounded-full cursor-pointer hover:bg-orange-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </label>
                <input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureUpload}
                  disabled={isSaving}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Profile Picture</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Upload a new profile picture. Max size: 5MB.
                </p>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself, your interests, and career goals..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Personal Details */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+975 17 00 00 00"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address"
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Thimphu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Dzongkhag</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Thimphu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="11001"
                  />
                </div>
              </div>
            </div>

            {/* Interests and Goals */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interests">Interests</Label>
                <Input
                  id="interests"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="Science, Sports, Music..."
                />
                <p className="text-xs text-gray-500">Separate with commas</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goals">Career Goals</Label>
                <Textarea
                  id="goals"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="What do you want to become?"
                  rows={1}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Manage how you receive updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Notifications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive updates via email</p>
                </div>
                <Switch
                  checked={emailEnabled}
                  onCheckedChange={setEmailEnabled}
                />
              </div>
              {emailEnabled && (
                <div className="ml-4 space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Announcements</p>
                      <p className="text-xs text-gray-500">School announcements and news</p>
                    </div>
                    <Switch
                      checked={emailAnnouncements}
                      onCheckedChange={setEmailAnnouncements}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Alerts</p>
                      <p className="text-xs text-gray-500">Important alerts and reminders</p>
                    </div>
                    <Switch
                      checked={emailAlerts}
                      onCheckedChange={setEmailAlerts}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Assessment Reminders</p>
                      <p className="text-xs text-gray-500">Reminders for pending assessments</p>
                    </div>
                    <Switch
                      checked={emailReminders}
                      onCheckedChange={setEmailReminders}
                      size="sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* In-App Notifications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">In-App Notifications</p>
                  <p className="text-sm text-gray-500">Push notifications in the app</p>
                </div>
                <Switch
                  checked={inAppEnabled}
                  onCheckedChange={setInAppEnabled}
                />
              </div>
              {inAppEnabled && (
                <div className="ml-4 space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Announcements</p>
                      <p className="text-xs text-gray-500">School announcements and news</p>
                    </div>
                    <Switch
                      checked={inAppAnnouncements}
                      onCheckedChange={setInAppAnnouncements}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Alerts</p>
                      <p className="text-xs text-gray-500">Important alerts and reminders</p>
                    </div>
                    <Switch
                      checked={inAppAlerts}
                      onCheckedChange={setInAppAlerts}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Assessment Reminders</p>
                      <p className="text-xs text-gray-500">Reminders for pending assessments</p>
                    </div>
                    <Switch
                      checked={inAppReminders}
                      onCheckedChange={setInAppReminders}
                      size="sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quiet Hours */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="font-medium mb-3">Quiet Hours</p>
              <p className="text-sm text-gray-500 mb-4">
                Disable notifications during these hours
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quietHoursStart">From</Label>
                  <Input
                    id="quietHoursStart"
                    type="time"
                    value={quietHoursStart}
                    onChange={(e) => setQuietHoursStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quietHoursEnd">To</Label>
                  <Input
                    id="quietHoursEnd"
                    type="time"
                    value={quietHoursEnd}
                    onChange={(e) => setQuietHoursEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Account Security
          </CardTitle>
          <CardDescription>
            Manage your password and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium">Email Address</p>
                <p className="text-sm text-gray-500">{settings?.profile.email}</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/account">Manage</Link>
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-gray-500">Change your password</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/account">Update</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize your viewing experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-gray-500">Light, dark, or system default</p>
            </div>
            <Button variant="outline" disabled>System</Button>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="border-red-200 dark:border-red-900">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">Sign Out</p>
              <p className="text-sm text-gray-500">Sign out of your account</p>
            </div>
            <Button variant="destructive" asChild>
              <a href="/sign-out">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
