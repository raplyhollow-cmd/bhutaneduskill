"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardContainer } from "@/components/wizard/wizard-container";
import { WizardNavigation } from "@/components/wizard/wizard-navigation";
import { SchoolCodeInput } from "@/components/wizard/school-code-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Building2, User, CheckCircle2, Loader2 } from "lucide-react";

const STEPS = [
  { id: "code", title: "School Code" },
  { id: "details", title: "Your Details" },
  { id: "complete", title: "Complete" },
];

export default function SchoolAdminSetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: School Code
  const [schoolCode, setSchoolCode] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolDistrict, setSchoolDistrict] = useState("");
  const [schoolId, setSchoolId] = useState("");

  // Step 2: Personal Details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("principal");

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return !!schoolId; // Only proceed if code verified
      case 2:
        return !!(fullName && email && phone && position);
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (isLoading) return;

    if (currentStep === 2) {
      await submitSetup();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const submitSetup = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/setup/school-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "complete",
          data: {
            schoolCode,
            schoolName,
            adminName: fullName,
            adminEmail: email,
            adminPhone: phone,
            position,
          },
        }),
      });

      if (response.ok) {
        setCurrentStep(3);
      } else {
        const error = await response.json();
        alert(error.error || "Setup failed. Please try again.");
      }
    } catch (error) {
      console.error("Setup error:", error);
      alert("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/setup/complete", { method: "POST" });
      router.push("/school-admin?welcome=true");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchoolCodeChange = (code: string, school?: any) => {
    setSchoolCode(code);
    if (school) {
      setSchoolName(school.name);
      setSchoolDistrict(school.state || school.district || "");
      setSchoolId(school.id);
    } else {
      setSchoolName("");
      setSchoolDistrict("");
      setSchoolId("");
    }
  };

  return (
    <WizardContainer
      currentStep={currentStep}
      totalSteps={STEPS.length}
      title="School Administrator Setup"
      subtitle="Join your school on Career Compass"
      onExit={() => router.push("/dashboard")}
    >
      {/* Step 1: School Code */}
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
            onChange={handleSchoolCodeChange}
            placeholder="Enter school code (e.g., RHS-THI-2026)"
          />

          {schoolName && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900">{schoolName}</h3>
                  <p className="text-sm text-green-700">{schoolDistrict}, Bhutan</p>
                  <p className="text-sm text-green-600 mt-1">School Code: {schoolCode}</p>
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
              Tell us about yourself so we can set up your administrator account for {schoolName}.
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
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Complete */}
      {currentStep === 3 && (
        <div className="text-center space-y-6 py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Setup Complete!
            </h2>
            <p className="text-gray-600">
              Your account has been linked to <strong>{schoolName}</strong>. You can now access the school admin dashboard.
            </p>
          </div>

          <Card className="p-4 bg-blue-50 border-blue-200 text-left">
            <h3 className="font-semibold text-blue-900 mb-3">Next Steps:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✓ Add subjects and create class schedules</li>
              <li>✓ Invite teachers to join the platform</li>
              <li>✓ Register students or send them invite codes</li>
              <li>✓ Set up fee structure</li>
              <li>✓ Explore your admin dashboard with AI insights</li>
            </ul>
          </Card>

          <Button onClick={handleComplete} size="lg" disabled={isLoading}>
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
      {currentStep < 3 && (
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={STEPS.length}
          canGoNext={canGoNext()}
          canGoBack={currentStep > 1}
          isNextLoading={isLoading}
          onNext={handleNext}
          onBack={() => setCurrentStep((prev) => prev - 1)}
        />
      )}
    </WizardContainer>
  );
}
