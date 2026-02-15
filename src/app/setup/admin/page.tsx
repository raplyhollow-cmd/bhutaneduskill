"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardContainer } from "@/components/wizard/wizard-container";
import { WizardNavigation } from "@/components/wizard/wizard-navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Building2, Globe, Settings } from "lucide-react";

const ADMIN_STEPS = [
  { id: "org", title: "Organization" },
  { id: "admin", title: "Admin Account" },
  { id: "complete", title: "Complete" },
];

const TIMEZONES = [
  "Asia/Thimphu",
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Bangkok",
];

export default function PlatformAdminWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Organization Setup
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [themeColor, setThemeColor] = useState("blue");
  const [timezone, setTimezone] = useState("Asia/Thimphu");

  // Step 2: Admin Account
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return !!(orgName && orgSlug && timezone);
      case 2:
        return !!(adminName && adminEmail && adminPhone);
      default:
        return true;
    }
  };

  const handleNext = async () => {
    // Prevent double-clicks
    if (isLoading) return;

    if (currentStep === ADMIN_STEPS.length) {
      await completeWizard();
    } else if (currentStep === 2) {
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
      const response = await fetch("/api/setup/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "complete",
          data: {
            organization: { orgName, orgSlug, themeColor, timezone },
            admin: { adminName, adminEmail, adminPhone },
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Setup complete, moving to step 3");
        setCurrentStep(3);
      } else {
        const error = await response.json();
        console.error("Setup API error:", error);
        alert(error.error || "Failed to complete setup. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting wizard data:", error);
      alert("Network error. Please check your connection and try again.");
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
        router.push("/admin?welcome=true");
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
      totalSteps={ADMIN_STEPS.length}
      title="Platform Setup"
      subtitle="Initialize your Bhutan EduSkill platform"
      onExit={() => router.push("/dashboard")}
    >
      {/* Step 1: Organization Setup */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Organization Setup</h2>
              <p className="text-gray-600">Configure your organization details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => {
                  setOrgName(e.target.value);
                  setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
                placeholder="e.g., Ministry of Education"
              />
            </div>

            <div>
              <Label htmlFor="orgSlug">Organization Slug</Label>
              <Input
                id="orgSlug"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                placeholder="ministry-of-education"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be used in your platform URL
              </p>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Theme Color</Label>
              <div className="flex gap-3 mt-2">
                {["blue", "green", "purple", "orange", "red"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setThemeColor(color)}
                    className={`w-10 h-10 rounded-full border-2 ${
                      themeColor === color ? "border-gray-900" : "border-gray-200"
                    }`}
                    style={{ backgroundColor: color === "blue" ? "#3b82f6" : color === "green" ? "#22c55e" : color === "purple" ? "#a855f7" : color === "orange" ? "#f97316" : "#ef4444" }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Admin Account */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Admin Account</h2>
              <p className="text-gray-600">Set up the primary administrator account</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="adminName">Full Name</Label>
              <Input
                id="adminName"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Administrator's full name"
              />
            </div>

            <div>
              <Label htmlFor="adminEmail">Email Address</Label>
              <Input
                id="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@organization.bt"
              />
            </div>

            <div>
              <Label htmlFor="adminPhone">Phone Number</Label>
              <Input
                id="adminPhone"
                type="tel"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="+975 17 123 456"
              />
            </div>

            <Card className="p-3 bg-blue-50 border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your Clerk account will be linked as the platform administrator.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* Step 3: Complete */}
      {currentStep === 3 && (
        <div className="text-center space-y-6 py-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
            <Globe className="w-10 h-10 text-white" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Platform Ready!
            </h2>
            <p className="text-gray-600">
              Your Bhutan EduSkill platform has been initialized successfully.
            </p>
          </div>

          <Card className="p-4 bg-blue-50 border-blue-200 text-left">
            <h3 className="font-semibold text-blue-900 mb-3">Next Steps:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✓ Go to the <strong>Schools page</strong> to create and manage schools</li>
              <li>✓ Configure global settings and policies</li>
              <li>✓ Set up payment gateway for subscriptions</li>
              <li>✓ Customize career and assessment content</li>
              <li>✓ Monitor platform usage and analytics</li>
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
      {currentStep < 3 && (
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={ADMIN_STEPS.length}
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
