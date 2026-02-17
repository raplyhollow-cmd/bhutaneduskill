/**
 * SCHOOL ADMIN - SCHOOL SETTINGS
 *
 * Features:
 * - School profile and information
 * - Academic settings with year configuration
 * - Grading system configuration
 * - Bell schedule management
 * - Fee structure management
 * - Notification preferences
 * - System integrations
 * - Security settings
 *
 * All settings persist to the database via API calls.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  GraduationCap,
  DollarSign,
  Bell,
  Shield,
  Link as LinkIcon,
  Save,
  Check,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Users,
  Calendar,
  Settings as SettingsIcon,
  ToggleLeft,
  ToggleRight,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

type GradingSystem = "percentage" | "gpa" | "cwa" | "grade";

interface SchoolSettings {
  // General
  schoolName: string;
  schoolCode: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  website: string;
  logo: string;

  // Academic
  academicYearStart: string;
  academicYearEnd: string;
  currentTerm: string;
  gradingSystem: GradingSystem;
  passMark: string;
  workingDays: string[];

  // Fee Settings
  currency: string;
  lateFeeEnabled: boolean;
  lateFeeAmount: string;
  lateFeeAfter: string;
  discountEnabled: boolean;

  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  attendanceAlerts: boolean;
  feeReminders: boolean;
  examResults: boolean;

  // Integration Settings
  paymentGateway: string;
  emailService: string;
  smsService: string;

  // Security Settings
  twoFactorAuth: boolean;
  sessionTimeout: string;
  ipRestriction: boolean;
  allowedIps: string;
}

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  currentTerm: string | null;
  terms: Array<{
    name: string;
    startDate: string;
    endDate: string;
  }> | null;
}

interface GradeConfiguration {
  id: string;
  gradingSystem: string;
  passMark: string;
  grades: Array<{
    grade: string;
    minScore: number;
    maxScore: number;
    label: string;
    gpa?: number;
  }> | null;
}

interface BellSchedule {
  id: string;
  name: string;
  isActive: boolean;
  periods: Array<{
    periodNumber: number;
    name: string;
    startTime: string;
    endTime: string;
    type: "class" | "break" | "lunch";
  }> | null;
}

interface ApiResponse {
  school?: SchoolInfo;
  settings?: SchoolSettings;
  academicYears?: AcademicYear[];
  gradeConfiguration?: GradeConfiguration;
  bellSchedules?: BellSchedule[];
  error?: string;
}

interface SchoolInfo {
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  logo: string;
}

// SchoolSettingsData is now merged into SchoolSettings interface above
// Keeping this alias for backward compatibility with existing code
type SchoolSettingsData = SchoolSettings;

// ============================================================================
// TABS CONFIGURATION
// ============================================================================

const tabs = [
  { id: "general", name: "General", icon: Building2 },
  { id: "academic", name: "Academic", icon: GraduationCap },
  { id: "grades", name: "Grades", icon: GraduationCap },
  { id: "schedule", name: "Schedule", icon: Clock },
  { id: "fees", name: "Fees", icon: DollarSign },
  { id: "notifications", name: "Notifications", icon: Bell },
  { id: "integrations", name: "Integrations", icon: LinkIcon },
  { id: "security", name: "Security", icon: Shield },
];

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultSettings: SchoolSettings = {
  // General
  schoolName: "",
  schoolCode: "",
  email: "",
  phone: "",
  address: "",
  district: "Thimphu",
  website: "",
  logo: "",

  // Academic
  academicYearStart: "",
  academicYearEnd: "",
  currentTerm: "",
  gradingSystem: "percentage",
  passMark: "40",
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],

  // Fee Settings
  currency: "BTN",
  lateFeeEnabled: false,
  lateFeeAmount: "0",
  lateFeeAfter: "0",
  discountEnabled: false,

  // Notification Settings
  emailNotifications: true,
  smsNotifications: true,
  attendanceAlerts: true,
  feeReminders: true,
  examResults: true,

  // Integration Settings
  paymentGateway: "rma",
  emailService: "resend",
  smsService: "bmobile",

  // Security Settings
  twoFactorAuth: false,
  sessionTimeout: "60",
  ipRestriction: false,
  allowedIps: "",
};

const districts = [
  "Thimphu", "Paro", "Punakha", "Wangdue Phodrang", "Gasa", "Dagana",
  "Tsirang", "Sarpang", "Zhemgang", "Trongsa", "Bumthang", "Mongar",
  "Lhuentse", "Trashigang", "Trashiyangtse", "Samdrup Jongkhar",
  "Pema Gatshel", "Samtse", "Chukha", "Haa"
];

const gradingSystems = [
  { value: "percentage", label: "Percentage (0-100%)" },
  { value: "gpa", label: "GPA (4.0 Scale)" },
  { value: "cwa", label: "CWA (Cumulative Weighted Average)" },
  { value: "grade", label: "Letter Grade (A-F)" },
];

const defaultGrades = {
  percentage: [
    { grade: "A+", minScore: 90, maxScore: 100, label: "Excellent" },
    { grade: "A", minScore: 80, maxScore: 89, label: "Very Good" },
    { grade: "B", minScore: 70, maxScore: 79, label: "Good" },
    { grade: "C", minScore: 60, maxScore: 69, label: "Satisfactory" },
    { grade: "D", minScore: 50, maxScore: 59, label: "Pass" },
    { grade: "F", minScore: 0, maxScore: 49, label: "Fail" },
  ],
  gpa: [
    { grade: "4.0", minScore: 90, maxScore: 100, label: "Excellent", gpa: 4.0 },
    { grade: "3.7", minScore: 85, maxScore: 89, label: "Very Good", gpa: 3.7 },
    { grade: "3.3", minScore: 80, maxScore: 84, label: "Good", gpa: 3.3 },
    { grade: "3.0", minScore: 75, maxScore: 79, label: "Good", gpa: 3.0 },
    { grade: "2.7", minScore: 70, maxScore: 74, label: "Satisfactory", gpa: 2.7 },
    { grade: "2.0", minScore: 60, maxScore: 69, label: "Satisfactory", gpa: 2.0 },
    { grade: "1.0", minScore: 50, maxScore: 59, label: "Pass", gpa: 1.0 },
    { grade: "0.0", minScore: 0, maxScore: 49, label: "Fail", gpa: 0.0 },
  ],
  cwa: [
    { grade: "A", minScore: 75, maxScore: 100, label: "Excellent" },
    { grade: "B", minScore: 65, maxScore: 74, label: "Very Good" },
    { grade: "C", minScore: 55, maxScore: 64, label: "Good" },
    { grade: "D", minScore: 45, maxScore: 54, label: "Satisfactory" },
    { grade: "F", minScore: 0, maxScore: 44, label: "Fail" },
  ],
  grade: [
    { grade: "A", minScore: 80, maxScore: 100, label: "Excellent" },
    { grade: "B", minScore: 70, maxScore: 79, label: "Very Good" },
    { grade: "C", minScore: 60, maxScore: 69, label: "Good" },
    { grade: "D", minScore: 50, maxScore: 59, label: "Pass" },
    { grade: "F", minScore: 0, maxScore: 49, label: "Fail" },
  ],
};

const defaultBellSchedulePeriods = [
  { periodNumber: 1, name: "Morning Assembly", startTime: "08:00", endTime: "08:15", type: "break" as const },
  { periodNumber: 2, name: "Period 1", startTime: "08:15", endTime: "09:00", type: "class" as const },
  { periodNumber: 3, name: "Period 2", startTime: "09:00", endTime: "09:45", type: "class" as const },
  { periodNumber: 4, name: "Short Break", startTime: "09:45", endTime: "10:00", type: "break" as const },
  { periodNumber: 5, name: "Period 3", startTime: "10:00", endTime: "10:45", type: "class" as const },
  { periodNumber: 6, name: "Period 4", startTime: "10:45", endTime: "11:30", type: "class" as const },
  { periodNumber: 7, name: "Lunch Break", startTime: "11:30", endTime: "12:15", type: "lunch" as const },
  { periodNumber: 8, name: "Period 5", startTime: "12:15", endTime: "13:00", type: "class" as const },
  { periodNumber: 9, name: "Period 6", startTime: "13:00", endTime: "13:45", type: "class" as const },
  { periodNumber: 10, name: "Period 7", startTime: "13:45", endTime: "14:30", type: "class" as const },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SchoolSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [settings, setSettings] = useState<SchoolSettings>(defaultSettings);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [gradeConfiguration, setGradeConfiguration] = useState<GradeConfiguration | null>(null);
  const [bellSchedules, setBellSchedules] = useState<BellSchedule[]>([]);

  const [newAcademicYear, setNewAcademicYear] = useState<Partial<AcademicYear>>({
    name: "",
    startDate: "",
    endDate: "",
    isActive: false,
    currentTerm: "",
    terms: null,
  });

  const [newBellSchedule, setNewBellSchedule] = useState<Partial<BellSchedule>>({
    name: "",
    isActive: true,
    periods: defaultBellSchedulePeriods,
  });

  const hasFetched = useRef(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/school-admin/settings");
      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch settings");
      }

      // Update settings from database
      if (data.settings) {
        setSettings({
          schoolName: data.settings.schoolName || "",
          schoolCode: data.settings.schoolCode || "",
          email: data.settings.email || "",
          phone: data.settings.phone || "",
          address: data.settings.address || "",
          district: data.settings.district || "Thimphu",
          website: data.settings.website || "",
          logo: data.settings.logo || "",
          academicYearStart: data.settings.academicYearStart || "",
          academicYearEnd: data.settings.academicYearEnd || "",
          currentTerm: data.settings.currentTerm || "",
          gradingSystem: data.settings.gradingSystem || "percentage",
          passMark: data.settings.passMark || "40",
          workingDays: data.settings.workingDays || defaultSettings.workingDays,
          currency: data.settings.currency || "BTN",
          lateFeeEnabled: data.settings.lateFeeEnabled ?? false,
          lateFeeAmount: data.settings.lateFeeAmount || "0",
          lateFeeAfter: data.settings.lateFeeAfter || "0",
          discountEnabled: data.settings.discountEnabled ?? false,
          emailNotifications: data.settings.emailNotifications ?? true,
          smsNotifications: data.settings.smsNotifications ?? true,
          attendanceAlerts: data.settings.attendanceAlerts ?? true,
          feeReminders: data.settings.feeReminders ?? true,
          examResults: data.settings.examResults ?? true,
          paymentGateway: data.settings.paymentGateway || "rma",
          emailService: data.settings.emailService || "resend",
          smsService: data.settings.smsService || "bmobile",
          twoFactorAuth: data.settings.twoFactorAuth ?? false,
          sessionTimeout: data.settings.sessionTimeout || "60",
          ipRestriction: data.settings.ipRestriction ?? false,
          allowedIps: data.settings.allowedIps || "",
        });
      }

      // Update school info if available
      if (data.school) {
        setSettings((prev) => ({
          ...prev,
          schoolName: data.school?.name || prev.schoolName,
          schoolCode: data.school?.code || prev.schoolCode,
          email: data.school?.email || prev.email,
          phone: data.school?.phone || prev.phone,
          address: data.school?.address || prev.address,
          website: data.school?.website || prev.website,
          logo: data.school?.logo || prev.logo,
        }));
      }

      if (data.academicYears) {
        setAcademicYears(data.academicYears);
      }

      if (data.gradeConfiguration) {
        setGradeConfiguration(data.gradeConfiguration);
      }

      if (data.bellSchedules) {
        setBellSchedules(data.bellSchedules);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      setErrorMessage("Failed to load settings. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // SAVE HANDLERS
  // ============================================================================

  const handleSave = async (section?: string) => {
    setIsSaving(true);
    setSaveStatus("idle");
    setErrorMessage(null);

    try {
      const payload = section
        ? { section, ...getSectionData(section) }
        : settings;

      const response = await fetch("/api/school-admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to save settings");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const getSectionData = (section: string): Record<string, unknown> => {
    switch (section) {
      case "general":
        return {
          schoolName: settings.schoolName,
          schoolCode: settings.schoolCode,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          district: settings.district,
          website: settings.website,
          logo: settings.logo,
        };
      case "academic":
        return {
          academicYearStart: settings.academicYearStart,
          academicYearEnd: settings.academicYearEnd,
          currentTerm: settings.currentTerm,
          gradingSystem: settings.gradingSystem,
          passMark: settings.passMark,
          workingDays: settings.workingDays,
        };
      default:
        return { ...settings };
    }
  };

  // ============================================================================
  // ACADEMIC YEAR MANAGEMENT
  // ============================================================================

  const handleCreateAcademicYear = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/school-admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_academic_year",
          ...newAcademicYear,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create academic year");
      }

      const data = await response.json();
      setAcademicYears((prev) => [...prev, data.academicYear]);
      setNewAcademicYear({
        name: "",
        startDate: "",
        endDate: "",
        isActive: false,
        currentTerm: "",
        terms: null,
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to create academic year:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAcademicYear = async (id: string) => {
    if (!confirm("Are you sure you want to delete this academic year?")) return;

    try {
      const response = await fetch(`/api/school-admin/settings/academic-years/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete academic year");
      }

      setAcademicYears((prev) => prev.filter((ay) => ay.id !== id));
    } catch (error) {
      console.error("Failed to delete academic year:", error);
    }
  };

  // ============================================================================
  // GRADE CONFIGURATION MANAGEMENT
  // ============================================================================

  const handleSaveGradeConfiguration = async () => {
    setIsSaving(true);
    try {
      const grades = defaultGrades[settings.gradingSystem as keyof typeof defaultGrades];

      const response = await fetch("/api/school-admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_grade_configuration",
          gradingSystem: settings.gradingSystem,
          passMark: settings.passMark,
          grades,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save grade configuration");
      }

      const data = await response.json();
      setGradeConfiguration(data.gradeConfiguration);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to save grade configuration:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // BELL SCHEDULE MANAGEMENT
  // ============================================================================

  const handleCreateBellSchedule = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/school-admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_bell_schedule",
          ...newBellSchedule,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create bell schedule");
      }

      const data = await response.json();
      setBellSchedules((prev) => [...prev, data.bellSchedule]);
      setNewBellSchedule({
        name: "",
        isActive: true,
        periods: defaultBellSchedulePeriods,
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to create bell schedule:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBellSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bell schedule?")) return;

    try {
      const response = await fetch(`/api/school-admin/settings/bell-schedules/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete bell schedule");
      }

      setBellSchedules((prev) => prev.filter((bs) => bs.id !== id));
    } catch (error) {
      console.error("Failed to delete bell schedule:", error);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (field: keyof SchoolSettings, value: string | string[] | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Settings</h1>
          <p className="text-gray-600 mt-1">Manage your school's configuration and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchSettings()}>
            <SettingsIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => handleSave(activeTab)}
            disabled={isSaving}
            className="text-white"
            style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saveStatus === "success" ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="font-semibold text-red-900">{errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {saveStatus === "success" && !errorMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <p className="font-semibold text-green-900">Settings saved successfully!</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <Card>
          <CardContent className="pt-6">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeTab === tab.id
                      ? "bg-violet-100 text-violet-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {/* GENERAL TAB */}
          {activeTab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-violet-600" />
                  General Settings
                </CardTitle>
                <CardDescription>Basic information about your school</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                    <Input
                      value={settings.schoolName}
                      onChange={(e) => handleChange("schoolName", e.target.value)}
                      placeholder="Enter school name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Code</label>
                    <Input
                      value={settings.schoolCode}
                      onChange={(e) => handleChange("schoolCode", e.target.value)}
                      placeholder="Enter school code"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <Input
                      type="email"
                      value={settings.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="school@edu.bt"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </label>
                    <Input
                      value={settings.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+975 2 XXXXXX"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </label>
                    <Input
                      value={settings.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      placeholder="School address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                    <select
                      value={settings.district}
                      onChange={(e) => handleChange("district", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {districts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Website
                    </label>
                    <Input
                      value={settings.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                      placeholder="www.school.edu.bt"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ACADEMIC TAB */}
          {activeTab === "academic" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-violet-600" />
                  Academic Settings
                </CardTitle>
                <CardDescription>Configure academic year and calendar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Academic Year Dates
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year Start</label>
                      <Input
                        type="date"
                        value={settings.academicYearStart}
                        onChange={(e) => handleChange("academicYearStart", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year End</label>
                      <Input
                        type="date"
                        value={settings.academicYearEnd}
                        onChange={(e) => handleChange("academicYearEnd", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Term</label>
                      <Input
                        value={settings.currentTerm}
                        onChange={(e) => handleChange("currentTerm", e.target.value)}
                        placeholder="e.g., Spring 2025"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Working Days</h3>
                  <div className="flex flex-wrap gap-2">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const newDays = settings.workingDays.includes(day)
                            ? settings.workingDays.filter((d) => d !== day)
                            : [...settings.workingDays, day];
                          handleChange("workingDays", newDays);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          settings.workingDays.includes(day)
                            ? "bg-violet-100 text-violet-700 border border-violet-300"
                            : "bg-gray-100 text-gray-600 border border-gray-300"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Academic Years</h3>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab("academic-years")}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Year
                    </Button>
                  </div>
                  {academicYears.length > 0 ? (
                    <div className="space-y-2">
                      {academicYears.map((ay) => (
                        <div key={ay.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{ay.name}</span>
                            <Badge variant={ay.isActive ? "default" : "secondary"}>
                              {ay.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{ay.startDate} to {ay.endDate}</span>
                            <button
                              onClick={() => handleDeleteAcademicYear(ay.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No academic years configured yet.</p>
                  )}
                </div>

                {/* Create New Academic Year */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Create New Academic Year</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year Name</label>
                      <Input
                        value={newAcademicYear.name}
                        onChange={(e) => setNewAcademicYear({ ...newAcademicYear, name: e.target.value })}
                        placeholder="e.g., 2025-2026"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Term</label>
                      <Input
                        value={newAcademicYear.currentTerm || ""}
                        onChange={(e) => setNewAcademicYear({ ...newAcademicYear, currentTerm: e.target.value })}
                        placeholder="e.g., Spring 2025"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <Input
                        type="date"
                        value={newAcademicYear.startDate}
                        onChange={(e) => setNewAcademicYear({ ...newAcademicYear, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <Input
                        type="date"
                        value={newAcademicYear.endDate}
                        onChange={(e) => setNewAcademicYear({ ...newAcademicYear, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={newAcademicYear.isActive}
                      onChange={(e) => setNewAcademicYear({ ...newAcademicYear, isActive: e.target.checked })}
                      className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700">
                      Set as active academic year
                    </label>
                  </div>
                  <Button
                    onClick={handleCreateAcademicYear}
                    disabled={!newAcademicYear.name || !newAcademicYear.startDate || !newAcademicYear.endDate}
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Academic Year
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* GRADES TAB */}
          {activeTab === "grades" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-violet-600" />
                  Grade Configuration
                </CardTitle>
                <CardDescription>Configure grading system and grade ranges</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grading System</label>
                    <select
                      value={settings.gradingSystem}
                      onChange={(e) => handleChange("gradingSystem", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {gradingSystems.map((system) => (
                        <option key={system.value} value={system.value}>
                          {system.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pass Mark (%)</label>
                    <Input
                      type="number"
                      value={settings.passMark}
                      onChange={(e) => handleChange("passMark", e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Grade Ranges ({settings.gradingSystem.toUpperCase()})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Grade</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Range</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Label</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(defaultGrades[settings.gradingSystem as keyof typeof defaultGrades] || []).map((grade) => (
                          <tr key={grade.grade} className="border-b">
                            <td className="py-2 px-4 font-medium">{grade.grade}</td>
                            <td className="py-2 px-4">{grade.minScore}% - {grade.maxScore}%</td>
                            <td className="py-2 px-4">{grade.label}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Button onClick={handleSaveGradeConfiguration}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Grade Configuration
                </Button>
              </CardContent>
            </Card>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === "schedule" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-violet-600" />
                  Bell Schedule
                </CardTitle>
                <CardDescription>Configure daily bell schedules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing Schedules */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Existing Schedules</h3>
                  {bellSchedules.length > 0 ? (
                    <div className="space-y-3">
                      {bellSchedules.map((schedule) => (
                        <div key={schedule.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{schedule.name}</span>
                              <Badge variant={schedule.isActive ? "default" : "secondary"}>
                                {schedule.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <button
                              onClick={() => handleDeleteBellSchedule(schedule.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {schedule.periods && (
                            <div className="grid md:grid-cols-2 gap-2 text-sm">
                              {schedule.periods.map((period) => (
                                <div key={period.periodNumber} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                  <span className="font-medium">{period.name}</span>
                                  <span className="text-gray-500">{period.startTime} - {period.endTime}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No bell schedules configured yet.</p>
                  )}
                </div>

                {/* Create New Schedule */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Create New Bell Schedule</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Name</label>
                      <Input
                        value={newBellSchedule.name}
                        onChange={(e) => setNewBellSchedule({ ...newBellSchedule, name: e.target.value })}
                        placeholder="e.g., Regular Day, Short Day, Exam Schedule"
                      />
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Periods</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {(newBellSchedule.periods || defaultBellSchedulePeriods).map((period, index) => (
                          <div key={period.periodNumber} className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                            <span className="w-8 text-center font-medium">{period.periodNumber}</span>
                            <Input
                              value={period.name}
                              onChange={(e) => {
                                const updated = [...(newBellSchedule.periods || defaultBellSchedulePeriods)];
                                updated[index] = { ...period, name: e.target.value };
                                setNewBellSchedule({ ...newBellSchedule, periods: updated });
                              }}
                              className="flex-1"
                            />
                            <Input
                              type="time"
                              value={period.startTime}
                              onChange={(e) => {
                                const updated = [...(newBellSchedule.periods || defaultBellSchedulePeriods)];
                                updated[index] = { ...period, startTime: e.target.value };
                                setNewBellSchedule({ ...newBellSchedule, periods: updated });
                              }}
                              className="w-32"
                            />
                            <span>-</span>
                            <Input
                              type="time"
                              value={period.endTime}
                              onChange={(e) => {
                                const updated = [...(newBellSchedule.periods || defaultBellSchedulePeriods)];
                                updated[index] = { ...period, endTime: e.target.value };
                                setNewBellSchedule({ ...newBellSchedule, periods: updated });
                              }}
                              className="w-32"
                            />
                            <select
                              value={period.type}
                              onChange={(e) => {
                                const updated = [...(newBellSchedule.periods || defaultBellSchedulePeriods)];
                                updated[index] = { ...period, type: e.target.value as "class" | "break" | "lunch" };
                                setNewBellSchedule({ ...newBellSchedule, periods: updated });
                              }}
                              className="px-2 py-1 border rounded w-24"
                            >
                              <option value="class">Class</option>
                              <option value="break">Break</option>
                              <option value="lunch">Lunch</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="scheduleIsActive"
                        checked={newBellSchedule.isActive}
                        onChange={(e) => setNewBellSchedule({ ...newBellSchedule, isActive: e.target.checked })}
                        className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                      />
                      <label htmlFor="scheduleIsActive" className="text-sm text-gray-700">
                        Set as active schedule
                      </label>
                    </div>

                    <Button
                      onClick={handleCreateBellSchedule}
                      disabled={!newBellSchedule.name}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Bell Schedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* FEES TAB */}
          {activeTab === "fees" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-violet-600" />
                  Fee Settings
                </CardTitle>
                <CardDescription>Configure currency and late fee policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={settings.currency || "BTN"}
                    onChange={(e) => handleChange("currency", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="BTN">Ngultrum (BTN)</option>
                    <option value="INR">Indian Rupee (INR)</option>
                    <option value="USD">US Dollar (USD)</option>
                  </select>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Late Fee Configuration</h3>
                      <p className="text-sm text-gray-500">Apply penalty for late fee payments</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange("lateFeeEnabled", !settings.lateFeeEnabled)}
                      className="relative"
                    >
                      {settings.lateFeeEnabled ? (
                        <ToggleRight className="w-12 h-6 text-violet-600" />
                      ) : (
                        <ToggleLeft className="w-12 h-6 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {settings.lateFeeEnabled && (
                    <div className="grid md:grid-cols-2 gap-4 pl-4 border-l-4 border-violet-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee Amount</label>
                        <Input
                          value={settings.lateFeeAmount || "0"}
                          onChange={(e) => handleChange("lateFeeAmount", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apply After (Days)</label>
                        <Input
                          type="number"
                          value={settings.lateFeeAfter || "0"}
                          onChange={(e) => handleChange("lateFeeAfter", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Early Payment Discount</h3>
                      <p className="text-sm text-gray-500">Offer discounts for early fee payments</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange("discountEnabled", !settings.discountEnabled)}
                      className="relative"
                    >
                      {settings.discountEnabled ? (
                        <ToggleRight className="w-12 h-6 text-violet-600" />
                      ) : (
                        <ToggleLeft className="w-12 h-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-violet-600" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Manage how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "emailNotifications" as const, label: "Email Notifications", desc: "Receive notifications via email" },
                  { key: "smsNotifications" as const, label: "SMS Notifications", desc: "Receive important alerts via SMS" },
                  { key: "attendanceAlerts" as const, label: "Attendance Alerts", desc: "Get notified about low attendance" },
                  { key: "feeReminders" as const, label: "Fee Reminders", desc: "Remind parents about pending fees" },
                  { key: "examResults" as const, label: "Exam Results", desc: "Notify when results are published" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange(item.key, !settings[item.key])}
                      className="relative"
                    >
                      {settings[item.key] ? (
                        <ToggleRight className="w-12 h-6 text-violet-600" />
                      ) : (
                        <ToggleLeft className="w-12 h-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === "integrations" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-violet-600" />
                  Integrations
                </CardTitle>
                <CardDescription>Configure third-party service connections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Payment Gateway</h3>
                  <select
                    value={settings.paymentGateway || "rma"}
                    onChange={(e) => handleChange("paymentGateway", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="rma">RMA (Bhutan)</option>
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Email Service</h3>
                  <select
                    value={settings.emailService || "resend"}
                    onChange={(e) => handleChange("emailService", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="resend">Resend</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="ses">Amazon SES</option>
                  </select>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">SMS Service</h3>
                  <select
                    value={settings.smsService || "bmobile"}
                    onChange={(e) => handleChange("smsService", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="bmobile">Bhutan Telecom</option>
                    <option value="tashicell">TashiCell</option>
                    <option value="twilio">Twilio</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-violet-600" />
                  Security Settings
                </CardTitle>
                <CardDescription>Configure security and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange("twoFactorAuth", !settings.twoFactorAuth)}
                    className="relative"
                  >
                    {settings.twoFactorAuth ? (
                      <ToggleRight className="w-12 h-6 text-violet-600" />
                    ) : (
                      <ToggleLeft className="w-12 h-6 text-gray-400" />
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                  <Input
                    type="number"
                    value={settings.sessionTimeout || "60"}
                    onChange={(e) => handleChange("sessionTimeout", e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-logout after period of inactivity</p>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-gray-900">IP Restriction</p>
                      <p className="text-sm text-gray-500">Limit access to specific IP addresses</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange("ipRestriction", !settings.ipRestriction)}
                      className="relative"
                    >
                      {settings.ipRestriction ? (
                        <ToggleRight className="w-12 h-6 text-violet-600" />
                      ) : (
                        <ToggleLeft className="w-12 h-6 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {settings.ipRestriction && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allowed IP Addresses</label>
                      <textarea
                        value={settings.allowedIps || ""}
                        onChange={(e) => handleChange("allowedIps", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter IP addresses, one per line"
                      />
                      <p className="text-xs text-gray-500 mt-1">One IP per line. Use CIDR notation for ranges.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
