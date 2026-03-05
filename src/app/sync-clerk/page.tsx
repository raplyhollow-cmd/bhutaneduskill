/**
 * SYNC CLERK USER IDs
 *
 * Visit this page to sync Clerk user IDs with the database.
 * Fixes login issues caused by clerkUserId mismatches.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react";

export default function SyncClerkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const syncUsers = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Use fix-user endpoint which gets current Clerk userId from auth
      const response = await fetch("/api/debug/fix-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "raplyhollow@gmail.com" }),
      });
      const data = await response.json();
      setResult(data);

      if (data.success || data.alreadyLinked) {
        // Auto-redirect after 2 seconds on success
        setTimeout(() => {
          router.push(data.user?.redirectTo || "/admin");
        }, 2000);
      }
    } catch (error) {
      setResult({ error: "Failed to sync user" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Fix Platform Admin Login</h1>
          <p className="text-gray-600 mt-2">
            Links your current Clerk session to your database account
          </p>
        </div>

        {result ? (
          <div className={`rounded-xl p-4 mb-6 ${
            result.error ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"
          }`}>
            {result.error ? (
              <p className="text-red-800">{result.error}</p>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-green-800 font-medium">Sync Complete!</p>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>✅ Updated: {result.summary.updated} users</p>
                  <p>⏭️ Skipped: {result.summary.skipped} users</p>
                  <p>❌ Not found: {result.summary.notFound} users</p>
                  {result.summary.updated > 0 && (
                    <p className="mt-3 text-green-600 font-medium">
                      Redirecting to /admin in 3 seconds...
                    </p>
                  )}
                </div>
                {result.details && result.details.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-sm text-green-700 cursor-pointer">
                      View details
                    </summary>
                    <ul className="text-xs text-green-600 mt-2 space-y-1 pl-4">
                      {result.details.map((d: string, i: number) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600">
            <p className="font-medium mb-2">What this does:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Gets your current Clerk session ID</li>
              <li>Links it to your database account (raplyhollow@gmail.com)</li>
              <li>Fixes onboarding status</li>
              <li>Redirects you to admin panel</li>
            </ul>
          </div>
        )}

        <button
          onClick={syncUsers}
          disabled={loading || result?.success || result?.alreadyLinked}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Fixing Account...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Fix My Account
            </>
          )}
        </button>

        <div className="mt-6 flex gap-2">
          <a
            href="/admin"
            className="flex-1 text-center py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
          >
            Try Admin
          </a>
          <a
            href="/sign-in"
            className="flex-1 text-center py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
