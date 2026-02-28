"use client";

import { logger } from "@/lib/logger";
/**
 * TEACHER SETTINGS PAGE
 *
 * Features:
 * - Profile editing (name, contact info)
 * - Profile picture upload
 * - School information display (read-only)
 * - Notification preferences with database persistence
 * - Account management (links to Clerk)
 * - Preferences (theme, notifications)
 */

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Shield,
  Bell,
  LogOut,
  Save,
  Camera,
  Loader2,
  Building2,
  GraduationCap,
  IdCard,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toaster";

// Types for our data structures
type TeacherProfile = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  specialization?: string;
  subjects: string[];
  joiningDate?: string;
  status: string;
  // School info
  schoolId?: string | null;
  schoolName?: string | null;
  schoolCode?: string | null;
  schoolType?: string | null;
};

export default function TeacherSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");

  // Unsaved changes tracking
  const [hasChanges, setHasChanges] = useState(false);
  const originalValues = useRef<Record<string, unknown>>({});

  // Helper to check if current values differ from original
  const checkForChanges = () => {
    const currentValues: Record<string, unknown> = {
      firstName,
      lastName,
      phone,
      specialization,
    };

    const hasChanged = Object.keys(currentValues).some((key) => {
      return currentValues[key] !== originalValues.current[key];
    });

    setHasChanges(hasChanged);
  };

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/teacher/profile?includeStats=false");
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        const profileData = data.data as TeacherProfile;
        setProfile(profileData);

        // Populate form fields
        setFirstName(profileData.firstName || "");
        setLastName(profileData.lastName || "");
        setPhone(profileData.phone || "");
        setSpecialization(profileData.specialization || "");

        // Store original values for change detection
        originalValues.current = {
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          phone: profileData.phone || "",
          specialization: profileData.specialization || "",
        };
      } catch (error) {
        logger.error("Failed to fetch teacher profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile. Please refresh the page.",
          variant: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [toast]);

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "error",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB.",
        variant: "error",
      });
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "profile");

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();
      const imageUrl = data.file.url;

      // Update profile with new image
      await updateProfile({ profileImage: imageUrl });

      toast({
        title: "Photo uploaded",
        description: "Your profile picture has been updated.",
        variant: "success",
      });
    } catch (error) {
      logger.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload profile picture",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update profile helper
  const updateProfile = async (updates: Record<string, unknown>) => {
    const response = await fetch("/api/teacher/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update profile");
    }

    return await response.json();
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      await updateProfile({
        firstName,
        lastName,
        phone,
        specialization,
      });

      // Update original values
      originalValues.current = {
        firstName,
        lastName,
        phone,
        specialization,
      };
      setHasChanges(false);

      toast({
        title: "Settings saved",
        description: "Your profile has been updated successfully.",
        variant: "success",
      });
    } catch (error) {
      logger.error("Save error:", error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Get avatar URL or initials
  const getAvatarDisplay = () => {
    if (profile?.profileImage) {
      return (
        <img
          src={profile.profileImage}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      );
    }
    const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "T";
    return (
      <span className="text-2xl font-semibold text-blue-600">
        {initials}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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

      <form onSubmit={handleSubmit}>
        {/* School Information Card - Read Only */}
        {profile?.schoolName && (
          <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <Building2 className="w-5 h-5" />
                School Information
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Your assigned school (managed by school administrator)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-blue-900 dark:text-blue-100">School Name</Label>
                  <p className="text-gray-900 dark:text-white font-medium mt-1">{profile.schoolName}</p>
                </div>
                <div>
                  <Label className="text-blue-900 dark:text-blue-100">School Code</Label>
                  <p className="text-gray-900 dark:text-white font-medium mt-1">{profile.schoolCode || "N/A"}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-blue-900 dark:text-blue-100">School Type</Label>
                  <p className="text-gray-900 dark:text-white font-medium mt-1 capitalize">{profile.schoolType || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-blue-900 dark:text-blue-100">Status</Label>
                  <p className="text-gray-900 dark:text-white font-medium mt-1 capitalize">{profile.status || "Active"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
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
              </div>
            </div>

            {/* Employment Info - Read Only */}
            {profile && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Employment Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <IdCard className="w-4 h-4" />
                      Employee ID
                    </Label>
                    <p className="text-gray-900 dark:text-white font-medium mt-1">{profile.employeeId || "Not assigned"}</p>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Designation
                    </Label>
                    <p className="text-gray-900 dark:text-white font-medium mt-1">{profile.designation || "Not assigned"}</p>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <p className="text-gray-900 dark:text-white font-medium mt-1">{profile.department || "Not assigned"}</p>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Joining Date
                    </Label>
                    <p className="text-gray-900 dark:text-white font-medium mt-1">
                      {profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : "Not recorded"}
                    </p>
                  </div>
                </div>
                {profile.subjects && profile.subjects.length > 0 && (
                  <div>
                    <Label>Subjects</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.subjects.map((subject, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Editable Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    checkForChanges();
                  }}
                  placeholder="Your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    checkForChanges();
                  }}
                  placeholder="Your last name"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    checkForChanges();
                  }}
                  placeholder="+975 17 00 00 00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={specialization}
                  onChange={(e) => {
                    setSpecialization(e.target.value);
                    checkForChanges();
                  }}
                  placeholder="e.g., Mathematics, Science"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={profile?.email || ""} disabled className="bg-gray-100 dark:bg-gray-800" />
              <p className="text-xs text-gray-500">Contact your administrator to change your email</p>
            </div>

            {hasChanges && (
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
            )}
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
                <p className="text-sm text-gray-500">{profile?.email}</p>
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
