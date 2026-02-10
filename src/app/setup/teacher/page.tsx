"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardContainer } from "@/components/wizard/wizard-container";
import { WizardNavigation } from "@/components/wizard/wizard-navigation";
import { SchoolCodeInput } from "@/components/wizard/school-code-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Upload } from "lucide-react";

const TEACHER_STEPS = [
  { id: "find", title: "Find School" },
  { id: "details", title: "Personal Details" },
  { id: "subjects", title: "Subjects & Classes" },
  { id: "profile", title: "Profile Setup" },
  { id: "complete", title: "Complete" },
];

const SUBJECT_OPTIONS = [
  "Mathematics", "English", "Dzongkha", "Science", "Physics",
  "Chemistry", "Biology", "History", "Geography", "Economics",
  "Information Technology", "Physical Education", "Art", "Music"
];

const CLASS_OPTIONS = [
  "6", "7", "8", "9", "10", "11", "12"
];

export default function TeacherWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: School
  const [schoolCode, setSchoolCode] = useState("");
  const [verifiedSchool, setVerifiedSchool] = useState<any>(null);

  // Step 2: Personal Details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [qualifications, setQualifications] = useState("");

  // Step 3: Subjects & Classes
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Step 4: Profile
  const [bio, setBio] = useState("");
  const [specializations, setSpecializations] = useState("");

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const toggleClass = (className: string) => {
    setSelectedClasses((prev) =>
      prev.includes(className)
        ? prev.filter((c) => c !== className)
        : [...prev, className]
    );
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return verifiedSchool !== null;
      case 2:
        return fullName && email && phone;
      case 3:
        return selectedSubjects.length > 0 && selectedClasses.length > 0;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (currentStep === TEACHER_STEPS.length) {
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

  const submitWizardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/setup/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "complete",
          data: {
            schoolCode,
            personalDetails: { fullName, email, phone, employeeId, qualifications },
            subjects: selectedSubjects,
            classes: selectedClasses,
            profile: { bio, specializations },
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
        router.push("/teacher?welcome=true");
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
      totalSteps={TEACHER_STEPS.length}
      title="Teacher Setup"
      subtitle="Set up your teacher profile and subjects"
      onExit={() => router.push("/dashboard")}
    >
      {/* Step 1: Find Your School */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Find Your School</h2>
            <p className="text-gray-600">
              Enter your school code to verify your employment.
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
              Tell us about yourself so we can set up your teacher account.
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
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu.bt"
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
              <Label htmlFor="employeeId">Employee ID (Optional)</Label>
              <Input
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Your school employee ID"
              />
            </div>

            <div>
              <Label htmlFor="qualifications">Qualifications</Label>
              <Input
                id="qualifications"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder="e.g., B.Ed, M.Ed, PGCE"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Subjects & Classes */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Subjects & Classes</h2>
            <p className="text-gray-600">
              Select the subjects you teach and the classes you&apos;re assigned to.
            </p>
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
              {CLASS_OPTIONS.map((className) => (
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
      )}

      {/* Step 4: Profile Setup */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Profile Setup</h2>
            <p className="text-gray-600">
              Complete your profile to help students and parents know you better.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="bio">Bio / Introduction</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell students about yourself, your teaching philosophy..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="specializations">Specializations</Label>
              <Input
                id="specializations"
                value={specializations}
                onChange={(e) => setSpecializations(e.target.value)}
                placeholder="e.g., Mathematics specialist, Career guidance"
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
              Your teacher account is ready. You can now start using Career Compass.
            </p>
          </div>

          <Card className="p-4 bg-blue-50 border-blue-200 text-left">
            <h3 className="font-semibold text-blue-900 mb-3">You can now:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✓ Create homework assignments for your classes</li>
              <li>✓ Take attendance digitally</li>
              <li>✓ Grade student submissions</li>
              <li>✓ Create learning modules</li>
              <li>✓ Earn extra income through tutoring</li>
            </ul>
          </Card>

          <Button onClick={completeWizard} size="lg" disabled={isLoading}>
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
      )}

      {/* Navigation */}
      {currentStep < 5 && (
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={TEACHER_STEPS.length}
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
