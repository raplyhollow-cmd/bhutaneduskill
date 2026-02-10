"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardContainer } from "@/components/wizard/wizard-container";
import { WizardNavigation } from "@/components/wizard/wizard-navigation";
import { SchoolCodeInput } from "@/components/wizard/school-code-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";

const STUDENT_STEPS = [
  { id: "find", title: "Find School" },
  { id: "details", title: "Personal Details" },
  { id: "academic", title: "Academic Details" },
  { id: "guardian", title: "Guardian Information" },
  { id: "complete", title: "Complete" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDERS = ["Male", "Female", "Other"];

export default function StudentWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: School
  const [schoolCode, setSchoolCode] = useState("");
  const [verifiedSchool, setVerifiedSchool] = useState<any>(null);

  // Step 2: Personal Details
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [studentId, setStudentId] = useState("");

  // Step 3: Academic Details
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [academicYear, setAcademicYear] = useState("2025-2026");

  // Step 4: Guardian Information
  const [guardianName, setGuardianName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [address, setAddress] = useState("");

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return verifiedSchool !== null;
      case 2:
        return fullName && dateOfBirth && gender && bloodGroup;
      case 3:
        return grade && section;
      case 4:
        return guardianName && guardianPhone;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (currentStep === STUDENT_STEPS.length) {
      await completeWizard();
    } else if (currentStep === 4) {
      await submitWizardData();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSkipAssessment = () => {
    completeWizard();
  };

  const submitWizardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/setup/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "complete",
          data: {
            schoolCode,
            personalDetails: { fullName, dateOfBirth, gender, bloodGroup, studentId },
            academicDetails: { grade, section, rollNumber, academicYear },
            guardianDetails: { guardianName, relationship, guardianPhone, guardianEmail, address },
          },
        }),
      });

      if (response.ok) {
        setCurrentStep(5);
      }
    } catch (error) {
      console.error("Error submitting wizard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeWizard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        router.push("/student?welcome=true");
      }
    } catch (error) {
      console.error("Error completing wizard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WizardContainer
      currentStep={currentStep}
      totalSteps={STUDENT_STEPS.length}
      title="Student Setup"
      subtitle="Set up your student profile"
      onExit={() => router.push("/dashboard")}
    >
      {/* Step 1: Find Your School */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Find Your School</h2>
            <p className="text-gray-600">
              Enter your school code to verify your enrollment.
            </p>
          </div>

          <SchoolCodeInput
            value={schoolCode}
            onChange={(code, school) => {
              setSchoolCode(code);
              setVerifiedSchool(school);
            }}
          />

          {verifiedSchool && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900">{verifiedSchool.name}</h3>
                  <p className="text-sm text-green-700">{verifiedSchool.district}, Bhutan</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Step 2: Personal Details */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Your Details</h2>
            <p className="text-gray-600">
              Tell us about yourself so we can set up your student account.
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
              <Label htmlFor="bloodGroup">Blood Group</Label>
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
          </div>
        </div>
      )}

      {/* Step 3: Academic Details */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Academic Details</h2>
            <p className="text-gray-600">
              Tell us about your current class and academic year.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="grade">Class/Grade</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your class" />
                </SelectTrigger>
                <SelectContent>
                  {["6", "7", "8", "9", "10", "11", "12"].map((g) => (
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
                  {["A", "B", "C", "D", "E"].map((s) => (
                    <SelectItem key={s} value={s}>Section {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rollNumber">Roll Number (Optional)</Label>
              <Input
                id="rollNumber"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Your roll number"
              />
            </div>

            <div>
              <Label>Academic Year</Label>
              <Input value={academicYear} disabled className="bg-gray-100" />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Guardian Information */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Guardian Information</h2>
            <p className="text-gray-600">
              Provide your parent or guardian contact information.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="guardianName">Guardian Name</Label>
              <Input
                id="guardianName"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="Parent or guardian full name"
              />
            </div>

            <div>
              <Label htmlFor="relationship">Relationship</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="father">Father</SelectItem>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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

            <div>
              <Label htmlFor="guardianEmail">Guardian Email (Optional)</Label>
              <Input
                id="guardianEmail"
                type="email"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                placeholder="parent@example.com"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Home address"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Complete */}
      {currentStep === 5 && (
        <div className="text-center space-y-6 py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome, {fullName}!
            </h2>
            <p className="text-gray-600">
              Your student account is ready. Start exploring Career Compass!
            </p>
          </div>

          <Card className="p-4 bg-purple-50 border-purple-200 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Discover Your Career Path!</h3>
            </div>
            <p className="text-sm text-purple-800 mb-3">
              Take a free career assessment to discover which careers match your interests and abilities.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="bg-white"
              onClick={() => router.push("/dashboard/assessment/riasec")}
            >
              Take RIASEC Assessment
            </Button>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkipAssessment}
              disabled={isLoading}
            >
              Skip for Now
            </Button>
            <Button onClick={completeWizard} disabled={isLoading}>
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
        </div>
      )}

      {/* Navigation */}
      {currentStep < 5 && (
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={STUDENT_STEPS.length}
          canGoNext={canGoNext()}
          canGoBack={currentStep > 1}
          isNextLoading={isLoading}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
    </WizardContainer>
  );
}
