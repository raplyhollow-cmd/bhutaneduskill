"use client";

import { useState } from "react";
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
import { Building2, User, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

const STEPS = [
  { id: "verify", title: "Ministry Verification" },
  { id: "details", title: "Your Details" },
  { id: "complete", title: "Complete" },
];

export default function MinistrySetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Ministry Verification
  const [ministryId, setMinistryId] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  // Step 2: Personal Details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");

  const verifyMinistryId = async () => {
    setIsVerifying(true);
    setVerificationError("");

    // Mock verification - replace with actual API call
    setTimeout(() => {
      if (ministryId.length >= 3) {
        setIsVerified(true);
        setCurrentStep(2);
      } else {
        setVerificationError("Invalid Ministry ID. Please enter a valid ID.");
      }
      setIsVerifying(false);
    }, 1000);
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return isVerified;
      case 2:
        return !!(fullName && email && phone && officeLocation);
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (isLoading || isVerifying) return;

    if (currentStep === 1 && !isVerified) {
      await verifyMinistryId();
    } else if (currentStep === 2) {
      await submitSetup();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const submitSetup = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/setup/ministry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "complete",
          data: {
            ministryId,
            department,
            designation,
            fullName,
            email,
            phone,
            officeLocation,
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
      router.push("/ministry?welcome=true");
    } finally {
      setIsLoading(false);
    }
  };

  const colors = {
    primary: "rgb(168 85 247)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: colors.gradient }}>
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Ministry Portal Setup
            </h1>
            <p className="text-gray-600">
              Set up your Ministry of Education account
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

              {/* Step 1: Ministry Verification */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Verify Your Ministry Identity
                    </h2>
                    <p className="text-gray-600">
                      Enter your Ministry ID and department information
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="ministryId">Ministry ID *</Label>
                    <Input
                      id="ministryId"
                      value={ministryId}
                      onChange={(e) => setMinistryId(e.target.value)}
                      placeholder="Enter your Ministry issued ID"
                      disabled={isVerified}
                    />
                  </div>

                  <div>
                    <Label htmlFor="department">Department *</Label>
                    <Select
                      value={department}
                      onValueChange={setDepartment}
                      disabled={isVerified}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="education">Department of Education</SelectItem>
                        <SelectItem value="curriculum">Department of Curriculum</SelectItem>
                        <SelectItem value="examinations">Department of Examinations</SelectItem>
                        <SelectItem value="higher">Department of Higher Education</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="designation">Designation *</Label>
                    <Select
                      value={designation}
                      onValueChange={setDesignation}
                      disabled={isVerified}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="director">Director</SelectItem>
                        <SelectItem value="joint-director">Joint Director</SelectItem>
                        <SelectItem value="deputy-director">Deputy Director</SelectItem>
                        <SelectItem value="education-officer">Education Officer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {verificationError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm">{verificationError}</span>
                    </div>
                  )}

                  <Button
                    onClick={handleNext}
                    disabled={!ministryId || !department || !designation || isVerifying}
                    className="w-full"
                    style={{ background: colors.gradient }}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : isVerified ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Verified
                      </>
                    ) : (
                      "Verify Ministry ID"
                    )}
                  </Button>
                </div>
              )}

              {/* Step 2: Personal Details */}
              {currentStep === 2 && (
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
                      placeholder="your.email@education.gov.bt"
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
                    <Label htmlFor="officeLocation">Office Location *</Label>
                    <Input
                      id="officeLocation"
                      value={officeLocation}
                      onChange={(e) => setOfficeLocation(e.target.value)}
                      placeholder="Thimphu / Paro / etc."
                    />
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
              )}

              {/* Step 3: Complete */}
              {currentStep === 3 && (
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Setup Complete!
                    </h2>
                    <p className="text-gray-600">
                      Your Ministry portal account has been created successfully.
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 text-left">
                    <p className="text-sm font-medium text-purple-900 mb-2">
                      Ministry Account Details:
                    </p>
                    <div className="text-sm text-purple-800 space-y-1">
                      <p><strong>Department:</strong> {department}</p>
                      <p><strong>Designation:</strong> {designation}</p>
                      <p><strong>Name:</strong> {fullName}</p>
                    </div>
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
                      "Go to Ministry Dashboard"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1 || isLoading}
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canGoNext() || isLoading}
            style={{ background: colors.gradient }}
            className="text-white"
          >
            {isLoading ? "Processing..." : currentStep === 2 ? "Complete Setup" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
