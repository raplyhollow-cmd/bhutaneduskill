/**
 * SCHOOL ADMIN - SCHOOL SETTINGS
 *
 * Features:
 * - School profile and information
 * - Academic settings
 * - Grading system configuration
 * - Fee structure management
 * - Notification preferences
 * - System integrations
 * - Security settings
 */

"use client";

import { useState } from "react";
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
} from "lucide-react";

// Tabs
const tabs = [
  { id: "general", name: "General", icon: Building2 },
  { id: "academic", name: "Academic", icon: GraduationCap },
  { id: "fees", name: "Fees", icon: DollarSign },
  { id: "notifications", name: "Notifications", icon: Bell },
  { id: "integrations", name: "Integrations", icon: LinkIcon },
  { id: "security", name: "Security", icon: Shield },
];

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
  gradingSystem: string;
  passMark: string;
  workingDays: string[];

  // Fees
  currency: string;
  lateFeeEnabled: boolean;
  lateFeeAmount: string;
  lateFeeAfter: string;
  discountEnabled: boolean;

  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  attendanceAlerts: boolean;
  feeReminders: boolean;
  examResults: boolean;

  // Integrations
  paymentGateway: string;
  emailService: string;
  smsService: string;

  // Security
  twoFactorAuth: boolean;
  sessionTimeout: string;
  ipRestriction: boolean;
  allowedIps: string;
}

export default function SchoolSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const [settings, setSettings] = useState<SchoolSettings>({
    // General
    schoolName: "Demo Higher Secondary School",
    schoolCode: "DEMO2025001",
    email: "admin@demoschool.edu.bt",
    phone: "+975 2 322456",
    address: "Thimphu, Bhutan",
    district: "Thimphu",
    website: "www.demoschool.edu.bt",
    logo: "",

    // Academic
    academicYearStart: "2025-02-10",
    academicYearEnd: "2025-12-15",
    currentTerm: "Spring 2025",
    gradingSystem: "percentage",
    passMark: "40",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],

    // Fees
    currency: "BTN",
    lateFeeEnabled: true,
    lateFeeAmount: "500",
    lateFeeAfter: "10",
    discountEnabled: true,

    // Notifications
    emailNotifications: true,
    smsNotifications: true,
    attendanceAlerts: true,
    feeReminders: true,
    examResults: true,

    // Integrations
    paymentGateway: "rma",
    emailService: "resend",
    smsService: "bmobile",

    // Security
    twoFactorAuth: false,
    sessionTimeout: "60",
    ipRestriction: false,
    allowedIps: "",
  });

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSaving(false);
    setSaveStatus("success");

    setTimeout(() => setSaveStatus("idle"), 3000);
  };

  const handleChange = (field: keyof SchoolSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Settings</h1>
          <p className="text-gray-600 mt-1">Manage your school's configuration and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Advanced
          </Button>
          <Button
            onClick={handleSave}
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

      {/* Success Message */}
      {saveStatus === "success" && (
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Code</label>
                    <Input
                      value={settings.schoolCode}
                      onChange={(e) => handleChange("schoolCode", e.target.value)}
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
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">School Logo</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-violet-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-10 h-10 text-violet-600" />
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        Upload New Logo
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">Recommended: 200x200px PNG or JPG</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "academic" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-violet-600" />
                  Academic Settings
                </CardTitle>
                <CardDescription>Configure academic year and grading system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Academic Year
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
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Grading System</h3>
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
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Working Days</h3>
                  <div className="flex flex-wrap gap-2">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                      <button
                        key={day}
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
              </CardContent>
            </Card>
          )}

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
                    value={settings.currency}
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
                          value={settings.lateFeeAmount}
                          onChange={(e) => handleChange("lateFeeAmount", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apply After (Days)</label>
                        <Input
                          type="number"
                          value={settings.lateFeeAfter}
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
                  { key: "emailNotifications", label: "Email Notifications", desc: "Receive notifications via email" },
                  { key: "smsNotifications", label: "SMS Notifications", desc: "Receive important alerts via SMS" },
                  { key: "attendanceAlerts", label: "Attendance Alerts", desc: "Get notified about low attendance" },
                  { key: "feeReminders", label: "Fee Reminders", desc: "Remind parents about pending fees" },
                  { key: "examResults", label: "Exam Results", desc: "Notify when results are published" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleChange(item.key as keyof SchoolSettings, !settings[item.key as keyof SchoolSettings])}
                      className="relative"
                    >
                      {settings[item.key as keyof SchoolSettings] ? (
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
                    value={settings.paymentGateway}
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
                    value={settings.emailService}
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
                    value={settings.smsService}
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
                    value={settings.sessionTimeout}
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
                        value={settings.allowedIps}
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
