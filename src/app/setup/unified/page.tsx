"use client";

import { logger } from "@/lib/logger";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { WizardContainer } from "@/components/wizard/wizard-container";
import { WizardNavigation } from "@/components/wizard/wizard-navigation";
import { SchoolCodeInput } from "@/components/wizard/school-code-input";
import { SchoolSearchInput, type School as SchoolType } from "@/components/wizard/school-search-input";
import { VerificationCodeInput } from "@/components/wizard/verification-code-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, UserPlus, GraduationCap, Users, BookOpen, School, ChevronRight, ArrowRight, Sparkles, MapPin } from "lucide-react";
import { motion } from "framer-motion";

// Role definitions with colors and icons
const ROLES = [
  {
    id: "student",
    name: "Student",
    description: "Take assessments, explore careers, track your progress",
    icon: "GraduationCap",
    color: "rgb(249 115 22)",
    colorTo: "rgb(194 65 12)",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    steps: [
      { id: "role", title: "Select Role" },
      { id: "find", title: "Find School" },
      { id: "details", title: "Your Details" },
      { id: "academic", title: "Academic Info" },
      { id: "complete", title: "Complete" },
    ],
  },
  {
    id: "teacher",
    name: "Teacher",
    description: "Manage classes, homework, track student progress",
    icon: "BookOpen",
    color: "rgb(59 130 246)",
    colorTo: "rgb(37 99 235)",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    steps: [
      { id: "role", title: "Select Role" },
      { id: "find", title: "Find School" },
      { id: "details", title: "Your Details" },
      { id: "subjects", title: "Subjects & Classes" },
      { id: "complete", title: "Complete" },
    ],
  },
  {
    id: "parent",
    name: "Parent",
    description: "Monitor your child's progress and communicate",
    icon: "Users",
    color: "rgb(107 114 128)",
    colorTo: "rgb(75 85 99)",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    steps: [
      { id: "role", title: "Select Role" },
      { id: "find", title: "Find School" },
      { id: "details", title: "Your Details" },
      { id: "children", title: "Link Children" },
      { id: "complete", title: "Complete" },
    ],
  },
  {
    id: "counselor",
    name: "Counselor",
    description: "Guide students through career and personal development",
    icon: "UserPlus",
    color: "rgb(168 85 247)",
    colorTo: "rgb(147 51 234)",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    steps: [
      { id: "role", title: "Select Role" },
      { id: "find", title: "Find School" },
      { id: "details", title: "Your Details" },
      { id: "specialization", title: "Specialization" },
      { id: "complete", title: "Complete" },
    ],
  },
  {
    id: "school-admin",
    name: "School Admin",
    description: "Manage school, students, teachers, and operations",
    icon: "School",
    color: "rgb(139 92 246)",
    colorTo: "rgb(124 58 237)",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    steps: [
      { id: "role", title: "Select Role" },
      { id: "find", title: "Find School" },
      { id: "details", title: "Your Details" },
      { id: "complete", title: "Complete" },
    ],
  },
];

// Icon mapping
const IconMap = {
  GraduationCap,
  BookOpen,
  Users,
  UserPlus,
  School,
};

// Constants
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDERS = ["Male", "Female", "Other"];
const GRADES = ["6", "7", "8", "9", "10", "11", "12"];
const SECTIONS = ["A", "B", "C", "D", "E"];
const SUBJECT_OPTIONS = [
  "Mathematics", "English", "Dzongkha", "Science", "Physics",
  "Chemistry", "Biology", "History", "Geography", "Economics",
  "Information Technology", "Physical Education", "Art", "Music"
];
const RELATIONSHIPS = ["Father", "Mother", "Guardian", "Grandparent", "Other"];
const SPECIALIZATIONS = [
  "Career Counseling", "Academic Guidance", "Personal Development",
  "College Applications", "Mental Health Support", "Study Skills",
  "Career Assessment", "Goal Setting", "Parent Consultation"
];
const POSITIONS = ["principal", "vice_principal", "admin_officer", "other"];

export default function UnifiedSetupWizard() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<typeof ROLES[0] | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if user is already set up (especially admin users)
  useEffect(() => {
    let isMounted = true;

    fetch("/api/auth/set-role")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;

        const { userType, needsSetup } = data;

        // If user does not need setup, redirect to their portal
        if (!needsSetup && userType) {
          const redirectMap: Record<string, string> = {
            student: "/student",
            teacher: "/teacher",
            parent: "/parent",
            counselor: "/counselor",
            "school-admin": "/school-admin",
            admin: "/admin",
            ministry: "/ministry",
          };
          const redirectPath = redirectMap[userType] || "/setup/unified";
          // Use router.push for Next.js navigation (more reliable than window.location.href)
          router.push(redirectPath);
        }
      })
      .catch(() => {
        // On error, continue showing setup wizard
      });

    return () => {
      isMounted = false;
    };
  }, [router]);


  // Common form fields
  const [schoolCode, setSchoolCode] = useState("");
  const [verifiedSchool, setVerifiedSchool] = useState<any>(null);
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Student specific
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [studentId, setStudentId] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");

  // Teacher specific
  const [employeeId, setEmployeeId] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Parent specific
  const [relationship, setRelationship] = useState("");
  const [children, setChildren] = useState<Array<{ name: string; studentId: string }>>([]);
  const [newChildName, setNewChildName] = useState("");
  const [newChildId, setNewChildId] = useState("");

  // Counselor specific
  const [licenseNumber, setLicenseNumber] = useState("");
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);

  // School Admin specific
  const [position, setPosition] = useState("principal");

  const steps = selectedRole?.steps || ROLES[0].steps;

  const handleRoleSelect = (role: typeof ROLES[0]) => {
    setSelectedRole(role);
    setCurrentStep(2);
  };

  const canGoNext = () => {
    if (!selectedRole) return false;

    switch (selectedRole.id) {
      case "student":
        if (currentStep === 2) return verifiedSchool !== null;
        if (currentStep === 3) return !!(fullName && dateOfBirth && gender);
        if (currentStep === 4) return !!(grade && section);
        return true;
      case "teacher":
        if (currentStep === 2) return verifiedSchool !== null;
        if (currentStep === 3) return !!(fullName && email && phone);
        if (currentStep === 4) return selectedSubjects.length > 0 && selectedClasses.length > 0;
        return true;
      case "parent":
        if (currentStep === 2) return verifiedSchool !== null;
        if (currentStep === 3) return !!(fullName && email && phone && relationship);
        if (currentStep === 4) return children.length > 0;
        return true;
      case "counselor":
        if (currentStep === 2) return verifiedSchool !== null;
        if (currentStep === 3) return !!(fullName && email && phone && qualifications);
        if (currentStep === 4) return true;
        return true;
      case "school-admin":
        if (currentStep === 2) return verifiedSchool !== null;
        if (currentStep === 3) return !!(fullName && email && phone && position);
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    setError("");
    const totalSteps = steps.length;

    if (currentStep === totalSteps) {
      await completeWizard();
    } else if (currentStep === totalSteps - 1) {
      await submitWizardData();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 2 && selectedRole) {
      setSelectedRole(null);
      setCurrentStep(1);
    } else {
      setCurrentStep((prev) => Math.max(1, prev - 1));
    }
  };

  const submitWizardData = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    setError("");

    try {
      const endpoint = `/api/setup/${selectedRole.id}`;
      const body: any = {
        step: "complete",
        data: { schoolCode },
      };

      // Add role-specific data
      switch (selectedRole.id) {
        case "student":
          body.data.personalDetails = { fullName, dateOfBirth, gender, bloodGroup, studentId };
          body.data.academicDetails = { grade, section };
          body.data.guardianDetails = { guardianName, guardianPhone };
          break;
        case "teacher":
          body.data.personalDetails = { fullName, email, phone, employeeId, qualifications };
          body.data.subjects = selectedSubjects;
          body.data.classes = selectedClasses;
          break;
        case "parent":
          body.data.personalDetails = { fullName, email, phone, relationship };
          body.data.children = children;
          break;
        case "counselor":
          body.data.personalDetails = { fullName, email, phone, licenseNumber, qualifications, specializations: selectedSpecializations };
          break;
        case "school-admin":
          body.data.adminName = fullName;
          body.data.adminEmail = email;
          body.data.adminPhone = phone;
          body.data.position = position;
          break;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setCurrentStep((prev) => prev + 1);
      } else {
        // Try to get error details from response
        let errorMsg = `Setup failed (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.details || errorMsg;
        } catch (e) {
          // Response body might not be JSON
          const text = await response.text().catch(() => "");
          if (text) errorMsg = `${errorMsg}: ${text}`;
        }
        logger.error("Setup API error:", errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      logger.error("Setup wizard network error:", errMsg);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const completeWizard = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      // Mark setup as complete
      const response = await fetch("/api/setup/complete", { method: "POST" });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to complete setup");
        return;
      }

      logger.debug("[Setup Complete] Setup complete, redirecting to", `/${selectedRole.id}`);

      // Redirect to portal immediately
      router.push(`/${selectedRole.id}?welcome=true`);
    } catch (err) {
      logger.error("[Setup Complete] Error:", err);
      setError("Failed to complete setup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  const addChild = () => {
    if (newChildName && newChildId) {
      setChildren([...children, { name: newChildName, studentId: newChildId }]);
      setNewChildName("");
      setNewChildId("");
    }
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const toggleClass = (className: string) => {
    setSelectedClasses((prev) =>
      prev.includes(className) ? prev.filter((c) => c !== className) : [...prev, className]
    );
  };

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const renderRoleSelection = () => (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-700">Welcome to Bhutan EduSkill</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Choose your role</h2>
        <p className="text-slate-600 max-w-md mx-auto">Select your role to get started with your personalized onboarding experience</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ROLES.map((role, index) => {
          const Icon = IconMap[role.icon as keyof typeof IconMap];
          return (
            <motion.button
              key={role.id}
              type="button"
              onClick={() => handleRoleSelect(role)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="group relative p-5 rounded-2xl border-2 border-slate-200 bg-white text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-transparent"
              style={{
                boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = role.color;
                e.currentTarget.style.boxShadow = `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1), 0 0 0 4px ${role.color}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgb(226 232 240)";
                e.currentTarget.style.boxShadow = "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)";
              }}
            >
              {/* Gradient background on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `linear-gradient(135deg, ${role.color}08 0%, ${role.colorTo}08 100%)` }}
              />

              {/* Icon container */}
              <div className="flex items-start gap-4 relative">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{ background: `linear-gradient(135deg, ${role.color} 0%, ${role.colorTo} 100%)` }}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 mb-1 text-lg">{role.name}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{role.description}</p>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-2"
                style={{ backgroundColor: `${role.color}15` }}
              >
                <ArrowRight className="w-4 h-4" style={{ color: role.color }} />
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Not sure which role to choose? Contact your school administrator for guidance.</span>
      </div>
    </div>
  );

  const renderSchoolVerification = () => {
    // State 1: No school selected - show search
    if (!selectedSchool) {
      return (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mx-auto">
              <School className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Find Your School</h2>
              <p className="text-slate-600 mt-1">
                {selectedRole?.id === "parent"
                  ? "Search for your child's school to verify and link your account."
                  : "Search for your school by name to verify your enrollment."}
              </p>
            </div>
          </div>

          <SchoolSearchInput onSchoolSelect={setSelectedSchool} />
        </div>
      );
    }

    // State 2: School selected but not verified - show code input
    if (!isCodeVerified) {
      return (
        <div className="space-y-6">
          {/* Selected school card */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <School className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">{selectedSchool.name}</h3>
                  <p className="text-sm text-blue-700 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedSchool.city}
                    {selectedSchool.state && `, ${selectedSchool.state}`}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedSchool(null);
                  setIsCodeVerified(false);
                  setSchoolCode("");
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-white/50"
              >
                Change
              </Button>
            </div>
          </motion.div>

          {/* Verification code input */}
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-slate-900">Enter School Code</h3>
              <p className="text-sm text-slate-600">
                Enter the verification code for <span className="font-medium text-blue-600">{selectedSchool.name}</span>
              </p>
            </div>
            <VerificationCodeInput
              expectedCode={selectedSchool.code}
              schoolName={selectedSchool.name}
              onVerified={(isValid, code) => {
                setIsCodeVerified(isValid);
                setSchoolCode(code);
                if (isValid) {
                  setVerifiedSchool(selectedSchool);
                }
              }}
            />
          </div>
        </div>
      );
    }

    // State 3: Verified - show success
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-900">{selectedSchool.name}</h3>
              <p className="text-sm text-emerald-700 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {selectedSchool.city}
                {selectedSchool.state && `, ${selectedSchool.state}`}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCodeVerified(false);
                setVerifiedSchool(null);
              }}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-white/50"
            >
              Change
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium text-emerald-700">School verified successfully! You can proceed to the next step.</span>
        </motion.div>
      </div>
    );
  };

  const renderPersonalDetails = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mx-auto">
          <GraduationCap className="w-8 h-8 text-slate-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Your Details</h2>
          <p className="text-slate-600 mt-1">
            Tell us about yourself so we can set up your {selectedRole?.name} account.
          </p>
        </div>
      </div>

      <div className="space-y-5 max-w-lg mx-auto">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        {selectedRole?.id === "student" ? (
          <>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bloodGroup">Blood Group (Optional)</Label>
              <Select value={bloodGroup} onValueChange={setBloodGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((bg) => (
                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="studentId">Student ID (Optional)</Label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Your school student ID"
              />
            </div>
          </>
        ) : selectedRole?.id === "teacher" || selectedRole?.id === "counselor" || selectedRole?.id === "school-admin" ? (
          <>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@school.edu.bt"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+975 17 123 456"
              />
            </div>

            {(selectedRole?.id === "teacher" || selectedRole?.id === "counselor") && (
              <>
                <div>
                  <Label htmlFor="employeeId">
                    {selectedRole?.id === "teacher" ? "Employee ID" : "License Number"} (Optional)
                  </Label>
                  <Input
                    id="employeeId"
                    value={selectedRole?.id === "teacher" ? employeeId : licenseNumber}
                    onChange={(e) => selectedRole?.id === "teacher" ? setEmployeeId(e.target.value) : setLicenseNumber(e.target.value)}
                    placeholder={selectedRole?.id === "teacher" ? "Your school employee ID" : "Professional license number"}
                  />
                </div>

                <div>
                  <Label htmlFor="qualifications">Qualifications</Label>
                  <Input
                    id="qualifications"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    placeholder="e.g., B.Ed, M.Ed, M.A. in Counseling"
                  />
                </div>
              </>
            )}

            {selectedRole?.id === "school-admin" && (
              <div>
                <Label htmlFor="position">Position</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your position" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos === "vice_principal" ? "Vice Principal" :
                         pos === "admin_officer" ? "Administrative Officer" :
                         pos.charAt(0).toUpperCase() + pos.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        ) : selectedRole?.id === "parent" ? (
          <>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@example.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+975 17 123 456"
              />
            </div>

            <div>
              <Label htmlFor="relationship">Relationship to Student</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((rel) => (
                    <SelectItem key={rel} value={rel.toLowerCase()}>{rel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );

  const renderAcademicDetails = () => {
    if (selectedRole?.id === "student") {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Academic Details</h2>
            <p className="text-gray-600">Tell us about your current class.</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="grade">Class/Grade</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your class" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>Class {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="section">Section</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s} value={s}>Section {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="guardianName">Guardian Name</Label>
              <Input
                id="guardianName"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="Parent or guardian name"
              />
            </div>

            <div>
              <Label htmlFor="guardianPhone">Guardian Phone</Label>
              <Input
                id="guardianPhone"
                type="tel"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="+975 17 123 456"
              />
            </div>
          </div>
        </div>
      );
    }

    if (selectedRole?.id === "teacher") {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Subjects & Classes</h2>
            <p className="text-gray-600">Select the subjects you teach and your assigned classes.</p>
          </div>

          <div>
            <Label>Subjects (Select at least one)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
              {SUBJECT_OPTIONS.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => toggleSubject(subject)}
                  className={`p-2 text-sm rounded-lg border-2 text-left transition-all ${
                    selectedSubjects.includes(subject)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Classes (Select at least one)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {GRADES.map((className) => (
                <button
                  key={className}
                  type="button"
                  onClick={() => toggleClass(className)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    selectedClasses.includes(className)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  Class {className}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (selectedRole?.id === "parent") {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Link Your Children</h2>
            <p className="text-gray-600">Add your children who are enrolled at this school.</p>
          </div>

          <Card className="p-4">
            <h3 className="font-medium mb-3">Add a Child</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="childName">Child's Name</Label>
                <Input
                  id="childName"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="Enter child's full name"
                />
              </div>

              <div>
                <Label htmlFor="childId">Student ID</Label>
                <Input
                  id="childId"
                  value={newChildId}
                  onChange={(e) => setNewChildId(e.target.value)}
                  placeholder="Enter student ID from school"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addChild}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Child
              </Button>
            </div>
          </Card>

          {children.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Linked Children ({children.length})</h3>
              <div className="space-y-2">
                {children.map((child, index) => (
                  <Card key={index} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{child.name}</p>
                      <p className="text-sm text-gray-500">ID: {child.studentId}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChild(index)}
                    >
                      Remove
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (selectedRole?.id === "counselor") {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Areas of Specialization</h2>
            <p className="text-gray-600">Select your counseling specializations.</p>
          </div>

          <div>
            <Label>Specializations (Select all that apply)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
              {SPECIALIZATIONS.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpecialization(spec)}
                  className={`p-2 text-sm rounded-lg border-2 text-left transition-all ${
                    selectedSpecializations.includes(spec)
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderCompletion = () => {
    if (!selectedRole) return null;

    const roleFeatures: Record<string, { color: string; title: string; features: string[]; action?: string; actionPath?: string }> = {
      student: {
        color: "purple",
        title: "Discover Your Career Path!",
        features: [
          "Take free career assessments (RIASEC, MBTI, DISC)",
          "Explore careers and RUB colleges",
          "Set academic goals and track progress",
          "View homework and class schedules",
        ],
        action: "Take RIASEC Assessment",
        actionPath: "/dashboard/assessment/riasec",
      },
      teacher: {
        color: "blue",
        title: "Your Teacher Account is Ready!",
        features: [
          "Create homework assignments for your classes",
          "Take attendance digitally",
          "Grade student submissions",
          "Create learning modules",
          "Earn extra income through tutoring",
        ],
      },
      parent: {
        color: "gray",
        title: "Stay Connected to Your Child's Education!",
        features: [
          "View your child's attendance records",
          "Monitor homework and assessments",
          "Track academic progress",
          "Communicate with teachers",
          "Pay school fees online",
        ],
      },
      counselor: {
        color: "purple",
        title: "Start Guiding Students to Success!",
        features: [
          "View assigned students and their profiles",
          "Schedule counseling sessions",
          "Track student interventions and progress",
          "Maintain confidential counseling notes",
          "Administer career assessments",
        ],
      },
      "school-admin": {
        color: "violet",
        title: "Your School Dashboard is Ready!",
        features: [
          "Add subjects and create class schedules",
          "Invite teachers to join the platform",
          "Register students or send them invite codes",
          "Set up fee structure",
          "Explore AI-powered insights",
        ],
      },
    };

    const features = roleFeatures[selectedRole.id] || roleFeatures.student;

    return (
      <div className="text-center space-y-8 py-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative"
        >
          {/* Animated rings */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full"
            style={{ background: `linear-gradient(135deg, ${selectedRole.color} 0%, ${selectedRole.colorTo} 100%)` }}
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            className="absolute inset-0 rounded-full"
            style={{ background: `linear-gradient(135deg, ${selectedRole.color} 0%, ${selectedRole.colorTo} 100%)` }}
          />

          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center mx-auto"
            style={{ background: `linear-gradient(135deg, ${selectedRole.color} 0%, ${selectedRole.colorTo} 100%)` }}
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Welcome, {fullName}!
          </h2>
          <p className="text-slate-600">
            {selectedRole.id === "school-admin"
              ? `Your account has been linked to ${verifiedSchool?.name || "your school"}.`
              : `Your ${selectedRole.name} account is ready.`}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card
            className={`p-5 text-left border-2 ${selectedRole.bgColor} ${selectedRole.borderColor}`}
          >
            <h3 className={`font-bold text-lg mb-4 flex items-center gap-2`} style={{ color: selectedRole.color }}>
              <Sparkles className="w-5 h-5" />
              {features.title}
            </h3>
            <ul className="space-y-3">
              {features.features.map((feature, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-start gap-3 text-sm"
                  style={{ color: selectedRole.color }}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: `${selectedRole.color}20` }}
                  >
                    <CheckCircle2 className="w-3 h-3" style={{ color: selectedRole.color }} />
                  </span>
                  {feature}
                </motion.li>
              ))}
            </ul>

            {selectedRole.id === "student" && features.action && features.actionPath && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 bg-white"
                onClick={() => router.push(features.actionPath)}
              >
                {features.action}
              </Button>
            )}
          </Card>
        </motion.div>

        {selectedRole.id === "parent" && children.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm"
          >
            <Users className="w-4 h-4" />
            {children.length} child{children.length > 1 ? "ren" : ""} linked to your account
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={completeWizard}
            size="lg"
            disabled={isLoading}
            className="text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ background: `linear-gradient(135deg, ${selectedRole.color} 0%, ${selectedRole.colorTo} 100%)` }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      </div>
    );
  };

  const getStepTitle = () => {
    if (!selectedRole) return "Select Your Role";
    return steps[currentStep - 1]?.title || "Setup";
  };

  const getWizardTitle = () => {
    if (!selectedRole) return "Setup Your Account";
    return `${selectedRole.name} Setup`;
  };

  const getWizardSubtitle = () => {
    if (!selectedRole) return "Join Bhutan EduSkill";
    return selectedRole.description;
  };

  // Get step titles for the stepper
  const getStepTitles = () => {
    if (!selectedRole) return ["Select Role", "Find School", "Your Details", "Complete"];
    return steps.map(s => s.title);
  };

  return (
    <WizardContainer
      currentStep={currentStep}
      totalSteps={steps.length}
      title={getWizardTitle()}
      subtitle={getWizardSubtitle()}
      onExit={() => router.push("/")}
      stepTitles={getStepTitles()}
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Role Selection */}
      {currentStep === 1 && renderRoleSelection()}

      {/* Step 2: School Verification */}
      {currentStep === 2 && selectedRole && renderSchoolVerification()}

      {/* Step 3: Personal Details */}
      {currentStep === 3 && selectedRole && renderPersonalDetails()}

      {/* Step 4: Role-Specific Details */}
      {currentStep === 4 && selectedRole && renderAcademicDetails()}

      {/* Step 5: Completion */}
      {currentStep === steps.length && selectedRole && renderCompletion()}

      {/* Navigation */}
      {currentStep < steps.length && selectedRole && (
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={steps.length}
          canGoNext={canGoNext()}
          canGoBack={currentStep > 1}
          isNextLoading={isLoading}
          onNext={handleNext}
          onBack={handleBack}
          nextLabel={currentStep === steps.length - 1 ? "Complete Setup" : undefined}
        />
      )}
    </WizardContainer>
  );
}
