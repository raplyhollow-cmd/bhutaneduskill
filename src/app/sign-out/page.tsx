"use client";

import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

/**
 * Sign Out Page
 *
 * This page is a fallback for direct navigation to /sign-out.
 * The main sign out flow is handled directly by the sidebar components
 * using Clerk's signOut() function, which redirects to '/' automatically.
 *
 * This page should only be accessed if someone navigates here directly.
 */
export default function SignOutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogOut className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign Out</h1>
        <p className="text-gray-500 mb-6">Click the button below to sign out of your account.</p>
        <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
          <button className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
            Sign Out
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
