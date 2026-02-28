"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  Shield,
  Users,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  User,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Send,
} from "lucide-react";
import { db } from "@/lib/db";
import { counselingSessions, users, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

const GNH_DOMAINS = [
  { id: "psychological", name: "Psychological Wellbeing", description: "Mental health, emotional balance" },
  { id: "community", name: "Community Vitality", description: "Relationships, belonging, support" },
  { id: "time", name: "Time Use", description: "Work-life balance, leisure" },
  { id: "cultural", name: "Cultural Diversity", description: "Cultural preservation, identity" },
  { id: "ecological", name: "Ecological Resilience", description: "Environment connection" },
  { id: "governance", name: "Good Governance", description: "Fair treatment, rights" },
];

const SESSION_TYPES = [
  { id: "individual", name: "Individual", icon: "👤" },
  { id: "group", name: "Group", icon: "👥" },
  { id: "family", name: "Family", icon: "👨‍👩‍👧" },
  { id: "crisis", name: "Crisis Intervention", icon: "🚨" },
];

const CONCERN_CATEGORIES = [
  "Academic Stress",
  "Behavioral Issues",
  "Social Difficulties",
  "Family Problems",
  "Emotional Distress",
  "Anxiety/Depression",
  "Peer Relationships",
  "Self-Esteem",
  "Identity Issues",
  "Substance Use",
  "Trauma",
  "Other",
];

export default function WellnessCompassPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Array<{ id: string; name: string; firstName?: string; lastName?: string; classGrade?: number }>>([]);
  const [showMinistryPreview, setShowMinistryPreview] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    studentId: "",
    sessionType: "individual",
    sessionDate: new Date().toISOString().split("T")[0],
    duration: "30",
    concerns: [] as string[],
    notes: "",
    gnhDomains: [] as string[],
    outcome: "",
    followUpRequired: false,
    followUpDate: "",
    confidentiality: "standard",
    notifyParent: true,
  });

  // Fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      const response = await fetch('/api/counselor/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data.data.students || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  }

  function toggleConcern(concern: string) {
    setFormData((prev) => ({
      ...prev,
      concerns: prev.concerns.includes(concern)
        ? prev.concerns.filter((c) => c !== concern)
        : [...prev.concerns, concern],
    }));
  }

  function toggleGnhDomain(domain: string) {
    setFormData((prev) => ({
      ...prev,
      gnhDomains: prev.gnhDomains.includes(domain)
        ? prev.gnhDomains.filter((d) => d !== domain)
        : [...prev.gnhDomains, domain],
    }));
  }

  function nextStep() {
    if (step < 4) setStep(step + 1);
  }

  function prevStep() {
    if (step > 1) setStep(step - 1);
  }

  async function submitSession() {
    try {
      setIsLoading(true);

      const response = await fetch("/api/counselor/wellness-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to log session");

      // Reset and show success
      alert("Session logged successfully");
      setStep(1);
      setFormData({
        studentId: "",
        sessionType: "individual",
        sessionDate: new Date().toISOString().split("T")[0],
        duration: "30",
        concerns: [],
        notes: "",
        gnhDomains: [],
        outcome: "",
        followUpRequired: false,
        followUpDate: "",
        confidentiality: "standard",
        notifyParent: true,
      });
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to log session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Get anonymized data for Ministry preview
  const ministryData = {
    dzongkhag: "Thimphu", // Would be actual school's dzongkhag
    schoolLevel: "middle",
    sessionType: formData.sessionType,
    concerns: formData.concerns.map((c) =>
      c.toLowerCase().replace(/[^a-z]/g, "_")
    ),
    gnhDomains: formData.gnhDomains,
    outcome: formData.outcome || "in_progress",
    date: formData.sessionDate,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Wellness Compass</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMinistryPreview(!showMinistryPreview)}
          >
            {showMinistryPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showMinistryPreview ? "Hide" : "Show"} Ministry Preview
          </Button>
        </div>
        <p className="text-gray-600 mt-1">Private session logging with GNH alignment</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s}
            </div>
            {s < 4 && (
              <div
                className={`w-16 h-1 ${step > s ? "bg-purple-600" : "bg-gray-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Ministry Preview (when toggled) */}
      {showMinistryPreview && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Ministry Anonymized Preview
            </CardTitle>
            <CardDescription className="text-blue-700">
              This is what the Ministry will see (NO personal identifiers)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-white p-4 rounded border overflow-auto">
              {JSON.stringify(ministryData, null, 2)}
            </pre>
            <div className="flex items-center gap-2 mt-4 text-sm text-blue-700">
              <Lock className="w-4 h-4" />
              <span>Student name and details remain private</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Student Selection & Session Type */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Student & Session Details</CardTitle>
            <CardDescription>Select the student and session type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Student Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.studentId}
                onValueChange={(value) => setFormData({ ...formData, studentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      No students found. Use search to find students.
                    </div>
                  ) : (
                    students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} - Class {student.classGrade}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SESSION_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, sessionType: type.id })}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      formData.sessionType === type.id
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-sm font-medium">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.sessionDate}
                  onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData({ ...formData, duration: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Confidentiality Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confidentiality Level
              </label>
              <Select
                value={formData.confidentiality}
                onValueChange={(value) => setFormData({ ...formData, confidentiality: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard - Visible to school counselors</SelectItem>
                  <SelectItem value="high">High - Limited access</SelectItem>
                  <SelectItem value="critical">Critical - Counselor only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Concerns & GNH Domains */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Areas of Concern</CardTitle>
            <CardDescription>Select concerns and GNH domains addressed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Concern Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Concerns (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CONCERN_CATEGORIES.map((concern) => (
                  <button
                    key={concern}
                    type="button"
                    onClick={() => toggleConcern(concern)}
                    className={`p-3 rounded-lg border text-left text-sm transition-all ${
                      formData.concerns.includes(concern)
                        ? "border-purple-600 bg-purple-50 text-purple-700"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {formData.concerns.includes(concern) && (
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                      )}
                      <span>{concern}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* GNH Domains */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                GNH Domains Addressed
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {GNH_DOMAINS.map((domain) => (
                  <button
                    key={domain.id}
                    type="button"
                    onClick={() => toggleGnhDomain(domain.id)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      formData.gnhDomains.includes(domain.id)
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <div className="font-medium text-sm">{domain.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{domain.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Session Notes */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Session Notes</CardTitle>
            <CardDescription>
              Record your observations and discussion (Private - Counselor Only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Notes <span className="text-red-500">*</span>
              </label>
              <Textarea
                rows={8}
                placeholder="Describe the session: topics discussed, student's responses, observations, recommendations..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                These notes are private and will NOT be shared with Ministry
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Outcome
              </label>
              <Textarea
                rows={3}
                placeholder="Summary of outcome, next steps, agreements made..."
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Submit */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Submit</CardTitle>
            <CardDescription>Review session details before logging</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Session Type:</span>
                  <span className="ml-2 font-medium capitalize">{formData.sessionType}</span>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>
                  <span className="ml-2 font-medium">{formData.sessionDate}</span>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-2 font-medium">{formData.duration} minutes</span>
                </div>
                <div>
                  <span className="text-gray-500">Confidentiality:</span>
                  <span className="ml-2 font-medium capitalize">{formData.confidentiality}</span>
                </div>
              </div>

              {formData.concerns.length > 0 && (
                <div>
                  <span className="text-gray-500 text-sm">Concerns:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.concerns.map((c) => (
                      <Badge key={c} variant="secondary" className="text-xs">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.gnhDomains.length > 0 && (
                <div>
                  <span className="text-gray-500 text-sm">GNH Domains:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.gnhDomains.map((d) => {
                      const domain = GNH_DOMAINS.find((gd) => gd.id === d);
                      return (
                        <Badge key={d} className="text-xs bg-purple-100 text-purple-700">
                          {domain?.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Parent Notification */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="font-medium text-blue-900">Notify Parent</div>
                <div className="text-sm text-blue-700">
                  Send simple notification: "A well-being session was conducted today."
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, notifyParent: !formData.notifyParent })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  formData.notifyParent ? "bg-purple-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    formData.notifyParent ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Follow-up */}
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="followUp"
                checked={formData.followUpRequired}
                onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="followUp" className="text-sm">
                Follow-up session required
              </label>
              {formData.followUpRequired && (
                <Input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  className="w-40"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        {step < 4 ? (
          <Button onClick={nextStep} className="bg-purple-600 hover:bg-purple-700">
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={submitSession}
            disabled={isLoading || !formData.notes}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Log Session
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
