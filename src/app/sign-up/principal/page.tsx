"use client";

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, School, Building2, User, Mail, Phone, FileText, CheckCircle2, AlertCircle, Upload, ArrowLeft, ArrowRight, Globe, Shield, Home } from "lucide-react";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

const SCHOOL_TYPES = [
  { value: "public", label: "Public School" },
  { value: "private", label: "Private School" },
  { value: "international", label: "International School" },
] as const;

const SCHOOL_LEVELS = [
  { value: "primary", label: "Primary (PP-VI)" },
  { value: "middle", label: "Middle (VII-VIII)" },
  { value: "secondary", label: "Secondary (IX-X)" },
  { value: "higher_secondary", label: "Higher Secondary (XI-XII)" },
  { value: "comprehensive", label: "Comprehensive (PP-XII)" },
] as const;

const BHUTAN_DISTRICTS = [
  "Thimphu", "Paro", "Punakha", "Wangdue Phodrang", "Tsirang",
  "Dagana", "Chukha", "Samtse", "Haa", "Gasa",
  "Bumthang", "Trongsa", "Zhemgang", "Mongar", "Lhuentse",
  "Trashigang", "Trashiyangtse", "Pema Gatshel", "Sarpang", "Samdrup Jongkhar"
];

const ADMIN_TITLES = [
  { value: "principal", label: "Principal" },
  { value: "vice_principal", label: "Vice Principal" },
  { value: "it_admin", label: "IT Administrator" },
  { value: "director", label: "Director" },
] as const;

const VERIFICATION_METHODS = [
  {
    id: "domain",
    title: "Domain Verification",
    description: "Verify ownership by adding a DNS TXT record",
    icon: Globe,
    duration: "10-15 minutes",
    recommended: true,
  },
  {
    id: "document",
    title: "Document Upload",
    description: "Upload school registration and authorization documents",
    icon: FileText,
    duration: "1-2 business days",
    recommended: false,
  },
  {
    id: "ministry",
    title: "Ministry Code",
    description: "Enter your official Ministry of Education code",
    icon: Shield,
    duration: "Instant",
    recommended: false,
  },
] as const;

interface SchoolFormData {
  // School Information
  schoolName: string;
  schoolType: string;
  schoolLevel: string;
  address: string;
  district: string;
  governmentId: string;
  contactEmail: string;
  contactPhone: string;
  website: string;

  // Admin Details
  adminName: string;
  adminTitle: string;
  adminEmail: string;
  adminPhone: string;
  employeeId: string;

  // Verification
  verificationMethod: string;
  domain: string;
  ministryCode: string;

  // Documents (base64 encoded)
  registrationCertificate?: string;
  appointmentLetter?: string;
  governmentIdDoc?: string;
}

interface StepConfig {
  id: string;
  title: string;
  description: string;
  icon: typeof Building2;
}

const STEPS: StepConfig[] = [
  { id: "school", title: "School Information", description: "Tell us about your school", icon: Building2 },
  { id: "admin", title: "Admin Details", description: "Your contact information", icon: User },
  { id: "verification", title: "Verification", description: "Choose a verification method", icon: Shield },
  { id: "review", title: "Review", description: "Review and submit", icon: CheckCircle2 },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PrincipalSignUpPage() {
  const router = useRouter();

  // State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [requestId, setRequestId] = useState("");

  // Form data
  const [formData, setFormData] = useState<SchoolFormData>({
    schoolName: "",
    schoolType: "",
    schoolLevel: "",
    address: "",
    district: "",
    governmentId: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    adminName: "",
    adminTitle: "",
    adminEmail: "",
    adminPhone: "",
    employeeId: "",
    verificationMethod: "",
    domain: "",
    ministryCode: "",
  });

  // Document upload state
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const currentStep = STEPS[currentStepIndex];
  const currentStepId = currentStep.id;

  const updateFormData = useCallback((field: keyof SchoolFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < STEPS.length) {
      setCurrentStepIndex(stepIndex);
      setError("");
    }
  }, []);

  const canProceed = useCallback(() => {
    switch (currentStepId) {
      case "school":
        return formData.schoolName && formData.schoolType && formData.schoolLevel &&
               formData.address && formData.district && formData.governmentId &&
               formData.contactEmail && formData.contactPhone;
      case "admin":
        return formData.adminName && formData.adminTitle && formData.adminEmail &&
               formData.adminPhone && formData.employeeId;
      case "verification":
        if (!formData.verificationMethod) return false;
        if (formData.verificationMethod === "domain" && !formData.domain) return false;
        if (formData.verificationMethod === "ministry" && !formData.ministryCode) return false;
        if (formData.verificationMethod === "document") {
          return formData.registrationCertificate && formData.appointmentLetter;
        }
        return true;
      default:
        return true;
    }
  }, [currentStepId, formData]);

  const extractDomain = useCallback((email: string) => {
    const match = email.match(/@(.+)$/);
    return match ? match[1] : "";
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleNext = () => {
    if (canProceed()) {
      if (currentStepIndex < STEPS.length - 1) {
        goToStep(currentStepIndex + 1);
      } else {
        handleSubmit();
      }
    } else {
      setError("Please fill in all required fields");
    }
  };

  const handleBack = () => {
    goToStep(currentStepIndex - 1);
  };

  const handleFileUpload = async (field: "registrationCertificate" | "appointmentLetter" | "governmentIdDoc", file: File) => {
    setUploadingDoc(field);

    try {
      // Convert to base64 (in production, upload to storage service)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        updateFormData(field, base64);
        setUploadingDoc(null);
      };
      reader.onerror = () => {
        setError("Failed to read file");
        setUploadingDoc(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to upload file");
      setUploadingDoc(null);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/verification/school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit verification request");
      }

      setRequestId(data.requestId);

      if (data.verified) {
        // Instant verification (ministry code)
        setSuccess(true);
        setTimeout(() => {
          router.push("/sign-in?redirect=/school-admin/dashboard");
        }, 3000);
      } else if (data.verificationCode) {
        // Domain verification - show code
        setVerificationCode(data.verificationCode);
      } else {
        // Document upload - pending review
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/verification/verify-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: formData.domain,
          requestId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      if (data.verified) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/sign-in?redirect=/school-admin/dashboard");
        }, 2000);
      } else {
        setError("DNS record not found. Please check the record and try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="w-full max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="text-white font-bold">BE</span>
            </div>
            <span className="font-bold text-2xl text-gray-900 dark:text-white">Bhutan EduSkill</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">School Registration</h1>
          <p className="text-gray-600 dark:text-gray-400">Register your school and verify your account</p>
        </div>

        {/* Success State */}
        {success && !verificationCode && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Registration Submitted!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {formData.verificationMethod === "document"
                  ? "Your documents are being reviewed. You will receive an email once verification is complete."
                  : "Your account has been verified. You can now sign in."}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Redirecting to sign in...</p>
            </CardContent>
          </Card>
        )}

        {/* Domain Verification Code */}
        {verificationCode && !success && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verify Your Domain</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Add the following TXT record to your domain's DNS configuration:
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Type:</span>
                  <Badge variant="outline">TXT</Badge>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Host:</span>
                  <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">@</code>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Value:</span>
                </div>
                <code className="block w-full bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm break-all">
                  bhutan-edu-verify={verificationCode}
                </code>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                DNS changes may take 10-15 minutes to propagate. Once added, click the button below to verify.
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={handleVerifyDomain}
                  disabled={isLoading}
                  className="flex-1"
                  style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Verify Domain
                </Button>
                <Button variant="outline" onClick={() => window.open("https://www.google.com/search?q=how+to+add+txt+record+dns", "_blank")}>
                  Help
                </Button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Form */}
        {!success && !verificationCode && (
          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{currentStep.title}</CardTitle>
                  <CardDescription>{currentStep.description}</CardDescription>
                </div>
                <div className="hidden sm:block">
                  {currentStep.icon && <currentStep.icon className="w-8 h-8 text-orange-500" />}
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center gap-2 mt-4">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                          index <= currentStepIndex
                            ? "bg-orange-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {index < currentStepIndex ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                      </div>
                      <span className={`text-xs mt-1 hidden sm:block ${
                        index === currentStepIndex ? "text-orange-500 font-medium" : "text-gray-400"
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-2 ${
                        index < currentStepIndex ? "bg-orange-500" : "bg-gray-200 dark:bg-gray-700"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </CardHeader>

            <CardContent>
              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
                </div>
              )}

              {/* Step 1: School Information */}
              {currentStepId === "school" && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schoolName">School Name *</Label>
                      <Input
                        id="schoolName"
                        placeholder="e.g., Yangchenphug Higher Secondary School"
                        value={formData.schoolName}
                        onChange={(e) => updateFormData("schoolName", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="schoolType">School Type *</Label>
                      <Select value={formData.schoolType} onValueChange={(v) => updateFormData("schoolType", v)}>
                        <SelectTrigger id="schoolType">
                          <SelectValue placeholder="Select school type" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHOOL_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="schoolLevel">School Level *</Label>
                      <Select value={formData.schoolLevel} onValueChange={(v) => updateFormData("schoolLevel", v)}>
                        <SelectTrigger id="schoolLevel">
                          <SelectValue placeholder="Select school level" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHOOL_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="governmentId">School Government ID *</Label>
                      <Input
                        id="governmentId"
                        placeholder="e.g., SCH-2024-001"
                        value={formData.governmentId}
                        onChange={(e) => updateFormData("governmentId", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="district">District *</Label>
                      <Select value={formData.district} onValueChange={(v) => updateFormData("district", v)}>
                        <SelectTrigger id="district">
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                        <SelectContent>
                          {BHUTAN_DISTRICTS.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">School Contact Email *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="school@example.edu.bt"
                        value={formData.contactEmail}
                        onChange={(e) => updateFormData("contactEmail", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Contact Phone *</Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        placeholder="+975 2 322 456"
                        value={formData.contactPhone}
                        onChange={(e) => updateFormData("contactPhone", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website (Optional)</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://school.edu.bt"
                        value={formData.website}
                        onChange={(e) => updateFormData("website", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">School Address *</Label>
                    <textarea
                      id="address"
                      className="w-full min-h-[80px] rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow]"
                      placeholder="Full school address including locality"
                      value={formData.address}
                      onChange={(e) => updateFormData("address", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Admin Details */}
              {currentStepId === "admin" && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminName">Full Name *</Label>
                      <Input
                        id="adminName"
                        placeholder="e.g., Karma Dorji"
                        value={formData.adminName}
                        onChange={(e) => updateFormData("adminName", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminTitle">Title/Position *</Label>
                      <Select value={formData.adminTitle} onValueChange={(v) => updateFormData("adminTitle", v)}>
                        <SelectTrigger id="adminTitle">
                          <SelectValue placeholder="Select your title" />
                        </SelectTrigger>
                        <SelectContent>
                          {ADMIN_TITLES.map((title) => (
                            <SelectItem key={title.value} value={title.value}>
                              {title.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">Email Address *</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        placeholder="your.name@school.edu.bt"
                        value={formData.adminEmail}
                        onChange={(e) => {
                          updateFormData("adminEmail", e.target.value);
                          // Auto-populate domain if not set
                          if (!formData.domain && e.target.value.includes("@")) {
                            updateFormData("domain", extractDomain(e.target.value));
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500">
                        Must match your school domain for verification
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminPhone">Phone Number *</Label>
                      <Input
                        id="adminPhone"
                        type="tel"
                        placeholder="+975 17 123 456"
                        value={formData.adminPhone}
                        onChange={(e) => updateFormData("adminPhone", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="employeeId">Employee ID / CID *</Label>
                      <Input
                        id="employeeId"
                        placeholder="e.g., EMP-2024-001 or 123456789"
                        value={formData.employeeId}
                        onChange={(e) => updateFormData("employeeId", e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Your Civil ID or school employee identification number
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Verification Method */}
              {currentStepId === "verification" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Choose a verification method</h3>
                    <div className="grid gap-4">
                      {VERIFICATION_METHODS.map((method) => {
                        const Icon = method.icon;
                        const isSelected = formData.verificationMethod === method.id;
                        return (
                          <div
                            key={method.id}
                            className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                              isSelected
                                ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                            }`}
                            onClick={() => updateFormData("verificationMethod", method.id)}
                          >
                            {method.recommended && (
                              <Badge className="absolute -top-2 right-4" style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}>
                                Recommended
                              </Badge>
                            )}
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-lg ${
                                isSelected ? "bg-orange-100 dark:bg-orange-900/30" : "bg-gray-100 dark:bg-gray-800"
                              }`}>
                                <Icon className={`w-6 h-6 ${isSelected ? "text-orange-600 dark:text-orange-400" : "text-gray-600 dark:text-gray-400"}`} />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white">{method.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{method.description}</p>
                                <p className="text-xs text-gray-500 mt-2">Average time: {method.duration}</p>
                              </div>
                              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center">
                                {isSelected && (
                                  <div className="w-3 h-3 rounded-full" style={{ background: 'rgb(249 115 22)' }} />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Domain Verification Details */}
                  {formData.verificationMethod === "domain" && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Domain Verification</h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="domain">Your Domain *</Label>
                          <Input
                            id="domain"
                            placeholder="school.edu.bt"
                            value={formData.domain}
                            onChange={(e) => updateFormData("domain", e.target.value)}
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Enter your school's domain name. We'll verify you own it by checking for a DNS TXT record.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ministry Code Details */}
                  {formData.verificationMethod === "ministry" && (
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Ministry of Education Code</h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="ministryCode">Ministry School Code *</Label>
                          <Input
                            id="ministryCode"
                            placeholder="e.g., MOE-SCH-2024-001"
                            value={formData.ministryCode}
                            onChange={(e) => updateFormData("ministryCode", e.target.value)}
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Enter your official school code from the Ministry of Education for instant verification.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Document Upload Details */}
                  {formData.verificationMethod === "document" && (
                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Upload Required Documents</h4>
                      <div className="space-y-4">
                        <FileUploader
                          label="School Registration Certificate *"
                          description="Official registration document from Ministry of Education"
                          file={formData.registrationCertificate}
                          isLoading={uploadingDoc === "registrationCertificate"}
                          onFileSelect={(file) => handleFileUpload("registrationCertificate", file)}
                          onClear={() => updateFormData("registrationCertificate", "")}
                        />
                        <FileUploader
                          label="Principal/IT Admin Appointment Letter *"
                          description="Official letter appointing you as principal or IT administrator"
                          file={formData.appointmentLetter}
                          isLoading={uploadingDoc === "appointmentLetter"}
                          onFileSelect={(file) => handleFileUpload("appointmentLetter", file)}
                          onClear={() => updateFormData("appointmentLetter", "")}
                        />
                        <FileUploader
                          label="Government ID (Optional)"
                          description="Your Civil ID card or passport"
                          file={formData.governmentIdDoc}
                          isLoading={uploadingDoc === "governmentIdDoc"}
                          onFileSelect={(file) => handleFileUpload("governmentIdDoc", file)}
                          onClear={() => updateFormData("governmentIdDoc", "")}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Review */}
              {currentStepId === "review" && (
                <div className="space-y-6">
                  <ReviewSection title="School Information" icon={Building2}>
                    <ReviewItem label="School Name" value={formData.schoolName} />
                    <ReviewItem label="Type" value={formData.schoolType} />
                    <ReviewItem label="Level" value={formData.schoolLevel} />
                    <ReviewItem label="District" value={formData.district} />
                    <ReviewItem label="Address" value={formData.address} />
                    <ReviewItem label="Government ID" value={formData.governmentId} />
                    <ReviewItem label="Contact Email" value={formData.contactEmail} />
                    <ReviewItem label="Contact Phone" value={formData.contactPhone} />
                    <ReviewItem label="Website" value={formData.website || "Not provided"} />
                  </ReviewSection>

                  <ReviewSection title="Admin Details" icon={User}>
                    <ReviewItem label="Name" value={formData.adminName} />
                    <ReviewItem label="Title" value={formData.adminTitle} />
                    <ReviewItem label="Email" value={formData.adminEmail} />
                    <ReviewItem label="Phone" value={formData.adminPhone} />
                    <ReviewItem label="Employee ID" value={formData.employeeId} />
                  </ReviewSection>

                  <ReviewSection title="Verification Method" icon={Shield}>
                    <ReviewItem
                      label="Method"
                      value={VERIFICATION_METHODS.find(m => m.id === formData.verificationMethod)?.title || formData.verificationMethod}
                    />
                    {formData.verificationMethod === "domain" && (
                      <ReviewItem label="Domain" value={formData.domain} />
                    )}
                    {formData.verificationMethod === "ministry" && (
                      <ReviewItem label="Ministry Code" value={formData.ministryCode} />
                    )}
                    {formData.verificationMethod === "document" && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>Registration Certificate: {formData.registrationCertificate ? "Uploaded" : "Not uploaded"}</p>
                        <p>Appointment Letter: {formData.appointmentLetter ? "Uploaded" : "Not uploaded"}</p>
                        <p>Government ID: {formData.governmentIdDoc ? "Uploaded" : "Not uploaded"}</p>
                      </div>
                    )}
                  </ReviewSection>

                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      By clicking Submit, you confirm that all information provided is accurate and you have the
                      authority to register this school on behalf of the institution.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStepIndex === 0 || isLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || isLoading}
                  style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : currentStepId === "review" ? (
                    <>
                      Submit Registration
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Next Step
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sign In Link */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function FileUploader({
  label,
  description,
  file,
  isLoading,
  onFileSelect,
  onClear,
}: {
  label: string;
  description: string;
  file?: string;
  isLoading?: boolean;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      // Check file size (max 5MB)
      if (selected.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      onFileSelect(selected);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium text-sm text-gray-900 dark:text-white">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          {file && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              File uploaded
            </p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />
        <div className="flex gap-2">
          {file ? (
            <Button size="sm" variant="outline" onClick={onClear} disabled={isLoading}>
              Clear
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Building2;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <Icon className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
        {children}
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-gray-500 dark:text-gray-400">{label}:</span>
      <span className="text-gray-900 dark:text-white font-medium">{value || "—"}</span>
    </>
  );
}
