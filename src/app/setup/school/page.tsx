"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardContainer } from "@/components/wizard/wizard-container";
import { WizardNavigation } from "@/components/wizard/wizard-navigation";
import { SchoolCodeInput } from "@/components/wizard/school-code-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";

const SCHOOL_STEPS = [
  { id: "find", title: "Find School" },
  { id: "details", title: "Personal Details" },
  { id: "config", title: "Configuration" },
  { id: "import", title: "Import Data" },
  { id: "complete", title: "Complete" },
];

export default function SchoolAdminWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Step 1: School Verification
  const [schoolCode, setSchoolCode] = useState("");
  const [verifiedSchool, setVerifiedSchool] = useState<any>(null);

  // Step 2: Personal Details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");

  // Step 3: Configuration
  const [gradeLevels, setGradeLevels] = useState<string[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const [enableModules, setEnableModules] = useState({
    attendance: true,
    homework: true,
    fees: true,
    assessments: true,
  });

  const toggleGradeLevel = (grade: string) => {
    setGradeLevels((prev) =>
      prev.includes(grade)
        ? prev.filter((g) => g !== grade)
        : [...prev, grade]
    );
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return verifiedSchool !== null;
      case 2:
        return fullName && email && phone && position;
      case 3:
        return gradeLevels.length > 0 && academicYear;
      case 4:
        return true; // Can skip import
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (currentStep === SCHOOL_STEPS.length) {
      // Complete wizard
      await completeWizard();
    } else if (currentStep === 4) {
      // Submit all data
      await submitWizardData();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSkip = () => {
    if (currentStep === 4) {
      // Skip import, go to complete
      setCurrentStep(5);
    }
  };

  const submitWizardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/setup/school-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "complete",
          data: {
            schoolCode,
            personalDetails: { fullName, email, phone, position },
            configuration: { gradeLevels, academicYear, enableModules },
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
        router.push("/school-admin?welcome=true");
      }
    } catch (error) {
      console.error("Error completing wizard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/setup/import", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setCurrentStep(5);
      }
    } catch (error) {
      console.error("Error importing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WizardContainer
      currentStep={currentStep}
      totalSteps={SCHOOL_STEPS.length}
      title="School Setup"
      subtitle="Configure your school for Career Compass"
      onExit={() => router.push("/dashboard")}
    >
      {/* Step 1: Find Your School */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Find Your School</h2>
            <p className="text-gray-600">
              Enter your school code to verify your institution. This code was provided when your school registered.
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
                  <p className="text-sm text-green-600 mt-1">School Code: {verifiedSchool.code}</p>
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
              Tell us about yourself so we can set up your administrator account.
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
                placeholder="admin@school.edu.bt"
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
              <Label htmlFor="position">Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="principal">Principal</SelectItem>
                  <SelectItem value="vice_principal">Vice Principal</SelectItem>
                  <SelectItem value="admin_officer">Administrative Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Configuration */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">School Configuration</h2>
            <p className="text-gray-600">
              Configure your school settings for the academic year.
            </p>
          </div>

          <div>
            <Label>Academic Year</Label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-2026">2025 - 2026</SelectItem>
                <SelectItem value="2026-2027">2026 - 2027</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Grade Levels (Select all that apply)</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {["6", "7", "8", "9", "10", "11", "12"].map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => toggleGradeLevel(grade)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    gradeLevels.includes(grade)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  Class {grade}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Enable Modules</Label>
            <div className="space-y-2 mt-2">
              {[
                { key: "attendance", label: "Attendance Tracking" },
                { key: "homework", label: "Homework Management" },
                { key: "fees", label: "Fee Management" },
                { key: "assessments", label: "Assessments & Results" },
              ].map((module) => (
                <div key={module.key} className="flex items-center gap-3">
                  <Checkbox
                    id={module.key}
                    checked={enableModules[module.key as keyof typeof enableModules]}
                    onCheckedChange={(checked) =>
                      setEnableModules((prev) => ({
                        ...prev,
                        [module.key]: checked,
                      }))
                    }
                  />
                  <Label htmlFor={module.key} className="cursor-pointer">
                    {module.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Import Data */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Import School Data</h2>
            <p className="text-gray-600">
              Upload student and teacher data from Excel/CSV. You can also add them manually later.
            </p>
          </div>

          <Card className="p-6 border-dashed border-2">
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">
                Upload Excel or CSV file
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Download template from{" "}
                <a href="/templates/student-import.xlsx" className="text-blue-600 hover:underline">
                  here
                </a>
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload">
                <Button type="button" variant="outline" asChild>
                  <span>Choose File</span>
                </Button>
              </Label>
              {selectedFile && (
                <p className="text-sm text-green-600 mt-2">{selectedFile.name}</p>
              )}
            </div>
          </Card>

          {selectedFile && (
            <Button onClick={handleImport} className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Data"
              )}
            </Button>
          )}

          <p className="text-center text-gray-500 text-sm">or</p>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setCurrentStep(5)}
          >
            Add Manually Later
          </Button>
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
              Setup Complete!
            </h2>
            <p className="text-gray-600">
              Your school has been configured. You can now start using Career Compass.
            </p>
          </div>

          <Card className="p-4 bg-blue-50 border-blue-200 text-left">
            <h3 className="font-semibold text-blue-900 mb-3">Next Steps:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✓ Add subjects and create class schedules</li>
              <li>✓ Invite teachers to join the platform</li>
              <li>✓ Set up fee structure (if enabled)</li>
              <li>✓ Explore your admin dashboard</li>
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
          totalSteps={SCHOOL_STEPS.length}
          canGoNext={canGoNext()}
          canGoBack={currentStep > 1}
          isNextLoading={isLoading}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={currentStep === 4 ? handleSkip : undefined}
          showSkip={currentStep === 4}
        />
      )}
    </WizardContainer>
  );
}
