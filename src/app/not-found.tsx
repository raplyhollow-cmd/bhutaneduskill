/**
 * Next.js Not Found Page
 *
 * Displayed when:
 * 1. A route doesn't exist (404)
 * 2. When notFound() is called in a route
 *
 * Docs: https://nextjs.org/docs/app/api-reference/functions/not-found
 */

import Link from "next/link";
import { ErrorDisplay } from "@/components/error/error-display";

export default function NotFound() {
  return (
    <ErrorDisplay
      title="Page Not Found"
      message="The page you're looking for doesn't exist or has been moved to a new location."
      errorCode={404}
      homeLink={false}
    />
  );
}

/**
 * Helper component with link back home
 */
export function NotFoundWithLinks() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-6xl mb-6">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Go Home
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
