"use client";

import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardContainer } from "@/components/wizard/wizard-container";
import { WizardNavigation } from "@/components/wizard/wizard-navigation";
import { SchoolSearchInput, type School as SchoolType } from "@/components/wizard/school-search-input";
import { VerificationCodeInput } from "@/components/wizard/verification-code-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, UserPlus, GraduationCap, Users, BookOpen, School, ChevronRight, Sparkles, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Role definitions - Premium styling
const ROLES = [
  {
    id: "student",
    name: "Student",
    description: "Take assessments, explore careers, track your progress",
    icon: GraduationCap,
    gradient: "from-orange-500 to-orange-600",
    steps: ["Role", "School", "Details", "Academic", "Done"],
  },
  {
    id: "teacher",
    name: "Teacher",
    description: "Manage classes, homework, track student progress",
    icon: BookOpen,
    gradient: "from-blue-500 to-blue-600",
    steps: ["Role", "School", "Details", "Subjects", "Done"],
  },
  {
    id: "parent",
    name: "Parent",
    description: "Monitor your child's progress and communicate",
    icon: Users,
    gradient: "from-neutral-400 to-neutral-500",
    steps: ["Role", "School", "Details", "Children", "Done"],
  },
  {
    id: "counselor",
    name: "Counselor",
    description: "Guide students through career and personal development",
    icon: UserPlus,
    gradient: "from-purple-500 to-purple-600",
    steps: ["Role", "School", "Details", "Specialization", "Done"],
  },
  {
    id: "school-admin",
    name: "School Admin",
    description: "Manage school, students, teachers, and operations",
    icon: School,
    gradient: "from-violet-500 to-violet-600",
    steps: ["Role", "School", "Details", "Done"],
  },
];

// Constants
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDERS = ["Male", "Female", "Other"];
const QUALIFICATIONS = ["Class X", "Class XII", "Diploma", "Bachelor's", "Master's", "M.Ed", "B.Ed", "PhD", "Other"];
const RELATIONSHIPS = ["Father", "Mother", "Guardian", "Grandparent", "Other"];
const SPECIALIZATIONS = [
  "Career Counseling", "Academic Guidance", "Personal Development",
  "College Applications", "Mental Health Support", "Study Skills",
  "Career Assessment", "Goal Setting", "Parent Consultation"
];
const POSITIONS = ["principal", "vice_principal", "admin_officer", "other"];

function UnifiedSetupWizardContent() {
  const router = useRouter();
  // Get user data via API instead of Clerk hooks to avoid build issues
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<typeof ROLES[0] | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Note: Authentication and routing is now handled by middleware
  // The middleware redirects users here when they need to complete setup
  // No need to check auth status here - just render the form

  // Form state
  const [schoolCode, setSchoolCode] = useState("");
  type VerifiedSchool = { id: string; name: string; code: string; city?: string; };
  const [verifiedSchool, setVerifiedSchool] = useState<VerifiedSchool | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Student
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [studentId, setStudentId] = useState("");
  type SchoolClass = { id: string; name: string; grade: number; section: string; };
  const [availableClasses, setAvailableClasses] = useState<SchoolClass[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [classesError, setClassesError] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");

  // Teacher
  const [cidNo, setCidNo] = useState("");
  const [qualification, setQualification] = useState("");
  const [university, setUniversity] = useState("");
  // Track selected subjects with their grades: { "Mathematics": [6, 7, 8], "English": [9, 10] }
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, number[]>>({});
  type Subject = { id: string; name: string; grade?: number };
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [subjectsError, setSubjectsError] = useState("");
  const [teacherAvailableClasses, setTeacherAvailableClasses] = useState<SchoolClass[]>([]);
  const [isLoadingTeacherClasses, setIsLoadingTeacherClasses] = useState(false);
  const [teacherClassesError, setTeacherClassesError] = useState("");

  // Parent
  const [relationship, setRelationship] = useState("");
  const [children, setChildren] = useState<Array<{ name: string; studentId: string }>>([]);
  const [newChildName, setNewChildName] = useState("");
  const [newChildId, setNewChildId] = useState("");

  // Counselor
  const [licenseNumber, setLicenseNumber] = useState("");
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);

  // School Admin
  const [position, setPosition] = useState("principal");

  // Auto-fill email from Clerk
  // Fetch user email from API
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          const userEmail = data.data?.profile?.email || data.profile?.email || data.user?.email;
          if (userEmail && !email) {
            setEmail(userEmail);
          }
        }
      } catch (error) {
        console.debug("Could not fetch user email:", error);
      }
    };
    fetchUserEmail();
  }, [email]);

  // Load classes for students
  useEffect(() => {
    if (verifiedSchool && selectedRole?.id === "student") {
      loadClassesForSchool(verifiedSchool.code);
    } else if (!verifiedSchool) {
      setAvailableClasses([]); setSelectedClassId(""); setClassesError("");
    }
  }, [verifiedSchool, selectedRole]);

  const loadClassesForSchool = async (schoolCode: string) => {
    setIsLoadingClasses(true);
    setClassesError("");
    try {
      const response = await fetch(`/api/classes/public?schoolCode=${encodeURIComponent(schoolCode)}`);
      const data = await response.json();
      if (data.success) {
        setAvailableClasses(data.data.classes);
        if (selectedClassId && !data.data.classes.some((c: SchoolClass) => c.id === selectedClassId)) {
          setSelectedClassId("");
        }
      } else {
        setClassesError(data.error || "Failed to load classes");
        setAvailableClasses([]);
      }
    } catch (error) {
      logger.error("Failed to load classes", error);
      setClassesError("Failed to load classes");
      setAvailableClasses([]);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // Load subjects and classes for teachers
  useEffect(() => {
    if (verifiedSchool && selectedRole?.id === "teacher") {
      loadSubjectsForSchool(verifiedSchool.code);
    } else if (!verifiedSchool) {
      setAvailableSubjects([]); setSelectedSubjects({}); setSubjectsError("");
    }
  }, [verifiedSchool, selectedRole]);

  const loadSubjectsForSchool = async (schoolCode: string) => {
    setIsLoadingSubjects(true);
    setSubjectsError("");
    try {
      const response = await fetch(`/api/subjects/public?schoolCode=${encodeURIComponent(schoolCode)}`);
      const data = await response.json();
      if (data.success) {
        setAvailableSubjects(data.data.subjects || []);
      } else {
        setSubjectsError(data.error || "Failed to load subjects");
        setAvailableSubjects([]);
      }
    } catch (error) {
      logger.error("Failed to load subjects", error);
      setAvailableSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const loadTeacherClassesForSchool = async (schoolCode: string) => {
    setIsLoadingTeacherClasses(true);
    setTeacherClassesError("");
    try {
      const response = await fetch(`/api/classes/public?schoolCode=${encodeURIComponent(schoolCode)}`);
      const data = await response.json();
      if (data.success) {
        setTeacherAvailableClasses(data.data.classes || []);
      } else {
        setTeacherClassesError(data.error || "Failed to load classes");
        setTeacherAvailableClasses([]);
      }
    } catch (error) {
      logger.error("Failed to load teacher classes", error);
      setTeacherAvailableClasses([]);
    } finally {
      setIsLoadingTeacherClasses(false);
    }
  };

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
        if (currentStep === 4) return !!selectedClassId;
        return true;
      case "teacher":
        if (currentStep === 2) return verifiedSchool !== null;
        if (currentStep === 3) return !!(fullName && cidNo && phone && qualification);
        if (currentStep === 4) return Object.keys(selectedSubjects).length > 0;
        return true;
      case "parent":
        if (currentStep === 2) return verifiedSchool !== null;
        if (currentStep === 3) return !!(fullName && email && phone && relationship);
        if (currentStep === 4) return children.length > 0;
        return true;
      case "counselor":
        if (currentStep === 2) return verifiedSchool !== null;
        if (currentStep === 3) return !!(fullName && email && phone);
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
      setSelectedRole(null); setCurrentStep(1);
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
      const body: { step: string; data: Record<string, unknown> } = {
        step: "complete",
        data: { schoolCode },
      };
      switch (selectedRole.id) {
        case "student":
          body.data.personalDetails = { fullName, dateOfBirth, gender, bloodGroup, studentId };
          body.data.academicDetails = { selectedClassId };
          body.data.guardianDetails = { guardianName, guardianPhone };
          break;
        case "teacher":
          body.data.personalDetails = { fullName, cidNo, phone, qualification, university };
          // Convert { "Mathematics": [6, 7], "English": [9] } to array of objects with subject and grade
          // This allows showing which grade each subject is for in the pending approval page
          body.data.subjects = Object.entries(selectedSubjects).flatMap(([subject, grades]) =>
            grades.map(grade => ({ subject, grade }))
          );
          break;
        case "parent":
          body.data.personalDetails = { fullName, email, phone, relationship };
          body.data.children = children;
          break;
        case "counselor":
          body.data.personalDetails = { fullName, email, phone, licenseNumber, specializations: selectedSpecializations };
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
        let errorMsg = `Setup failed (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.details || errorMsg;
        } catch (e) {}
        logger.error("Setup API error:", errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      logger.error("Setup wizard network error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const completeWizard = async () => {
    if (!selectedRole) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/setup/complete", { method: "POST" });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to complete setup");
        return;
      }
      const data = await response.json();
      if (data.needsApproval) {
        router.push("/pending-approval");
      } else {
        router.push(`/${selectedRole.id}?welcome=true`);
      }
    } catch (err) {
      logger.error("[Setup Complete] Error:", err);
      setError("Failed to complete setup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-redirect when completion screen is shown
  useEffect(() => {
    const steps = selectedRole?.steps || [];
    const totalSteps = steps.length;
    // When user reaches the completion screen (last step), automatically redirect
    if (currentStep === totalSteps && selectedRole && !isLoading) {
      completeWizard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, selectedRole]);

  const addChild = () => {
    if (newChildName && newChildId) {
      setChildren([...children, { name: newChildName, studentId: newChildId }]);
      setNewChildName(""); setNewChildId("");
    }
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const toggleSubjectGrade = (subjectName: string, grade: number) => {
    setSelectedSubjects((prev) => {
      const currentGrades = prev[subjectName] || [];
      const newGrades = currentGrades.includes(grade)
        ? currentGrades.filter(g => g !== grade)
        : [...currentGrades, grade];
      if (newGrades.length === 0) {
        const { [subjectName]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [subjectName]: newGrades };
    });
  };

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  // =============================================================================
  // RENDER FUNCTIONS - Premium styling
  // =============================================================================

  const renderRoleSelection = () => (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-gray-100 to-gray-200/80 border border-gray-200/60 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-xs font-medium text-gray-700">Bhutan EduSkill</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Choose your role</h2>
        <p className="text-gray-500 text-sm">Select your role to continue</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROLES.map((role, index) => (
          <motion.button
            key={role.id}
            type="button"
            onClick={() => handleRoleSelect(role)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.2 }}
            className="group relative p-4 rounded-xl border border-gray-200/80 bg-white/80 hover:bg-white hover:border-gray-300/80 hover:shadow-md hover:shadow-gray-200/50 text-left transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br shadow-sm",
                  role.gradient
                )}
              >
                <role.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">{role.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{role.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderSchoolVerification = () => {
    // State 1: No school selected - show search
    if (!selectedSchool) {
      return (
        <div className="space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/80 flex items-center justify-center mx-auto shadow-sm">
              <School className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Find Your School</h2>
              <p className="text-gray-500 text-sm mt-1">
                {selectedRole?.id === "parent"
                  ? "Search for your child's school"
                  : "Search for your school by name"}
              </p>
            </div>
          </div>
          <SchoolSearchInput onSchoolSelect={setSelectedSchool} />
        </div>
      );
    }

    // State 2: School selected but not verified
    if (!isCodeVerified) {
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200/80 flex items-center justify-center">
                  <School className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{selectedSchool.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {selectedSchool.city}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedSchool(null); setIsCodeVerified(false); setSchoolCode(""); }}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Change
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">Enter School Code</h3>
            <VerificationCodeInput
              expectedCode={selectedSchool.code}
              schoolName={selectedSchool.name}
              onVerified={(isValid, code) => {
                setIsCodeVerified(isValid);
                setSchoolCode(code);
                if (isValid) setVerifiedSchool(selectedSchool);
              }}
            />
          </div>
        </div>
      );
    }

    // State 3: Verified
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/60 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-emerald-700">{selectedSchool.name}</h3>
              <p className="text-xs text-emerald-600">{selectedSchool.city}</p>
            </div>
            <button
              onClick={() => { setIsCodeVerified(false); setVerifiedSchool(null); }}
              className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Change
            </button>
          </div>
        </div>
        <p className="text-sm text-emerald-700 text-center">School verified successfully</p>
      </div>
    );
  };

  const renderPersonalDetails = () => (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">Your Details</h2>
        <p className="text-gray-500 text-sm">Tell us about yourself</p>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="fullName" className="text-gray-600 text-xs font-medium">Full Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-200"
          />
        </div>

        {selectedRole?.id === "student" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dateOfBirth" className="text-gray-600 text-xs font-medium">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="bg-neutral-800 border-neutral-700 text-white focus:border-neutral-500"
                />
              </div>
              <div>
                <Label htmlFor="gender" className="text-gray-600 text-xs font-medium">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {GENDERS.map((g) => (
                      <SelectItem key={g} value={g} className="text-gray-900 hover:bg-gray-100">{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bloodGroup" className="text-gray-600 text-xs font-medium">Blood Group</Label>
                <Select value={bloodGroup} onValueChange={setBloodGroup}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {BLOOD_GROUPS.map((bg) => (
                      <SelectItem key={bg} value={bg} className="text-gray-900 hover:bg-gray-100">{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="studentId" className="text-gray-600 text-xs font-medium">Student ID</Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Optional"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-200"
                />
              </div>
            </div>
          </>
        ) : selectedRole?.id === "teacher" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cidNo" className="text-gray-600 text-xs font-medium">CID / Route Permit / Passport No</Label>
                <Input
                  id="cidNo"
                  value={cidNo}
                  onChange={(e) => setCidNo(e.target.value)}
                  placeholder="Enter your ID number"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-gray-600 text-xs font-medium">Mobile No</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+975 17 123 456"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="qualification" className="text-gray-600 text-xs font-medium">Qualification</Label>
                <Select value={qualification} onValueChange={setQualification}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {QUALIFICATIONS.map((qual) => (
                      <SelectItem key={qual} value={qual} className="text-gray-900 hover:bg-gray-100">{qual}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="university" className="text-gray-600 text-xs font-medium">University</Label>
                <Input
                  id="university"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Your university"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-200"
                />
              </div>
            </div>
          </>
        ) : selectedRole?.id === "counselor" || selectedRole?.id === "school-admin" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="email" className="text-gray-600 text-xs font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-gray-600 text-xs font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+975 17 123 456"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-200"
                />
              </div>
            </div>

            {selectedRole?.id === "counselor" && (
              <div>
                <Label htmlFor="licenseNumber" className="text-gray-600 text-xs font-medium">License Number</Label>
                <Input
                  id="licenseNumber"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="Optional"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-200"
                />
              </div>
            )}

            {selectedRole?.id === "school-admin" && (
              <div>
                <Label htmlFor="position" className="text-gray-600 text-xs font-medium">Position</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos} className="text-gray-900 hover:bg-gray-100">
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="email" className="text-gray-600 text-xs font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-gray-600 text-xs font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+975 17 123 456"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-200"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="relationship" className="text-gray-600 text-xs font-medium">Relationship</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {RELATIONSHIPS.map((rel) => (
                    <SelectItem key={rel} value={rel.toLowerCase()} className="text-gray-900 hover:bg-gray-100">{rel}</SelectItem>
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
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">Academic Info</h2>
          </div>

          <div>
            <Label htmlFor="classSelect" className="text-gray-600 text-xs font-medium">Your Class</Label>
            {isLoadingClasses ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading classes...
              </div>
            ) : classesError ? (
              <div className="p-3 bg-red-50/80 border border-red-200/60 rounded-lg">
                <p className="text-sm text-red-700">{classesError}</p>
              </div>
            ) : availableClasses.length === 0 ? (
              <div className="p-3 bg-gray-50/80 border border-gray-200/60 rounded-lg">
                <p className="text-sm text-gray-500">No classes found. Contact your school admin.</p>
              </div>
            ) : (
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Choose from available classes" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id} className="text-gray-900 hover:bg-gray-100">
                      {cls.name} <span className="text-neutral-500">({cls.grade}-{cls.section})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="guardianName" className="text-gray-600 text-xs font-medium">Guardian Name</Label>
              <Input
                id="guardianName"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="Guardian name"
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-200"
              />
            </div>
            <div>
              <Label htmlFor="guardianPhone" className="text-gray-600 text-xs font-medium">Guardian Phone</Label>
              <Input
                id="guardianPhone"
                type="tel"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="+975 17 123 456"
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-200"
              />
            </div>
          </div>
        </div>
      );
    }

    if (selectedRole?.id === "teacher") {
      return (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">Subjects & Classes</h2>
            <p className="text-gray-500 text-sm">Select what you teach</p>
          </div>

          <div>
            <Label className="text-gray-600 text-xs font-medium mb-3">Select Subjects & Grades</Label>
            {isLoadingSubjects ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading subjects...
              </div>
            ) : subjectsError ? (
              <div className="p-3 bg-red-50/80 border border-red-200/60 rounded-lg">
                <p className="text-sm text-red-700">{subjectsError}</p>
              </div>
            ) : availableSubjects.length === 0 ? (
              <div className="p-3 bg-gray-50/80 border border-gray-200/60 rounded-lg">
                <p className="text-sm text-gray-500">No subjects found. Contact your school admin.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {(() => {
                  // Group subjects by name and collect grades (deduplicate)
                  const groupedSubjects = availableSubjects.reduce((acc, subject) => {
                    if (!acc[subject.name]) {
                      acc[subject.name] = { name: subject.name, grades: new Set<number>() };
                    }
                    if (subject.grade) {
                      acc[subject.name].grades.add(subject.grade);
                    }
                    return acc;
                  }, {} as Record<string, { name: string; grades: Set<number> }>);

                  // Convert to array and sort by name, then grades
                  const subjectList = Object.values(groupedSubjects)
                    .map(s => ({
                      ...s,
                      grades: Array.from(s.grades).sort((a, b) => a - b)
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name));

                  return subjectList.map((subject) => {
                    const selectedGrades = selectedSubjects[subject.name] || [];
                    const hasSelection = selectedGrades.length > 0;

                    return (
                      <div
                        key={subject.name}
                        className={cn(
                          "p-4 rounded-xl border transition-all",
                          hasSelection
                            ? "bg-blue-50/50 border-blue-300/60"
                            : "bg-white border-gray-200"
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className={cn(
                            "font-medium",
                            hasSelection ? "text-blue-700" : "text-gray-900"
                          )}>
                            {subject.name}
                          </h4>
                          {hasSelection && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                              {selectedGrades.length} grade{selectedGrades.length > 1 ? 's' : ''} selected
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {subject.grades.map((grade) => {
                            const isSelected = selectedGrades.includes(grade);
                            return (
                              <button
                                key={grade}
                                type="button"
                                onClick={() => toggleSubjectGrade(subject.name, grade)}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                  isSelected
                                    ? "bg-blue-500 text-white shadow-sm"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                )}
                              >
                                Grade {grade}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (selectedRole?.id === "parent") {
      return (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">Link Your Children</h2>
            <p className="text-gray-500 text-sm">Add your children enrolled at this school</p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/60 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="childName" className="text-gray-600 text-xs font-medium">Child's Name</Label>
                <Input
                  id="childName"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="Full name"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="childId" className="text-gray-600 text-xs font-medium">Student ID</Label>
                <Input
                  id="childId"
                  value={newChildId}
                  onChange={(e) => setNewChildId(e.target.value)}
                  placeholder="Student ID"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-200"
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={addChild}
              className="w-full bg-neutral-700 hover:bg-neutral-600 text-white border border-neutral-600"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Child
            </Button>
          </div>

          {children.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-neutral-500">Linked Children ({children.length})</p>
              {children.map((child, index) => (
                <div key={index} className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-700 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{child.name}</p>
                    <p className="text-xs text-neutral-500">ID: {child.studentId}</p>
                  </div>
                  <button
                    onClick={() => removeChild(index)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (selectedRole?.id === "counselor") {
      return (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">Specializations</h2>
            <p className="text-gray-500 text-sm">Select your areas of expertise</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => toggleSpecialization(spec)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm border transition-all",
                  selectedSpecializations.includes(spec)
                    ? "bg-purple-500 border-purple-500 text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderCompletion = () => {
    if (!selectedRole) return null;

    const features: Record<string, { title: string; features: string[] }> = {
      student: {
        title: "Your Account is Ready!",
        features: [
          "Take free career assessments (RIASEC, MBTI, DISC)",
          "Explore careers and RUB colleges",
          "Set academic goals and track progress",
          "View homework and class schedules",
        ],
      },
      teacher: {
        title: "Your Teacher Account is Ready!",
        features: [
          "Create homework assignments for your classes",
          "Take attendance digitally",
          "Grade student submissions",
          "Create learning modules",
        ],
      },
      parent: {
        title: "Your Parent Account is Ready!",
        features: [
          "View your child's attendance records",
          "Monitor homework and assessments",
          "Track academic progress",
          "Communicate with teachers",
        ],
      },
      counselor: {
        title: "Your Counselor Account is Ready!",
        features: [
          "View assigned students and their profiles",
          "Schedule counseling sessions",
          "Track student interventions",
          "Maintain confidential counseling notes",
        ],
      },
      "school-admin": {
        title: "Application Submitted",
        features: [
          "Your application has been submitted to the platform administrator",
          "You'll receive an email once your account is approved",
          "After approval, you can manage your school",
        ],
      },
    };

    const roleFeatures = features[selectedRole.id] || features.student;

    return (
      <div className="text-center space-y-6 py-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-16 h-16 mx-auto"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-300/40 to-transparent"
          />
          <div
            className={cn(
              "relative w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg",
              selectedRole.gradient
            )}
          >
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">
            {selectedRole.id === "school-admin" ? "Application Submitted!" : `Welcome, ${fullName}!`}
          </h2>
          <p className="text-gray-500 text-sm">
            {selectedRole.id === "school-admin"
              ? "Your application is awaiting approval"
              : "Your account is ready to use"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-left p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/80 border border-gray-200/60 shadow-sm"
        >
          <h3 className={cn("font-medium mb-3", selectedRole.gradient.includes("orange") ? "text-orange-600" : selectedRole.gradient.includes("blue") ? "text-blue-600" : selectedRole.gradient.includes("neutral") ? "text-gray-700" : selectedRole.gradient.includes("purple") ? "text-purple-600" : "text-violet-600")}>
            {roleFeatures.title}
          </h3>
          <ul className="space-y-2">
            {roleFeatures.features.map((feature, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                {feature}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    );
  };

  return (
    <WizardContainer
      currentStep={currentStep}
      totalSteps={steps.length}
      title={selectedRole ? `${selectedRole.name} Setup` : "Create Account"}
      subtitle={selectedRole?.description}
      onExit={() => router.push("/")}
      stepTitles={steps}
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50/80 border border-red-200/60 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {currentStep === 1 && renderRoleSelection()}
      {currentStep === 2 && selectedRole && renderSchoolVerification()}
      {currentStep === 3 && selectedRole && renderPersonalDetails()}
      {currentStep === 4 && selectedRole && renderAcademicDetails()}
      {currentStep === steps.length && selectedRole && renderCompletion()}

      {currentStep < steps.length && selectedRole && (
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={steps.length}
          canGoNext={canGoNext()}
          canGoBack={currentStep > 1}
          isNextLoading={isLoading}
          onNext={handleNext}
          onBack={handleBack}
          nextLabel={currentStep === steps.length - 1 ? "Complete" : undefined}
        />
      )}
    </WizardContainer>
  );
}

export default UnifiedSetupWizardContent;
