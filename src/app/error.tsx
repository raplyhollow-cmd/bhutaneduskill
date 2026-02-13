/**
 * Next.js Error Page
 *
 * Catches errors thrown in React components
 * Automatically wraps the root layout
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

"use client";

import { ErrorDisplay } from "@/components/error/error-display";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Something went wrong"
      message={error.message || "An unexpected error occurred. Please try again."}
      onRetry={reset}
      errorCode={500}
    />
  );
}

/**
 * Error boundary for client components
 * Wrap your components with this to catch errors
 */
export function ErrorBoundary({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return <>{children}</>;
}
