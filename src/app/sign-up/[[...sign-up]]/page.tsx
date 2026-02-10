"use client";

import { useState } from "react";
import { SignUp } from "@clerk/nextjs";
import { GraduationCap, Users, UserCog, Building2, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

const portals = [
  {
    id: "student",
    name: "Student",
    description: "Take assessments, explore careers, plan your future",
    icon: GraduationCap,
    color: "from-orange-500 to-red-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-900/50",
    textColor: "text-orange-600 dark:text-orange-400",
  },
  {
    id: "teacher",
    name: "Teacher",
    description: "Manage classes, homework, and track student progress",
    icon: Users,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-900/50",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "parent",
    name: "Parent",
    description: "Monitor your child's progress and communicate",
    icon: Users,
    color: "from-gray-500 to-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-800",
    borderColor: "border-gray-200 dark:border-gray-700",
    textColor: "text-gray-600 dark:text-gray-400",
  },
  {
    id: "school-admin",
    name: "School Admin",
    description: "Manage your school, students, teachers, and data",
    icon: Building2,
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-900/50",
    textColor: "text-violet-600 dark:text-violet-400",
  },
];

export default function SignUpPage() {
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="w-full max-w-5xl relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="text-white font-bold">CC</span>
            </div>
            <span className="font-bold text-2xl text-gray-900 dark:text-white">Career Compass</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Your Account</h1>
          <p className="text-gray-600 dark:text-gray-400">Choose your role and start your journey</p>
        </div>

        {/* Portal Selector */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {portals.map((portal) => (
            <button
              key={portal.id}
              onClick={() => setSelectedPortal(portal.id)}
              className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                selectedPortal === portal.id
                  ? `${portal.bgColor} ${portal.borderColor} shadow-lg ring-2 ring-offset-2 ring-orange-500/20`
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300"
              }`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${portal.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <portal.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className={`font-semibold mb-1 ${selectedPortal === portal.id ? portal.textColor : "text-gray-900 dark:text-white"}`}>
                {portal.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {portal.description}
              </p>
            </button>
          ))}
        </div>

        {/* Sign Up Form */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 max-w-md mx-auto border border-gray-200 dark:border-gray-800">
          <SignUp
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
            redirectUrl="/dashboard"
          />

          {/* Portal Info */}
          {selectedPortal && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Creating a <span className="font-semibold text-gray-900 dark:text-white">{portals.find(p => p.id === selectedPortal)?.name}</span> account
              </p>
            </div>
          )}
        </div>

        {/* Benefits */}
        <div className="mt-8 max-w-md mx-auto">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            Get started with:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {["Free career assessments", "RUB college matching", "Study abroad guides", "Scholarship database"].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-orange-600 dark:text-orange-400 hover:underline font-medium inline-flex items-center gap-1">
            Sign in
            <ArrowRight className="w-4 h-4" />
          </Link>
        </p>
      </div>
    </div>
  );
}
