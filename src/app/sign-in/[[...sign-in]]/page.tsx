"use client";

import { useState } from "react";
import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { GraduationCap, Users, UserCog, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";

const portals = [
  {
    id: "student",
    name: "Student Portal",
    description: "Take assessments, explore careers, plan your future",
    icon: GraduationCap,
    color: "from-orange-500 to-red-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-900/50",
    textColor: "text-orange-600 dark:text-orange-400",
  },
  {
    id: "teacher",
    name: "Teacher Portal",
    description: "Manage classes, homework, and track student progress",
    icon: Users,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-900/50",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "parent",
    name: "Parent Portal",
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

export default function SignInPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400">Select your portal to sign in</p>
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

        {/* Sign In Form */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 max-w-md mx-auto border border-gray-200 dark:border-gray-800">
          <SignIn
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
            redirectUrl="/dashboard"
          />

          {/* Portal Info */}
          {selectedPortal && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Signing in to <span className="font-semibold text-gray-900 dark:text-white">{portals.find(p => p.id === selectedPortal)?.name}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                You'll be redirected to your dashboard after sign in
              </p>
            </div>
          )}
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-orange-600 dark:text-orange-400 hover:underline font-medium inline-flex items-center gap-1">
            Sign up
            <ArrowRight className="w-4 h-4" />
          </Link>
        </p>

        {/* Help Links */}
        <div className="mt-8 flex justify-center gap-6 text-sm">
          <Link href="/forgot-password" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
            Forgot password?
          </Link>
          <Link href="/contact" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
            Need help?
          </Link>
        </div>
      </div>
    </div>
  );
}
