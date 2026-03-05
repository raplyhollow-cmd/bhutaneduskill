/**
 * DEBUG LOGIN PAGE
 *
 * Visit this page while signed in to diagnose login issues
 * and fix the clerkUserId mismatch
 */

"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, CheckCircle2, AlertCircle, Wrench } from "lucide-react";

interface UserStatus {
  found: boolean;
  count?: number;
  clerkUserIdFromAuth?: string;
  hasClerkIdMatch?: boolean;
  users?: Array<{
    id: string;
    email: string;
    name: string;
    type: string;
    onboardingStatus: string;
    isActive: boolean;
    clerkUserIdMatch: boolean;
    canLogin: boolean;
    redirectTo: string;
  }>;
}

export default function DebugLoginPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);
  const [emailToCheck, setEmailToCheck] = useState("");

  useEffect(() => {
    if (isLoaded && clerkUser) {
      setEmailToCheck(clerkUser.primaryEmailAddress?.emailAddress || "");
      checkStatus();
    }
  }, [isLoaded, clerkUser]);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const email = clerkUser?.primaryEmailAddress?.emailAddress;
      const response = await fetch(`/api/debug/user-status?email=${email}`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Error checking status:", error);
    } finally {
      setLoading(false);
    }
  };

  const fixUser = async () => {
    setFixing(true);
    setFixResult(null);
    try {
      const email = clerkUser?.primaryEmailAddress?.emailAddress;
      const response = await fetch("/api/debug/fix-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setFixResult(data);

      if (data.success) {
        // Reload page after successful fix
        setTimeout(() => {
          window.location.href = data.user.redirectTo || "/admin";
        }, 1500);
      }
    } catch (error) {
      setFixResult({ error: "Failed to fix user" });
    } finally {
      setFixing(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!clerkUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in first</p>
          <a href="/sign-in" className="text-blue-600 hover:underline">Go to Sign In</a>
        </div>
      </div>
    );
  }

  const hasIssue = status && (!status.found || !status.hasClerkIdMatch);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Debug Tool</h1>
          <p className="text-gray-600 mb-6">Diagnose and fix login issues</p>

          {/* Clerk Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">Your Clerk Account</h2>
            <div className="text-sm text-blue-800 space-y-1">
              <p><span className="font-medium">Email:</span> {clerkUser.primaryEmailAddress?.emailAddress}</p>
              <p><span className="font-medium">Clerk ID:</span> {clerkUser.id}</p>
              <p><span className="font-medium">Name:</span> {clerkUser.fullName || "Not set"}</p>
            </div>
          </div>

          {/* Status */}
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking database status...
            </div>
          ) : status ? (
            <div className={`border rounded-xl p-4 mb-6 ${
              status.found && status.hasClerkIdMatch
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-start gap-3">
                {status.found && status.hasClerkIdMatch ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h2 className={`font-semibold mb-2 ${
                    status.found && status.hasClerkIdMatch ? "text-green-900" : "text-red-900"
                  }`}>
                    {status.found && status.hasClerkIdMatch
                      ? "✅ All Good! You can login."
                      : "⚠️ Issue Found!"}
                  </h2>

                  {!status.found && (
                    <p className="text-red-800 text-sm mb-3">
                      User not found in database. You need to complete the setup wizard.
                    </p>
                  )}

                  {status.found && !status.hasClerkIdMatch && (
                    <p className="text-red-800 text-sm mb-3">
                      Your Clerk ID doesn't match the database. This usually happens after
                      authentication changes. Click the button below to fix it.
                    </p>
                  )}

                  {status.users && status.users.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Database Records:</p>
                      {status.users.map((u, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div><span className="text-gray-500">Type:</span> {u.type}</div>
                            <div><span className="text-gray-500">Status:</span> {u.onboardingStatus}</div>
                            <div><span className="text-gray-500">Active:</span> {u.isActive ? "Yes" : "No"}</div>
                            <div><span className="text-gray-500">Can Login:</span> {u.canLogin ? "✅" : "❌"}</div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Redirect to: <code className="bg-gray-100 px-1 rounded">{u.redirectTo}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Fix Button */}
          {hasIssue && (
            <button
              onClick={fixUser}
              disabled={fixing}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {fixing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  Fix My Account
                </>
              )}
            </button>
          )}

          {/* Fix Result */}
          {fixResult && (
            <div className={`mt-4 border rounded-xl p-4 ${
              fixResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}>
              <p className={fixResult.success ? "text-green-800" : "text-red-800"}>
                {fixResult.message || fixResult.error}
              </p>
              {fixResult.success && fixResult.user && (
                <p className="text-sm text-green-700 mt-2">
                  Redirecting to {fixResult.user.redirectTo}...
                </p>
              )}
            </div>
          )}

          {/* Manual Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Manual Actions</h3>
            <div className="flex flex-wrap gap-2">
              <a
                href="/setup/unified"
                className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Go to Setup Wizard
              </a>
              <a
                href="/admin"
                className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Try Admin Portal
              </a>
              <button
                onClick={checkStatus}
                className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          Visit this page while signed in to diagnose login issues
        </p>
      </div>
    </div>
  );
}
