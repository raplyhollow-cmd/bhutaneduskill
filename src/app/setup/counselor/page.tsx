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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Slider } from "@/components/ui/slider"; // Slider component not available
import { Loader2, CheckCircle2, GraduationCap } from "lucide-react";

const COUNSELOR_STEPS = [
  { id: "find", title: "Find School" },
  { id: "details", title: "Personal Details" },
  { id: "setup", title: "Setup Preferences" },
  { id: "complete", title: "Complete" },
];

const SPECIALIZATIONS = [
  "Career Counseling", "Academic Guidance", "Personal Development",
  "College Applications", "Mental Health Support", "Study Skills",
  "Career Assessment", "Goal Setting", "Parent Consultation"
];

export default function CounselorWizard() {
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
  const [licenseNumber, setLicenseNumber] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);

  // Step 3: Setup Preferences
  const [caseloadCapacity, setCaseloadCapacity] = useState([50]);
  const [sessionDuration, setSessionDuration] = useState("30");
  const [availability, setAvailability] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations((prev) =>
      prev.includes(spec)
        ? prev.filter((s) => s !== spec)
        : [...prev, spec]
    );
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return verifiedSchool !== null;
      case 2:
        return !!(fullName && email && phone && qualifications);
      case 3:
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (currentStep === COUNSELOR_STEPS.length) {
      await completeWizard();
    } else if (currentStep === 3) {
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
      const response = await fetch("/api/setup/counselor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "complete",
          data: {
            schoolCode,
            personalDetails: {
              fullName,
              email,
              phone,
              licenseNumber,
              qualifications,
              specializations: selectedSpecializations,
            },
            preferences: {
              caseloadCapacity: caseloadCapacity[0],
              sessionDuration,
              availability,
            },
          },
        }),
      });

      if (response.ok) {
        setCurrentStep(4);
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
        router.push("/counselor?welcome=true");
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
      totalSteps={COUNSELOR_STEPS.length}
      title="Counselor Setup"
      subtitle="Configure your counseling profile"
      onExit={() => router.push("/dashboard")}
    >
      {/* Step 1: Find Your School */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Find Your School</h2>
            <p className="text-gray-600">
              Enter your school code to verify your counselor status.
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
              Tell us about yourself so we can set up your counselor account.
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
                placeholder="counselor@school.edu.bt"
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
              <Label htmlFor="licenseNumber">License Number (Optional)</Label>
              <Input
                id="licenseNumber"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Professional license number"
              />
            </div>

            <div>
              <Label htmlFor="qualifications">Qualifications</Label>
              <Textarea
                id="qualifications"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder="e.g., M.A. in Counseling, B.Ed, Certified Career Coach"
                rows={3}
              />
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
        </div>
      )}

      {/* Step 3: Setup Preferences */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Counseling Preferences</h2>
            <p className="text-gray-600">
              Configure your counseling schedule and capacity.
            </p>
          </div>

          <div>
            <Label>
              Caseload Capacity: {caseloadCapacity[0]} students
            </Label>
            <p className="text-sm text-gray-500 mb-3">
              Maximum number of students you can actively counsel
            </p>
            <Input
              type="number"
              min={10}
              max={100}
              step={5}
              value={caseloadCapacity[0]}
              onChange={(e) => setCaseloadCapacity([Number(e.target.value)])}
              className="py-4"
            />
          </div>

          <div>
            <Label>Default Session Duration</Label>
            <Select value={sessionDuration} onValueChange={setSessionDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Availability</Label>
            <p className="text-sm text-gray-500 mb-3">
              Select the days you're available for counseling sessions
            </p>
            <div className="grid grid-cols-7 gap-2">
              {[
                { key: "monday", label: "Mon" },
                { key: "tuesday", label: "Tue" },
                { key: "wednesday", label: "Wed" },
                { key: "thursday", label: "Thu" },
                { key: "friday", label: "Fri" },
                { key: "saturday", label: "Sat" },
                { key: "sunday", label: "Sun" },
              ].map((day) => (
                <button
                  key={day.key}
                  type="button"
                  onClick={() =>
                    setAvailability({ ...availability, [day.key]: !availability[day.key as keyof typeof availability] })
                  }
                  className={`p-2 text-sm rounded-lg border-2 text-center transition-all ${
                    availability[day.key as keyof typeof availability]
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {currentStep === 4 && (
        <div className="text-center space-y-6 py-8">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
            <GraduationCap className="w-10 h-10 text-purple-600" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome, {fullName}!
            </h2>
            <p className="text-gray-600">
              Your counselor account is ready. Start helping students achieve their goals!
            </p>
          </div>

          <Card className="p-4 bg-purple-50 border-purple-200 text-left">
            <h3 className="font-semibold text-purple-900 mb-3">You can now:</h3>
            <ul className="space-y-2 text-sm text-purple-800">
              <li>✓ View assigned students and their profiles</li>
              <li>✓ Schedule counseling sessions</li>
              <li>✓ Track student interventions and progress</li>
              <li>✓ Maintain confidential counseling notes</li>
              <li>✓ Administer career assessments</li>
              <li>✓ Generate reports for parents and school</li>
            </ul>
          </Card>

          <div className="text-sm text-gray-500">
            Caseload capacity: {caseloadCapacity[0]} students
          </div>

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
      {currentStep < 4 && (
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={COUNSELOR_STEPS.length}
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
