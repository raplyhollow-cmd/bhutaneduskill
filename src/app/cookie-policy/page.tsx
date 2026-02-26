/**
 * COOKIE POLICY PAGE
 *
 * Publicly accessible page containing our cookie policy.
 * No authentication required.
 */

import type { Metadata } from "next";
import { CookiePolicyContent } from "@/components/legal/cookie-policy-content";

export const metadata: Metadata = {
  title: "Cookie Policy - Bhutan EduSkill",
  description: "Learn about cookies on Bhutan EduSkill platform, including essential, functional, and analytics cookies. Understand your privacy choices.",
  keywords: ["cookie policy", "browser cookies", "privacy settings", "data tracking"],
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 md:p-12">
          <CookiePolicyContent />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            &copy; {new Date().getFullYear()} Bhutan EduSkill. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <a
              href="/privacy-policy"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/terms-of-service"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="/contact"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
