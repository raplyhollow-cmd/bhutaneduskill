"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, GraduationCap, BookOpen, Users, HeartHandshake, Building, Landmark, Check } from "lucide-react";

const portals = [
  { name: "Student", icon: GraduationCap, color: "from-orange-500 to-orange-600" },
  { name: "Teacher", icon: BookOpen, color: "from-blue-500 to-blue-600" },
  { name: "Parent", icon: Users, color: "from-gray-500 to-gray-600" },
  { name: "Counselor", icon: HeartHandshake, color: "from-purple-500 to-purple-600" },
  { name: "School Admin", icon: Building, color: "from-violet-500 to-violet-600" },
  { name: "Ministry", icon: Landmark, color: "from-indigo-500 to-indigo-600" },
];

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/30 to-blue-50/20 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.06),transparent)]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/8 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side - Portal Preview */}
        <div className="hidden lg:block space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Your Future Starts{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                Here
              </span>
            </h2>
            <p className="text-gray-600">
              Unified platform for students, educators, and administrators across Bhutan.
            </p>
          </div>

          {/* Portal Grid */}
          <div className="grid grid-cols-2 gap-3">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <div
                  key={portal.name}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/60 border border-gray-200 hover:border-orange-400/50 hover:bg-white/80 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 group"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${portal.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    {portal.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 pt-4">
            {["Ministry Approved", "Secure Platform", "24/7 Support"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Sign In Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
                <span className="text-white font-bold">BES</span>
              </div>
              <span className="font-bold text-xl text-gray-900">Bhutan EduSkill</span>
            </div>
          </div>

          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back</span>
          </Link>

          {/* Form Container - Premium Glassmorphism */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/80 p-8 shadow-2xl shadow-orange-500/5">
            <div className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 rounded-2xl p-6 -m-6 mb-6 shadow-lg shadow-orange-500/20">
              <h1 className="text-2xl font-bold text-white text-center">
                Welcome Back
              </h1>
            </div>

            <SignIn
              signUpUrl="/sign-up"
              fallbackRedirectUrl="/"
            />

            {/* Sign Up Link */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/sign-up" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          {/* Mobile Trust badges */}
          <div className="lg:hidden mt-6 flex justify-center gap-4">
            {["Secure", "Approved", "Support"].map((item) => (
              <span key={item} className="text-xs text-gray-500 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-400/30 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-orange-500" />
                </div>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
