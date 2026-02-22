"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Users,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardDescription, PremiumCardContent } from "@/components/admin/premium-card";

// Role configurations
const ROLE_CONFIG = {
  student: {
    name: "Student",
    icon: GraduationCap,
    color: "rgb(249 115 22)",
    colorTo: "rgb(194 65 12)",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    description: "Take assessments, explore careers, track your progress",
    features: [
      "Free career assessments (RIASEC, MBTI, DISC)",
      "Explore careers and RUB colleges",
      "Set academic goals and track progress",
      "View homework and class schedules",
    ],
  },
  teacher: {
    name: "Teacher",
    icon: BookOpen,
    color: "rgb(59 130 246)",
    colorTo: "rgb(37 99 235)",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    description: "Manage classes, homework, track student progress",
    features: [
      "Create homework assignments for your classes",
      "Take attendance digitally",
      "Grade student submissions",
      "Create learning modules",
      "Earn extra income through tutoring",
    ],
  },
  parent: {
    name: "Parent",
    icon: Users,
    color: "rgb(107 114 128)",
    colorTo: "rgb(75 85 99)",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    description: "Monitor your child's progress and communicate",
    features: [
      "View your child's attendance records",
      "Monitor homework and assessments",
      "Track academic progress",
      "Communicate with teachers",
      "Pay school fees online",
    ],
  },
};

function GeneralSignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [selectedRole, setSelectedRole] = useState<keyof typeof ROLE_CONFIG | null>(
    roleParam === "student" || roleParam === "teacher" || roleParam === "parent" ? roleParam : null
  );

  // Redirect if no valid role selected
  useEffect(() => {
    if (!roleParam || !["student", "teacher", "parent"].includes(roleParam)) {
      router.push("/signup");
    }
  }, [roleParam, router]);

  const handleBack = () => {
    router.push("/signup");
  };

  const handleContinue = () => {
    if (!selectedRole) return;

    // Store the role in session storage for use after Clerk auth
    sessionStorage.setItem("pendingRole", selectedRole);

    // Redirect to Clerk signup
    // After auth, user will go to /restricted to enter school code
    router.push(`/sign-up?redirect_url=${encodeURIComponent("/restricted?role=" + selectedRole)}`);
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Invalid role selected</p>
          <Button onClick={() => router.push("/signup")}>Go Back</Button>
        </div>
      </div>
    );
  }

  const roleConfig = ROLE_CONFIG[selectedRole];
  const Icon = roleConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center space-y-4 mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${roleConfig.color} 0%, ${roleConfig.colorTo} 100%)` }}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-semibold text-blue-700">Sign up as {roleConfig.name}</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold text-slate-900"
          >
            Join Your School on Bhutan EduSkill
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-600 max-w-xl mx-auto"
          >
            Create your account first, then enter your school code to connect with your school and access all features.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Role Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-1"
          >
            <PremiumCard className={`h-full ${roleConfig.borderColor}`}>
              <PremiumCardHeader>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `linear-gradient(135deg, ${roleConfig.color} 0%, ${roleConfig.colorTo} 100%)` }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <PremiumCardTitle>{roleConfig.name} Account</PremiumCardTitle>
                <PremiumCardDescription>{roleConfig.description}</PremiumCardDescription>
              </PremiumCardHeader>
              <PremiumCardContent>
                <h4 className="font-medium text-slate-900 text-sm mb-3">You'll get access to:</h4>
                <ul className="space-y-2">
                  {roleConfig.features.map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: roleConfig.color }} />
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </PremiumCardContent>
            </PremiumCard>
          </motion.div>

          {/* Right Column - Signup Flow */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 space-y-6"
          >
            {/* How It Works */}
            <PremiumCard>
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  How It Works
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 font-semibold text-blue-600 text-sm">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Create Your Account</h4>
                      <p className="text-sm text-slate-600">
                        Sign up with your email or social account. This takes just a minute.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 font-semibold text-purple-600 text-sm">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Enter Your School Code</h4>
                      <p className="text-sm text-slate-600">
                        Get your unique school code from your school administrator and enter it to connect.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 font-semibold text-green-600 text-sm">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Get Approved & Start</h4>
                      <p className="text-sm text-slate-600">
                        Your school administrator will approve your request. Once approved, you can access all features.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </PremiumCard>

            {/* Important Notice */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3"
            >
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-amber-900 text-sm">Before You Begin</h3>
                <p className="text-sm text-amber-800 mt-1">
                  Make sure you have your school code ready. If you don't have one, contact your school administrator
                  before signing up.
                </p>
              </div>
            </motion.div>

            {/* CTA Button */}
            <Button
              onClick={handleContinue}
              size="lg"
              className="w-full text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              style={{ background: `linear-gradient(135deg, ${roleConfig.color} 0%, ${roleConfig.colorTo} 100%)` }}
            >
              Create Your Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>

        {/* Sign In Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-sm text-slate-600"
        >
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-purple-600 hover:text-purple-700">
            Sign in
          </Link>
        </motion.p>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Bhutan EduSkill. Multi-tenant education management platform.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function GeneralSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    }>
      <GeneralSignupPageContent />
    </Suspense>
  );
}
