"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/30 to-amber-50/20 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.08),transparent)]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-400/8 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back</span>
        </Link>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20">
              <span className="text-white font-bold text-lg">BES</span>
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-amber-400 rounded-2xl blur opacity-40 animate-pulse" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Bhutan EduSkill</span>
        </div>

        {/* Tagline */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <p className="text-sm text-gray-500">Begin your journey</p>
        </div>

        {/* Form Container - Premium Glassmorphism */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/80 p-8 shadow-2xl shadow-orange-500/5">
          <div className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 rounded-2xl p-6 -m-6 mb-6 shadow-lg shadow-orange-500/20">
            <h1 className="text-2xl font-bold text-white text-center">
              Create Account
            </h1>
          </div>

          <SignUp
            signInUrl="/sign-in"
            fallbackRedirectUrl="/"
          />

          {/* Sign In Link */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-1.5">
          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Secured by 256-bit encryption
        </p>
      </div>
    </div>
  );
}
