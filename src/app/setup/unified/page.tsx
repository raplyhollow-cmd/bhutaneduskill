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
import { Loader2, CheckCircle2, UserPlus, GraduationCap, Users, BookOpen, School, ChevronRight } from "lucide-react";

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
          // Use window.location.href for full page navigation that clears state
          window.location.href = redirectPath;
        }
      })
      .catch(() => {
        // On error, continue showing setup wizard
      });

    return () => {
      isMounted = false;
    };
  }, []);


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
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || errorData.details || "Setup failed. Please try again.";
        logger.error("Setup API error:", errorData);
        setError(errorMsg);
      }
    } catch (err) {
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
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Bhutan EduSkill</h2>
        <p className="text-gray-600">Select your role to get started with your personalized setup</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ROLES.map((role) => {
          const Icon = IconMap[role.icon as keyof typeof IconMap];
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => handleRoleSelect(role)}
              className="group relative p-6 rounded-xl border-2 border-gray-200 bg-white text-left transition-all hover:shadow-lg hover:-translate-y-1 hover:border-gray-300"
            >
              {/* Colored accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                style={{ background: `linear-gradient(180deg, ${role.color} 0%, ${role.colorTo} 100%)` }}
              />

              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${role.color} 0%, ${role.colorTo} 100%)` }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">{role.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{role.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 mt-1" />
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-sm text-gray-500">
        Not sure which role to choose? Contact your school administrator for guidance.
      </p>
    </div>
  );

  const renderSchoolVerification = () => {
    // State 1: No school selected - show search
    if (!selectedSchool) {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Find Your School</h2>
            <p className="text-gray-600">
              {selectedRole?.id === "parent"
                ? "Search for your child's school to verify and link your account."
                : "Search for your school by name to verify your enrollment."}
            </p>
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
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <School className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">{selectedSchool.name}</h3>
                  <p className="text-sm text-blue-700">
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
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
              >
                Change
              </Button>
            </div>
          </Card>

          {/* Verification code input */}
          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Enter School Code</h3>
              <p className="text-sm text-gray-500">
                Enter your school verification code to confirm your enrollment at {selectedSchool.name}.
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
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">{selectedSchool.name}</h3>
              <p className="text-sm text-green-700">
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
              className="text-green-600 hover:text-green-700 hover:bg-green-100"
            >
              Change
            </Button>
          </div>
        </Card>

        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4" />
          <span>School verified successfully! You can proceed to the next step.</span>
        </div>
      </div>
    );
  };

  const renderPersonalDetails = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Your Details</h2>
        <p className="text-gray-600">
          Tell us about yourself so we can set up your {selectedRole?.name} account.
        </p>
      </div>

      <div className="space-y-4">
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
      <div className="text-center space-y-6 py-8">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
          style={{ background: `linear-gradient(135deg, ${selectedRole.color} 0%, ${selectedRole.colorTo} 100%)` }}
        >
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {fullName}!
          </h2>
          <p className="text-gray-600">
            {selectedRole.id === "school-admin"
              ? `Your account has been linked to ${verifiedSchool?.name || "your school"}.`
              : `Your ${selectedRole.name} account is ready.`}
          </p>
        </div>

        <Card
          className={`p-4 ${selectedRole.bgColor} ${selectedRole.borderColor} text-left`}
        >
          <h3 className={`font-semibold mb-3`} style={{ color: selectedRole.color }}>
            {features.title}
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: selectedRole.color }}>
            {features.features.map((feature, i) => (
              <li key={i}>✓ {feature}</li>
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

        {selectedRole.id === "parent" && children.length > 0 && (
          <div className="text-sm text-gray-500">
            {children.length} child{children.length > 1 ? "ren" : ""} linked to your account
          </div>
        )}

        <Button
          onClick={completeWizard}
          size="lg"
          disabled={isLoading}
          style={{ background: `linear-gradient(135deg, ${selectedRole.color} 0%, ${selectedRole.colorTo} 100%)` }}
          className="text-white border-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Go to Dashboard"
          )}
        </Button>
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

  return (
    <WizardContainer
      currentStep={currentStep}
      totalSteps={steps.length}
      title={getWizardTitle()}
      subtitle={getWizardSubtitle()}
      onExit={() => router.push("/")}
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
