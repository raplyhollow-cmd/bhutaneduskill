"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WizardLayout, WizardStep, useWizardData } from "@/components/shared/wizard-layout";
import { VictoryScreen } from "@/components/shared/victory-screen";
import { OtpInputWithTimer } from "@/components/form/otp-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { User, Search, Shield, CheckCircle2, AlertCircle, Mail, Phone, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GuardianLinkWizardProps {
  onCancel?: () => void;
  onComplete?: () => void;
}

interface StudentData {
  id: string;
  name: string;
  photo?: string;
  classGrade?: string;
  section?: string;
  schoolName?: string;
}

export function GuardianLinkWizard({ onCancel, onComplete }: GuardianLinkWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [parentData, setParentData] = useState<{ name?: string; cid?: string }>({});
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [otpMethod, setOtpMethod] = useState<"sms" | "email">("sms");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpTimerKey, setOtpTimerKey] = useState(Date.now().toString());
  const [linkedSuccessfully, setLinkedSuccessfully] = useState(false);

  const wizardData = useWizardData({
    parentCID: "",
    studentCode: "",
    relationship: "mother",
    paymentMethod: "",
    enableNotifications: true,
  });

  // Step 1: Verify Parent Identity
  const verifyParentCID = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/parent/verify-cid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid: wizardData.data.parentCID }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "CID verification failed");
      }

      setParentData({ name: data.name, cid: data.cid });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Search for Student
  const searchStudent = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/parent/search-student?code=${wizardData.data.studentCode}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Student not found");
      }

      setStudentData(data.student);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Student search failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Send OTP
  const sendOtp = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/parent/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentData?.id,
          method: otpMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpSent(true);
      setOtpTimerKey(Date.now().toString());
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP sending failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    await sendOtp();
  };

  // Step 3: Verify OTP and Link
  const verifyAndLink = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/parent/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentData?.id,
          code: otpCode,
          relationship: wizardData.data.relationship,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // Step 4: Save payment preferences if provided
      if (wizardData.data.paymentMethod) {
        await fetch("/api/parent/payment-preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethod: wizardData.data.paymentMethod,
            enableNotifications: wizardData.data.enableNotifications,
          }),
        });
      }

      setLinkedSuccessfully(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Step definitions
  const steps: WizardStep[] = [
    {
      id: "identity",
      title: "Verify Your Identity",
      canProceed: wizardData.data.parentCID.length === 11,
      onSubmit: verifyParentCID,
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Enter your CID</p>
              <p className="text-sm text-slate-500">11-digit Bhutan Citizen ID</p>
            </div>
          </div>

          <div>
            <Label htmlFor="parentCID">Citizen ID (CID)</Label>
            <Input
              id="parentCID"
              value={wizardData.data.parentCID}
              onChange={(e) => wizardData.updateField("parentCID", e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="11111111111"
              maxLength={11}
              className="text-center text-lg tracking-widest mt-2"
            />
            <p className="text-xs text-slate-500 mt-2">
              {wizardData.data.parentCID.length}/11 digits
            </p>
          </div>

          {parentData.name && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-green-50 border border-green-200"
            >
              <p className="text-sm font-medium text-green-900">Verified: {parentData.name}</p>
            </motion.div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "child-discovery",
      title: "Find Your Child",
      canProceed: !!studentData,
      onSubmit: searchStudent,
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Search className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Enter Student Code</p>
              <p className="text-sm text-slate-500">CID or Index Number</p>
            </div>
          </div>

          <div>
            <Label htmlFor="studentCode">Student CID / Index Number</Label>
            <Input
              id="studentCode"
              value={wizardData.data.studentCode}
              onChange={(e) => wizardData.updateField("studentCode", e.target.value.toUpperCase())}
              placeholder="Enter student's CID or index number"
              className="mt-2"
            />
          </div>

          {studentData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200"
            >
              <div className="flex items-start gap-4">
                {/* Student Photo */}
                <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                  {studentData.photo ? (
                    <img src={studentData.photo} alt={studentData.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-400" />
                  )}
                </div>

                {/* Student Details */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{studentData.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Class {studentData.classGrade}{studentData.section && `-${studentData.section}`}
                  </p>
                  <p className="text-sm text-slate-500">{studentData.schoolName}</p>
                </div>

                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
              </div>

              <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Please confirm this is your child before proceeding
              </p>
            </motion.div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "security-handshake",
      title: "Security Verification",
      canProceed: otpCode.length === 6,
      onSubmit: otpSent ? verifyAndLink : sendOtp,
      content: (
        <div className="space-y-6">
          {!otpSent ? (
            <>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Choose verification method</p>
                  <p className="text-sm text-slate-500">How should we send your verification code?</p>
                </div>
              </div>

              <RadioGroup value={otpMethod} onValueChange={(v) => setOtpMethod(v as "sms" | "email")}>
                <div className="space-y-3">
                  <label
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      otpMethod === "sms"
                        ? "border-purple-500 bg-purple-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <RadioGroupItem value="sms" />
                    <Phone className="w-5 h-5 text-slate-600" />
                    <div className="flex-1">
                      <p className="font-medium">SMS (Text Message)</p>
                      <p className="text-sm text-slate-500">Send to registered phone number</p>
                    </div>
                  </label>

                  <label
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      otpMethod === "email"
                        ? "border-purple-500 bg-purple-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <RadioGroupItem value="email" />
                    <Mail className="w-5 h-5 text-slate-600" />
                    <div className="flex-1">
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-slate-500">Send to registered email address</p>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </>
          ) : (
            <>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Enter the verification code</h3>
                  <p className="text-sm text-slate-500">
                    {otpMethod === "sms" ? "SMS" : "Email"} sent to your registered {otpMethod === "sms" ? "phone" : "email"}
                  </p>
                </div>
              </div>

              <OtpInputWithTimer
                value={otpCode}
                onChange={setOtpCode}
                onResend={resendOtp}
                timerKey={otpTimerKey}
                error={error}
              />
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "relationship",
      title: "Confirm Relationship",
      canProceed: !!wizardData.data.relationship,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-slate-600">How are you related to {studentData?.name}?</p>
          </div>

          <RadioGroup
            value={wizardData.data.relationship}
            onValueChange={(v) => wizardData.updateField("relationship", v)}
          >
            <div className="grid grid-cols-2 gap-3">
              {["father", "mother", "guardian", "grandparent"].map((role) => (
                <label
                  key={role}
                  className={cn(
                    "flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all capitalize",
                    wizardData.data.relationship === role
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <RadioGroupItem value={role} className="sr-only" />
                  <span className="font-medium">{role}</span>
                </label>
              ))}
            </div>
          </RadioGroup>

          {studentData && (
            <div className="p-4 rounded-xl bg-slate-50 text-center">
              <p className="text-sm text-slate-600">
                Linking as <strong className="text-slate-900 capitalize">{wizardData.data.relationship}</strong> to{" "}
                <strong className="text-slate-900">{studentData.name}</strong>
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "financial",
      title: "Payment Setup (Optional)",
      canProceed: true,
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Set up fee payments</p>
              <p className="text-sm text-slate-500">Link mBOB for one-click payments (optional)</p>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Payment Method</Label>
            <RadioGroup
              value={wizardData.data.paymentMethod}
              onValueChange={(v) => wizardData.updateField("paymentMethod", v)}
            >
              <div className="space-y-2">
                <label
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    wizardData.data.paymentMethod === "mbob"
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200"
                  )}
                >
                  <RadioGroupItem value="mbob" />
                  <span className="font-medium">mBOB</span>
                  <span className="text-sm text-slate-500 ml-auto">Bhutan&apos;s mobile payment</span>
                </label>

                <label
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    wizardData.data.paymentMethod === "bank"
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200"
                  )}
                >
                  <RadioGroupItem value="bank" />
                  <span className="font-medium">Bank Transfer</span>
                  <span className="text-sm text-slate-500 ml-auto">Manual payment</span>
                </label>

                <label
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    wizardData.data.paymentMethod === ""
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200"
                  )}
                >
                  <RadioGroupItem value="" />
                  <span className="font-medium">Skip for now</span>
                  <span className="text-sm text-slate-500 ml-auto">Setup later</span>
                </label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="notifications"
              checked={wizardData.data.enableNotifications}
              onCheckedChange={(c) => wizardData.updateField("enableNotifications", !!c)}
            />
            <label htmlFor="notifications" className="text-sm text-slate-600">
              Send me fee reminders and payment confirmations
            </label>
          </div>
        </div>
      ),
    },
  ];

  // Victory state
  if (linkedSuccessfully) {
    return (
      <VictoryScreen
        title={`${studentData?.name || "Your child"} is now linked`}
        message="You can now track attendance, grades, and receive notifications."
        highlights={[
          "Attendance alerts will be sent to your phone",
          "Grade updates will appear on your dashboard",
          "Fee reminders are enabled",
          "School announcements will be visible",
        ]}
        actionLabel="Go to Children"
        actionHref="/parent/children"
        portalType="parent"
      />
    );
  }

  return (
    <WizardLayout
      steps={steps}
      portalType="parent"
      title="Link Your Child"
      subtitle="Securely connect to your child's school account"
      onCancel={onCancel}
      autoSaveKey="guardian-link-wizard"
      onComplete={onComplete}
    />
  );
}
