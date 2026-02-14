"use client";

import { useEffect } from "react";
import { SignOutButton, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to homepage after sign out
    const timer = setTimeout(() => {
      router.push("/");
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
          <button className="text-gray-600 hover:text-gray-900">
            Signing out...
          </button>
        </SignOutButton>
        <p className="text-gray-500 mt-2">You will be redirected shortly.</p>
      </div>
    </div>
  );
}
