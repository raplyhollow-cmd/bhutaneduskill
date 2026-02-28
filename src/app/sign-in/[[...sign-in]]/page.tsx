"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { GraduationCap, BookOpen, Users, HeartHandshake, Building, Landmark, Check } from "lucide-react";

const portals = [
  { name: "Student", icon: GraduationCap, color: "from-orange-500 to-orange-600", description: "Assessments, careers, planning" },
  { name: "Teacher", icon: BookOpen, color: "from-blue-500 to-blue-600", description: "Classes, homework, tracking" },
  { name: "Parent", icon: Users, color: "from-gray-500 to-gray-600", description: "Monitor child's progress" },
  { name: "Counselor", icon: HeartHandshake, color: "from-purple-500 to-purple-600", description: "Interventions, sessions" },
  { name: "School Admin", icon: Building, color: "from-violet-500 to-violet-600", description: "Manage operations" },
  { name: "Ministry", icon: Landmark, color: "from-indigo-500 to-indigo-600", description: "Analytics, policies" },
];

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Side - Branding & Info */}
          <div className="hidden lg:block space-y-8">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bhutan EduSkill</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Career & Education Platform</p>
              </div>
            </Link>

            {/* Hero Text */}
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                Your Future Starts{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                  Here
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg">
                Unified platform for students, educators, and administrators across Bhutan.
                Track progress, plan careers, and manage schools in one place.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {portals.slice(0, 4).map((portal) => {
                const Icon = portal.icon;
                return (
                  <div
                    key={portal.name}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-900 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${portal.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{portal.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{portal.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 pt-4">
              {["Ministry Approved", "Secure Platform", "24/7 Support"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Sign In Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900 dark:text-white">Bhutan EduSkill</span>
              </Link>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Sign in to access your portal</p>
            </div>

            {/* Sign In Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-black/50 p-6 border border-gray-200/50 dark:border-gray-800">
              <SignIn
                signUpUrl="/sign-up"
                fallbackRedirectUrl="/"
              />
            </div>

            {/* Mobile Trust Indicators */}
            <div className="lg:hidden mt-6 flex justify-center gap-4">
              {["Secure", "Approved", "Support"].map((item) => (
                <span key={item} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  </div>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
