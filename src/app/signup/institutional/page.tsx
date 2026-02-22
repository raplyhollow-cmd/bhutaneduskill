"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  School,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PremiumCard } from "@/components/admin/premium-card";

// Role configurations
const ROLE_CONFIG = {
  "school-admin": {
    name: "School Admin",
    icon: School,
    color: "rgb(139 92 246)",
    colorTo: "rgb(124 58 237)",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
  },
  "counselor": {
    name: "Counselor",
    icon: UserPlus,
    color: "rgb(168 85 247)",
    colorTo: "rgb(147 51 234)",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
};

export default function InstitutionalSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    }>
      <InstitutionalSignupPageContent />
    </Suspense>
  );
}

function InstitutionalSignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [selectedRole, setSelectedRole] = useState<keyof typeof ROLE_CONFIG | null>(
    roleParam === "school-admin" || roleParam === "counselor" ? roleParam : null
  );
  const [schoolCode, setSchoolCode] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [error, setError] = useState("");

  // Redirect if no valid role selected
  useEffect(() => {
    if (!roleParam || !["school-admin", "counselor"].includes(roleParam)) {
      router.push("/signup");
    }
  }, [roleParam, router]);

  const handleBack = () => {
    router.push("/signup");
  };

  const validateSchoolCode = async () => {
    if (!schoolCode.trim()) {
      setError("Please enter a school code");
      return;
    }

    setIsValidating(true);
    setError("");

    try {
      // Validate school code via API
      const response = await fetch("/api/schools/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: schoolCode.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setIsCodeValid(true);
        setSchoolName(data.school.name);
        setError("");
      } else {
        setIsCodeValid(false);
        setSchoolName("");
        setError(data.message || "Invalid school code. Please check with your school administrator.");
      }
    } catch (err) {
      setIsCodeValid(false);
      setSchoolName("");
      setError("Unable to validate school code. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleContinue = () => {
    if (!isCodeValid || !selectedRole) return;

    // Store the school code in session storage for use after Clerk auth
    sessionStorage.setItem("pendingSchoolCode", schoolCode.trim().toUpperCase());
    sessionStorage.setItem("pendingRole", selectedRole);

    // Redirect to Clerk signup with the appropriate redirect URL
    const redirectUrl = encodeURIComponent(`/setup/${selectedRole}?code=${schoolCode.trim().toUpperCase()}`);
    router.push(`/sign-up?redirect_url=${redirectUrl}`);
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const roleConfig = ROLE_CONFIG[selectedRole];
  const Icon = roleConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${roleConfig.color} 0%, ${roleConfig.colorTo} 100%)` }}
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">Bhutan EduSkill</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${roleConfig.color} 0%, ${roleConfig.colorTo} 100%)` }}
          >
            1
          </div>
          <div className="w-16 h-0.5 bg-slate-200" />
          <div className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-400">
            2
          </div>
        </div>

        {/* Hero */}
        <div className="text-center space-y-3 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100"
          >
            <Icon className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-700">{roleConfig.name} Registration</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold text-slate-900"
          >
            Verify Your School
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-600"
          >
            Enter your school code to begin the application process. This code is provided by your school administrator.
          </motion.p>
        </div>

        {/* School Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PremiumCard className={isCodeValid ? roleConfig.borderColor : ""}>
            <div className="space-y-6">
              {/* Input Section */}
              {!isCodeValid ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="schoolCode">School Code</Label>
                    <Input
                      id="schoolCode"
                      type="text"
                      value={schoolCode}
                      onChange={(e) => {
                        setSchoolCode(e.target.value.toUpperCase());
                        if (error) setError("");
                      }}
                      placeholder="e.g., ABC-DIST-2024"
                      className="text-lg tracking-wider uppercase"
                      autoFocus
                      disabled={isValidating}
                      onKeyDown={(e) => e.key === "Enter" && !isValidating && validateSchoolCode()}
                    />
                    <p className="text-xs text-slate-500">
                      Enter the unique code provided by your school. This code verifies your school's participation.
                    </p>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200"
                    >
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </motion.div>
                  )}

                  <Button
                    onClick={validateSchoolCode}
                    disabled={isValidating || !schoolCode.trim()}
                    className="w-full"
                    style={{ background: `linear-gradient(135deg, ${roleConfig.color} 0%, ${roleConfig.colorTo} 100%)` }}
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify School Code
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  {/* Verified State */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-emerald-900">School Verified</h3>
                        <p className="text-emerald-700 font-medium">{schoolName}</p>
                        <p className="text-sm text-emerald-600 mt-1">Code: {schoolCode}</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsCodeValid(false);
                          setSchoolName("");
                        }}
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Change
                      </button>
                    </div>
                  </motion.div>

                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Next step:</strong> Create your account. Your application will be submitted to the platform
                      administrator for approval.
                    </p>
                  </div>

                  <Button
                    onClick={handleContinue}
                    className="w-full"
                    style={{ background: `linear-gradient(135deg, ${roleConfig.color} 0%, ${roleConfig.colorTo} 100%)` }}
                  >
                    Continue to Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              )}

              {/* Help Text */}
              {!isCodeValid && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 text-center">
                    Don't have a school code? Contact your school administrator or{" "}
                    <Link href="/help" className="text-purple-600 hover:text-purple-700 font-medium">
                      get help
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </PremiumCard>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200"
        >
          <h3 className="font-medium text-slate-900 text-sm mb-2">About Institutional Accounts</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>&bull; Your school code verifies your institution's participation in the platform</li>
            <li>&bull; After creating your account, your application will be reviewed by the platform administrator</li>
            <li>&bull; You'll receive a notification once your account is approved</li>
          </ul>
        </motion.div>

        {/* Sign In Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center text-sm text-slate-600"
        >
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-purple-600 hover:text-purple-700">
            Sign in
          </Link>
        </motion.p>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Bhutan EduSkill. Multi-tenant education management platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
