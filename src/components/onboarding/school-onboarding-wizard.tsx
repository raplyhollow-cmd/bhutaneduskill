"use client";

/**
 * SCHOOL ONBOARDING WIZARD
 *
 * Guided setup for new schools signing up
 * 5 steps to get from sign-up to full platform use
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  ChevronRight,
  School,
  Users,
  MapPin,
  Upload,
  Settings,
  Rocket,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================/

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

interface SchoolInfo {
  name: string;
  nameDz: string;
  code: string;
  district: string;
  schoolType: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

interface Administrator {
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface SetupConfig {
  studentCount: number;
  teacherCount: number;
  grades: string[];
  streams: string[];
  features: string[];
}

interface ImportData {
  hasData: boolean;
  dataSource: "manual" | "csv" | "integration";
}

interface OnboardingData {
  schoolInfo: SchoolInfo;
  administrator: Administrator;
  setupConfig: SetupConfig;
  importData: ImportData;
}

// ============================================================================
// COMPONENT
// ============================================================================/

export function SchoolOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [data, setData] = useState<OnboardingData>({
    schoolInfo: {
      name: "",
      nameDz: "",
      code: "",
      district: "",
      schoolType: "",
      address: "",
      phone: "",
      email: "",
      website: "",
    },
    administrator: {
      name: "",
      email: "",
      phone: "",
      role: "principal",
    },
    setupConfig: {
      studentCount: 0,
      teacherCount: 0,
      grades: [],
      streams: [],
      features: [],
    },
    importData: {
      hasData: false,
      dataSource: "manual",
    },
  });

  const progress = (currentStep / 5) * 100;

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep((currentStep + 1) as OnboardingStep);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as OnboardingStep);
  };

  const completeOnboarding = async () => {
    // TODO: Submit to API
    console.log("Onboarding complete:", data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Bhutan EduSkill
          </h1>
          <p className="text-gray-600">
            Let's set up your school in 5 simple steps
          </p>
        </div>

        {/* Progress */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep} of 5</span>
              <span className="text-sm text-gray-500">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-4">
              <StepIndicator number={1} label="School" active={currentStep === 1} completed={currentStep > 1} />
              <StepIndicator number={2} label="Admin" active={currentStep === 2} completed={currentStep > 2} />
              <StepIndicator number={3} label="Configure" active={currentStep === 3} completed={currentStep > 3} />
              <StepIndicator number={4} label="Import" active={currentStep === 4} completed={currentStep > 4} />
              <StepIndicator number={5} label="Review" active={currentStep === 5} completed={false} />
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardContent className="p-8">
            {currentStep === 1 && (
              <SchoolInfoStep data={data} onChange={setData} />
            )}
            {currentStep === 2 && (
              <AdministratorStep data={data} onChange={setData} />
            )}
            {currentStep === 3 && (
              <ConfigurationStep data={data} onChange={setData} />
            )}
            {currentStep === 4 && (
              <ImportStep data={data} onChange={setData} />
            )}
            {currentStep === 5 && (
              <ReviewStep data={data} onChange={setData} />
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              {currentStep < 5 ? (
                <Button onClick={nextStep}>
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={completeOnboarding} className="bg-purple-600 hover:bg-purple-700">
                  <Rocket className="w-4 h-4 mr-2" />
                  Complete Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================/

function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          completed
            ? "bg-green-600 text-white"
            : active
            ? "bg-purple-600 text-white"
            : "bg-gray-200 text-gray-600"
        }`}
      >
        {completed ? <Check className="w-4 h-4" /> : number}
      </div>
      <span
        className={`text-xs mt-1 ${
          active ? "text-purple-600 font-medium" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function SchoolInfoStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (data: OnboardingData) => void;
}) {
  const updateField = (field: keyof SchoolInfo, value: string) => {
    onChange({
      ...data,
      schoolInfo: { ...data.schoolInfo, [field]: value },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
          <School className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">School Information</h2>
          <p className="text-sm text-gray-500">Tell us about your school</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="schoolName">School Name *</Label>
          <Input
            id="schoolName"
            placeholder="e.g., Yangchenphug Higher Secondary School"
            value={data.schoolInfo.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="schoolNameDz">སློབ་གྲྭམའི་མིང་། (Dzongkha Name)</Label>
          <Input
            id="schoolNameDz"
            placeholder="དབྱིས་འཛིན་ཕོ་བོ་གླིང་ཚེ་རིང་སློབ་གྲྭམ།"
            value={data.schoolInfo.nameDz}
            onChange={(e) => updateField("nameDz", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="schoolCode">School Code *</Label>
          <Input
            id="schoolCode"
            placeholder="e.g., YHSS"
            value={data.schoolInfo.code}
            onChange={(e) => updateField("code", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">District *</Label>
          <Select
            value={data.schoolInfo.district}
            onValueChange={(value) => updateField("district", value)}
          >
            <SelectTrigger id="district">
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thimphu">Thimphu</SelectItem>
              <SelectItem value="paro">Paro</SelectItem>
              <SelectItem value="punakha">Punakha</SelectItem>
              <SelectItem value="wangdue">Wangdue Phodrang</SelectItem>
              <SelectItem value="mongar">Mongar</SelectItem>
              <SelectItem value="trashigang">Trashigang</SelectItem>
              <SelectItem value="samtse">Samtse</SelectItem>
              {/* Add all 20 districts */}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="schoolType">School Type *</Label>
          <Select
            value={data.schoolInfo.schoolType}
            onValueChange={(value) => updateField("schoolType", value)}
          >
            <SelectTrigger id="schoolType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="government">Government</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            placeholder="+975 2-34567"
            value={data.schoolInfo.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            placeholder="School address"
            value={data.schoolInfo.address}
            onChange={(e) => updateField("address", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="email">Official Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="school@example.bt"
            value={data.schoolInfo.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="website">Website (Optional)</Label>
          <Input
            id="website"
            placeholder="https://"
            value={data.schoolInfo.website}
            onChange={(e) => updateField("website", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function AdministratorStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (data: OnboardingData) => void;
}) {
  const updateField = (field: keyof Administrator, value: string) => {
    onChange({
      ...data,
      administrator: { ...data.administrator, [field]: value },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Administrator Account</h2>
          <p className="text-sm text-gray-500">Primary platform administrator</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="adminName">Full Name *</Label>
          <Input
            id="adminName"
            placeholder="Dorji Wangmo"
            value={data.administrator.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminRole">Role *</Label>
          <Select
            value={data.administrator.role}
            onValueChange={(value) => updateField("role", value)}
          >
            <SelectTrigger id="adminRole">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="principal">Principal</SelectItem>
              <SelectItem value="vice_principal">Vice Principal</SelectItem>
              <SelectItem value="administrator">System Administrator</SelectItem>
              <SelectItem value="counselor">School Counselor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminEmail">Email Address *</Label>
          <Input
            id="adminEmail"
            type="email"
            placeholder="admin@school.bt"
            value={data.administrator.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminPhone">Mobile Number</Label>
          <Input
            id="adminPhone"
            placeholder="+975 17-123456"
            value={data.administrator.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-blue-800">
          This account will have full access to manage students, teachers, and settings.
          You can add additional administrators later.
        </p>
      </div>
    </div>
  );
}

function ConfigurationStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (data: OnboardingData) => void;
}) {
  const updateConfig = (field: keyof SetupConfig, value: any) => {
    onChange({
      ...data,
      setupConfig: { ...data.setupConfig, [field]: value },
    });
  };

  const toggleGrade = (grade: string) => {
    const grades = data.setupConfig.grades.includes(grade)
      ? data.setupConfig.grades.filter((g) => g !== grade)
      : [...data.setupConfig.grades, grade];
    updateConfig("grades", grades);
  };

  const toggleFeature = (feature: string) => {
    const features = data.setupConfig.features.includes(feature)
      ? data.setupConfig.features.filter((f) => f !== feature)
      : [...data.setupConfig.features, feature];
    updateConfig("features", features);
  };

  const toggleStream = (stream: string) => {
    const streams = data.setupConfig.streams.includes(stream)
      ? data.setupConfig.streams.filter((s) => s !== stream)
      : [...data.setupConfig.streams, stream];
    updateConfig("streams", streams);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
          <Settings className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Platform Configuration</h2>
          <p className="text-sm text-gray-500">Customize for your school</p>
        </div>
      </div>

      {/* Student/Teacher Counts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="studentCount">Number of Students *</Label>
          <Input
            id="studentCount"
            type="number"
            placeholder="500"
            value={data.setupConfig.studentCount || ""}
            onChange={(e) => updateConfig("studentCount", parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-gray-500">
            This helps us recommend the right plan
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="teacherCount">Number of Teachers *</Label>
          <Input
            id="teacherCount"
            type="number"
            placeholder="25"
            value={data.setupConfig.teacherCount || ""}
            onChange={(e) => updateConfig("teacherCount", parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Grades */}
      <div className="space-y-3">
        <Label>Classes Offered *</Label>
        <div className="grid grid-cols-7 gap-2">
          {["PP", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((grade) => (
            <button
              key={grade}
              type="button"
              onClick={() => toggleGrade(grade)}
              className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-colors ${
                data.setupConfig.grades.includes(grade)
                  ? "border-purple-600 bg-purple-50 text-purple-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {grade}
            </button>
          ))}
        </div>
      </div>

      {/* Streams for Classes 11-12 */}
      <div className="space-y-3">
        <Label>Streams (Class 11-12)</Label>
        <div className="flex gap-3">
          {["Science", "Arts", "Commerce"].map((stream) => (
            <button
              key={stream}
              type="button"
              onClick={() => toggleStream(stream)}
              className={`py-2 px-4 rounded-lg text-sm font-medium border-2 transition-colors ${
                data.setupConfig.streams.includes(stream)
                  ? "border-purple-600 bg-purple-50 text-purple-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {stream}
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <Label>Platform Features</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "assessments", label: "Career Assessments", desc: "RIASEC, MBTI" },
            { id: "roadmap", label: "Student Roadmaps", desc: "Class 6 → Career" },
            { id: "analytics", label: "Advanced Analytics", desc: "School insights" },
            { id: "counselor", label: "Counselor Dashboard", desc: "Student tracking" },
            { id: "parent", label: "Parent Portal", desc: "Family access" },
            { id: "attendance", label: "Attendance", desc: "Daily tracking" },
          ].map((feature) => (
            <div key={feature.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
              <Checkbox
                id={feature.id}
                checked={data.setupConfig.features.includes(feature.id)}
                onCheckedChange={() => toggleFeature(feature.id)}
              />
              <div className="flex-1">
                <Label htmlFor={feature.id} className="cursor-pointer font-medium">
                  {feature.label}
                </Label>
                <p className="text-xs text-gray-500">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImportStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (data: OnboardingData) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
          <Upload className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Import Your Data</h2>
          <p className="text-sm text-gray-500">Add existing students and teachers</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Upload CSV File</h3>
          <p className="text-sm text-gray-500 mb-4">
            Drag and drop your student/teacher data file here
          </p>
          <Button variant="outline">Choose File</Button>
        </div>

        <div className="text-center text-sm text-gray-500">
          OR
        </div>

        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <h3 className="font-semibold mb-2">Manual Entry</h3>
          <p className="text-sm text-gray-500 mb-4">
            Enter students and teachers manually after setup
          </p>
          <Button variant="outline">I'll do this later</Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> You can always import more data later. The platform will be
          fully functional immediately after setup.
        </p>
      </div>
    </div>
  );
}

function ReviewStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (data: OnboardingData) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
          <Check className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Review & Complete</h2>
          <p className="text-sm text-gray-500">Confirm your setup details</p>
        </div>
      </div>

      <div className="space-y-4">
        <Section title="School Information">
          <Detail label="School Name" value={data.schoolInfo.name} />
          <Detail label="District" value={data.schoolInfo.district} />
          <Detail label="Type" value={data.schoolInfo.schoolType} />
          <Detail label="Students" value={data.setupConfig.studentCount?.toString()} />
          <Detail label="Teachers" value={data.setupConfig.teacherCount?.toString()} />
        </Section>

        <Section title="Administrator">
          <Detail label="Name" value={data.administrator.name} />
          <Detail label="Email" value={data.administrator.email} />
          <Detail label="Role" value={data.administrator.role} />
        </Section>

        <Section title="Configuration">
          <div className="flex flex-wrap gap-2">
            {data.setupConfig.grades.map((grade) => (
              <Badge key={grade} variant="secondary">
                Class {grade}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {data.setupConfig.streams.map((stream) => (
              <Badge key={stream} className="bg-purple-100 text-purple-700">
                {stream}
              </Badge>
            ))}
          </div>
        </Section>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">Ready to Go!</h3>
        <p className="text-sm text-green-800">
          After completing setup, you'll have immediate access to:
        </p>
        <ul className="text-sm text-green-700 mt-2 space-y-1">
          <li>• Student assessments (RIASEC, MBTI, DISC)</li>
          <li>• Career roadmaps for every student</li>
          <li>• BCSE readiness tracking</li>
          <li>• Analytics dashboard</li>
        </ul>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
