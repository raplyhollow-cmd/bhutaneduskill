"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Mail, Calendar, GraduationCap, Target, Award, Edit, Check, X, Loader2 } from "lucide-react";

const BHUTAN_SCHOOLS = [
  "Pelkhil School",
  "Druk School",
  "Yangchenphug HSS",
  "Motithang HSS",
  "Zilukha MSS",
  "Rinchen HSS",
  "Utpal Academy",
  "Other",
];

const GRADES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];

const INTERESTS = [
  "Computers", "Mathematics", "Science", "Art", "Music", "Sports",
  "Writing", "Debating", "Leadership", "Programming", "Design",
  "Business", "Teaching", "Healthcare", "Engineering", "Environment",
];

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    grade: "",
    school: "",
    interests: [] as string[],
    goals: "",
    bio: "",
  });

  // Load profile from database on mount
  useEffect(() => {
    if (isLoaded && user) {
      loadProfile();
    }
  }, [isLoaded, user]);

  const loadProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfile({
            firstName: data.profile.firstName || user?.firstName || "",
            lastName: data.profile.lastName || user?.lastName || "",
            email: data.profile.email || user?.emailAddresses?.[0]?.emailAddress || "",
            dateOfBirth: data.profile.dateOfBirth || "",
            grade: data.profile.grade || "",
            school: data.profile.school || "",
            interests: data.profile.interests || [],
            goals: data.profile.goals || "",
            bio: data.profile.bio || "",
          });
        }
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const saveProfile = async () => {
    setIsLoading(true);
    setSaveStatus("saving");
    setErrorMessage("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        setSaveStatus("saved");
        setTimeout(() => {
          setSaveStatus("idle");
          setIsEditing(false);
        }, 1500);
      } else {
        // Parse error response to show actual error message
        let errorMsg = "Failed to save profile. Please try again.";
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.details || errorMsg;
          console.error("Profile save error:", errorData);
        } catch {
          console.error("Profile save failed with status:", response.status);
        }
        setErrorMessage(errorMsg);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 5000); // Keep error message visible longer
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      setErrorMessage("Network error. Please check your connection and try again.");
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setProfile((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const age = profile.dateOfBirth
    ? new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear()
    : "-";

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and preferences</p>
        </div>
        {!isEditing && (
          <Button variant="outline" onClick={() => { setIsEditing(true); setErrorMessage(""); }}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="grade">Class/Grade</Label>
                <Select value={profile.grade} onValueChange={(value) => setProfile({ ...profile, grade: value })}>
                  <SelectTrigger id="grade">
                    <SelectValue placeholder="Select your grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="school">School</Label>
                <Select value={profile.school} onValueChange={(value) => setProfile({ ...profile, school: value })}>
                  <SelectTrigger id="school">
                    <SelectValue placeholder="Select your school" />
                  </SelectTrigger>
                  <SelectContent>
                    {BHUTAN_SCHOOLS.map((school) => (
                      <SelectItem key={school} value={school}>
                        {school}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={profile.dateOfBirth}
                onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="bio">About Me</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="goals">My Goals</Label>
              <Textarea
                id="goals"
                placeholder="What careers are you interested in? Where do you want to study?"
                value={profile.goals}
                onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label>Interests (select all that apply)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      profile.interests.includes(interest)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={saveProfile} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saveStatus === "saved" ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>

            {saveStatus === "error" && errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium mb-1">Failed to save profile</p>
                <p className="text-red-500 text-xs">{errorMessage}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {profile.firstName[0]}
                    {profile.lastName[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <p className="text-gray-600">{profile.email}</p>
                  <div className="flex gap-2 mt-2">
                    {profile.grade && <Badge variant="secondary">{profile.grade}</Badge>}
                    <Badge variant="outline">Age {age}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{profile.firstName} {profile.lastName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium">
                      {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "Not set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">School</p>
                    <p className="font-medium">{profile.school || "Not set"}</p>
                  </div>
                </div>
              </div>

              {profile.bio && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">About Me</h3>
                  <p className="text-gray-600">{profile.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interests & Goals */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  My Interests
                </CardTitle>
                <CardDescription>Topics and activities you enjoy</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="text-sm px-3 py-1">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No interests selected yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  My Goals
                </CardTitle>
                <CardDescription>Career and education aspirations</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.goals ? (
                  <p className="text-gray-700">{profile.goals}</p>
                ) : (
                  <p className="text-gray-500 text-sm">No goals set yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats Summary */}
          <Card>
            <CardHeader>
              <CardTitle>My Journey So Far</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">-</div>
                  <p className="text-sm text-gray-500">Assessments Completed</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">-</div>
                  <p className="text-sm text-gray-500">Career Matches</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">-</div>
                  <p className="text-sm text-gray-500">Skills in Progress</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">-</div>
                  <p className="text-sm text-gray-500">Study Abroad Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
