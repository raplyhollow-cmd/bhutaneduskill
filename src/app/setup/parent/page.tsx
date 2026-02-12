"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardContainer } from "@/components/wizard/wizard-container";
import { WizardNavigation } from "@/components/wizard/wizard-navigation";
import { SchoolCodeInput } from "@/components/wizard/school-code-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, UserPlus, Mail, MessageSquare } from "lucide-react";

const PARENT_STEPS = [
  { id: "find", title: "Find School" },
  { id: "details", title: "Personal Details" },
  { id: "children", title: "Link Children" },
  { id: "preferences", title: "Preferences" },
  { id: "complete", title: "Complete" },
];

const RELATIONSHIPS = ["Father", "Mother", "Guardian", "Grandparent", "Other"];

export default function ParentWizard() {
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
  const [relationship, setRelationship] = useState("");
  const [governmentId, setGovernmentId] = useState("");

  // Step 3: Link Children
  const [children, setChildren] = useState<Array<{ name: string; studentId: string; classGrade: string }>>([]);
  const [newChildName, setNewChildName] = useState("");
  const [newChildId, setNewChildId] = useState("");
  const [newChildGrade, setNewChildGrade] = useState("");

  // Step 4: Preferences
  const [notifications, setNotifications] = useState({
    sms: true,
    email: true,
    app: true,
    frequency: "immediate" as "immediate" | "daily" | "weekly",
  });
  const [language, setLanguage] = useState("english");

  const addChild = () => {
    if (newChildName && newChildId) {
      setChildren([...children, {
        name: newChildName,
        studentId: newChildId,
        classGrade: newChildGrade,
      }]);
      setNewChildName("");
      setNewChildId("");
      setNewChildGrade("");
    }
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return verifiedSchool !== null;
      case 2:
        return !!(fullName && email && phone && relationship);
      case 3:
        return children.length > 0;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (currentStep === PARENT_STEPS.length) {
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
      const response = await fetch("/api/setup/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "complete",
          data: {
            schoolCode,
            personalDetails: { fullName, email, phone, relationship, governmentId },
            children,
            preferences: { notifications, language },
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
        router.push("/parent?welcome=true");
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
      totalSteps={PARENT_STEPS.length}
      title="Parent Setup"
      subtitle="Connect with your child's education journey"
      onExit={() => router.push("/dashboard")}
    >
      {/* Step 1: Find Your School */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Find Your Child's School</h2>
            <p className="text-gray-600">
              Enter your school code to verify and link your account.
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
              Tell us about yourself so we can verify your identity.
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
                placeholder="parent@example.com"
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
              <Label htmlFor="relationship">Relationship to Student</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((rel) => (
                    <SelectItem key={rel} value={rel.toLowerCase()}>{rel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="governmentId">Government ID (Optional)</Label>
              <Input
                id="governmentId"
                value={governmentId}
                onChange={(e) => setGovernmentId(e.target.value)}
                placeholder="CID or Passport number"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Link Children */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Link Your Children</h2>
            <p className="text-gray-600">
              Add your children who are enrolled at this school.
            </p>
          </div>

          <Card className="p-4">
            <h3 className="font-medium mb-3">Add a Child</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="childName">Child's Name</Label>
                <Input
                  id="childName"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="Enter child's full name"
                />
              </div>

              <div>
                <Label htmlFor="childId">Student ID</Label>
                <Input
                  id="childId"
                  value={newChildId}
                  onChange={(e) => setNewChildId(e.target.value)}
                  placeholder="Enter student ID from school"
                />
              </div>

              <div>
                <Label htmlFor="childGrade">Class/Grade (Optional)</Label>
                <Input
                  id="childGrade"
                  value={newChildGrade}
                  onChange={(e) => setNewChildGrade(e.target.value)}
                  placeholder="e.g., Class 10"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addChild}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Child
              </Button>
            </div>
          </Card>

          {children.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Linked Children ({children.length})</h3>
              <div className="space-y-2">
                {children.map((child, index) => (
                  <Card key={index} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{child.name}</p>
                      <p className="text-sm text-gray-500">
                        {child.studentId} {child.classGrade && `• ${child.classGrade}`}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChild(index)}
                    >
                      Remove
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Preferences */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Communication Preferences</h2>
            <p className="text-gray-600">
              Choose how you'd like to receive updates about your child.
            </p>
          </div>

          <div>
            <Label>Notification Methods</Label>
            <div className="space-y-3 mt-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Receive text messages for important updates</p>
                </div>
                <Checkbox
                  checked={notifications.sms}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, sms: !!checked })
                  }
                />
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Mail className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive email summaries and reports</p>
                </div>
                <Checkbox
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, email: !!checked })
                  }
                />
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs">🔔</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">App Notifications</p>
                  <p className="text-sm text-gray-500">Push notifications in the app</p>
                </div>
                <Checkbox
                  checked={notifications.app}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, app: !!checked })
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Update Frequency</Label>
            <Select value={notifications.frequency} onValueChange={(val: any) => setNotifications({ ...notifications, frequency: val })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate (for urgent matters)</SelectItem>
                <SelectItem value="daily">Daily Summary</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Language Preference</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="dzongkha">Dzongkha</SelectItem>
              </SelectContent>
            </Select>
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
              Your parent account is ready. You can now monitor your child's progress.
            </p>
          </div>

          <Card className="p-4 bg-blue-50 border-blue-200 text-left">
            <h3 className="font-semibold text-blue-900 mb-3">You can now:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✓ View your child's attendance records</li>
              <li>✓ Monitor homework and assessments</li>
              <li>✓ Track academic progress</li>
              <li>✓ Communicate with teachers</li>
              <li>✓ Pay school fees online</li>
            </ul>
          </Card>

          <div className="text-sm text-gray-500">
            {children.length} child{children.length > 1 ? "ren" : ""} linked to your account
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
      {currentStep < 5 && (
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={PARENT_STEPS.length}
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
