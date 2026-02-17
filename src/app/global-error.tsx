"use client";

/**
 * Next.js Global Error Page
 *
 * Catches errors thrown in root layout or server components
 * This is the "last resort" error handler
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */


import { ErrorDisplay } from "@/components/error/error-display";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <ErrorDisplay
          title="Critical Error"
          message="A critical error occurred. Please refresh the page or contact support if the problem persists."
          onRetry={reset}
          errorCode={500}
        />
      </body>
    </html>
  );
}
