"use client";

/**
 * Client-side Error Boundary wrapper for the entire app
 *
 * This component wraps the application content with an ErrorBoundary
 * to catch and handle client-side React errors.
 */

import { ErrorBoundary } from "./error-boundary";
import type { ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Errors are already logged by ErrorBoundary component
        // This callback can be used for additional error reporting
        // e.g., sending to Sentry, Analytics, etc.
        console.log("[AppErrorBoundary]", error instanceof Error ? error.message : String(error), errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
