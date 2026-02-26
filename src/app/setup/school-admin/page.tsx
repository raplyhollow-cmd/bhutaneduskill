"use client";

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { School, User, CheckCircle2, Loader2, AlertCircle, GraduationCap, Mail, Phone, MapPin } from "lucide-react";
import { SchoolSearchInput, type School as SchoolType } from "@/components/wizard/school-search-input";
import { VerificationCodeInput } from "@/components/wizard/verification-code-input";

const STEPS = [
  { id: "school", title: "Find Your School" },
  { id: "details", title: "Your Details" },
  { id: "complete", title: "Complete" },
];

const POSITIONS = [
  { value: "principal", label: "Principal" },
  { value: "vice_principal", label: "Vice Principal" },
  { value: "admin_officer", label: "Administrative Officer" },
  { value: "other", label: "Other" },
];

export default function SchoolAdminSetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: School Verification
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [schoolCode, setSchoolCode] = useState("");
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [verifiedSchool, setVerifiedSchool] = useState<SchoolType | null>(null);

  // Step 2: Personal Details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("principal");

  // Always call hooks - memoize values
  const colors = useMemo(() => ({
    primary: "rgb(139 92 246)",
    primaryTo: "rgb(124 58 237)",
    gradient: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
  }), []);

  // Check if user is already set up
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/set-role");
        const data = await res.json();

        if (!data.needsSetup && data.userType === "school-admin") {
          router.push("/school-admin?welcome=true");
        }
      } catch (err) {
        logger.error("Auth check error:", err);
      }
    };
    checkAuth();
  }, [router]);

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return isCodeVerified && verifiedSchool !== null;
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

  const handleBack = () => {
    if (currentStep === 2 && !isCodeVerified) {
      setSelectedSchool(null);
    }
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const submitSetup = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/setup/school-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "complete",
          data: {
            schoolCode,
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
        const errorData = await response.json().catch(() => ({ error: "Setup failed" }));
        setError(errorData.error || errorData.details || "Setup failed. Please try again.");
      }
    } catch (err) {
      logger.error("Setup error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/setup/complete", { method: "POST" });
      const data = await response.json();

      if (data.needsApproval) {
        router.push("/pending-approval");
      } else {
        router.push("/school-admin?welcome=true");
      }
    } catch (err) {
      logger.error("Complete setup error:", err);
      setError("Failed to complete setup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Render helpers - always call the same hooks in the same order
  const renderStep1 = () => {
    return (
      <div className="space-y-6">
        {!selectedSchool ? (
          // State 1: No school selected - show search
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center mx-auto">
                <GraduationCap className="w-8 h-8 text-violet-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Find Your School</h2>
                <p className="text-slate-600 mt-1">
                  Search for your school by name to verify your enrollment.
                </p>
              </div>
            </div>

            <SchoolSearchInput onSchoolSelect={setSelectedSchool} />
          </div>
        ) : !isCodeVerified ? (
          // State 2: School selected but not verified
          <div className="space-y-6">
            {/* Selected school card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-200">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <School className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-violet-900">{selectedSchool.name}</h3>
                    <p className="text-sm text-violet-700 flex items-center gap-1 mt-0.5">
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
                  className="text-violet-600 hover:text-violet-700 hover:bg-white/50"
                >
                  Change
                </Button>
              </div>
            </div>

            {/* Verification code input */}
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-slate-900">Enter School Code</h3>
                <p className="text-sm text-slate-600">
                  Enter the verification code for <span className="font-medium text-violet-600">{selectedSchool.name}</span>
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
        ) : (
          // State 3: Verified - show success
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200">
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
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-medium text-emerald-700">School verified successfully! You can proceed to the next step.</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStep2 = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Your Personal Details
          </h2>
          <p className="text-gray-600">
            Complete your profile information
          </p>
        </div>

        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@school.edu.bt"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+975 17 123 456"
          />
        </div>

        <div>
          <Label htmlFor="position">Position *</Label>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger>
              <SelectValue placeholder="Select your position" />
            </SelectTrigger>
            <SelectContent>
              {POSITIONS.map((pos) => (
                <SelectItem key={pos.value} value={pos.value}>
                  {pos.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleNext}
          disabled={!canGoNext() || isLoading}
          className="w-full"
          style={{ background: colors.gradient }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            "Complete Setup"
          )}
        </Button>
      </div>
    );
  };

  const renderStep3 = () => {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Application Submitted!
          </h2>
          <p className="text-gray-600">
            Your school admin application for <span className="font-medium">{verifiedSchool?.name}</span> has been submitted and is awaiting approval.
          </p>
        </div>

        <div className="bg-violet-50 rounded-lg p-4 text-left">
          <p className="text-sm font-medium text-violet-900 mb-2">
            Application Details:
          </p>
          <div className="text-sm text-violet-800 space-y-1">
            <p><strong>School:</strong> {verifiedSchool?.name}</p>
            <p><strong>Name:</strong> {fullName}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Position:</strong> {POSITIONS.find(p => p.value === position)?.label}</p>
          </div>
        </div>

        <div className="bg-amber-50 rounded-lg p-4 text-left">
          <p className="text-sm font-medium text-amber-900 mb-2">
            What happens next?
          </p>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Your application will be reviewed by the platform administrator</li>
            <li>• You'll receive an email once your account is approved</li>
            <li>• After approval, you can manage your school, students, and teachers</li>
          </ul>
        </div>

        <Button
          onClick={handleComplete}
          disabled={isLoading}
          className="w-full"
          style={{ background: colors.gradient }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            "Continue to Dashboard"
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: colors.gradient }}>
            <School className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            School Admin Portal Setup
          </h1>
          <p className="text-gray-600">
            Set up your school administration account
          </p>
        </div>

        {/* Wizard Card */}
        <Card className="shadow-xl">
          <CardContent className="p-8">
            {/* Steps */}
            <div className="flex items-center justify-center mb-8">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                        currentStep > index
                          ? "bg-green-500 text-white"
                          : currentStep === index + 1
                          ? "text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                      style={
                        currentStep === index + 1
                          ? { background: colors.gradient }
                          : undefined
                      }
                    >
                      {currentStep > index ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className="text-xs mt-1 font-medium text-gray-600">
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-16 h-1 mx-2 rounded ${
                        currentStep > index + 1 ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Step 1: School Verification */}
            {currentStep === 1 && renderStep1()}

            {/* Step 2: Personal Details */}
            {currentStep === 2 && renderStep2()}

            {/* Step 3: Complete */}
            {currentStep === 3 && renderStep3()}
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep < 3 && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isLoading}
            >
              Back
            </Button>
            {currentStep === 1 && isCodeVerified ? (
              <Button
                onClick={handleNext}
                style={{ background: colors.gradient }}
                className="text-white"
              >
                Continue
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
