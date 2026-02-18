"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="text-white font-bold">BE</span>
            </div>
            <span className="font-bold text-2xl text-gray-900 dark:text-white">Bhutan EduSkill</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sign in to Bhutan EduSkill</h1>
          <p className="text-gray-600 dark:text-gray-400">Your career and education journey starts here</p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
          <SignIn
            signUpUrl="/sign-up"
            redirectUrl="/setup/unified"
            afterSignInUrl="/setup/unified"
            fallbackRedirectUrl="/setup/unified"
          />
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
            Sign up
          </Link>
        </p>

        {/* Help Links */}
        <div className="mt-8 flex justify-center gap-6 text-sm">
          <Link href="/contact" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
            Need help?
          </Link>
        </div>
      </div>
    </div>
  );
}
